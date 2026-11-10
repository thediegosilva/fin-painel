import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  addPageNumbers,
  addWatermark,
  extractPages,
  groupsEvery,
  hasPdfHeader,
  imagesToPdf,
  loadPdf,
  mergePdfs,
  organizePages,
  readMetadata,
  removePages,
  rotatePages,
  splitByGroups,
  stampImage,
  writeMetadata,
} from "@/lib/pdf/ops";
import { TINY_PNG, makePdf } from "./helpers";
import { visualTexts } from "./pdfjs-node";

const count = async (b: Uint8Array) => (await PDFDocument.load(b)).getPageCount();
const firstText = async (b: Uint8Array, page: number) =>
  (await visualTexts(b, page)).find((t) => t.str.startsWith("Pagina"))?.str;

describe("validação de entrada", () => {
  it("rejeita arquivos que não são PDF", async () => {
    expect(hasPdfHeader(new TextEncoder().encode("hello"))).toBe(false);
    await expect(loadPdf(new TextEncoder().encode("hello"))).rejects.toMatchObject({ code: "invalid-pdf" });
  });
  it("rejeita PDF truncado com mensagem amigável", async () => {
    const pdf = await makePdf(1);
    await expect(loadPdf(pdf.slice(0, 40))).rejects.toMatchObject({ code: "invalid-pdf" });
  });
});

describe("organizar", () => {
  it("junta PDFs preservando a ordem", async () => {
    const a = await makePdf(2);
    const b = await makePdf(3);
    const out = await mergePdfs([b, a]);
    expect(await count(out)).toBe(5);
    expect(await firstText(out, 4)).toBe("Pagina 1");
  });
  it("exige ao menos dois arquivos para juntar", async () => {
    await expect(mergePdfs([await makePdf(1)])).rejects.toMatchObject({ code: "empty-selection" });
  });
  it("divide por grupos e a cada N páginas", async () => {
    const pdf = await makePdf(5);
    const parts = await splitByGroups(pdf, [[0, 1], [4]]);
    expect(parts).toHaveLength(2);
    expect(await count(parts[0])).toBe(2);
    expect(await firstText(parts[1], 1)).toBe("Pagina 5");
    expect(groupsEvery(5, 2)).toEqual([[0, 1], [2, 3], [4]]);
    expect(() => groupsEvery(5, 0)).toThrow();
  });
  it("extrai e remove páginas", async () => {
    const pdf = await makePdf(4);
    const ex = await extractPages(pdf, [3, 0]);
    expect(await count(ex)).toBe(2);
    expect(await firstText(ex, 1)).toBe("Pagina 4");
    const rm = await removePages(pdf, [1, 2]);
    expect(await count(rm)).toBe(2);
    expect(await firstText(rm, 2)).toBe("Pagina 4");
    await expect(removePages(pdf, [0, 1, 2, 3])).rejects.toMatchObject({ code: "no-pages-left" });
    await expect(extractPages(pdf, [9])).rejects.toMatchObject({ code: "invalid-range" });
  });
  it("reordena e gira páginas", async () => {
    const pdf = await makePdf(3);
    const out = await organizePages(pdf, [
      { index: 2, rotate: 90 },
      { index: 0, rotate: 0 },
    ]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(2);
    expect(doc.getPage(0).getRotation().angle).toBe(90);
    expect(await firstText(out, 1)).toBe("Pagina 3");
  });
  it("gira somente as páginas indicadas, somando à rotação existente", async () => {
    const pdf = await makePdf(2, { rotate: 90 });
    const out = await rotatePages(pdf, 270, [1]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPage(0).getRotation().angle).toBe(90);
    expect(doc.getPage(1).getRotation().angle).toBe(0);
  });
});

describe("editar", () => {
  it("numera páginas na posição visual correta, inclusive em páginas giradas", async () => {
    for (const rotate of [0, 90, 180, 270]) {
      const pdf = await makePdf(3, { rotate });
      const out = await addPageNumbers(pdf, {
        position: "bottom-right",
        format: "n-total",
        startAt: 1,
        fontSize: 12,
        margin: 20,
        color: "#000000",
      });
      const texts = await visualTexts(out, 2);
      const num = texts.find((t) => t.str === "2 / 3");
      expect(num, `rotação ${rotate}`).toBeTruthy();
      // Canto inferior direito da página como ela aparece na tela.
      expect(num!.x, `rotação ${rotate}`).toBeGreaterThan(num!.pageWidth * 0.6);
      expect(num!.y, `rotação ${rotate}`).toBeGreaterThan(num!.pageHeight * 0.85);
    }
  });
  it("numera apenas o intervalo escolhido, com número inicial", async () => {
    const pdf = await makePdf(4);
    const out = await addPageNumbers(pdf, {
      position: "top-left",
      format: "pagina-n-de-total",
      startAt: 5,
      fontSize: 10,
      margin: 20,
      color: "#333333",
      pages: [1, 2],
    });
    expect((await visualTexts(out, 1)).some((t) => t.str.startsWith("Página"))).toBe(false);
    const p2 = (await visualTexts(out, 2)).find((t) => t.str.startsWith("Página"));
    expect(p2?.str).toBe("Página 5 de 6");
    expect(p2!.x).toBeLessThan(p2!.pageWidth * 0.3);
    expect(p2!.y).toBeLessThan(p2!.pageHeight * 0.2);
  });
  it("aplica marca d'água centralizada e em mosaico", async () => {
    const pdf = await makePdf(1, { rotate: 90 });
    const center = await addWatermark(pdf, {
      text: "CONFIDENCIAL",
      fontSize: 40,
      color: "#ff0000",
      opacity: 0.3,
      angle: 45,
      layout: "center",
      bold: true,
    });
    const t = (await visualTexts(center, 1)).find((x) => x.str === "CONFIDENCIAL");
    expect(t).toBeTruthy();
    const mosaic = await addWatermark(pdf, {
      text: "Cópia",
      fontSize: 20,
      color: "#000000",
      opacity: 0.2,
      angle: 30,
      layout: "mosaic",
      bold: false,
    });
    expect((await visualTexts(mosaic, 1)).filter((x) => x.str === "Cópia").length).toBeGreaterThan(4);
  });
  it("rejeita caracteres que a fonte padrão não suporta", async () => {
    const pdf = await makePdf(1);
    await expect(
      addWatermark(pdf, { text: "😀", fontSize: 40, color: "#000000", opacity: 0.3, angle: 0, layout: "center", bold: false }),
    ).rejects.toMatchObject({ code: "unsupported-chars" });
  });
  it("lê e grava metadados", async () => {
    const pdf = await makePdf(2);
    const out = await writeMetadata(pdf, {
      title: "Relatório Anual",
      author: "Equipe Financeira",
      subject: "Balanço",
      keywords: "finanças, 2026",
      creator: "Teste",
    });
    const meta = await readMetadata(out);
    expect(meta).toMatchObject({ title: "Relatório Anual", author: "Equipe Financeira", pageCount: 2, producer: "FIN-Painel" });
    expect(meta.keywords).toContain("finanças");
  });
});

describe("converter e assinar", () => {
  it("converte imagens em PDF com tamanhos de página diferentes", async () => {
    const fit = await imagesToPdf([{ bytes: TINY_PNG, kind: "png" }], { pageSize: "fit", orientation: "auto", margin: 0 });
    const a4 = await imagesToPdf(
      [
        { bytes: TINY_PNG, kind: "png" },
        { bytes: TINY_PNG, kind: "png" },
      ],
      { pageSize: "a4", orientation: "landscape", margin: 20 },
    );
    expect((await PDFDocument.load(fit)).getPage(0).getWidth()).toBeCloseTo(0.75);
    const page = (await PDFDocument.load(a4)).getPage(1);
    expect(page.getWidth()).toBeCloseTo(841.89);
    expect(await count(a4)).toBe(2);
  });
  it("recusa imagem corrompida", async () => {
    await expect(
      imagesToPdf([{ bytes: new Uint8Array([1, 2, 3]), kind: "jpg" }], { pageSize: "a4", orientation: "auto", margin: 0 }),
    ).rejects.toMatchObject({ code: "invalid-image" });
  });
  it("insere a assinatura nas páginas indicadas", async () => {
    const pdf = await makePdf(2, { rotate: 90 });
    const out = await stampImage(pdf, TINY_PNG, [{ pageIndex: 1, nx: 0.6, ny: 0.8, nw: 0.3, nh: 0.1 }]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(2);
    expect(out.byteLength).toBeGreaterThan(pdf.byteLength);
    await expect(stampImage(pdf, TINY_PNG, [])).rejects.toMatchObject({ code: "empty-selection" });
  });
});
