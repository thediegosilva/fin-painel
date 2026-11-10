import { Laptop, Server } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ToolIcon } from "@/components/ui/tool-icon";
import type { ToolDefinition } from "@/lib/tools";

export function ToolCard({ tool, unavailable }: { tool: ToolDefinition; unavailable?: boolean }) {
  return (
    <Link
      href={`/${tool.slug}`}
      data-cat={tool.category}
      className="group relative flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--cat)] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <ToolIcon icon={tool.icon} category={tool.category} />
        {unavailable ? (
          <Badge tone="warning" title="Este servidor não possui o software necessário para esta ferramenta.">
            Indisponível
          </Badge>
        ) : tool.mode === "local" ? (
          <Badge tone="brand" title="O arquivo é processado no seu navegador e não é enviado.">
            <Laptop className="size-3" aria-hidden /> No navegador
          </Badge>
        ) : (
          <Badge tone="neutral" title="O arquivo é enviado ao servidor, processado e descartado.">
            <Server className="size-3" aria-hidden /> No servidor
          </Badge>
        )}
      </div>
      <h3 className="mt-4 font-semibold text-text">{tool.name}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{tool.summary}</p>
    </Link>
  );
}
