"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { usePdfInput, type PdfInput } from "@/hooks/use-pdf-input";
import { useRunner } from "@/hooks/use-runner";
import { LOCAL_MAX_MB } from "@/lib/client/files";
import type { ToolDefinition } from "@/lib/tools";
import { Dropzone } from "./dropzone";
import { FileHeader } from "./file-header";
import { LargeFileNotice } from "./large-file-notice";
import { ResultView } from "./result-view";

export type Runner = ReturnType<typeof useRunner>;

/**
 * Fluxo padrão de ferramentas com um PDF de entrada:
 * seleção → configuração (editor) → resultado.
 * O editor permanece montado (oculto) na tela de resultado, preservando os
 * ajustes quando o usuário clica em "Voltar e ajustar".
 */
export function SinglePdfTool({
  tool,
  children,
  summary,
  resultTitle,
  zipName,
  maxMb = LOCAL_MAX_MB,
  allowEncrypted,
  validate,
}: {
  tool: ToolDefinition;
  children: (input: PdfInput, runner: Runner) => ReactNode;
  summary?: (meta: Record<string, string | number | boolean> | undefined, input: PdfInput) => ReactNode;
  resultTitle?: string;
  zipName?: (input: PdfInput) => string;
  maxMb?: number;
  allowEncrypted?: boolean;
  /** Validação extra após carregar o arquivo; retorna mensagem de erro ou null. */
  validate?: (input: PdfInput) => Promise<string | null>;
}) {
  const pdf = usePdfInput({ maxMb, allowEncrypted });
  const runner = useRunner();

  const restart = () => {
    runner.reset();
    pdf.reset();
  };

  if (!pdf.input) {
    return (
      <Dropzone
        accept="pdf"
        multiple={false}
        maxMb={maxMb}
        loading={pdf.loading}
        error={pdf.error}
        onFiles={async (files) => {
          runner.reset();
          await pdf.select(files);
        }}
      />
    );
  }

  const input = pdf.input;
  const key = `${input.file.name}-${input.file.size}-${input.file.lastModified}`;

  return (
    <>
      {runner.result && (
        <ResultView
          tool={tool}
          files={runner.result.files}
          title={resultTitle}
          zipName={zipName?.(input)}
          summary={summary?.(runner.result.meta, input)}
          onRestart={restart}
          onBack={runner.clearResult}
        />
      )}
      <div hidden={!!runner.result} className="space-y-4">
        <FileHeader file={input.file} pageCount={input.pageCount || undefined} onChange={restart} />
        <LargeFileNotice bytes={input.file.size} mode={tool.mode} />
        <ValidatedEditor key={key} input={input} validate={validate}>
          {children(input, runner)}
        </ValidatedEditor>
      </div>
    </>
  );
}

function ValidatedEditor({
  input,
  validate,
  children,
}: {
  input: PdfInput;
  validate?: (input: PdfInput) => Promise<string | null>;
  children: ReactNode;
}) {
  const [state, setState] = useState<{ checked: boolean; error: string | null }>({ checked: !validate, error: null });
  useEffect(() => {
    if (!validate) return;
    let alive = true;
    validate(input)
      .then((error) => alive && setState({ checked: true, error }))
      .catch(() => alive && setState({ checked: true, error: "Não foi possível analisar o arquivo." }));
    return () => {
      alive = false;
    };
  }, [input, validate]);

  if (!state.checked) {
    return (
      <div className="flex min-h-40 items-center justify-center" role="status">
        <span className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden />
        <span className="sr-only">Analisando arquivo…</span>
      </div>
    );
  }
  if (state.error) return <Alert tone="warning">{state.error}</Alert>;
  return <>{children}</>;
}
