import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

type PdfjsModule = typeof import("pdfjs-dist");

let modulePromise: Promise<PdfjsModule> | null = null;
let sharedWorker: InstanceType<PdfjsModule["PDFWorker"]> | null = null;

/** Carrega o pdf.js sob demanda (apenas no navegador), com assets servidos localmente. */
export function loadPdfjs(): Promise<PdfjsModule> {
  if (!modulePromise) {
    modulePromise = import("pdfjs-dist").then((m) => {
      m.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
      return m;
    });
    modulePromise.catch(() => {
      modulePromise = null;
    });
  }
  return modulePromise;
}

export async function openPdf(bytes: Uint8Array, password?: string): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfjs();
  // Um único Web Worker atende todos os documentos abertos (evita um worker por miniatura).
  if (!sharedWorker || sharedWorker.destroyed) sharedWorker = new pdfjs.PDFWorker();
  // O pdf.js transfere o buffer para o worker; passamos uma cópia para preservar o original.
  const task = pdfjs.getDocument({
    worker: sharedWorker,
    data: bytes.slice(),
    password,
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
    wasmUrl: "/pdfjs/wasm/",
    iccUrl: "/pdfjs/iccs/",
  });
  return task.promise;
}

/** Identifica se o pdf.js exige senha para abrir o documento. */
export async function needsPassword(bytes: Uint8Array): Promise<boolean> {
  try {
    const doc = await openPdf(bytes);
    await closePdf(doc);
    return false;
  } catch (e) {
    if (e && typeof e === "object" && "name" in e && e.name === "PasswordException") return true;
    throw e;
  }
}

/** Libera o documento (o worker compartilhado continua ativo). */
export function closePdf(doc: PDFDocumentProxy): Promise<void> {
  return doc.loadingTask.destroy();
}

// Navegadores limitam o tamanho de um canvas; ficamos bem abaixo dos limites.
const MAX_SIDE = 12_000;
const MAX_AREA = 36_000_000;

export interface RenderOptions {
  /** Escala desejada (1 = 72 DPI). */
  scale: number;
  /** Rotação extra em graus, somada à rotação da própria página. */
  rotation?: number;
  background?: string;
}

export async function renderPage(page: PDFPageProxy, opts: RenderOptions): Promise<HTMLCanvasElement> {
  const rotation = (((page.rotate + (opts.rotation ?? 0)) % 360) + 360) % 360;
  let viewport = page.getViewport({ scale: opts.scale, rotation });
  const shrink = Math.min(1, MAX_SIDE / viewport.width, MAX_SIDE / viewport.height, Math.sqrt(MAX_AREA / (viewport.width * viewport.height)));
  if (shrink < 1) viewport = page.getViewport({ scale: opts.scale * shrink, rotation });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  await page.render({ canvas, viewport, background: opts.background ?? "#ffffff" }).promise;
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: "image/jpeg" | "image/png", quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao gerar imagem"))), type, quality);
  });
}

/** Extrai o texto de todas as páginas, preservando quebras de linha. */
export async function extractText(
  doc: PDFDocumentProxy,
  onProgress?: (done: number, total: number) => void,
): Promise<{ pages: string[]; chars: number }> {
  const pages: string[] = [];
  let chars = 0;
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let text = "";
    for (const item of content.items) {
      if (!("str" in item)) continue;
      text += item.str;
      if (item.hasEOL) text += "\n";
    }
    text = text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    chars += text.replace(/\s/g, "").length;
    pages.push(text);
    page.cleanup();
    onProgress?.(i, doc.numPages);
  }
  return { pages, chars };
}
