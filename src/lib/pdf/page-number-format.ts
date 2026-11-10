/** Formatos de numeração de página (módulo leve, sem pdf-lib). */
export type NumberFormat = "n" | "n-total" | "pagina-n-de-total" | "pag-n";

export function formatPageNumber(format: NumberFormat, n: number, total: number): string {
  switch (format) {
    case "n-total":
      return `${n} / ${total}`;
    case "pagina-n-de-total":
      return `Página ${n} de ${total}`;
    case "pag-n":
      return `Pág. ${n}`;
    default:
      return `${n}`;
  }
}
