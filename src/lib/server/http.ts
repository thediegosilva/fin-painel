import "server-only";
import { maxUploadBytes, serverConfig } from "./config";
import { BusyError, ExecError } from "./exec";

export type ApiErrorCode =
  | "bad-request"
  | "too-large"
  | "invalid-file"
  | "encrypted"
  | "wrong-password"
  | "unavailable"
  | "rate-limited"
  | "busy"
  | "timeout"
  | "processing-failed";

const STATUS: Record<ApiErrorCode, number> = {
  "bad-request": 400,
  "too-large": 413,
  "invalid-file": 415,
  encrypted: 422,
  "wrong-password": 401,
  unavailable: 503,
  "rate-limited": 429,
  busy: 503,
  timeout: 504,
  "processing-failed": 500,
};

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorResponse(code: ApiErrorCode, message: string, extraHeaders?: Record<string, string>): Response {
  return Response.json(
    { error: { code, message } },
    { status: STATUS[code], headers: { "Cache-Control": "no-store", ...extraHeaders } },
  );
}

/** Converte exceções em respostas JSON padronizadas, sem vazar detalhes internos. */
export function handleError(e: unknown): Response {
  if (e instanceof ApiError) return errorResponse(e.code, e.message);
  if (e instanceof BusyError) {
    return errorResponse("busy", "O servidor está processando muitos arquivos agora. Tente novamente em instantes.", {
      "Retry-After": "10",
    });
  }
  if (e instanceof ExecError && e.timedOut) {
    return errorResponse("timeout", "O processamento demorou demais e foi interrompido. Tente um arquivo menor.");
  }
  console.error("[api] falha no processamento:", e instanceof ExecError ? e.stderr.slice(0, 2000) : e);
  return errorResponse("processing-failed", "Não foi possível processar o arquivo. Verifique se ele é válido e tente novamente.");
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export type FileKind = "pdf" | "office";

const OFFICE_EXT = new Set(["doc", "docx", "odt", "rtf", "xls", "xlsx", "ods", "ppt", "pptx", "odp"]);

function startsWith(bytes: Uint8Array, sig: number[]): boolean {
  return sig.every((b, i) => bytes[i] === b);
}

export function sniffPdf(bytes: Uint8Array): boolean {
  const head = Buffer.from(bytes.subarray(0, 1024)).toString("latin1");
  return head.includes("%PDF-");
}

/** Valida extensão + assinatura binária de documentos Office/ODF/RTF. */
export function sniffOffice(bytes: Uint8Array, filename: string): string | null {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (!OFFICE_EXT.has(ext)) return null;
  const zip = startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]); // docx/xlsx/pptx/odt/ods/odp
  const ole = startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]); // doc/xls/ppt
  const rtf = startsWith(bytes, [0x7b, 0x5c, 0x72, 0x74, 0x66]); // {\rtf
  if (["docx", "xlsx", "pptx", "odt", "ods", "odp"].includes(ext) && zip) return ext;
  if (["doc", "xls", "ppt"].includes(ext) && ole) return ext;
  if (ext === "rtf" && rtf) return ext;
  return null;
}

export interface ParsedUpload {
  bytes: Uint8Array;
  name: string;
  ext: string;
  fields: FormData;
}

export async function readUpload(request: Request, kind: FileKind): Promise<ParsedUpload> {
  const limit = maxUploadBytes();
  const declared = Number(request.headers.get("content-length") ?? "0");
  // Margem para os campos do multipart além do arquivo.
  if (declared && declared > limit + 64 * 1024) {
    throw new ApiError("too-large", `O arquivo excede o limite de ${serverConfig.maxUploadMb} MB.`);
  }
  const ct = request.headers.get("content-type") ?? "";
  if (!ct.toLowerCase().startsWith("multipart/form-data")) {
    throw new ApiError("bad-request", "Envie o arquivo como multipart/form-data.");
  }
  if (!request.body) throw new ApiError("bad-request", "Nenhum arquivo foi enviado.");
  // Limita o corpo durante a leitura: não depende do Content-Length (que pode
  // estar ausente em envios "chunked" ou ser falso).
  const maxBody = limit + 64 * 1024;
  let received = 0;
  const limited = request.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        received += chunk.byteLength;
        if (received > maxBody) controller.error(new ApiError("too-large", `O arquivo excede o limite de ${serverConfig.maxUploadMb} MB.`));
        else controller.enqueue(chunk);
      },
    }),
  );
  let form: FormData;
  try {
    form = await new Response(limited, { headers: { "content-type": ct } }).formData();
  } catch (e) {
    if (received > maxBody) throw new ApiError("too-large", `O arquivo excede o limite de ${serverConfig.maxUploadMb} MB.`);
    if (e instanceof ApiError) throw e;
    throw new ApiError("bad-request", "Não foi possível ler o envio.");
  }
  const file = form.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    throw new ApiError("bad-request", "Nenhum arquivo foi enviado.");
  }
  if (file.size > limit) {
    throw new ApiError("too-large", `O arquivo excede o limite de ${serverConfig.maxUploadMb} MB.`);
  }
  const name = (file instanceof File && file.name) || "arquivo";
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (kind === "pdf") {
    if (!sniffPdf(bytes)) throw new ApiError("invalid-file", "O arquivo enviado não é um PDF válido.");
    return { bytes, name, ext: "pdf", fields: form };
  }
  const ext = sniffOffice(bytes, name);
  if (!ext) {
    throw new ApiError(
      "invalid-file",
      "Formato não suportado ou arquivo corrompido. Envie DOC, DOCX, ODT, RTF, XLS, XLSX, ODS, PPT, PPTX ou ODP.",
    );
  }
  return { bytes, name, ext, fields: form };
}

export function pdfResponse(bytes: Uint8Array, filename: string, extra: Record<string, string> = {}): Response {
  const safe = filename.replace(/[^\w.\-]+/g, "_").slice(0, 120) || "documento.pdf";
  return new Response(bytes as Uint8Array<ArrayBuffer>, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `attachment; filename="${safe}"`,
      "Cache-Control": "no-store",
      ...extra,
    },
  });
}

// ---------------------------------------------------------------------------
// Rate limit simples em memória (por instância)
// ---------------------------------------------------------------------------

const buckets = new Map<string, { count: number; reset: number }>();

export function clientKey(request: Request): string {
  if (!serverConfig.trustProxy) return "global";
  const fwd = request.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function checkRateLimit(request: Request): void {
  const limit = serverConfig.rateLimitPerMinute;
  if (limit <= 0) return;
  const key = clientKey(request);
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + 60_000 });
    return;
  }
  b.count++;
  if (b.count > limit) {
    throw new ApiError("rate-limited", "Muitas solicitações em pouco tempo. Aguarde um minuto e tente novamente.");
  }
}

export function resetRateLimit() {
  buckets.clear();
}
