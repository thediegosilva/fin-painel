import { Laptop, Server } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ToolClient } from "@/components/tool/tool-client";
import { ToolIcon } from "@/components/ui/tool-icon";
import { TOOLS, getCategory, getTool } from "@/lib/tools";

export const ensureStatic = "navigation";

/** Todas as ferramentas são pré-renderizadas; slugs desconhecidos resultam em 404 via notFound(). */
export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const tool = getTool((await params).slug);
  if (!tool) return {};
  return {
    title: `${tool.name} online e grátis`,
    description: tool.description,
    alternates: { canonical: `/${tool.slug}` },
  };
}

export default async function ToolPage({ params }: PageProps<"/[slug]">) {
  const tool = getTool((await params).slug);
  if (!tool) notFound();
  const category = getCategory(tool.category);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
      <nav aria-label="Trilha" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-text">
              Início
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>{category.name}</li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-text">
            {tool.name}
          </li>
        </ol>
      </nav>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start">
        <ToolIcon icon={tool.icon} category={tool.category} size="lg" />
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{tool.name}</h1>
          <p className="mt-2 text-muted text-pretty">{tool.description}</p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted">
            {tool.mode === "local" ? (
              <>
                <Laptop className="size-3.5 text-brand" aria-hidden />
                Processado no seu navegador — o arquivo não é enviado a nenhum servidor.
              </>
            ) : (
              <>
                <Server className="size-3.5" aria-hidden />
                Processado no servidor do FIN-Painel e apagado logo após a conclusão.
              </>
            )}
          </p>
        </div>
      </header>
      <ToolClient tool={tool} />
    </div>
  );
}
