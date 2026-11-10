export type PdfErrorCode =
  | "encrypted"
  | "invalid-pdf"
  | "invalid-image"
  | "empty-selection"
  | "invalid-range"
  | "unsupported-chars"
  | "no-pages-left"
  | "no-text"
  | "too-large";

/** Erro de domínio com mensagem pronta para exibir ao usuário (pt-BR). */
export class PdfError extends Error {
  readonly code: PdfErrorCode;
  constructor(code: PdfErrorCode, message: string) {
    super(message);
    this.name = "PdfError";
    this.code = code;
  }
}

export function isPdfError(e: unknown): e is PdfError {
  return e instanceof Error && e.name === "PdfError" && "code" in e;
}

/** Converte qualquer erro em uma mensagem amigável. */
export function toUserMessage(e: unknown): string {
  if (isPdfError(e)) return e.message;
  if (e instanceof Error && /encrypt/i.test(e.message)) {
    return "Este PDF está protegido por senha. Desbloqueie-o antes de usar esta ferramenta.";
  }
  if (e instanceof Error && /(Failed to parse|No PDF header|Invalid PDF|InvalidPDF)/i.test(e.message)) {
    return "Não foi possível ler este arquivo. Ele pode estar corrompido ou não ser um PDF válido.";
  }
  return "Ocorreu um erro inesperado ao processar o arquivo. Tente novamente.";
}
