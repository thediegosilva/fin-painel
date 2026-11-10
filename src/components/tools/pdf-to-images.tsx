"use client";

import { useMemo, useState } from "react";
import { OptionGroup, Workspace } from "@/components/tool/workspace";
import { PageGrid } from "@/components/tool/page-grid";
import { SinglePdfTool, type Runner } from "@/components/tool/single-pdf-tool";
import type { ToolProps } from "@/components/tool/tool-client";
import { Segmented, Slider } from "@/components/ui/form";
import { usePdfjsDoc } from "@/hooks/use-pdfjs-doc";
import type { PdfInput } from "@/hooks/use-pdf-input";
import { canvasToBlob, closePdf, openPdf, renderPage } from "@/lib/client/pdfjs";
import { dateStamp, plural, sequenceName } from "@/lib/format";

export default function PdfToImagesTool({ tool }: ToolProps) {
  return (
    <SinglePdfTool
      tool={tool}
      // ZIP nomeado com a data do download, ex.: "01 05 26.zip".
      zipName={() => `${dateStamp()}.zip`}
      summary={(meta) => `${plural(Number(meta?.count), "imagem gerada", "imagens geradas")} em ${meta?.format}, ${meta?.dpi} DPI.`}
    >
      {(input, runner) => <Editor input={input} runner={runner} actionLabel={tool.actionLabel} />}
    </SinglePdfTool>
  );
}

function Editor({ input, runner, actionLabel }: { input: PdfInput; runner: Runner; actionLabel: string }) {
  const { doc } = usePdfjsDoc(input.bytes);
  const allPages = useMemo(() => new Set(Array.from({ length: input.pageCount }, (_, i) => i)), [input.pageCount]);
  const [selected, setSelected] = useState<Set<number>>(allPages);
  const [format, setFormat] = useState<"jpg" | "png">("jpg");
  const [dpi, setDpi] = useState(150);
  const [quality, setQuality] = useState(90);

  return (
    <Workspace
      main={<PageGrid doc={doc} pageCount={input.pageCount} selected={selected} onChange={setSelected} selectionLabel="Páginas a converter" />}
      options={
        <OptionGroup title="Imagem">
          <Segmented
            label="Formato"
            value={format}
            onChange={setFormat}
            options={[
              { value: "jpg", label: "JPG" },
              { value: "png", label: "PNG" },
            ]}
          />
          <Segmented
            label="Resolução"
            value={dpi}
            onChange={setDpi}
            options={[
              { value: 72, label: "72 DPI" },
              { value: 150, label: "150 DPI" },
              { value: 300, label: "300 DPI" },
            ]}
          />
          {format === "jpg" && <Slider label="Qualidade JPG" value={quality} onChange={setQuality} min={40} max={100} format={(v) => `${v}%`} />}
          <p className="text-xs text-muted">300 DPI gera imagens grandes, ideais para impressão; 150 DPI atende a maioria dos usos em tela.</p>
        </OptionGroup>
      }
      actionLabel={actionLabel}
      disabledReason={selected.size === 0 ? "Selecione ao menos uma página." : null}
      busy={runner.busy}
      progress={runner.progress}
      error={runner.error}
      onCancel={runner.cancel}
      onAction={() =>
        runner.run(async ({ setProgress, signal }) => {
          const pdf = await openPdf(input.bytes);
          const pages = [...selected].sort((a, b) => a - b);
          const files = [];
          try {
            for (let k = 0; k < pages.length; k++) {
              if (signal.aborted) break;
              setProgress(k / pages.length, `Convertendo página ${k + 1} de ${pages.length}…`);
              const page = await pdf.getPage(pages[k] + 1);
              const canvas = await renderPage(page, { scale: dpi / 72 });
              const blob = await canvasToBlob(canvas, format === "jpg" ? "image/jpeg" : "image/png", quality / 100);
              canvas.width = canvas.height = 0; // libera memória do canvas
              page.cleanup();
              files.push({ name: sequenceName(k, pages.length, format), blob });
            }
          } finally {
            await closePdf(pdf);
          }
          return { files, meta: { count: files.length, format: format.toUpperCase(), dpi } };
        })
      }
    />
  );
}
