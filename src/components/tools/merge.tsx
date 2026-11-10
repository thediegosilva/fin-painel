"use client";

import { ArrowDownAZ, Trash2 } from "lucide-react";
import { DragHandle } from "@/components/tool/drag-handle";
import { AddFilesButton, Dropzone } from "@/components/tool/dropzone";
import { PageThumb } from "@/components/tool/page-thumb";
import { LargeFileNotice } from "@/components/tool/large-file-notice";
import { ResultView } from "@/components/tool/result-view";
import { SortableGrid } from "@/components/tool/sortable";
import type { ToolProps } from "@/components/tool/tool-client";
import { Workspace } from "@/components/tool/workspace";
import { Alert } from "@/components/ui/alert";
import { useFileCollection } from "@/hooks/use-file-collection";
import { usePdfjsDoc } from "@/hooks/use-pdfjs-doc";
import { useRunner } from "@/hooks/use-runner";
import { pdfBlob } from "@/lib/client/download";
import { LOCAL_MAX_MB, readBytes, sniffFile } from "@/lib/client/files";
import { baseName, formatBytes, plural } from "@/lib/format";
import { PdfError } from "@/lib/pdf/errors";
import { pdfOps } from "@/lib/pdf/lazy";

interface PdfData {
  bytes: Uint8Array;
  pageCount: number;
}

async function loadPdfFile(file: File): Promise<PdfData> {
  if ((await sniffFile(file)) !== "pdf") throw new PdfError("invalid-pdf", "não é um PDF válido.");
  const bytes = await readBytes(file);
  return { bytes, pageCount: await (await pdfOps()).getPageCount(bytes) };
}

function FileCard({ bytes }: { bytes: Uint8Array }) {
  const { doc } = usePdfjsDoc(bytes);
  return <PageThumb doc={doc} pageNumber={1} width={200} />;
}

export default function MergeTool({ tool }: ToolProps) {
  const files = useFileCollection(loadPdfFile);
  const runner = useRunner();
  const totalPages = files.items.reduce((s, i) => s + i.data.pageCount, 0);

  const restart = () => {
    runner.reset();
    files.clear();
  };

  if (runner.result) {
    return (
      <ResultView
        tool={tool}
        files={runner.result.files}
        summary={`${plural(files.items.length, "arquivo combinado", "arquivos combinados")} em um PDF de ${plural(totalPages, "página", "páginas")}.`}
        onRestart={restart}
        onBack={runner.clearResult}
      />
    );
  }

  if (files.items.length === 0) {
    return (
      <Dropzone
        accept="pdf"
        multiple
        maxMb={LOCAL_MAX_MB}
        loading={files.loading}
        error={files.errors.join(" ") || null}
        onFiles={files.add}
        title="Selecionar PDFs"
      />
    );
  }

  return (
    <Workspace
      main={
        <div className="rounded-2xl border border-border bg-surface shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
            <p className="mr-auto text-sm font-medium">
              {plural(files.items.length, "arquivo", "arquivos")} · {plural(totalPages, "página", "páginas")}
            </p>
            <button
              type="button"
              onClick={() => files.setItems([...files.items].sort((a, b) => a.file.name.localeCompare(b.file.name, "pt-BR", { numeric: true })))}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text"
            >
              <ArrowDownAZ className="size-4" aria-hidden />
              Ordenar A–Z
            </button>
            <AddFilesButton accept="pdf" onFiles={files.add} label="Adicionar PDFs" />
          </div>
          <div className="px-4 pt-4 empty:hidden">
            <LargeFileNotice bytes={files.items.reduce((sum, i) => sum + i.file.size, 0)} />
          </div>
          {files.loading && <p className="px-4 pt-3 text-sm text-muted" role="status">Lendo arquivos…</p>}
          {files.errors.length > 0 && (
            <div className="px-4 pt-4">
              <Alert tone="danger" title="Alguns arquivos não foram adicionados">
                <ul className="list-disc pl-4">
                  {files.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </Alert>
            </div>
          )}
          <SortableGrid
            items={files.items}
            getId={(i) => i.id}
            onReorder={files.setItems}
            className="grid grid-cols-2 gap-3 p-4 min-[480px]:grid-cols-3 md:grid-cols-4"
          >
            {(item, index, handle, dragging) => (
              <div className={`rounded-xl border bg-surface-2 p-2 transition-shadow ${dragging ? "border-brand shadow-lg" : "border-transparent"}`}>
                <div className="mb-1 flex items-center justify-between">
                  <DragHandle handle={handle} label={`Mover ${item.file.name} (posição ${index + 1})`} />
                  <span className="text-xs font-semibold text-muted">{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => files.remove(item.id)}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-subtle hover:bg-danger-soft hover:text-danger"
                    aria-label={`Remover ${item.file.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <FileCard bytes={item.data.bytes} />
                <p className="mt-2 truncate text-xs font-medium" title={item.file.name}>
                  {item.file.name}
                </p>
                <p className="text-[11px] text-muted">
                  {plural(item.data.pageCount, "pág.", "págs.")} · {formatBytes(item.file.size)}
                </p>
              </div>
            )}
          </SortableGrid>
        </div>
      }
      options={<p className="text-sm text-muted">Arraste pelos puxadores para definir a ordem. O primeiro arquivo da lista vem primeiro no PDF final.</p>}
      actionLabel={tool.actionLabel}
      disabledReason={files.items.length < 2 ? "Adicione pelo menos dois PDFs." : null}
      busy={runner.busy}
      progress={runner.progress}
      error={runner.error}
      onAction={() =>
        runner.run(async () => {
          const out = await (await pdfOps()).mergePdfs(files.items.map((i) => i.data.bytes));
          return { files: [{ name: `${baseName(files.items[0].file.name)}_combinado.pdf`, blob: pdfBlob(out) }] };
        })
      }
    />
  );
}
