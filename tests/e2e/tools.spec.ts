import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { openWithPdfjs, visualTexts } from "../unit/pdfjs-node";
import { fixture, pdfPages, runAndDownload, trackErrors, unzip, upload } from "./utils";

test.describe("ferramentas no navegador", () => {
  test("Juntar PDF: combina, reordena A–Z e baixa @mobile", async ({ page }) => {
    const errs = trackErrors(page);
    await page.goto("/juntar-pdf");
    await upload(page, ["tres-paginas.pdf", "cinco-paginas.pdf"]);
    await expect(page.getByText("2 arquivos · 8 páginas")).toBeVisible();
    await page.getByRole("button", { name: "Ordenar A–Z" }).click();
    const { bytes, download } = await runAndDownload(page, "Juntar PDFs");
    expect(download.suggestedFilename()).toMatch(/_combinado\.pdf$/);
    expect(await pdfPages(bytes)).toBe(8);
    // Após ordenar A–Z, "cinco-paginas" vem primeiro.
    const page6 = await visualTexts(bytes, 6);
    expect(page6.some((t) => t.str === "Pagina 1")).toBe(true);
    errs.expectNone();
  });

  test("Juntar PDF: remover arquivo exige ao menos dois", async ({ page }) => {
    await page.goto("/juntar-pdf");
    await upload(page, ["tres-paginas.pdf", "cinco-paginas.pdf"]);
    await page.getByRole("button", { name: "Remover tres-paginas.pdf" }).click();
    await expect(page.getByRole("button", { name: "Juntar PDFs" })).toBeDisabled();
    await expect(page.getByText("Adicione pelo menos dois PDFs.")).toBeVisible();
  });

  test("Dividir PDF: intervalos geram ZIP com os arquivos certos", async ({ page }) => {
    await page.goto("/dividir-pdf");
    await upload(page, "cinco-paginas.pdf");
    await page.getByLabel("Intervalos", { exact: true }).fill("1-2, 3, 4-5");
    await expect(page.getByText("Prévia: 3 arquivos")).toBeVisible();
    const { bytes } = await runAndDownload(page, "Dividir PDF", /Baixar tudo/);
    const files = unzip(bytes);
    const names = Object.keys(files).sort();
    expect(names).toHaveLength(3);
    expect(await pdfPages(files[names.find((n) => n.includes("paginas-1-2"))!])).toBe(2);
  });

  test("Dividir PDF: intervalo inválido bloqueia a ação com mensagem", async ({ page }) => {
    await page.goto("/dividir-pdf");
    await upload(page, "tres-paginas.pdf");
    await page.getByLabel("Intervalos", { exact: true }).fill("1-9");
    await expect(page.getByText("A página 9 não existe").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Dividir PDF" })).toBeDisabled();
  });

  test("Remover páginas: remove as selecionadas @mobile", async ({ page }) => {
    await page.goto("/remover-paginas");
    await upload(page, "cinco-paginas.pdf");
    await page.getByRole("button", { name: "Página 2", exact: true }).click();
    await page.getByRole("button", { name: "Página 4", exact: true }).click();
    const { bytes } = await runAndDownload(page, "Remover páginas");
    expect(await pdfPages(bytes)).toBe(3);
    expect((await visualTexts(bytes, 2)).some((t) => t.str === "Pagina 3")).toBe(true);
  });

  test("Extrair páginas: intervalo digitado e um PDF por página", async ({ page }) => {
    await page.goto("/extrair-paginas");
    await upload(page, "cinco-paginas.pdf");
    const range = page.getByLabel("Páginas a extrair");
    await range.fill("2-3");
    await range.press("Enter");
    await expect(page.getByText("2 páginas selecionadas de 5.")).toBeVisible();
    let res = await runAndDownload(page, "Extrair páginas");
    expect(await pdfPages(res.bytes)).toBe(2);

    await page.getByRole("button", { name: "Voltar e ajustar" }).click();
    await page.getByText("Um PDF por página").click();
    res = await runAndDownload(page, "Extrair páginas", /Baixar tudo/);
    expect(Object.keys(unzip(res.bytes))).toHaveLength(2);
  });

  test("Organizar PDF: exclui e gira páginas", async ({ page }) => {
    await page.goto("/organizar-pdf");
    await upload(page, "tres-paginas.pdf");
    await expect(page.getByRole("button", { name: "Aplicar alterações" })).toBeDisabled();
    await page.getByRole("button", { name: "Excluir página 1" }).click();
    await page.getByRole("button", { name: "Girar página 2 para a direita" }).click();
    const { bytes } = await runAndDownload(page, "Aplicar alterações");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(2);
    expect(doc.getPage(0).getRotation().angle).toBe(90);
  });

  test("Organizar PDF: reordena via teclado", async ({ page }) => {
    await page.goto("/organizar-pdf");
    await upload(page, "tres-paginas.pdf");
    const handle = page.getByRole("button", { name: "Mover página 1 (posição 1)" });
    await handle.focus();
    // Ritmo humano entre teclas: o dnd-kit mede as posições após ativar o arraste.
    await page.keyboard.press("Space");
    await page.waitForTimeout(150);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(150);
    await page.keyboard.press("Space");
    await expect(page.getByRole("button", { name: "Mover página 1 (posição 2)" })).toBeVisible();
    const { bytes } = await runAndDownload(page, "Aplicar alterações");
    expect((await visualTexts(bytes, 1)).some((t) => t.str === "Pagina 2")).toBe(true);
  });

  test("Girar PDF: gira todas as páginas", async ({ page }) => {
    await page.goto("/girar-pdf");
    await upload(page, "tres-paginas.pdf");
    await page.getByText("180°", { exact: true }).click();
    const { bytes } = await runAndDownload(page, "Girar PDF");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPages().map((p) => p.getRotation().angle)).toEqual([180, 180, 180]);
  });

  test("Números de página: posição e formato aplicados (inclusive página girada)", async ({ page }) => {
    await page.goto("/numeros-de-pagina");
    await upload(page, "girado.pdf");
    await page.getByLabel("Texto").selectOption("pagina-n-de-total");
    await page.getByRole("radio", { name: "Superior direito" }).click();
    const { bytes } = await runAndDownload(page, "Adicionar números");
    const t = (await visualTexts(bytes, 2)).find((x) => x.str === "Página 2 de 2");
    expect(t).toBeTruthy();
    expect(t!.x).toBeGreaterThan(t!.pageWidth * 0.5);
    expect(t!.y).toBeLessThan(t!.pageHeight * 0.2);
  });

  test("Marca d'água: texto aplicado; texto vazio bloqueia", async ({ page }) => {
    await page.goto("/marca-dagua");
    await upload(page, "tres-paginas.pdf");
    const input = page.getByLabel("Texto da marca d'água");
    await input.fill("");
    await expect(page.getByRole("button", { name: "Aplicar marca d'água" })).toBeDisabled();
    await input.fill("RASCUNHO");
    const { bytes } = await runAndDownload(page, "Aplicar marca d'água");
    expect((await visualTexts(bytes, 3)).some((t) => t.str === "RASCUNHO")).toBe(true);
  });

  test("Marca d'água: emoji gera erro amigável", async ({ page }) => {
    await page.goto("/marca-dagua");
    await upload(page, "tres-paginas.pdf");
    await page.getByLabel("Texto da marca d'água").fill("Oi 😀");
    await page.getByRole("button", { name: "Aplicar marca d'água" }).click();
    await expect(page.getByText(/caracteres não suportados/)).toBeVisible();
  });

  test("Editar metadados: lê e grava", async ({ page }) => {
    await page.goto("/editar-metadados");
    await upload(page, "tres-paginas.pdf");
    await page.getByLabel("Título").fill("Relatório Trimestral");
    await page.getByLabel("Autor").fill("Equipe FIN");
    const { bytes } = await runAndDownload(page, "Salvar metadados");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getTitle()).toBe("Relatório Trimestral");
    expect(doc.getAuthor()).toBe("Equipe FIN");
  });

  test("Imagem para PDF: PNG e JPG viram páginas @mobile", async ({ page }) => {
    await page.goto("/jpg-para-pdf");
    await upload(page, ["imagem.png", "foto.jpg"]);
    await expect(page.getByText("2 imagens")).toBeVisible();
    const { bytes } = await runAndDownload(page, "Converter para PDF");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(2);
    expect(doc.getPage(0).getWidth()).toBeCloseTo(595.28, 1);
  });

  test("PDF para imagem: gera um JPG por página", async ({ page }) => {
    await page.goto("/pdf-para-jpg");
    await upload(page, "tres-paginas.pdf");
    await page.getByText("72 DPI").click();
    const { bytes } = await runAndDownload(page, "Converter em imagens", /Baixar tudo/);
    const files = unzip(bytes);
    const names = Object.keys(files).sort();
    expect(names).toEqual(["0000.jpg", "0001.jpg", "0002.jpg"]);
    for (const n of names) expect([...files[n].slice(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
  });

  test("PDF para imagem: baixar separados entrega cada imagem em ordem", async ({ page }) => {
    await page.goto("/pdf-para-jpg");
    await upload(page, "tres-paginas.pdf");
    await page.getByText("72 DPI").click();
    await page.getByRole("button", { name: "Converter em imagens" }).click();
    const btn = page.getByRole("button", { name: "Baixar separados" });
    await expect(btn).toBeVisible({ timeout: 45_000 });
    const downloads: string[] = [];
    page.on("download", (d) => downloads.push(d.suggestedFilename()));
    await btn.click();
    await expect.poll(() => downloads.length, { timeout: 10_000 }).toBe(3);
    expect(downloads).toEqual(["0000.jpg", "0001.jpg", "0002.jpg"]);
    await expect(page.getByRole("button", { name: "Baixar separados" })).toBeEnabled();
  });

  test("PDF para texto: extrai o conteúdo", async ({ page }) => {
    await page.goto("/pdf-para-texto");
    await upload(page, "tres-paginas.pdf");
    const { download } = await runAndDownload(page, "Extrair texto");
    const text = readFileSync((await download.path())!, "utf8");
    expect(text).toContain("— Página 2 —");
    expect(text).toContain("Pagina 3");
  });

  test("Assinar PDF: desenha, posiciona e aplica @mobile", async ({ page, isMobile }) => {
    await page.goto("/assinar-pdf");
    await upload(page, "tres-paginas.pdf");
    await expect(page.getByRole("button", { name: "Assinar PDF" })).toBeDisabled();
    const pad = page.getByLabel("Área para desenhar a assinatura");
    await pad.scrollIntoViewIfNeeded();
    const box = (await pad.boundingBox())!;
    if (isMobile) {
      // Em mobile usamos a assinatura digitada (toque já coberto pelo pointer events).
      await page.getByText("Digitar", { exact: true }).click();
      await page.getByLabel("Nome para assinatura").fill("Maria Silva");
    } else {
      await page.mouse.move(box.x + 20, box.y + 60);
      await page.mouse.down();
      for (let i = 1; i <= 12; i++) await page.mouse.move(box.x + 20 + i * 18, box.y + 60 + Math.sin(i) * 25);
      await page.mouse.up();
    }
    const sig = page.getByRole("group", { name: /Assinatura\. Use as setas/ });
    await expect(sig).toBeVisible();
    await sig.focus();
    await page.keyboard.press("ArrowLeft");
    await page.getByText("Todas", { exact: true }).click();
    const original = readFileSync(fixture("tres-paginas.pdf")).byteLength;
    const { bytes } = await runAndDownload(page, "Assinar PDF");
    expect(await pdfPages(bytes)).toBe(3);
    expect(bytes.byteLength).toBeGreaterThan(original);
  });
});

test.describe("ferramentas no servidor", () => {
  test("Comprimir PDF: envia, mostra resultado e baixa", async ({ page }) => {
    await page.goto("/comprimir-pdf");
    await upload(page, "cinco-paginas.pdf");
    await page.getByText("Compressão extrema").click();
    const { bytes } = await runAndDownload(page, "Comprimir PDF");
    expect(await pdfPages(bytes)).toBe(5);
    await expect(page.getByText(/redução de|já está otimizado/)).toBeVisible();
  });

  test("Proteger PDF: valida senha e gera arquivo que exige senha", async ({ page }) => {
    await page.goto("/proteger-pdf");
    await upload(page, "tres-paginas.pdf");
    await page.getByLabel("Senha", { exact: true }).fill("minhasenha");
    await page.getByLabel("Confirme a senha").fill("outra");
    await expect(page.getByRole("button", { name: "Proteger PDF" })).toBeDisabled();
    await page.getByLabel("Confirme a senha").fill("minhasenha");
    await page.getByRole("button", { name: "Mostrar senha" }).first().click();
    await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute("type", "text");
    const { bytes } = await runAndDownload(page, "Proteger PDF");
    await expect(openWithPdfjs(bytes)).rejects.toMatchObject({ name: "PasswordException" });
    const doc = await openWithPdfjs(bytes, "minhasenha");
    expect(doc.numPages).toBe(3);
    await doc.close();
  });

  test("Desbloquear PDF: senha errada mostra erro; correta desbloqueia", async ({ page }) => {
    await page.goto("/desbloquear-pdf");
    await upload(page, "protegido.pdf");
    const pw = page.getByLabel("Senha atual do PDF");
    await pw.fill("errada");
    await page.getByRole("button", { name: "Desbloquear PDF" }).click();
    await expect(page.getByText("Senha incorreta. Verifique e tente novamente.")).toBeVisible();
    await pw.fill("abc123");
    const { bytes } = await runAndDownload(page, "Desbloquear PDF");
    const doc = await openWithPdfjs(bytes);
    expect(doc.numPages).toBe(3);
    await doc.close();
  });

  test("Desbloquear PDF: arquivo sem proteção é informado", async ({ page }) => {
    await page.goto("/desbloquear-pdf");
    await upload(page, "tres-paginas.pdf");
    await expect(page.getByText("Este PDF não está protegido")).toBeVisible();
  });

  test("Office para PDF: reflete a disponibilidade real do LibreOffice", async ({ page, request }) => {
    const health = await (await request.get("/api/health")).json();
    await page.goto("/office-para-pdf");
    if (health.capabilities.libreoffice) {
      await expect(page.getByRole("button", { name: "Selecionar arquivo", exact: true })).toBeVisible();
    } else {
      await expect(page.getByText("Ferramenta indisponível neste servidor")).toBeVisible();
      await page.getByRole("link", { name: "Ver status do serviço" }).click();
      await expect(page).toHaveURL("/status");
    }
  });
});

test.describe("tratamento de erros", () => {
  test("arquivo que não é PDF é recusado com mensagem", async ({ page }) => {
    await page.goto("/girar-pdf");
    await upload(page, "nao-e-pdf.pdf");
    await expect(page.getByText("“nao-e-pdf.pdf” não é um PDF válido.")).toBeVisible();
  });

  test("PDF protegido orienta a usar Desbloquear PDF", async ({ page }) => {
    await page.goto("/dividir-pdf");
    await upload(page, "protegido.pdf");
    await expect(page.getByText(/protegido por senha.*Desbloquear PDF/)).toBeVisible();
  });

  test("Juntar: arquivos inválidos são listados sem bloquear os válidos", async ({ page }) => {
    await page.goto("/juntar-pdf");
    await upload(page, ["tres-paginas.pdf", "nao-e-pdf.pdf", "cinco-paginas.pdf"]);
    await expect(page.getByText("Alguns arquivos não foram adicionados")).toBeVisible();
    await expect(page.getByText("2 arquivos · 8 páginas")).toBeVisible();
  });

  test("trocar arquivo e processar outro reiniciam o fluxo", async ({ page }) => {
    await page.goto("/girar-pdf");
    await upload(page, "tres-paginas.pdf");
    await page.getByRole("button", { name: /Trocar/ }).click();
    await expect(page.getByRole("button", { name: "Selecionar arquivo", exact: true })).toBeVisible();
    await upload(page, "tres-paginas.pdf");
    await runAndDownload(page, "Girar PDF");
    await page.getByRole("button", { name: "Processar outro arquivo" }).click();
    await expect(page.getByRole("button", { name: "Selecionar arquivo", exact: true })).toBeVisible();
  });

  test("API recusa tipo errado e informa limite", async ({ request }) => {
    const res = await request.post("/api/pdf/compress", {
      multipart: { file: { name: "x.pdf", mimeType: "application/pdf", buffer: Buffer.from("falso") } },
    });
    expect(res.status()).toBe(415);
    expect((await res.json()).error.message).toMatch(/não é um PDF/);
  });
});
