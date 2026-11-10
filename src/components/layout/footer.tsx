import Link from "next/link";
import { AUTHOR, COPYRIGHT_YEAR } from "@/lib/author";
import { CATEGORIES, TOOLS } from "@/lib/tools";
import { Logo } from "./logo";
import { SocialLinks } from "./social-links";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_3fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-muted">
              Ferramentas de PDF rápidas e privadas. A maioria roda direto no seu navegador — seus arquivos não saem do
              seu dispositivo.
            </p>
            <SocialLinks className="mt-5" />
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((cat) => (
              <div key={cat.id}>
                <p className="text-xs font-semibold uppercase tracking-wider text-subtle">{cat.name}</p>
                <ul className="mt-3 space-y-2">
                  {TOOLS.filter((t) => t.category === cat.id).map((t) => (
                    <li key={t.slug}>
                      <Link href={`/${t.slug}`} className="text-sm text-muted hover:text-text">
                        {t.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-subtle">FIN-Painel</p>
              <ul className="mt-3 space-y-2">
                <li><Link href="/como-funciona" className="text-sm text-muted hover:text-text">Como funciona</Link></li>
                <li><Link href="/privacidade" className="text-sm text-muted hover:text-text">Privacidade</Link></li>
                <li><Link href="/termos" className="text-sm text-muted hover:text-text">Termos de uso</Link></li>
                <li><Link href="/status" className="text-sm text-muted hover:text-text">Status do serviço</Link></li>
                <li><Link href="/apoiar" className="text-sm text-muted hover:text-text">Apoie o projeto</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {COPYRIGHT_YEAR} {AUTHOR.name}. Projeto de código aberto sob a licença MIT.
          </p>
          <p>
            Desenvolvido por{" "}
            <a href={AUTHOR.github} target="_blank" rel="noopener noreferrer" className="font-signature text-xl font-bold text-text hover:text-brand">
              {AUTHOR.name}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
