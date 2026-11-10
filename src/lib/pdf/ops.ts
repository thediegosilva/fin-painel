/**
 * Operações de PDF baseadas em pdf-lib. Funcionam tanto no navegador quanto
 * no Node (usado nos testes). Nenhuma função aqui toca DOM ou rede.
 */
import { PDFDocument, PDFFont, PDFPage, StandardFonts, degrees, rgb } from "pdf-lib";
import { PdfError } from "./errors";
import { formatPageNumber, type NumberFormat } from "./page-number-format";

export { groupsEvery } from "./ranges";
export { formatPageNumber, type NumberFormat } from "./page-number-format";

export const PRODUCER = "FIN-Painel";

// ---------------------------------------------------------------------------
// Utilidades de carga / validação
// ---------------------------------------------------------------------------

export function hasPdfHeader(bytes: Uint8Array): boolean {
  const head = bytes.subarray(0, 1024);
  for (let i = 0; i + 4 < head.length; i++) {
    if (head[i] === 0x25 && head[i + 1] === 0x50 && head[i + 2] === 0x44 && head[i + 3] === 0x46 && head[i + 4] === 0x2d) {
      return true; // "%PDF-"
    }
  }
  return false;
}

export async function loadPdf(bytes: Uint8Array): Promise<PDFDocument> {
  if (!hasPdfHeader(bytes)) {
    throw new PdfError("invalid-pdf", "O arquivo não é um PDF válido.");
  }
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (e) {
    if (e instanceof Error && (e.name === "EncryptedPDFError" || /encrypt/i.test(e.message))) {
      throw new PdfError(
        "encrypted",
        "Este PDF está protegido por senha. Use a ferramenta Desbloquear PDF antes de continuar.",
      );
    }
    throw new PdfError(
      "invalid-pdf",
      "Não foi possível ler este PDF. O arquivo pode estar corrompido.",
    );
  }
}

export async function getPageCount(bytes: Uint8Array): Promise<number> {
  return (await loadPdf(bytes)).getPageCount();
}

async function save(doc: PDFDocument): Promise<Uint8Array> {
  doc.setProducer(PRODUCER);
  doc.setModificationDate(new Date());
  return doc.save({ useObjectStreams: true });
}

function normalizeAngle(a: number): number {
  return ((Math.round(a / 90) * 90) % 360 + 360) % 360;
}

function assertIndices(indices: number[], pageCount: number) {
  if (indices.length === 0) throw new PdfError("empty-selection", "Selecione ao menos uma página.");
  for (const i of indices) {
    if (!Number.isInteger(i) || i < 0 || i >= pageCount) {
      throw new PdfError("invalid-range", `Página ${i + 1} fora do documento (${pageCount} páginas).`);
    }
  }
}

async function copyToNew(src: PDFDocument, indices: number[]): Promise<PDFDocument> {
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  pages.forEach((p) => out.addPage(p));
  return out;
}

// ---------------------------------------------------------------------------
// Geometria: converte coordenadas "visuais" (como a página aparece na tela,
// considerando /Rotate) para o espaço de coordenadas do PDF.
// ---------------------------------------------------------------------------

export interface VisualBox {
  width: number;
  height: number;
  rotation: number;
  /** Converte um ponto visual (origem no canto inferior esquerdo) para o espaço do PDF. */
  toPdf(vx: number, vy: number): { x: number; y: number };
}

export function visualBox(page: PDFPage): VisualBox {
  const box = page.getCropBox();
  const rotation = normalizeAngle(page.getRotation().angle);
  const W = box.width;
  const H = box.height;
  const swap = rotation === 90 || rotation === 270;
  return {
    width: swap ? H : W,
    height: swap ? W : H,
    rotation,
    toPdf(vx, vy) {
      let x: number;
      let y: number;
      switch (rotation) {
        case 90:
          x = W - vy;
          y = vx;
          break;
        case 180:
          x = W - vx;
          y = H - vy;
          break;
        case 270:
          x = vy;
          y = H - vx;
          break;
        default:
          x = vx;
          y = vy;
      }
      return { x: x + box.x, y: y + box.y };
    },
  };
}

function rotateVec(x: number, y: number, deg: number) {
  const r = (deg * Math.PI) / 180;
  return { x: x * Math.cos(r) - y * Math.sin(r), y: x * Math.sin(r) + y * Math.cos(r) };
}

/** Desenha texto centralizado num ponto visual, com rotação visual opcional. */
function drawCenteredText(
  page: PDFPage,
  vb: VisualBox,
  text: string,
  opts: { cx: number; cy: number; font: PDFFont; size: number; angle?: number; color: ReturnType<typeof rgb>; opacity?: number },
) {
  const w = opts.font.widthOfTextAtSize(text, opts.size);
  const h = opts.font.heightAtSize(opts.size, { descender: false });
  const angle = opts.angle ?? 0;
  const off = rotateVec(-w / 2, -h / 2, angle);
  const origin = vb.toPdf(opts.cx + off.x, opts.cy + off.y);
  page.drawText(text, {
    x: origin.x,
    y: origin.y,
    size: opts.size,
    font: opts.font,
    color: opts.color,
    opacity: opts.opacity,
    rotate: degrees(vb.rotation + angle),
  });
}

function assertEncodable(font: PDFFont, text: string) {
  try {
    font.encodeText(text);
  } catch {
    throw new PdfError(
      "unsupported-chars",
      "O texto contém caracteres não suportados (por exemplo, emojis). Use letras, números e acentos comuns.",
    );
  }
}

export function hexToRgb(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return rgb(0, 0, 0);
  const n = parseInt(m[1], 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

// ---------------------------------------------------------------------------
// Organizar
// ---------------------------------------------------------------------------

export async function mergePdfs(files: Uint8Array[]): Promise<Uint8Array> {
  if (files.length < 2) throw new PdfError("empty-selection", "Adicione pelo menos dois PDFs para juntar.");
  const out = await PDFDocument.create();
  for (const bytes of files) {
    const src = await loadPdf(bytes);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  return save(out);
}

/** Cria um PDF por grupo de índices. */
export async function splitByGroups(bytes: Uint8Array, groups: number[][]): Promise<Uint8Array[]> {
  const src = await loadPdf(bytes);
  if (groups.length === 0) throw new PdfError("empty-selection", "Nenhum intervalo informado.");
  const outputs: Uint8Array[] = [];
  for (const g of groups) {
    assertIndices(g, src.getPageCount());
    outputs.push(await save(await copyToNew(src, g)));
  }
  return outputs;
}


export async function extractPages(bytes: Uint8Array, indices: number[]): Promise<Uint8Array> {
  const src = await loadPdf(bytes);
  assertIndices(indices, src.getPageCount());
  return save(await copyToNew(src, indices));
}

export async function removePages(bytes: Uint8Array, indices: number[]): Promise<Uint8Array> {
  const src = await loadPdf(bytes);
  const total = src.getPageCount();
  assertIndices(indices, total);
  const remove = new Set(indices);
  const keep = src.getPageIndices().filter((i) => !remove.has(i));
  if (keep.length === 0) {
    throw new PdfError("no-pages-left", "Não é possível remover todas as páginas. Mantenha pelo menos uma.");
  }
  return save(await copyToNew(src, keep));
}

export interface PagePlan {
  /** Índice 0-based da página no documento original. */
  index: number;
  /** Rotação adicional em graus (múltiplo de 90). */
  rotate: number;
}

/** Reordena, gira e descarta páginas conforme o plano (páginas ausentes são removidas). */
export async function organizePages(bytes: Uint8Array, plan: PagePlan[]): Promise<Uint8Array> {
  const src = await loadPdf(bytes);
  if (plan.length === 0) throw new PdfError("no-pages-left", "O documento final precisa ter pelo menos uma página.");
  assertIndices(plan.map((p) => p.index), src.getPageCount());
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, plan.map((p) => p.index));
  pages.forEach((page, k) => {
    const extra = normalizeAngle(plan[k].rotate);
    if (extra) page.setRotation(degrees(normalizeAngle(page.getRotation().angle + extra)));
    out.addPage(page);
  });
  return save(out);
}

export async function rotatePages(bytes: Uint8Array, angle: number, indices?: number[]): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  const targets = indices ?? doc.getPageIndices();
  assertIndices(targets, doc.getPageCount());
  const a = normalizeAngle(angle);
  for (const i of targets) {
    const page = doc.getPage(i);
    page.setRotation(degrees(normalizeAngle(page.getRotation().angle + a)));
  }
  return save(doc);
}

// ---------------------------------------------------------------------------
// Editar
// ---------------------------------------------------------------------------

export type NumberPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";


export interface PageNumberOptions {
  position: NumberPosition;
  format: NumberFormat;
  startAt: number;
  fontSize: number;
  margin: number;
  color: string;
  /** Índices 0-based a numerar; undefined = todas. */
  pages?: number[];
}


export async function addPageNumbers(bytes: Uint8Array, opts: PageNumberOptions): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const targets = opts.pages ?? doc.getPageIndices();
  assertIndices(targets, doc.getPageCount());
  const start = Math.max(0, Math.floor(opts.startAt));
  const total = start + targets.length - 1;
  const color = hexToRgb(opts.color);

  targets.forEach((pageIndex, k) => {
    const page = doc.getPage(pageIndex);
    const vb = visualBox(page);
    const text = formatPageNumber(opts.format, start + k, total);
    const w = font.widthOfTextAtSize(text, opts.fontSize);
    const h = font.heightAtSize(opts.fontSize, { descender: false });
    const [vert, horiz] = opts.position.split("-") as ["top" | "bottom", "left" | "center" | "right"];
    const cx =
      horiz === "left" ? opts.margin + w / 2 : horiz === "right" ? vb.width - opts.margin - w / 2 : vb.width / 2;
    const cy = vert === "top" ? vb.height - opts.margin - h / 2 : opts.margin + h / 2;
    drawCenteredText(page, vb, text, { cx, cy, font, size: opts.fontSize, color });
  });
  return save(doc);
}

export interface WatermarkOptions {
  text: string;
  fontSize: number;
  color: string;
  /** 0..1 */
  opacity: number;
  /** Ângulo visual em graus (sentido anti-horário). */
  angle: number;
  layout: "center" | "mosaic";
  bold: boolean;
  pages?: number[];
}

export async function addWatermark(bytes: Uint8Array, opts: WatermarkOptions): Promise<Uint8Array> {
  const text = opts.text.trim();
  if (!text) throw new PdfError("empty-selection", "Digite o texto da marca d'água.");
  const doc = await loadPdf(bytes);
  const font = await doc.embedFont(opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica);
  assertEncodable(font, text);
  const targets = opts.pages ?? doc.getPageIndices();
  assertIndices(targets, doc.getPageCount());
  const color = hexToRgb(opts.color);
  const opacity = Math.min(1, Math.max(0.05, opts.opacity));

  for (const i of targets) {
    const page = doc.getPage(i);
    const vb = visualBox(page);
    const base = { font, size: opts.fontSize, color, opacity, angle: opts.angle };
    if (opts.layout === "center") {
      drawCenteredText(page, vb, text, { ...base, cx: vb.width / 2, cy: vb.height / 2 });
    } else {
      const w = font.widthOfTextAtSize(text, opts.fontSize);
      const stepX = w + opts.fontSize * 3;
      const stepY = opts.fontSize * 5;
      const diag = Math.hypot(vb.width, vb.height);
      // Percorre uma grade rotacionada que cobre toda a página.
      for (let gy = -diag; gy <= diag; gy += stepY) {
        const row = Math.round(gy / stepY);
        for (let gx = -diag; gx <= diag; gx += stepX) {
          const shift = row % 2 === 0 ? 0 : stepX / 2;
          const p = rotateVec(gx + shift, gy, opts.angle);
          const cx = vb.width / 2 + p.x;
          const cy = vb.height / 2 + p.y;
          if (cx < -w || cx > vb.width + w || cy < -w || cy > vb.height + w) continue;
          drawCenteredText(page, vb, text, { ...base, cx, cy });
        }
      }
    }
  }
  return save(doc);
}

export interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
}

export async function readMetadata(bytes: Uint8Array): Promise<PdfMetadata & { pageCount: number }> {
  const doc = await loadPdf(bytes);
  return {
    title: doc.getTitle() ?? "",
    author: doc.getAuthor() ?? "",
    subject: doc.getSubject() ?? "",
    keywords: doc.getKeywords() ?? "",
    creator: doc.getCreator() ?? "",
    producer: doc.getProducer() ?? "",
    pageCount: doc.getPageCount(),
  };
}

export async function writeMetadata(bytes: Uint8Array, meta: Omit<PdfMetadata, "producer">): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  doc.setTitle(meta.title.trim());
  doc.setAuthor(meta.author.trim());
  doc.setSubject(meta.subject.trim());
  doc.setKeywords(
    meta.keywords
      .split(/[,;]/)
      .map((k) => k.trim())
      .filter(Boolean),
  );
  doc.setCreator(meta.creator.trim());
  return save(doc);
}

// ---------------------------------------------------------------------------
// Converter
// ---------------------------------------------------------------------------

export type PageSizeOption = "fit" | "a4" | "letter";
export type OrientationOption = "auto" | "portrait" | "landscape";

export interface ImageInput {
  bytes: Uint8Array;
  kind: "jpg" | "png";
}

const PAGE_SIZES: Record<Exclude<PageSizeOption, "fit">, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

export async function imagesToPdf(
  images: ImageInput[],
  opts: { pageSize: PageSizeOption; orientation: OrientationOption; margin: number },
): Promise<Uint8Array> {
  if (images.length === 0) throw new PdfError("empty-selection", "Adicione ao menos uma imagem.");
  const doc = await PDFDocument.create();
  for (const img of images) {
    let embedded;
    try {
      embedded = img.kind === "jpg" ? await doc.embedJpg(img.bytes) : await doc.embedPng(img.bytes);
    } catch {
      throw new PdfError("invalid-image", "Uma das imagens não pôde ser lida. Verifique se o arquivo não está corrompido.");
    }
    // Pixels → pontos assumindo 96 DPI (1px = 0,75pt).
    const iw = embedded.width * 0.75;
    const ih = embedded.height * 0.75;
    const margin = Math.max(0, opts.margin);
    let pw: number;
    let ph: number;
    if (opts.pageSize === "fit") {
      pw = iw + margin * 2;
      ph = ih + margin * 2;
    } else {
      [pw, ph] = PAGE_SIZES[opts.pageSize];
      const landscape = opts.orientation === "landscape" || (opts.orientation === "auto" && iw > ih);
      if (landscape) [pw, ph] = [ph, pw];
    }
    const page = doc.addPage([pw, ph]);
    const maxW = pw - margin * 2;
    const maxH = ph - margin * 2;
    const scale = opts.pageSize === "fit" ? 1 : Math.min(maxW / iw, maxH / ih);
    const w = iw * scale;
    const h = ih * scale;
    page.drawImage(embedded, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
  }
  return save(doc);
}

// ---------------------------------------------------------------------------
// Assinar
// ---------------------------------------------------------------------------

export interface SignaturePlacement {
  pageIndex: number;
  /** Coordenadas normalizadas (0..1) relativas à página visível, origem no canto superior esquerdo. */
  nx: number;
  ny: number;
  nw: number;
  /** Altura normalizada; se omitida, é derivada da proporção da imagem. */
  nh?: number;
}

export async function stampImage(
  bytes: Uint8Array,
  png: Uint8Array,
  placements: SignaturePlacement[],
): Promise<Uint8Array> {
  if (placements.length === 0) throw new PdfError("empty-selection", "Posicione a assinatura em ao menos uma página.");
  const doc = await loadPdf(bytes);
  assertIndices(placements.map((p) => p.pageIndex), doc.getPageCount());
  const img = await doc.embedPng(png);
  for (const p of placements) {
    const page = doc.getPage(p.pageIndex);
    const vb = visualBox(page);
    const w = p.nw * vb.width;
    const h = p.nh !== undefined ? p.nh * vb.height : (w * img.height) / img.width;
    const vx = p.nx * vb.width;
    const vy = vb.height - p.ny * vb.height - h;
    const origin = vb.toPdf(vx, vy);
    page.drawImage(img, { x: origin.x, y: origin.y, width: w, height: h, rotate: degrees(vb.rotation) });
  }
  return save(doc);
}
