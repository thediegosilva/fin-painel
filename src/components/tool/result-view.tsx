"use client";

import { ArrowLeft, CircleCheck, Download, FileArchive, Files, Heart, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/ui/tool-icon";
import { downloadBlob, zipFiles, type OutputFile } from "@/lib/client/download";
import { formatBytes } from "@/lib/format";
import { TOOLS, type ToolDefinition } from "@/lib/tools";

export function ResultView({
  tool,
  files,
  zipName,
  title = "Pronto!",
  summary,
  onRestart,
  onBack,
}: {
  tool: ToolDefinition;
  files: OutputFile[];
  /** Nome do ZIP; uma função é avaliada no momento do download. */
  zipName?: string | (() => string);
  title?: string;
  summary?: ReactNode;
  onRestart: () => void;
  onBack?: () => void;
}) {
  const [zipping, setZipping] = useState(false);
  const [separate, setSeparate] = useState<{ done: number } | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);
  const total = useMemo(() => files.reduce((s, f) => s + f.blob.size, 0), [files]);
  const single = files.length === 1;

  const related = TOOLS.filter((t) => t.slug !== tool.slug && t.accept === "pdf").slice(0, 4);

  async function downloadAll() {
    setZipping(true);
    setZipError(null);
    try {
      const name = typeof zipName === "function" ? zipName() : zipName;
      downloadBlob(await zipFiles(files), name ?? "arquivos.zip");
    } catch {
      setZipError("Não foi possível gerar o ZIP. Baixe os arquivos individualmente.");
    } finally {
      setZipping(false);
    }
  }

  /** Baixa cada arquivo individualmente, em ordem, com um pequeno intervalo entre eles. */
  async function downloadSeparately() {
    for (let i = 0; i < files.length; i++) {
      setSeparate({ done: i });
      downloadBlob(files[i].blob, files[i].name);
      // Intervalo para o navegador registrar cada download sem descartar nenhum.
      await new Promise((r) => setTimeout(r, 350));
    }
    setSeparate(null);
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="rounded-3xl border border-border bg-surface p-6 text-center shadow-md sm:p-10">
        <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
          <CircleCheck className="size-7" aria-hidden />
        </span>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h2>
        {summary && <div className="mt-2 text-sm text-muted">{summary}</div>}

        <div className="mt-6 flex flex-col items-center gap-3">
          {single ? (
            <Button size="lg" icon={<Download className="size-5" />} onClick={() => downloadBlob(files[0].blob, files[0].name)} className="w-full sm:w-auto">
              Baixar arquivo
            </Button>
          ) : (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button size="lg" icon={<FileArchive className="size-5" />} loading={zipping} disabled={!!separate} onClick={downloadAll}>
                Baixar tudo (.zip)
              </Button>
              <Button size="lg" variant="outline" icon={<Files className="size-5" />} loading={!!separate} disabled={zipping} onClick={downloadSeparately}>
                {separate ? `Baixando ${separate.done + 1} de ${files.length}…` : "Baixar separados"}
              </Button>
            </div>
          )}
          <p className="text-xs text-subtle">
            {single ? `${files[0].name} · ${formatBytes(files[0].blob.size)}` : `${files.length} arquivos · ${formatBytes(total)}`}
          </p>
          {!single && (
            <p className="max-w-md text-xs text-subtle">
              Ao baixar separados, o navegador pode pedir permissão para baixar vários arquivos — basta permitir.
            </p>
          )}
        </div>
        {zipError && <Alert tone="danger" className="mt-4 text-left">{zipError}</Alert>}

        {!single && (
          <ul className="mt-6 max-h-72 divide-y divide-border overflow-y-auto rounded-xl border border-border text-left">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1 truncate text-sm">{f.name}</span>
                <span className="shrink-0 text-xs text-subtle">{formatBytes(f.blob.size)}</span>
                <button
                  type="button"
                  onClick={() => downloadBlob(f.blob, f.name)}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-text"
                  aria-label={`Baixar ${f.name}`}
                >
                  <Download className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-2 border-t border-border pt-6">
          {onBack && (
            <Button variant="ghost" icon={<ArrowLeft className="size-4" />} onClick={onBack}>
              Voltar e ajustar
            </Button>
          )}
          <Button variant="outline" icon={<RotateCcw className="size-4" />} onClick={onRestart}>
            Processar outro arquivo
          </Button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        <Heart className="mr-1 inline size-4 align-[-3px] text-[var(--cat-seguranca)]" aria-hidden />
        O FIN-Painel te ajudou?{" "}
        <Link href="/apoiar" className="font-medium text-brand hover:underline">
          Apoie o projeto com qualquer valor
        </Link>
        .
      </p>

      <div className="mt-10">
        <p className="mb-3 text-sm font-medium text-muted">Continue com outra ferramenta</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {related.map((t) => (
            <Link
              key={t.slug}
              href={`/${t.slug}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 text-sm font-medium hover:border-border-strong"
            >
              <ToolIcon icon={t.icon} category={t.category} size="sm" />
              {t.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
