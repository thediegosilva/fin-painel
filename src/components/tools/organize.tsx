"use client";

import { RotateCcw, RotateCw, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";
import { DragHandle } from "@/components/tool/drag-handle";
import { PageThumb } from "@/components/tool/page-thumb";
import { SinglePdfTool, type Runner } from "@/components/tool/single-pdf-tool";
import { SortableGrid } from "@/components/tool/sortable";
import type { ToolProps } from "@/components/tool/tool-client";
import { Workspace } from "@/components/tool/workspace";
import { usePdfjsDoc } from "@/hooks/use-pdfjs-doc";
import type { PdfInput } from "@/hooks/use-pdf-input";
import { pdfBlob } from "@/lib/client/download";
import { baseName, plural } from "@/lib/format";
import { pdfOps } from "@/lib/pdf/lazy";

interface PageItem {
  id: string;
  index: number;
  rotate: number;
}

export default function OrganizeTool({ tool }: ToolProps) {
  return (
    <SinglePdfTool tool={tool} summary={(meta) => `Novo PDF com ${plural(Number(meta?.count), "página", "páginas")}.`}>
      {(input, runner) => <Editor input={input} runner={runner} actionLabel={tool.actionLabel} />}
    </SinglePdfTool>
  );
}

const initial = (n: number): PageItem[] => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, index: i, rotate: 0 }));

function Editor({ input, runner, actionLabel }: { input: PdfInput; runner: Runner; actionLabel: string }) {
  const { doc } = usePdfjsDoc(input.bytes);
  const [pages, setPages] = useState<PageItem[]>(() => initial(input.pageCount));
  const changed = pages.length !== input.pageCount || pages.some((p, i) => p.index !== i || p.rotate % 360 !== 0);

  const rotate = (id: string, delta: number) =>
    setPages((ps) => ps.map((p) => (p.id === id ? { ...p, rotate: (p.rotate + delta + 360) % 360 } : p)));

  return (
    <Workspace
      main={
        <div className="rounded-2xl border border-border bg-surface shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
            <p className="mr-auto text-sm font-medium">
              {plural(pages.length, "página", "páginas")}
              {pages.length !== input.pageCount && ` (${input.pageCount - pages.length} removida${input.pageCount - pages.length === 1 ? "" : "s"})`}
            </p>
            <button
              type="button"
              disabled={!changed}
              onClick={() => setPages(initial(input.pageCount))}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text disabled:opacity-40"
            >
              <Undo2 className="size-4" aria-hidden />
              Restaurar original
            </button>
          </div>
          <SortableGrid
            items={pages}
            getId={(p) => p.id}
            onReorder={setPages}
            className="grid grid-cols-2 gap-3 p-4 min-[480px]:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
          >
            {(p, i, handle, dragging) => (
              <div className={`rounded-xl border bg-surface-2 p-2 ${dragging ? "border-brand shadow-lg" : "border-transparent"}`}>
                <PageThumb doc={doc} pageNumber={p.index + 1} rotation={p.rotate} />
                <div className="mt-1.5 flex items-center justify-between gap-0.5">
                  <DragHandle handle={handle} label={`Mover página ${p.index + 1} (posição ${i + 1})`} />
                  <span className="text-xs font-medium text-muted" title={`Página original ${p.index + 1}`}>
                    {p.index + 1}
                  </span>
                  <div className="flex">
                    <button type="button" onClick={() => rotate(p.id, -90)} aria-label={`Girar página ${p.index + 1} para a esquerda`} className="inline-flex size-7 items-center justify-center rounded-md text-subtle hover:bg-surface-3 hover:text-text">
                      <RotateCcw className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => rotate(p.id, 90)} aria-label={`Girar página ${p.index + 1} para a direita`} className="inline-flex size-7 items-center justify-center rounded-md text-subtle hover:bg-surface-3 hover:text-text">
                      <RotateCw className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => setPages((ps) => ps.filter((x) => x.id !== p.id))} aria-label={`Excluir página ${p.index + 1}`} className="inline-flex size-7 items-center justify-center rounded-md text-subtle hover:bg-danger-soft hover:text-danger">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </SortableGrid>
        </div>
      }
      options={<p className="text-sm text-muted">Arraste pelos puxadores para reordenar. Use os botões de cada página para girá-la ou excluí-la.</p>}
      actionLabel={actionLabel}
      disabledReason={pages.length === 0 ? "O documento precisa ter ao menos uma página." : !changed ? "Faça alguma alteração para continuar." : null}
      busy={runner.busy}
      progress={runner.progress}
      error={runner.error}
      onAction={() =>
        runner.run(async () => {
          const out = await (await pdfOps()).organizePages(input.bytes, pages.map(({ index, rotate }) => ({ index, rotate })));
          return { files: [{ name: `${baseName(input.file.name)}_organizado.pdf`, blob: pdfBlob(out) }], meta: { count: pages.length } };
        })
      }
    />
  );
}
