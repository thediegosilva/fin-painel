import type { AcceptKind } from "@/lib/tools";

/** Limite por arquivo para ferramentas que rodam no navegador. */
export const LOCAL_MAX_MB = 950;

/** Acima deste tamanho (total), avisamos que o processamento pode ser lento e exigir muita memória. */
export const LARGE_FILE_MB = 300;

export type SniffedKind = "pdf" | "jpg" | "png" | "webp" | "gif" | "bmp" | "office" | "unknown";

const OFFICE_EXT = /\.(docx?|odt|rtf|xlsx?|ods|pptx?|odp)$/i;

export async function sniffFile(file: File): Promise<SniffedKind> {
  const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  const s = (i: number, sig: number[]) => sig.every((b, k) => head[i + k] === b);
  const latin = String.fromCharCode(...head);
  if (latin.includes("%PDF-")) return "pdf";
  if (s(0, [0xff, 0xd8, 0xff])) return "jpg";
  if (s(0, [0x89, 0x50, 0x4e, 0x47])) return "png";
  if (s(0, [0x52, 0x49, 0x46, 0x46]) && s(8, [0x57, 0x45, 0x42, 0x50])) return "webp";
  if (s(0, [0x47, 0x49, 0x46, 0x38])) return "gif";
  if (s(0, [0x42, 0x4d])) return "bmp";
  if (OFFICE_EXT.test(file.name)) return "office";
  return "unknown";
}

export function kindMatches(accept: AcceptKind, kind: SniffedKind): boolean {
  if (accept === "pdf") return kind === "pdf";
  if (accept === "image") return ["jpg", "png", "webp", "gif", "bmp"].includes(kind);
  return kind === "office";
}

export async function readBytes(file: Blob): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

/**
 * Lê a orientação EXIF de um JPEG (1 = normal). Retorna 1 se ausente/inválida.
 * Necessário porque o pdf-lib incorpora o JPEG cru, ignorando a rotação EXIF
 * (fotos de celular sairiam deitadas).
 */
export function jpegOrientation(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return 1;
  let offset = 2;
  while (offset + 4 < view.byteLength) {
    const marker = view.getUint16(offset);
    const size = view.getUint16(offset + 2);
    if (marker === 0xffe1 && offset + 10 < view.byteLength && view.getUint32(offset + 4) === 0x45786966) {
      const tiff = offset + 10;
      const little = view.getUint16(tiff) === 0x4949;
      const ifd = tiff + view.getUint32(tiff + 4, little);
      if (ifd + 2 > view.byteLength) return 1;
      const entries = view.getUint16(ifd, little);
      for (let i = 0; i < entries; i++) {
        const entry = ifd + 2 + i * 12;
        if (entry + 10 > view.byteLength) return 1;
        if (view.getUint16(entry, little) === 0x0112) {
          const v = view.getUint16(entry + 8, little);
          return v >= 1 && v <= 8 ? v : 1;
        }
      }
      return 1;
    }
    if ((marker & 0xff00) !== 0xff00 || size < 2) return 1;
    offset += 2 + size;
  }
  return 1;
}
