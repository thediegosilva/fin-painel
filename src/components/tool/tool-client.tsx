"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { ToolDefinition } from "@/lib/tools";

export interface ToolProps {
  tool: ToolDefinition;
}

function Loading() {
  return (
    <div className="flex min-h-72 items-center justify-center rounded-3xl border-2 border-dashed border-border-strong bg-surface" role="status">
      <span className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden />
      <span className="sr-only">Carregando ferramenta…</span>
    </div>
  );
}


// Cada ferramenta é carregada sob demanda: a página só baixa o código que usa.
const REGISTRY: Record<string, ComponentType<ToolProps>> = {
  "juntar-pdf": dynamic(() => import("@/components/tools/merge"), { ssr: false, loading: Loading }),
  "dividir-pdf": dynamic(() => import("@/components/tools/split"), { ssr: false, loading: Loading }),
  "remover-paginas": dynamic(() => import("@/components/tools/remove-pages"), { ssr: false, loading: Loading }),
  "extrair-paginas": dynamic(() => import("@/components/tools/extract-pages"), { ssr: false, loading: Loading }),
  "organizar-pdf": dynamic(() => import("@/components/tools/organize"), { ssr: false, loading: Loading }),
  "comprimir-pdf": dynamic(() => import("@/components/tools/compress"), { ssr: false, loading: Loading }),
  "jpg-para-pdf": dynamic(() => import("@/components/tools/images-to-pdf"), { ssr: false, loading: Loading }),
  "pdf-para-jpg": dynamic(() => import("@/components/tools/pdf-to-images"), { ssr: false, loading: Loading }),
  "pdf-para-texto": dynamic(() => import("@/components/tools/pdf-to-text"), { ssr: false, loading: Loading }),
  "office-para-pdf": dynamic(() => import("@/components/tools/office-to-pdf"), { ssr: false, loading: Loading }),
  "girar-pdf": dynamic(() => import("@/components/tools/rotate"), { ssr: false, loading: Loading }),
  "numeros-de-pagina": dynamic(() => import("@/components/tools/page-numbers"), { ssr: false, loading: Loading }),
  "marca-dagua": dynamic(() => import("@/components/tools/watermark"), { ssr: false, loading: Loading }),
  "editar-metadados": dynamic(() => import("@/components/tools/metadata"), { ssr: false, loading: Loading }),
  "assinar-pdf": dynamic(() => import("@/components/tools/sign"), { ssr: false, loading: Loading }),
  "proteger-pdf": dynamic(() => import("@/components/tools/protect"), { ssr: false, loading: Loading }),
  "desbloquear-pdf": dynamic(() => import("@/components/tools/unlock"), { ssr: false, loading: Loading }),
};

export function ToolClient({ tool }: ToolProps) {
  const Component = REGISTRY[tool.slug];
  if (!Component) throw new Error(`Ferramenta sem implementação: ${tool.slug}`);
  return <Component tool={tool} />;
}

export const IMPLEMENTED_SLUGS = Object.keys(REGISTRY);
