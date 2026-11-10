import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, StandardFonts, degrees } from "pdf-lib";

export const FIXTURES = join(__dirname, "..", "fixtures", "generated");

async function makePdf(pages: number, rotate = 0) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i++) {
    const page = doc.addPage([400, 560]);
    page.drawText(`Pagina ${i}`, { x: 60, y: 300, size: 32, font });
    if (rotate) page.setRotation(degrees(rotate));
  }
  return doc.save();
}

export default async function globalSetup() {
  mkdirSync(FIXTURES, { recursive: true });
  writeFileSync(join(FIXTURES, "tres-paginas.pdf"), await makePdf(3));
  writeFileSync(join(FIXTURES, "cinco-paginas.pdf"), await makePdf(5));
  writeFileSync(join(FIXTURES, "girado.pdf"), await makePdf(2, 90));
  writeFileSync(join(FIXTURES, "nao-e-pdf.pdf"), "isto não é um PDF");
  writeFileSync(
    join(FIXTURES, "imagem.png"),
    Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR42mNk+M9QzwAEjDAGNzYAAD3oA/2T7cg/AAAAAElFTkSuQmCC", "base64"),
  );
  // JPEG e PDF protegido gerados com Ghostscript (dependência do servidor).
  const src = join(FIXTURES, "tres-paginas.pdf");
  execFileSync("gs", ["-q", "-dSAFER", "-dBATCH", "-dNOPAUSE", "-sDEVICE=jpeg", "-r20", "-dFirstPage=1", "-dLastPage=1", `-sOutputFile=${join(FIXTURES, "foto.jpg")}`, src]);
  execFileSync("gs", ["-q", "-dSAFER", "-dBATCH", "-dNOPAUSE", "-sDEVICE=pdfwrite", "-sOwnerPassword=dono", "-sUserPassword=abc123", "-dEncryptionR=3", "-dKeyLength=128", `-sOutputFile=${join(FIXTURES, "protegido.pdf")}`, src]);
}
