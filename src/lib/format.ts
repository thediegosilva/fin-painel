export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toLocaleString("pt-BR", { maximumFractionDigits: v < 10 ? 1 : 0 })} ${units[i]}`;
}

export function plural(n: number, one: string, many: string): string {
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? one : many}`;
}

/** Nome base seguro para downloads, sem extensão. */
export function baseName(filename: string): string {
  const noExt = filename.replace(/\.[^./\\]+$/, "");
  const clean = noExt
    .normalize("NFC")
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return clean || "documento";
}

/**
 * Nome sequencial com zeros à esquerda: 0000, 0001, 0002…
 * Usa no mínimo 4 dígitos (mais, se houver 10.000 ou mais arquivos), garantindo
 * que a ordem alfabética seja igual à ordem das páginas.
 */
export function sequenceName(index: number, total: number, ext: string): string {
  const digits = Math.max(4, String(Math.max(0, total - 1)).length);
  return `${String(index).padStart(digits, "0")}.${ext}`;
}
