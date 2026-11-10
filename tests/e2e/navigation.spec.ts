import { expect, test } from "@playwright/test";
import { TOOLS } from "../../src/lib/tools";
import { trackErrors } from "./utils";

const CONTENT_PAGES = ["/", "/como-funciona", "/privacidade", "/termos", "/status", "/apoiar"];

test.describe("navegação e páginas", () => {
  test("home lista todas as ferramentas, filtra e busca @mobile", async ({ page }) => {
    const errs = trackErrors(page);
    await page.goto("/");
    await expect(page).toHaveTitle(/FIN-Painel/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const grid = page.locator("#ferramentas ul").first();
    await expect(grid.locator("> li")).toHaveCount(TOOLS.length);

    await page.getByRole("tab", { name: "Segurança" }).click();
    await expect(grid.locator("> li")).toHaveCount(TOOLS.filter((t) => t.category === "seguranca").length);

    await page.getByRole("tab", { name: "Todas" }).click();
    await page.getByRole("searchbox", { name: "Buscar ferramenta" }).fill("senha");
    await expect(grid.locator("> li")).toHaveCount(2);

    await page.getByRole("searchbox", { name: "Buscar ferramenta" }).fill("zzzz");
    await expect(page.getByText("Nenhuma ferramenta encontrada")).toBeVisible();
    await page.getByRole("button", { name: "Ver todas as ferramentas" }).click();
    await expect(grid.locator("> li")).toHaveCount(TOOLS.length);
    errs.expectNone();
  });

  test("todos os links internos respondem sem 404", async ({ page, request }) => {
    const seen = new Set<string>();
    for (const path of [...CONTENT_PAGES, ...TOOLS.map((t) => `/${t.slug}`)]) {
      await page.goto(path);
      const hrefs = await page.locator("a[href^='/']").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
      hrefs.forEach((h) => seen.add(h.split("#")[0] || "/"));
    }
    for (const href of seen) {
      const res = await request.get(href);
      expect(res.status(), href).toBe(200);
    }
    expect(seen.size).toBeGreaterThan(TOOLS.length);
  });

  test("todas as páginas de ferramenta carregam sem erros", async ({ page }) => {
    const errs = trackErrors(page);
    for (const t of TOOLS) {
      await page.goto(`/${t.slug}`);
      await expect(page.getByRole("heading", { level: 1, name: t.name })).toBeVisible();
      // Ferramenta pronta: dropzone ou aviso de indisponibilidade (nunca um carregamento infinito).
      await expect(
        page.getByRole("button", { name: /^Selecionar/ }).or(page.getByText("Ferramenta indisponível neste servidor")),
      ).toBeVisible();
    }
    errs.expectNone();
  });

  test("URL inexistente mostra página 404", async ({ page }) => {
    const res = await page.goto("/ferramenta-que-nao-existe");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
    await page.getByRole("link", { name: "Ver todas as ferramentas" }).click();
    await expect(page).toHaveURL("/");
  });

  test("menu de ferramentas do cabeçalho abre, fecha com Esc e navega", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Ferramentas" });
    await trigger.click();
    const menu = page.locator("#menu-ferramentas");
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await trigger.click();
    await menu.getByRole("link", { name: "Comprimir PDF" }).click();
    await expect(page).toHaveURL("/comprimir-pdf");
    await expect(menu).toBeHidden();
  });

  test("menu móvel abre e navega @mobile", async ({ page, isMobile }) => {
    test.skip(!isMobile, "somente mobile");
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menu" }).click();
    const menu = page.locator("#menu-mobile");
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "Assinar PDF" }).click();
    await expect(page).toHaveURL("/assinar-pdf");
    await expect(menu).toBeHidden();
  });

  test("atalhos PDF para JPG e JPG para PDF na barra superior @mobile", async ({ page, isMobile }) => {
    await page.goto("/");
    if (isMobile) {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      await page.locator("#menu-mobile").getByRole("link", { name: "JPG para PDF" }).click();
      await expect(page).toHaveURL("/jpg-para-pdf");
      return;
    }
    const nav = page.getByRole("navigation", { name: "Principal" });
    await nav.getByRole("link", { name: "PDF para JPG" }).click();
    await expect(page).toHaveURL("/pdf-para-jpg");
    await expect(nav.getByRole("link", { name: "PDF para JPG" })).toHaveAttribute("aria-current", "page");
    await nav.getByRole("link", { name: "JPG para PDF" }).click();
    await expect(page).toHaveURL("/jpg-para-pdf");
  });

  test("rodapé exibe autoria, licença e contatos", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toContainText("© 2026 Diego Silva");
    await expect(footer).toContainText("licença MIT");
    const contacts = footer.getByRole("list", { name: "Contatos de Diego Silva" });
    await expect(contacts.getByRole("link", { name: "GitHub de Diego Silva" })).toHaveAttribute("href", "https://github.com/thediegosilva");
    await expect(contacts.getByRole("link", { name: "LinkedIn de Diego Silva" })).toHaveAttribute("href", "https://www.linkedin.com/in/thediegosilva");
    await expect(contacts.getByRole("link", { name: "Instagram de Diego Silva" })).toHaveAttribute("href", "https://www.instagram.com/thediegosilva");
    await expect(contacts.getByRole("link", { name: /X \(Twitter\)/ })).toHaveCount(0);
    await expect(contacts.getByRole("link", { name: "E-mail de Diego Silva" })).toHaveAttribute("href", "mailto:thediegosilva@engineer.com");
    for (const a of await contacts.locator("a[target=_blank]").all()) {
      await expect(a).toHaveAttribute("rel", /noopener/);
    }
  });

  test("página Apoiar: QR Code e botão de copiar o código Pix", async ({ page, context, isMobile }) => {
    test.skip(isMobile, "clipboard testado no desktop");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    await page.getByRole("link", { name: "Apoiar" }).click();
    await expect(page).toHaveURL("/apoiar");
    await expect(page.getByRole("img", { name: /QR Code Pix/ }).locator("svg")).toBeVisible();
    const payload = (await page.getByTestId("pix-payload").textContent())!.trim();
    expect(payload).toMatch(/^000201010211.*br\.gov\.bcb\.pix.*6304[0-9A-F]{4}$/);
    await page.getByRole("button", { name: "Copiar código Pix" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(payload);
  });

  test("PDF para JPG e JPG para PDF são as primeiras caixas", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator("#ferramentas ul").first().locator("> li h3");
    await expect(cards.nth(0)).toHaveText("PDF para imagem");
    await expect(cards.nth(1)).toHaveText("Imagem para PDF");
  });

  test("texto inicial centralizado no celular e alinhado à esquerda no desktop @mobile", async ({ page, isMobile }) => {
    await page.goto("/");
    const hero = page.locator("section").first();
    const align = await hero.getByRole("heading", { level: 1 }).evaluate((el) => getComputedStyle(el).textAlign);
    expect(align).toBe(isMobile ? "center" : "left");
    if (isMobile) {
      // Botões centralizados: mesma distância das bordas esquerda e direita da tela.
      const vw = page.viewportSize()!.width;
      for (const name of ["Ver todas as ferramentas", "Como funciona"]) {
        const b = (await hero.getByRole("link", { name }).boundingBox())!;
        expect(Math.abs(b.x - (vw - b.x - b.width))).toBeLessThanOrEqual(2);
      }
    }
  });

  test("ícones: guia, iPhone e app instalável", async ({ page, request }) => {
    await page.goto("/");
    const head = page.locator("head");
    await expect(head.locator('link[rel="icon"][href^="/favicon.ico"]')).toHaveCount(1);
    await expect(head.locator('link[rel="icon"][type="image/png"]')).toHaveCount(1);
    const apple = head.locator('link[rel="apple-touch-icon"]');
    await expect(apple).toHaveAttribute("sizes", "180x180");
    const manifestHref = await head.locator('link[rel="manifest"]').getAttribute("href");
    const manifest = await (await request.get(manifestHref!)).json();
    expect(manifest.icons.map((i: { purpose: string }) => i.purpose).sort()).toEqual(["any", "any", "maskable"]);
    const urls = [
      "/favicon.ico",
      (await head.locator('link[rel="icon"][type="image/png"]').getAttribute("href"))!,
      (await apple.getAttribute("href"))!,
      ...manifest.icons.map((i: { src: string }) => i.src),
    ];
    for (const u of urls) {
      const r = await request.get(u);
      expect(r.status(), u).toBe(200);
      expect(r.headers()["content-type"], u).toMatch(/^image\//);
    }
  });

  test("abre no tema escuro por padrão, mesmo com o sistema no modo claro", async ({ page, request }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe("rgb(10, 15, 23)");
    // O HTML já chega escuro do servidor (sem depender de JavaScript).
    expect(await (await request.get("/")).text()).toMatch(/<html[^>]*data-theme="dark"/);
  });

  test("tema claro pode ser escolhido e persiste após recarregar", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Ativar tema claro" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.getByRole("button", { name: "Ativar tema escuro" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("layout sem rolagem horizontal em todas as páginas @mobile", async ({ page }) => {
    for (const path of [...CONTENT_PAGES, ...TOOLS.map((t) => `/${t.slug}`)]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `rolagem horizontal em ${path}`).toBeLessThanOrEqual(0);
    }
  });

  test("status mostra capacidades reais do servidor", async ({ page, request }) => {
    const health = await (await request.get("/api/health")).json();
    await page.goto("/status");
    await expect(page.getByText("Servidor operacional")).toBeVisible();
    await expect(page.getByText(`Limite de upload: ${health.limits.maxUploadMb} MB`)).toBeVisible();
    const office = page.locator("main li", { hasText: "Office para PDF" });
    await expect(office).toContainText(health.capabilities.libreoffice ? "Disponível" : "Indisponível");
  });

  test("cabeçalhos de segurança presentes", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("default-src 'self'");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-powered-by"]).toBeUndefined();
  });
});
