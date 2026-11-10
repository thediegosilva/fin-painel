// Utilitário de teste: usa o pdf.js (build legacy para Node) para inspecionar
// PDFs gerados como um leitor real faria — texto e posição visual na página.
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

export interface VisualText {
  str: string;
  /** Posição do texto na página renderizada (origem superior esquerda), em pontos. */
  x: number;
  y: number;
  pageWidth: number;
  pageHeight: number;
}

export async function openWithPdfjs(bytes: Uint8Array, password?: string) {
  const task = pdfjs.getDocument({ data: bytes.slice(), password, verbosity: 0 });
  const doc = await task.promise;
  return Object.assign(doc, { close: () => task.destroy() });
}

export async function visualTexts(bytes: Uint8Array, pageNumber: number): Promise<VisualText[]> {
  const doc = await openWithPdfjs(bytes);
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  const out: VisualText[] = [];
  for (const item of content.items) {
    if (!("str" in item) || !item.str.trim()) continue;
    const m = pdfjs.Util.transform(viewport.transform, item.transform);
    out.push({ str: item.str, x: m[4], y: m[5], pageWidth: viewport.width, pageHeight: viewport.height });
  }
  await doc.close();
  return out;
}
