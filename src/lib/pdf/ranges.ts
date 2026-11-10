import { PdfError } from "./errors";

/**
 * Interpreta uma expressão de páginas como "1-3, 5, 8-10" (1-based).
 * Retorna grupos de índices 0-based, um grupo por item da lista.
 * Aceita "-" e "–" como separador e intervalos decrescentes ("5-3").
 */
export function parseRangeGroups(input: string, pageCount: number): number[][] {
  const text = input.trim();
  if (!text) throw new PdfError("invalid-range", "Informe ao menos uma página ou intervalo.");
  const parts = text.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) throw new PdfError("invalid-range", "Informe ao menos uma página ou intervalo.");

  return parts.map((part) => {
    const m = /^(\d+)\s*(?:[-–]\s*(\d+)?)?$/.exec(part);
    if (!m) {
      throw new PdfError("invalid-range", `Intervalo inválido: "${part}". Use o formato 1-3, 5, 8-10.`);
    }
    const start = Number(m[1]);
    const hasDash = /[-–]/.test(part);
    const end = m[2] !== undefined ? Number(m[2]) : hasDash ? pageCount : start;
    for (const n of [start, end]) {
      if (n < 1 || n > pageCount) {
        throw new PdfError(
          "invalid-range",
          `A página ${n} não existe. O documento tem ${pageCount} página${pageCount === 1 ? "" : "s"}.`,
        );
      }
    }
    const group: number[] = [];
    if (start <= end) for (let i = start; i <= end; i++) group.push(i - 1);
    else for (let i = start; i >= end; i--) group.push(i - 1);
    return group;
  });
}

/** Igual a parseRangeGroups, mas achata e remove duplicatas preservando a ordem. */
export function parseRangeSet(input: string, pageCount: number): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const g of parseRangeGroups(input, pageCount)) {
    for (const i of g) {
      if (!seen.has(i)) {
        seen.add(i);
        out.push(i);
      }
    }
  }
  return out;
}

/** Converte índices 0-based em uma expressão compacta 1-based ("1-3, 5"). */
export function formatRange(indices: number[]): string {
  const sorted = [...new Set(indices)].sort((a, b) => a - b);
  const out: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    out.push(i === j ? `${sorted[i] + 1}` : `${sorted[i] + 1}-${sorted[j] + 1}`);
    i = j + 1;
  }
  return out.join(", ");
}

/** Agrupa as páginas em blocos de N (o último pode ser menor). */
export function groupsEvery(pageCount: number, n: number): number[][] {
  if (!Number.isInteger(n) || n < 1) throw new PdfError("invalid-range", "Informe um número de páginas maior que zero.");
  const groups: number[][] = [];
  for (let i = 0; i < pageCount; i += n) {
    groups.push(Array.from({ length: Math.min(n, pageCount - i) }, (_, k) => i + k));
  }
  return groups;
}
