"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useHealth } from "@/hooks/use-health";
import { cn } from "@/lib/cn";
import { CATEGORIES, popularFirst, searchTools, type CategoryId } from "@/lib/tools";
import { ToolCard } from "./tool-card";

export function ToolGrid() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<CategoryId | "todas">("todas");
  const tools = useMemo(() => popularFirst(searchTools(query, cat)), [query, cat]);
  const health = useHealth();
  const caps = health.state === "ok" ? health.data.capabilities : null;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Categorias" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {[{ id: "todas" as const, name: "Todas" }, ...CATEGORIES].map((c) => (
            <button
              key={c.id}
              role="tab"
              type="button"
              aria-selected={cat === c.id}
              onClick={() => setCat(c.id)}
              className={cn(
                "h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
                cat === c.id
                  ? "bg-text text-bg"
                  : "border border-border bg-surface text-muted hover:border-border-strong hover:text-text",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ferramenta…"
            aria-label="Buscar ferramenta"
            className="h-10 w-full rounded-full border border-border-strong bg-surface pl-9 pr-9 text-sm shadow-sm placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-3 focus:ring-[var(--brand-ring)] [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-subtle hover:bg-surface-2 hover:text-text"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {tools.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border-strong px-6 py-12 text-center">
          <p className="font-medium">Nenhuma ferramenta encontrada para “{query}”.</p>
          <button
            type="button"
            className="mt-2 text-sm font-medium text-brand hover:underline"
            onClick={() => {
              setQuery("");
              setCat("todas");
            }}
          >
            Ver todas as ferramentas
          </button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-live="polite">
          {tools.map((t) => (
            <li key={t.slug}>
              <ToolCard tool={t} unavailable={!!(caps && t.capability && !caps[t.capability])} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
