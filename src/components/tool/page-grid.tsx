"use client";

import { Check } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatRange, parseRangeSet } from "@/lib/pdf/ranges";
import { isPdfError } from "@/lib/pdf/errors";
import { plural } from "@/lib/format";
import { PageThumb } from "./page-thumb";

/**
 * Grade de miniaturas com seleção por clique e por intervalo digitado.
 * `tone` define o significado visual da seleção (remover = vermelho).
 */
export function PageGrid({
  doc,
  pageCount,
  selected,
  onChange,
  tone = "brand",
  rotationFor,
  selectionLabel,
  overlay,
}: {
  doc: PDFDocumentProxy | null;
  pageCount: number;
  selected: Set<number>;
  onChange: (next: Set<number>) => void;
  tone?: "brand" | "danger";
  rotationFor?: (index: number) => number;
  selectionLabel: string;
  overlay?: (index: number) => ReactNode;
}) {
  const [rangeText, setRangeText] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const shownRange = rangeText ?? formatRange([...selected]);

  function applyRange(text: string) {
    if (!text.trim()) {
      onChange(new Set());
      setRangeText(null);
      setRangeError(null);
      return;
    }
    try {
      onChange(new Set(parseRangeSet(text, pageCount)));
      setRangeText(null);
      setRangeError(null);
    } catch (e) {
      setRangeError(isPdfError(e) ? e.message : "Intervalo inválido.");
    }
  }

  function toggle(i: number) {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setRangeText(null);
    setRangeError(null);
    onChange(next);
  }

  const all = () => onChange(new Set(Array.from({ length: pageCount }, (_, i) => i)));
  const invert = () => onChange(new Set(Array.from({ length: pageCount }, (_, i) => i).filter((i) => !selected.has(i))));

  const ring = tone === "danger" ? "ring-danger" : "ring-brand";
  const badge = tone === "danger" ? "bg-danger text-white" : "bg-brand text-on-brand";

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="range-input" className="mb-1.5 block text-sm font-medium">
            {selectionLabel}
          </label>
          <input
            id="range-input"
            value={shownRange}
            placeholder="Ex.: 1-3, 5, 8-10"
            onChange={(e) => setRangeText(e.target.value)}
            onBlur={(e) => rangeText !== null && applyRange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyRange((e.target as HTMLInputElement).value);
              }
            }}
            aria-invalid={rangeError ? true : undefined}
            aria-describedby="range-hint"
            className="h-10 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-3 focus:ring-[var(--brand-ring)] aria-[invalid=true]:border-danger"
          />
          <p id="range-hint" className={cn("mt-1 text-xs", rangeError ? "text-danger" : "text-muted")}>
            {rangeError ?? `${plural(selected.size, "página selecionada", "páginas selecionadas")} de ${pageCount}. Clique nas miniaturas ou digite um intervalo.`}
          </p>
        </div>
        <div className="flex gap-1.5 sm:pb-5">
          <button type="button" onClick={all} className="h-9 rounded-lg px-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text">
            Todas
          </button>
          <button type="button" onClick={invert} className="h-9 rounded-lg px-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text">
            Inverter
          </button>
          <button type="button" onClick={() => onChange(new Set())} className="h-9 rounded-lg px-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text">
            Limpar
          </button>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-3 p-4 min-[480px]:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: pageCount }, (_, i) => {
          const on = selected.has(i);
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-pressed={on}
                aria-label={`Página ${i + 1}${on ? " (selecionada)" : ""}`}
                className={cn(
                  "group relative w-full rounded-xl bg-surface-2 p-2 transition-all hover:bg-surface-3",
                  on && `ring-2 ${ring}`,
                )}
              >
                <PageThumb doc={doc} pageNumber={i + 1} rotation={rotationFor?.(i)} className={cn(on && tone === "danger" && "opacity-40")} />
                {overlay?.(i)}
                <span
                  className={cn(
                    "absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-full border-2 transition-colors",
                    on ? `${badge} border-transparent` : "border-border-strong bg-surface",
                  )}
                  aria-hidden
                >
                  {on && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span className="mt-1.5 block text-xs font-medium text-muted">{i + 1}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
