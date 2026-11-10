/**
 * Carrega o módulo de operações (pdf-lib, ~150 KB) somente quando necessário,
 * para que a página da ferramenta abra rápido antes de o usuário escolher um arquivo.
 */
export const pdfOps = () => import("./ops");
