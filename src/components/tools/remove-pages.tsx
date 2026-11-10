"use client";

import { useState } from "react";
import { PageGrid } from "@/components/tool/page-grid";
import { SinglePdfTool, type Runner } from "@/components/tool/single-pdf-tool";
import type { ToolProps } from "@/components/tool/tool-client";
import { Workspace } from "@/components/tool/workspace";
import { usePdfjsDoc } from "@/hooks/use-pdfjs-doc";
import type { PdfInput } from "@/hooks/use-pdf-input";
import { pdfBlob } from "@/lib/client/download";
import { baseName, plural } from "@/lib/format";
import { pdfOps } from "@/lib/pdf/lazy";

export default function RemovePagesTool({ tool }: ToolProps) {
  return (
    <SinglePdfTool
      tool={tool}
      summary={(meta) => `${plural(Number(meta?.removed), "página removida", "páginas removidas")}. O novo PDF tem ${plural(Number(meta?.remaining), "página", "páginas")}.`}
    >
      {(input, runner) => <Editor input={input} runner={runner} actionLabel={tool.actionLabel} />}
    </SinglePdfTool>
  );
}

function Editor({ input, runner, actionLabel }: { input: PdfInput; runner: Runner; actionLabel: string }) {
  const { doc } = usePdfjsDoc(input.bytes);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const all = selected.size === input.pageCount;

  return (
    <Workspace
      main={
        <PageGrid
          doc={doc}
          pageCount={input.pageCount}
          selected={selected}
          onChange={setSelected}
          tone="danger"
          selectionLabel="Páginas a remover"
        />
      }
      options={
        <p className="text-sm text-muted">
          {selected.size === 0
            ? "Selecione as páginas que deseja excluir."
            : `${plural(selected.size, "página será removida", "páginas serão removidas")}; ${plural(input.pageCount - selected.size, "permanece", "permanecem")}.`}
        </p>
      }
      actionLabel={actionLabel}
      disabledReason={selected.size === 0 ? "Selecione ao menos uma página." : all ? "Mantenha pelo menos uma página no documento." : null}
      busy={runner.busy}
      progress={runner.progress}
      error={runner.error}
      onAction={() =>
        runner.run(async () => {
          const out = await (await pdfOps()).removePages(input.bytes, [...selected].sort((a, b) => a - b));
          return {
            files: [{ name: `${baseName(input.file.name)}_editado.pdf`, blob: pdfBlob(out) }],
            meta: { removed: selected.size, remaining: input.pageCount - selected.size },
          };
        })
      }
    />
  );
}
