import { Download, FileUp, Laptop, ShieldCheck, SlidersHorizontal, Zap } from "lucide-react";
import Link from "next/link";
import { ToolGrid } from "@/components/home/tool-grid";
import { LinkButton } from "@/components/ui/button";
import { ToolIcon } from "@/components/ui/tool-icon";
import { TOOLS } from "@/lib/tools";

const localCount = TOOLS.filter((t) => t.mode === "local").length;

const STEPS = [
  { icon: FileUp, title: "Envie o arquivo", text: "Arraste para a página ou selecione no seu dispositivo." },
  { icon: SlidersHorizontal, title: "Ajuste as opções", text: "Escolha páginas, ordem, qualidade ou posição." },
  { icon: Download, title: "Baixe o resultado", text: "O arquivo final fica pronto para download na hora." },
];

const FAQ = [
  {
    q: "Meus arquivos são enviados para algum servidor?",
    a: `Em ${localCount} das ${TOOLS.length} ferramentas, não: o processamento acontece inteiramente no seu navegador. As ferramentas marcadas como “No servidor” (comprimir, proteger, desbloquear e converter documentos Office) enviam o arquivo ao servidor do FIN-Painel, que o processa em uma pasta temporária e o apaga imediatamente após responder.`,
  },
  {
    q: "Preciso criar uma conta?",
    a: "Não. Todas as ferramentas podem ser usadas sem cadastro.",
  },
  {
    q: "Existe limite de tamanho?",
    a: "Nas ferramentas locais, o limite é a memória do seu dispositivo (aceitamos arquivos de até 950 MB; acima de 300 MB o processamento fica mais lento e exige bastante memória, então prefira um computador). Nas ferramentas de servidor, o limite é configurado pelo administrador e exibido na própria ferramenta.",
  },
  {
    q: "A assinatura do FIN-Painel tem validade jurídica?",
    a: "A ferramenta Assinar PDF insere uma imagem da sua assinatura (desenhada ou digitada). Ela não é uma assinatura digital com certificado ICP-Brasil. Para documentos que exigem certificação, use um serviço de assinatura digital certificada.",
  },
  {
    q: "Funciona no celular?",
    a: "Sim. A interface é responsiva e as ferramentas funcionam em navegadores móveis modernos. Arquivos muito grandes podem ser lentos em aparelhos com pouca memória.",
  },
];

export default function Home() {
  const featured = ["pdf-para-jpg", "jpg-para-pdf", "juntar-pdf", "comprimir-pdf"].map(
    (s) => TOOLS.find((t) => t.slug === s)!,
  );

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_60%_at_70%_0%,var(--brand-soft),transparent_70%)]"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <div className="text-center lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted shadow-sm">
              <ShieldCheck className="size-3.5 text-brand" aria-hidden />
              <span>
                {localCount} ferramentas <span className="hidden sm:inline">processam seus arquivos </span>sem upload
              </span>
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Tudo o que você faz com PDF, em um só painel.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted text-pretty lg:mx-0">
              Junte, divida, comprima, converta, assine e proteja documentos em segundos. Sem cadastro, sem marca
              d&apos;água no resultado e com privacidade por padrão.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <LinkButton href="#ferramentas" size="lg">
                Ver todas as ferramentas
              </LinkButton>
              <LinkButton href="/como-funciona" size="lg" variant="outline">
                Como funciona
              </LinkButton>
            </div>
          </div>
          <div className="hidden grid-cols-2 gap-3 sm:grid sm:gap-4">
            {featured.map((t, i) => (
              <Link
                key={t.slug}
                href={`/${t.slug}`}
                data-cat={t.category}
                className="group rounded-2xl border border-border bg-surface p-4 shadow-md transition-transform duration-200 hover:-translate-y-1 sm:p-5"
                style={{ transform: i % 2 ? "translateY(1.25rem)" : undefined }}
              >
                <ToolIcon icon={t.icon} category={t.category} size="lg" />
                <p className="mt-4 font-semibold">{t.name}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{t.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Ferramentas */}
      <section id="ferramentas" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight">Ferramentas</h2>
            <p className="mt-2 text-muted">
              {TOOLS.length} ferramentas prontas para uso. Filtre por categoria ou busque pelo que precisa.
            </p>
          </div>
          <ToolGrid />
        </div>
      </section>

      {/* Como funciona */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Três passos, nenhum cadastro</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative rounded-2xl border border-border bg-bg p-6">
                <span className="absolute right-5 top-5 font-mono text-sm text-subtle">0{i + 1}</span>
                <s.icon className="size-6 text-brand" aria-hidden />
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Privacidade */}
      <section>
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Privacidade não é um recurso extra</h2>
            <p className="mt-4 text-muted leading-relaxed">
              Sempre que tecnicamente possível, o FIN-Painel processa seus documentos no próprio navegador, usando
              bibliotecas de código aberto. Nesses casos o arquivo nunca trafega pela rede. Cada ferramenta informa
              claramente onde o processamento acontece.
            </p>
            <Link href="/privacidade" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
              Leia a política de privacidade →
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Laptop, t: "Processamento local", d: "Juntar, dividir, girar, assinar e mais rodam no seu dispositivo." },
              { icon: ShieldCheck, t: "Descarte imediato", d: "No servidor, arquivos vivem só em uma pasta temporária durante o processamento." },
              { icon: Zap, t: "Sem filas", d: "Ferramentas locais não dependem de servidor: o resultado sai na hora." },
              { icon: Download, t: "Sem marca d'água", d: "O resultado é seu, exatamente como você configurou." },
            ].map((f) => (
              <li key={f.t} className="rounded-2xl border border-border bg-surface p-5">
                <f.icon className="size-5 text-brand" aria-hidden />
                <p className="mt-3 font-medium">{f.t}</p>
                <p className="mt-1 text-sm text-muted">{f.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Perguntas frequentes</h2>
          <div className="mt-8 divide-y divide-border rounded-2xl border border-border">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {f.q}
                  <span className="text-xl leading-none text-subtle transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
