import { PDFDocument, StandardFonts, degrees } from "pdf-lib";

/** Gera um PDF de teste com N páginas; cada página contém o texto "Pagina i". */
export async function makePdf(pages: number, opts: { rotate?: number; size?: [number, number] } = {}) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i++) {
    const page = doc.addPage(opts.size ?? [300, 400]);
    page.drawText(`Pagina ${i}`, { x: 50, y: 200, size: 20, font });
    if (opts.rotate) page.setRotation(degrees(opts.rotate));
  }
  return doc.save();
}

export async function pageTexts(bytes: Uint8Array): Promise<number> {
  return (await PDFDocument.load(bytes)).getPageCount();
}

/** PNG 1x1 vermelho válido. */
export const TINY_PNG = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
    "base64",
  ),
);
