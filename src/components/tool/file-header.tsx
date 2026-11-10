"use client";

import { FileText, RefreshCw } from "lucide-react";
import { formatBytes, plural } from "@/lib/format";

/** Cabeçalho com o arquivo carregado e ação para trocá-lo. */
export function FileHeader({ file, pageCount, onChange }: { file: File; pageCount?: number; onChange: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 pr-4 shadow-sm">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted">
        <FileText className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-muted">
          {formatBytes(file.size)}
          {pageCount ? ` · ${plural(pageCount, "página", "páginas")}` : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text"
      >
        <RefreshCw className="size-3.5" aria-hidden />
        <span className="hidden sm:inline">Trocar arquivo</span>
        <span className="sm:hidden">Trocar</span>
      </button>
    </div>
  );
}
