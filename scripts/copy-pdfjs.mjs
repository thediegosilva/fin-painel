// Copia os assets estáticos do pdf.js (worker, cmaps, fontes padrão e wasm)
// para public/pdfjs, de onde são servidos pela própria aplicação (sem CDN).
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = dirname(require.resolve("pdfjs-dist/package.json"));
const dest = join(process.cwd(), "public", "pdfjs");

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(join(root, "build", "pdf.worker.min.mjs"), join(dest, "pdf.worker.min.mjs"));
for (const dir of ["cmaps", "standard_fonts", "wasm", "iccs"]) {
  const src = join(root, dir);
  if (existsSync(src)) cpSync(src, join(dest, dir), { recursive: true });
}
console.log("[copy-pdfjs] assets copiados para public/pdfjs");
