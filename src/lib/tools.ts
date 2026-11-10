/**
 * Registro central das ferramentas do FIN-Painel.
 *
 * Este arquivo é a única fonte de verdade para: navegação, cards da home,
 * páginas de ferramenta, sitemap e testes E2E. Uma ferramenta só deve ser
 * registrada aqui se estiver implementada de ponta a ponta.
 */

export type CategoryId = "organizar" | "otimizar" | "converter" | "editar" | "seguranca";

/**
 * - `local`: processamento 100% no navegador (o arquivo não sai do dispositivo).
 * - `servidor`: o arquivo é enviado ao servidor do FIN-Painel, processado e
 *   descartado imediatamente; depende de binários instalados no servidor.
 */
export type ProcessingMode = "local" | "servidor";

/** Binário de servidor exigido por ferramentas `servidor`. */
export type ServerCapability = "ghostscript" | "libreoffice";

export type IconName =
  | "combine"
  | "scissors"
  | "file-minus"
  | "file-output"
  | "layout-grid"
  | "minimize-2"
  | "image"
  | "file-image"
  | "file-text"
  | "file-input"
  | "rotate-cw"
  | "hash"
  | "stamp"
  | "signature"
  | "lock"
  | "lock-open"
  | "tags";

export interface ToolDefinition {
  slug: string;
  name: string;
  /** Frase curta usada nos cards. */
  summary: string;
  /** Descrição mais completa exibida no topo da página da ferramenta. */
  description: string;
  category: CategoryId;
  icon: IconName;
  mode: ProcessingMode;
  capability?: ServerCapability;
  /** Rótulo do botão de ação principal. */
  actionLabel: string;
  /** Tipos aceitos no seletor de arquivos. */
  accept: AcceptKind;
  multiple: boolean;
  keywords: string[];
}

export type AcceptKind = "pdf" | "image" | "office";

export const ACCEPT_ATTR: Record<AcceptKind, string> = {
  pdf: "application/pdf,.pdf",
  image: "image/jpeg,image/png,image/webp,image/gif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.bmp",
  office:
    ".doc,.docx,.odt,.rtf,.xls,.xlsx,.ods,.ppt,.pptx,.odp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text,application/rtf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.oasis.opendocument.spreadsheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.oasis.opendocument.presentation",
};

export const ACCEPT_LABEL: Record<AcceptKind, string> = {
  pdf: "PDF",
  image: "JPG, PNG, WEBP, GIF ou BMP",
  office: "DOC, DOCX, ODT, RTF, XLS, XLSX, ODS, PPT, PPTX ou ODP",
};

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  { id: "organizar", name: "Organizar", description: "Junte, divida, reordene e selecione páginas." },
  { id: "otimizar", name: "Otimizar", description: "Reduza o tamanho dos seus documentos." },
  { id: "converter", name: "Converter", description: "Transforme imagens, documentos e PDFs." },
  { id: "editar", name: "Editar", description: "Gire, numere, carimbe e ajuste propriedades." },
  { id: "seguranca", name: "Segurança", description: "Assine, proteja e desbloqueie PDFs." },
];

export const TOOLS: ToolDefinition[] = [
  {
    slug: "juntar-pdf",
    name: "Juntar PDF",
    summary: "Combine vários PDFs em um único arquivo, na ordem que você escolher.",
    description:
      "Combine dois ou mais PDFs em um único documento. Arraste os arquivos para definir a ordem final.",
    category: "organizar",
    icon: "combine",
    mode: "local",
    actionLabel: "Juntar PDFs",
    accept: "pdf",
    multiple: true,
    keywords: ["merge", "combinar", "unir", "mesclar"],
  },
  {
    slug: "dividir-pdf",
    name: "Dividir PDF",
    summary: "Separe um PDF por intervalos de páginas ou em arquivos individuais.",
    description:
      "Divida um PDF em vários arquivos: por intervalos personalizados, a cada N páginas ou uma página por arquivo.",
    category: "organizar",
    icon: "scissors",
    mode: "local",
    actionLabel: "Dividir PDF",
    accept: "pdf",
    multiple: false,
    keywords: ["split", "separar", "cortar"],
  },
  {
    slug: "remover-paginas",
    name: "Remover páginas",
    summary: "Exclua as páginas que você não precisa de um PDF.",
    description: "Selecione as páginas que deseja excluir clicando nas miniaturas ou informando um intervalo.",
    category: "organizar",
    icon: "file-minus",
    mode: "local",
    actionLabel: "Remover páginas",
    accept: "pdf",
    multiple: false,
    keywords: ["delete", "excluir", "apagar", "deletar"],
  },
  {
    slug: "extrair-paginas",
    name: "Extrair páginas",
    summary: "Crie um novo PDF apenas com as páginas selecionadas.",
    description: "Escolha as páginas que deseja manter e gere um novo PDF somente com elas.",
    category: "organizar",
    icon: "file-output",
    mode: "local",
    actionLabel: "Extrair páginas",
    accept: "pdf",
    multiple: false,
    keywords: ["extract", "selecionar", "copiar páginas"],
  },
  {
    slug: "organizar-pdf",
    name: "Organizar PDF",
    summary: "Reordene, gire e exclua páginas visualmente.",
    description:
      "Arraste as miniaturas para reordenar, gire páginas individualmente e remova as que não quiser.",
    category: "organizar",
    icon: "layout-grid",
    mode: "local",
    actionLabel: "Aplicar alterações",
    accept: "pdf",
    multiple: false,
    keywords: ["organize", "reordenar", "ordenar", "mover páginas"],
  },
  {
    slug: "comprimir-pdf",
    name: "Comprimir PDF",
    summary: "Reduza o tamanho do arquivo mantendo a melhor qualidade possível.",
    description:
      "Diminua o tamanho do PDF otimizando imagens e estruturas internas. Escolha o equilíbrio entre tamanho e qualidade.",
    category: "otimizar",
    icon: "minimize-2",
    mode: "servidor",
    capability: "ghostscript",
    actionLabel: "Comprimir PDF",
    accept: "pdf",
    multiple: false,
    keywords: ["compress", "reduzir", "diminuir", "otimizar", "tamanho"],
  },
  {
    slug: "jpg-para-pdf",
    name: "Imagem para PDF",
    summary: "Converta JPG, PNG e outras imagens em um PDF.",
    description:
      "Transforme fotos e imagens em um documento PDF. Defina tamanho de página, orientação e margens.",
    category: "converter",
    icon: "image",
    mode: "local",
    actionLabel: "Converter para PDF",
    accept: "image",
    multiple: true,
    keywords: ["jpg", "jpeg", "png", "imagem", "foto", "converter"],
  },
  {
    slug: "pdf-para-jpg",
    name: "PDF para imagem",
    summary: "Converta cada página do PDF em uma imagem JPG ou PNG.",
    description: "Gere uma imagem de alta qualidade para cada página do PDF, em JPG ou PNG.",
    category: "converter",
    icon: "file-image",
    mode: "local",
    actionLabel: "Converter em imagens",
    accept: "pdf",
    multiple: false,
    keywords: ["jpg", "png", "imagem", "converter", "exportar"],
  },
  {
    slug: "pdf-para-texto",
    name: "PDF para texto",
    summary: "Extraia o texto de um PDF para um arquivo .txt.",
    description:
      "Extraia todo o texto selecionável de um PDF. PDFs escaneados (somente imagem) não possuem texto extraível.",
    category: "converter",
    icon: "file-text",
    mode: "local",
    actionLabel: "Extrair texto",
    accept: "pdf",
    multiple: false,
    keywords: ["txt", "texto", "extrair", "copiar"],
  },
  {
    slug: "office-para-pdf",
    name: "Office para PDF",
    summary: "Converta documentos Word, Excel e PowerPoint em PDF.",
    description:
      "Converta documentos do Word, planilhas do Excel e apresentações do PowerPoint (ou equivalentes do LibreOffice) em PDF.",
    category: "converter",
    icon: "file-input",
    mode: "servidor",
    capability: "libreoffice",
    actionLabel: "Converter para PDF",
    accept: "office",
    multiple: false,
    keywords: ["word", "excel", "powerpoint", "docx", "xlsx", "pptx", "converter"],
  },
  {
    slug: "girar-pdf",
    name: "Girar PDF",
    summary: "Gire todas ou apenas algumas páginas do seu PDF.",
    description: "Gire páginas em 90°, 180° ou 270°. Aplique a todas as páginas ou somente às selecionadas.",
    category: "editar",
    icon: "rotate-cw",
    mode: "local",
    actionLabel: "Girar PDF",
    accept: "pdf",
    multiple: false,
    keywords: ["rotate", "rotacionar", "virar"],
  },
  {
    slug: "numeros-de-pagina",
    name: "Números de página",
    summary: "Adicione numeração às páginas com posição e formato personalizados.",
    description: "Insira números de página escolhendo posição, formato, tamanho e número inicial.",
    category: "editar",
    icon: "hash",
    mode: "local",
    actionLabel: "Adicionar números",
    accept: "pdf",
    multiple: false,
    keywords: ["numerar", "paginação", "page numbers"],
  },
  {
    slug: "marca-dagua",
    name: "Marca d'água",
    summary: "Carimbe um texto sobre as páginas do PDF.",
    description: "Adicione uma marca d'água de texto com cor, opacidade, tamanho e ângulo personalizados.",
    category: "editar",
    icon: "stamp",
    mode: "local",
    actionLabel: "Aplicar marca d'água",
    accept: "pdf",
    multiple: false,
    keywords: ["watermark", "carimbo", "confidencial"],
  },
  {
    slug: "editar-metadados",
    name: "Editar metadados",
    summary: "Altere título, autor, assunto e palavras-chave do PDF.",
    description:
      "Visualize e edite as propriedades do documento: título, autor, assunto, palavras-chave e aplicativo criador.",
    category: "editar",
    icon: "tags",
    mode: "local",
    actionLabel: "Salvar metadados",
    accept: "pdf",
    multiple: false,
    keywords: ["metadata", "propriedades", "título", "autor"],
  },
  {
    slug: "assinar-pdf",
    name: "Assinar PDF",
    summary: "Desenhe ou digite sua assinatura e posicione-a no documento.",
    description:
      "Crie uma assinatura desenhada ou digitada e posicione-a em qualquer página. Esta é uma assinatura visual (imagem), não uma assinatura digital com certificado.",
    category: "seguranca",
    icon: "signature",
    mode: "local",
    actionLabel: "Assinar PDF",
    accept: "pdf",
    multiple: false,
    keywords: ["sign", "assinatura", "rubrica"],
  },
  {
    slug: "proteger-pdf",
    name: "Proteger PDF",
    summary: "Adicione uma senha para abrir o PDF.",
    description:
      "Criptografe o PDF com senha. Quem abrir o arquivo precisará informar a senha definida por você.",
    category: "seguranca",
    icon: "lock",
    mode: "servidor",
    capability: "ghostscript",
    actionLabel: "Proteger PDF",
    accept: "pdf",
    multiple: false,
    keywords: ["senha", "password", "criptografar", "encrypt"],
  },
  {
    slug: "desbloquear-pdf",
    name: "Desbloquear PDF",
    summary: "Remova a senha de um PDF que você tem permissão para abrir.",
    description:
      "Remova a proteção por senha de um PDF informando a senha atual. Use apenas em documentos que você tem direito de acessar.",
    category: "seguranca",
    icon: "lock-open",
    mode: "servidor",
    capability: "ghostscript",
    actionLabel: "Desbloquear PDF",
    accept: "pdf",
    multiple: false,
    keywords: ["unlock", "remover senha", "decrypt"],
  },
];

/** Ferramentas mais usadas: aparecem primeiro na home e nos atalhos do cabeçalho. */
export const POPULAR_SLUGS = ["pdf-para-jpg", "jpg-para-pdf"] as const;

/** Ordena colocando as ferramentas mais usadas na frente (o restante mantém a ordem original). */
export function popularFirst(tools: ToolDefinition[]): ToolDefinition[] {
  const rank = (t: ToolDefinition) => {
    const i = (POPULAR_SLUGS as readonly string[]).indexOf(t.slug);
    return i === -1 ? POPULAR_SLUGS.length : i;
  };
  return [...tools].sort((a, b) => rank(a) - rank(b));
}

export function getTool(slug: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function getCategory(id: CategoryId): Category {
  const c = CATEGORIES.find((c) => c.id === id);
  if (!c) throw new Error(`Categoria desconhecida: ${id}`);
  return c;
}

/** Normaliza texto para busca sem acentos e sem diferenciar maiúsculas. */
export function normalizeSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function searchTools(query: string, category: CategoryId | "todas" = "todas"): ToolDefinition[] {
  const q = normalizeSearch(query);
  return TOOLS.filter((t) => {
    if (category !== "todas" && t.category !== category) return false;
    if (!q) return true;
    const hay = normalizeSearch([t.name, t.summary, ...t.keywords].join(" "));
    return q.split(/\s+/).every((part) => hay.includes(part));
  });
}
