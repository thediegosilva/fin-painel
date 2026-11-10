import "server-only";
import { randomBytes } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { serverConfig } from "./config";
import { ExecError, run, withJobSlot, withTempDir } from "./exec";
import { ApiError } from "./http";

export type CompressionLevel = "extrema" | "recomendada" | "baixa";

const PDF_SETTINGS: Record<CompressionLevel, string> = {
  extrema: "/screen", // imagens ~72 dpi
  recomendada: "/ebook", // imagens ~150 dpi
  baixa: "/printer", // imagens ~300 dpi
};

export function isCompressionLevel(v: unknown): v is CompressionLevel {
  return v === "extrema" || v === "recomendada" || v === "baixa";
}

const BASE_ARGS = ["-q", "-dSAFER", "-dBATCH", "-dNOPAUSE", "-dNOINTERPOLATE", "-sDEVICE=pdfwrite"];

/**
 * O Ghostscript 10 pode terminar com código 0 mesmo sem conseguir abrir o
 * arquivo (ex.: senha incorreta), gerando um PDF vazio. Por isso o stderr é
 * inspecionado também em caso de "sucesso".
 */
function checkGsOutput(stderr: string) {
  if (/password/i.test(stderr)) {
    throw new ApiError("encrypted", "Este PDF está protegido por senha. Desbloqueie-o antes de continuar.");
  }
  if (/Couldn't initialise file|No pages will be processed/i.test(stderr)) {
    throw new ApiError("invalid-file", "Não foi possível ler este PDF. O arquivo pode estar corrompido.");
  }
}

function mapGsError(e: unknown): never {
  if (e instanceof ExecError && !e.timedOut) checkGsOutput(e.stderr);
  throw e;
}

async function gs(input: Uint8Array, args: string[]): Promise<Uint8Array> {
  return withJobSlot(() =>
    withTempDir(async (dir) => {
      const inPath = join(dir, "entrada.pdf");
      const outPath = join(dir, "saida.pdf");
      await writeFile(inPath, input);
      try {
        const { stderr } = await run(serverConfig.ghostscriptPath, [
          ...BASE_ARGS,
          ...args,
          `-sOutputFile=${outPath}`,
          "--",
          inPath,
        ]);
        checkGsOutput(stderr);
      } catch (e) {
        if (e instanceof ApiError) throw e;
        mapGsError(e);
      }
      const info = await stat(outPath).catch(() => null);
      if (!info || info.size === 0) throw new Error("Ghostscript não gerou saída");
      return new Uint8Array(await readFile(outPath));
    }),
  );
}

export async function compressPdf(input: Uint8Array, level: CompressionLevel): Promise<Uint8Array> {
  return gs(input, [
    "-dCompatibilityLevel=1.5",
    `-dPDFSETTINGS=${PDF_SETTINGS[level]}`,
    "-dDetectDuplicateImages=true",
    "-dCompressFonts=true",
    "-dSubsetFonts=true",
  ]);
}

/** Senhas aceitas: 1–64 caracteres ASCII imprimíveis (compatibilidade com todos os leitores). */
export function validatePassword(pw: unknown, label = "A senha"): string {
  if (typeof pw !== "string" || pw.length === 0) throw new ApiError("bad-request", `${label} é obrigatória.`);
  if (pw.length > 64) throw new ApiError("bad-request", `${label} deve ter no máximo 64 caracteres.`);
  if (!/^[\x20-\x7E]+$/.test(pw)) {
    throw new ApiError(
      "bad-request",
      `${label} deve conter apenas letras sem acento, números, espaços e símbolos comuns.`,
    );
  }
  return pw;
}

export async function protectPdf(input: Uint8Array, userPassword: string, ownerPassword?: string): Promise<Uint8Array> {
  const owner = ownerPassword || randomBytes(18).toString("base64url");
  return gs(input, [
    `-sOwnerPassword=${owner}`,
    `-sUserPassword=${userPassword}`,
    "-dEncryptionR=3",
    "-dKeyLength=128",
    "-dPermissions=-4",
  ]);
}

export async function unlockPdf(input: Uint8Array, password: string): Promise<Uint8Array> {
  try {
    return await gs(input, [`-sPDFPassword=${password}`]);
  } catch (e) {
    if (e instanceof ApiError && e.code === "encrypted") {
      throw new ApiError("wrong-password", "Senha incorreta. Verifique e tente novamente.");
    }
    throw e;
  }
}
