"use client";

import { useState } from "react";
import { PageGrid } from "@/components/tool/page-grid";
import { SinglePdfTool, type Runner } from "@/components/tool/single-pdf-tool";
import type { ToolProps } from "@/components/tool/tool-client";
import { Workspace } from "@/components/tool/workspace";
import { Segmented } from "@/components/ui/form";
import { usePdfjsDoc } from "@/hooks/use-pdfjs-doc";
import type { PdfInput } from "@/hooks/use-pdf-input";
import { pdfBlob } from "@/lib/client/download";
import { baseName, plural } from "@/lib/format";
import { pdfOps } from "@/lib/pdf/lazy";

export default function ExtractPagesTool({ tool }: ToolProps) {
  return (
    <SinglePdfTool
      tool={tool}
      zipName={(i) => `${baseName(i.file.name)}_paginas.zip`}
      summary={(meta) =>
        meta?.separate
          ? `${plural(Number(meta?.count), "arquivo gerado", "arquivos gerados")}, um por página.`
          : `Novo PDF com ${plural(Number(meta?.count), "página", "páginas")}.`
      }
    >
      {(input, runner) => <Editor input={input} runner={runner} actionLabel={tool.actionLabel} />}
    </SinglePdfTool>
  );
}

function Editor({ input, runner, actionLabel }: { input: PdfInput; runner: Runner; actionLabel: string }) {
  const { doc } = usePdfjsDoc(input.bytes);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [separate, setSeparate] = useState(false);
  const base = baseName(input.file.name);

  return (
    <Workspace
      main={
        <PageGrid doc={doc} pageCount={input.pageCount} selected={selected} onChange={setSelected} selectionLabel="Páginas a extrair" />
      }
      options={
        <Segmented
          label="Resultado"
          value={separate ? "sep" : "one"}
          onChange={(v) => setSeparate(v === "sep")}
          columns={1}
          options={[
            { value: "one", label: "Um único PDF", description: "Todas as páginas selecionadas juntas." },
            { value: "sep", label: "Um PDF por página", description: "Baixados em um arquivo ZIP." },
          ]}
        />
      }
      actionLabel={actionLabel}
      disabledReason={selected.size === 0 ? "Selecione ao menos uma página." : null}
      busy={runner.busy}
      progress={runner.progress}
      error={runner.error}
      onAction={() =>
        runner.run(async () => {
          const pages = [...selected].sort((a, b) => a - b);
          if (separate) {
            const outs = await (await pdfOps()).splitByGroups(input.bytes, pages.map((p) => [p]));
            return {
              files: outs.map((o, k) => ({ name: `${base}_pagina-${pages[k] + 1}.pdf`, blob: pdfBlob(o) })),
              meta: { separate: true, count: outs.length },
            };
          }
          const out = await (await pdfOps()).extractPages(input.bytes, pages);
          return { files: [{ name: `${base}_extraido.pdf`, blob: pdfBlob(out) }], meta: { separate: false, count: pages.length } };
        })
      }
    />
  );
}
