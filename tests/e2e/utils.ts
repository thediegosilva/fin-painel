import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, type Download, type Page } from "@playwright/test";
import { unzipSync } from "fflate";
import { PDFDocument } from "pdf-lib";
import { FIXTURES } from "./global-setup";

export const fixture = (name: string) => join(FIXTURES, name);

/** Falha o teste se a página registrar erros no console ou exceções não tratadas. */
export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  return {
    errors,
    expectNone: (allow: RegExp[] = []) =>
      expect(errors.filter((e) => !allow.some((a) => a.test(e))), "erros no console").toEqual([]),
  };
}

export async function upload(page: Page, files: string | string[]) {
  const list = (Array.isArray(files) ? files : [files]).map(fixture);
  await page.locator('input[type="file"]').first().setInputFiles(list);
}

export async function bytesOf(download: Download): Promise<Uint8Array> {
  const path = await download.path();
  return new Uint8Array(readFileSync(path!));
}

/** Clica no botão de ação, aguarda o resultado e baixa o arquivo. */
export async function runAndDownload(page: Page, action: string | RegExp, downloadLabel: RegExp = /Baixar arquivo/) {
  await page.getByRole("button", { name: action }).click();
  const btn = page.getByRole("button", { name: downloadLabel });
  await expect(btn).toBeVisible({ timeout: 45_000 });
  const [dl] = await Promise.all([page.waitForEvent("download"), btn.click()]);
  return { download: dl, bytes: await bytesOf(dl) };
}

export async function pdfPages(bytes: Uint8Array) {
  return (await PDFDocument.load(bytes)).getPageCount();
}

export function unzip(bytes: Uint8Array) {
  return unzipSync(bytes);
}
