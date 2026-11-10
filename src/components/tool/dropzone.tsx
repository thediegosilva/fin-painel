"use client";

import { FileUp, Plus } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/cn";
import { ACCEPT_ATTR, ACCEPT_LABEL, type AcceptKind } from "@/lib/tools";

function hasFiles(e: DragEvent) {
  return Array.from(e.dataTransfer?.types ?? []).includes("Files");
}

/** Área de upload com arrastar-e-soltar, clique e teclado. */
export function Dropzone({
  accept,
  multiple,
  onFiles,
  loading,
  error,
  disabled,
  maxMb,
  title,
}: {
  accept: AcceptKind;
  multiple: boolean;
  onFiles: (files: File[]) => void;
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
  maxMb?: number;
  title?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const label = multiple ? `Selecionar arquivos ${ACCEPT_LABEL[accept]}` : `Selecionar arquivo ${ACCEPT_LABEL[accept]}`;

  return (
    <div className="space-y-4">
      <div
        onDragEnter={(e) => {
          if (!hasFiles(e) || disabled) return;
          e.preventDefault();
          setOver(true);
        }}
        onDragOver={(e) => {
          if (!hasFiles(e) || disabled) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false);
        }}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setOver(false);
          const files = Array.from(e.dataTransfer.files);
          if (files.length) onFiles(multiple ? files : files.slice(0, 1));
        }}
        className={cn(
          "relative flex min-h-72 flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          over ? "border-brand bg-brand-soft" : "border-border-strong bg-surface",
          disabled && "opacity-60",
        )}
      >
        <span className="mb-5 inline-flex size-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <FileUp className="size-8" aria-hidden />
        </span>
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-14 items-center gap-2 rounded-2xl bg-brand px-8 text-base font-semibold text-on-brand shadow-md transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {loading ? (
            <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
          ) : (
            <Plus className="size-5" aria-hidden />
          )}
          {loading ? "Lendo arquivo…" : title ?? (multiple ? "Selecionar arquivos" : "Selecionar arquivo")}
        </button>
        <p className="mt-4 text-sm text-muted">
          ou arraste e solte {multiple ? "os arquivos" : "o arquivo"} aqui
        </p>
        <p className="mt-1 text-xs text-subtle">
          {ACCEPT_LABEL[accept]}
          {maxMb ? ` · até ${maxMb} MB${multiple ? " por arquivo" : ""}` : ""}
        </p>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          aria-label={label}
          accept={ACCEPT_ATTR[accept]}
          multiple={multiple}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (files.length) onFiles(files);
          }}
        />
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}

/** Botão compacto para adicionar mais arquivos a uma lista existente. */
export function AddFilesButton({
  accept,
  onFiles,
  label = "Adicionar arquivos",
}: {
  accept: AcceptKind;
  onFiles: (files: File[]) => void;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 text-sm font-medium hover:bg-surface-2"
      >
        <Plus className="size-4" aria-hidden />
        {label}
      </button>
      <input
        ref={ref}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        aria-label={label}
        accept={ACCEPT_ATTR[accept]}
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
    </>
  );
}
