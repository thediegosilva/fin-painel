import { execFileSync } from "node:child_process";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { beforeEach, describe, expect, it } from "vitest";
import { POST as compress } from "@/app/api/pdf/compress/route";
import { POST as protect } from "@/app/api/pdf/protect/route";
import { POST as unlock } from "@/app/api/pdf/unlock/route";
import { POST as office } from "@/app/api/convert/office/route";
import { resetRateLimit } from "@/lib/server/http";
import { makePdf } from "./helpers";
import { openWithPdfjs } from "./pdfjs-node";

const hasGs = (() => {
  try {
    execFileSync("gs", ["--version"]);
    return true;
  } catch {
    return false;
  }
})();

function req(fields: Record<string, string | Blob>, headers: Record<string, string> = {}) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v instanceof Blob) fd.append(k, v, k === "file" ? "teste.pdf" : undefined);
    else fd.append(k, v);
  }
  return new Request("http://localhost/api", { method: "POST", body: fd, headers });
}

const pdfBlob = (b: Uint8Array) => new Blob([b.slice()], { type: "application/pdf" });

/** PDF com conteúdo redundante (mesma fonte embutida em várias páginas) — bom para comprimir. */
async function heavyPdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Courier);
  for (let p = 0; p < 20; p++) {
    const page = doc.addPage([595, 842]);
    for (let l = 0; l < 60; l++) page.drawText(`Linha ${l} da pagina ${p} - texto repetido para teste`, { x: 30, y: 800 - l * 12, size: 9, font });
  }
  return doc.save({ useObjectStreams: false });
}

beforeEach(() => resetRateLimit());

describe("validação das rotas", () => {
  it("recusa requisição sem multipart", async () => {
    const res = await compress(new Request("http://localhost/api", { method: "POST", body: "x" }));
    expect([400, 503]).toContain(res.status);
  });
  it.runIf(hasGs)("recusa arquivo que não é PDF (verificação por assinatura binária)", async () => {
    const res = await compress(req({ file: new Blob(["isto não é pdf"]) }));
    expect(res.status).toBe(415);
    expect((await res.json()).error.code).toBe("invalid-file");
  });
  it.runIf(hasGs)("recusa envio sem arquivo e nível inválido", async () => {
    expect((await compress(req({ level: "recomendada" }))).status).toBe(400);
    const res = await compress(req({ file: pdfBlob(await makePdf(1)), level: "absurda" }));
    expect(res.status).toBe(400);
  });
  it("Office retorna 503 com mensagem clara quando o LibreOffice não está instalado", async () => {
    let hasSoffice = true;
    try {
      execFileSync("soffice", ["--version"]);
    } catch {
      hasSoffice = false;
    }
    const res = await office(req({ file: new Blob(["x"]) }));
    if (!hasSoffice) {
      expect(res.status).toBe(503);
      expect((await res.json()).error.message).toMatch(/LibreOffice/);
    } else {
      expect(res.status).toBe(415);
    }
  });
});

describe.runIf(hasGs)("Ghostscript", () => {
  it("comprime um PDF e informa os tamanhos", async () => {
    const input = await heavyPdf();
    const res = await compress(req({ file: pdfBlob(input), level: "recomendada" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    const out = new Uint8Array(await res.arrayBuffer());
    expect(Number(res.headers.get("x-original-size"))).toBe(input.byteLength);
    expect(Number(res.headers.get("x-result-size"))).toBe(out.byteLength);
    expect(out.byteLength).toBeLessThanOrEqual(input.byteLength);
    expect((await PDFDocument.load(out)).getPageCount()).toBe(20);
  });

  it("protege com senha e desbloqueia com a senha correta", async () => {
    const input = await makePdf(2);
    const res = await protect(req({ file: pdfBlob(input), password: "segredo123" }));
    expect(res.status).toBe(200);
    const locked = new Uint8Array(await res.arrayBuffer());

    // Um leitor real exige a senha.
    await expect(openWithPdfjs(locked)).rejects.toMatchObject({ name: "PasswordException" });
    const opened = await openWithPdfjs(locked, "segredo123");
    expect(opened.numPages).toBe(2);
    await opened.close();

    // Senha errada → 401
    const wrong = await unlock(req({ file: pdfBlob(locked), password: "errada" }));
    expect(wrong.status).toBe(401);
    expect((await wrong.json()).error.code).toBe("wrong-password");

    // Senha correta → PDF sem proteção
    const ok = await unlock(req({ file: pdfBlob(locked), password: "segredo123" }));
    expect(ok.status).toBe(200);
    const unlocked = new Uint8Array(await ok.arrayBuffer());
    const doc = await openWithPdfjs(unlocked);
    expect(doc.numPages).toBe(2);
    await doc.close();
  });

  it("valida a senha de proteção", async () => {
    const pdf = pdfBlob(await makePdf(1));
    expect((await protect(req({ file: pdf, password: "" }))).status).toBe(400);
    expect((await protect(req({ file: pdf, password: "abc" }))).status).toBe(400);
    expect((await protect(req({ file: pdf, password: "senhaçã" }))).status).toBe(400);
    expect((await protect(req({ file: pdf, password: "x".repeat(65) }))).status).toBe(400);
  });

  it("compressão de PDF protegido retorna erro orientando o desbloqueio", async () => {
    const res = await protect(req({ file: pdfBlob(await makePdf(1)), password: "abcd1234" }));
    const locked = new Uint8Array(await res.arrayBuffer());
    const c = await compress(req({ file: pdfBlob(locked), level: "recomendada" }));
    expect(c.status).toBe(422);
    expect((await c.json()).error.code).toBe("encrypted");
  });
});

describe("limite de upload", () => {
  it.runIf(hasGs)("recusa corpo acima do limite mesmo sem Content-Length (envio em streaming)", async () => {
    const { vi } = await import("vitest");
    vi.resetModules();
    process.env.MAX_UPLOAD_MB = "1";
    try {
      const { POST } = await import("@/app/api/pdf/compress/route");
      const boundary = "----fp";
      const head = new TextEncoder().encode(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="a.pdf"\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.4\n`,
      );
      const chunk = new Uint8Array(256 * 1024);
      let sent = 0;
      const body = new ReadableStream<Uint8Array>({
        pull(controller) {
          if (sent === 0) controller.enqueue(head);
          if (sent >= 8) {
            controller.enqueue(new TextEncoder().encode(`\r\n--${boundary}--\r\n`));
            controller.close();
            return;
          }
          sent++;
          controller.enqueue(chunk);
        },
      });
      const res = await POST(
        new Request("http://localhost/api", {
          method: "POST",
          body,
          headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
          // @ts-expect-error -- requerido pelo Node para corpos em streaming
          duplex: "half",
        }),
      );
      expect(res.status).toBe(413);
      expect(sent).toBeLessThan(8); // parou de ler antes do fim
    } finally {
      delete process.env.MAX_UPLOAD_MB;
      vi.resetModules();
    }
  });
});
