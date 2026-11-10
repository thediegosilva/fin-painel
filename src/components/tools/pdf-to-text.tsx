"use client";

import { useState } from "react";
import { Workspace } from "@/components/tool/workspace";
import { SinglePdfTool, type Runner } from "@/components/tool/single-pdf-tool";
import type { ToolProps } from "@/components/tool/tool-client";
import { Checkbox } from "@/components/ui/form";
import type { PdfInput } from "@/hooks/use-pdf-input";
import { closePdf, extractText, openPdf } from "@/lib/client/pdfjs";
import { baseName, plural } from "@/lib/format";
import { PdfError } from "@/lib/pdf/errors";

export default function PdfToTextTool({ tool }: ToolProps) {
  return (
    <SinglePdfTool
      tool={tool}
      summary={(meta) => `${Number(meta?.chars).toLocaleString("pt-BR")} caracteres extraídos de ${plural(Number(meta?.pages), "página", "páginas")}.`}
    >
      {(input, runner) => <Editor input={input} runner={runner} actionLabel={tool.actionLabel} />}
    </SinglePdfTool>
  );
}

function Editor({ input, runner, actionLabel }: { input: PdfInput; runner: Runner; actionLabel: string }) {
  const [markers, setMarkers] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <Workspace
      main={
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          {preview === null ? (
            <p className="text-sm text-muted">
              O texto selecionável de todas as {input.pageCount} páginas será extraído para um arquivo .txt (UTF-8). PDFs
              digitalizados como imagem não contêm texto — para eles seria necessário OCR, que esta ferramenta não realiza.
            </p>
          ) : (
            <>
              <p className="mb-2 text-sm font-medium">Prévia do texto extraído</p>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-surface-2 p-4 font-mono text-xs leading-relaxed">
                {preview}
              </pre>
            </>
          )}
        </div>
      }
      options={
        <Checkbox
          label="Separar por página"
          description="Insere um marcador “— Página N —” antes do texto de cada página."
          checked={markers}
          onChange={setMarkers}
        />
      }
      actionLabel={actionLabel}
      busy={runner.busy}
      progress={runner.progress}
      error={runner.error}
      onAction={() =>
        runner.run(async ({ setProgress }) => {
          const doc = await openPdf(input.bytes);
          try {
            const { pages, chars } = await extractText(doc, (d, t) => setProgress(d / t, `Lendo página ${d} de ${t}…`));
            if (chars === 0) {
              throw new PdfError(
                "no-text",
                "Este PDF não contém texto selecionável (provavelmente é uma digitalização). Nenhum texto foi extraído.",
              );
            }
            const text = markers ? pages.map((p, i) => `— Página ${i + 1} —\n\n${p}`).join("\n\n") : pages.join("\n\n");
            setPreview(text.slice(0, 5000) + (text.length > 5000 ? "\n…" : ""));
            return {
              files: [{ name: `${baseName(input.file.name)}.txt`, blob: new Blob(["﻿" + text], { type: "text/plain;charset=utf-8" }) }],
              meta: { chars, pages: pages.length },
            };
          } finally {
            await closePdf(doc);
          }
        })
      }
    />
  );
}
