"use client";

import { RotateCcw, RotateCw } from "lucide-react";
import { useState } from "react";
import { PageGrid } from "@/components/tool/page-grid";
import { OptionGroup, Workspace } from "@/components/tool/workspace";
import { SinglePdfTool, type Runner } from "@/components/tool/single-pdf-tool";
import type { ToolProps } from "@/components/tool/tool-client";
import { Segmented } from "@/components/ui/form";
import { usePdfjsDoc } from "@/hooks/use-pdfjs-doc";
import type { PdfInput } from "@/hooks/use-pdf-input";
import { pdfBlob } from "@/lib/client/download";
import { baseName, plural } from "@/lib/format";
import { pdfOps } from "@/lib/pdf/lazy";

export default function RotateTool({ tool }: ToolProps) {
  return (
    <SinglePdfTool tool={tool} summary={(meta) => `${plural(Number(meta?.count), "página girada", "páginas giradas")} em ${meta?.angle}°.`}>
      {(input, runner) => <Editor input={input} runner={runner} actionLabel={tool.actionLabel} />}
    </SinglePdfTool>
  );
}

function Editor({ input, runner, actionLabel }: { input: PdfInput; runner: Runner; actionLabel: string }) {
  const { doc } = usePdfjsDoc(input.bytes);
  const [angle, setAngle] = useState(90);
  const [scope, setScope] = useState<"all" | "selected">("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const allSet = new Set(Array.from({ length: input.pageCount }, (_, i) => i));
  const effective = scope === "all" ? allSet : selected;

  return (
    <Workspace
      main={
        <PageGrid
          doc={doc}
          pageCount={input.pageCount}
          selected={effective}
          onChange={(s) => {
            setScope("selected");
            setSelected(s);
          }}
          rotationFor={(i) => (effective.has(i) ? angle : 0)}
          selectionLabel="Páginas a girar"
        />
      }
      options={
        <>
          <OptionGroup title="Ângulo">
            <Segmented
              label="Direção da rotação"
              value={angle}
              onChange={setAngle}
              options={[
                { value: 270, label: <span className="inline-flex items-center gap-1"><RotateCcw className="size-4" aria-hidden />90° esq.</span> },
                { value: 90, label: <span className="inline-flex items-center gap-1"><RotateCw className="size-4" aria-hidden />90° dir.</span> },
                { value: 180, label: "180°" },
              ]}
            />
          </OptionGroup>
          <Segmented
            label="Aplicar em"
            value={scope}
            onChange={(v) => {
              setScope(v);
              if (v === "selected" && selected.size === 0) setSelected(new Set());
            }}
            options={[
              { value: "all", label: "Todas as páginas" },
              { value: "selected", label: "Selecionadas" },
            ]}
          />
        </>
      }
      actionLabel={actionLabel}
      disabledReason={effective.size === 0 ? "Selecione ao menos uma página." : null}
      busy={runner.busy}
      progress={runner.progress}
      error={runner.error}
      onAction={() =>
        runner.run(async () => {
          const pages = [...effective].sort((a, b) => a - b);
          const out = await (await pdfOps()).rotatePages(input.bytes, angle, pages);
          return {
            files: [{ name: `${baseName(input.file.name)}_girado.pdf`, blob: pdfBlob(out) }],
            meta: { count: pages.length, angle: angle === 270 ? "-90" : angle },
          };
        })
      }
    />
  );
}
