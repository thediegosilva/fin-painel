"use client";

import { useMemo, useState } from "react";
import { OptionGroup, Workspace } from "@/components/tool/workspace";
import { PageThumb } from "@/components/tool/page-thumb";
import { SinglePdfTool, type Runner } from "@/components/tool/single-pdf-tool";
import type { ToolProps } from "@/components/tool/tool-client";
import { Field, Input, Segmented, Select, Slider } from "@/components/ui/form";
import { usePdfjsDoc } from "@/hooks/use-pdfjs-doc";
import type { PdfInput } from "@/hooks/use-pdf-input";
import { cn } from "@/lib/cn";
import { pdfBlob } from "@/lib/client/download";
import { baseName, plural } from "@/lib/format";
import { isPdfError } from "@/lib/pdf/errors";
import { pdfOps } from "@/lib/pdf/lazy";
import { formatPageNumber, type NumberFormat } from "@/lib/pdf/page-number-format";
import type { NumberPosition } from "@/lib/pdf/ops";
import { parseRangeSet } from "@/lib/pdf/ranges";

const POSITIONS: { value: NumberPosition; label: string }[] = [
  { value: "top-left", label: "Superior esquerdo" },
  { value: "top-center", label: "Superior central" },
  { value: "top-right", label: "Superior direito" },
  { value: "bottom-left", label: "Inferior esquerdo" },
  { value: "bottom-center", label: "Inferior central" },
  { value: "bottom-right", label: "Inferior direito" },
];

export default function PageNumbersTool({ tool }: ToolProps) {
  return (
    <SinglePdfTool tool={tool} summary={(meta) => `${plural(Number(meta?.count), "página numerada", "páginas numeradas")}.`}>
      {(input, runner) => <Editor input={input} runner={runner} actionLabel={tool.actionLabel} />}
    </SinglePdfTool>
  );
}

function Editor({ input, runner, actionLabel }: { input: PdfInput; runner: Runner; actionLabel: string }) {
  const { doc } = usePdfjsDoc(input.bytes);
  const [position, setPosition] = useState<NumberPosition>("bottom-center");
  const [format, setFormat] = useState<NumberFormat>("n");
  const [startAt, setStartAt] = useState(1);
  const [fontSize, setFontSize] = useState(11);
  const [margin, setMargin] = useState(24);
  const [color, setColor] = useState("#1f2937");
  const [scope, setScope] = useState<"all" | "range">("all");
  const [range, setRange] = useState(input.pageCount > 1 ? `2-${input.pageCount}` : "1");

  const pages = useMemo((): number[] | { error: string } | undefined => {
    if (scope === "all") return undefined;
    try {
      return parseRangeSet(range, input.pageCount).sort((a, b) => a - b);
    } catch (e) {
      return { error: isPdfError(e) ? e.message : "Intervalo inválido." };
    }
  }, [scope, range, input.pageCount]);
  const rangeError = pages && !Array.isArray(pages) ? pages.error : null;
  const count = Array.isArray(pages) ? pages.length : input.pageCount;
  const example = formatPageNumber(format, Math.max(0, startAt), Math.max(0, startAt) + count - 1);
  const [vert, horiz] = position.split("-");

  return (
    <Workspace
      main={
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium">Escolha a posição</p>
          <div className="mx-auto grid max-w-sm grid-cols-[1fr_auto] gap-4">
            <div className="relative rounded-xl bg-surface-2 p-3">
              <PageThumb doc={doc} pageNumber={1} width={360} />
              <span
                className={cn(
                  "pointer-events-none absolute rounded bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-on-brand shadow",
                  vert === "top" ? "top-4" : "bottom-4",
                  horiz === "left" ? "left-4" : horiz === "right" ? "right-4" : "left-1/2 -translate-x-1/2",
                )}
              >
                {example}
              </span>
            </div>
            <div role="radiogroup" aria-label="Posição do número" className="grid grid-cols-3 content-between gap-1.5 rounded-xl border border-border p-2">
              {POSITIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  role="radio"
                  aria-checked={position === p.value}
                  aria-label={p.label}
                  title={p.label}
                  onClick={() => setPosition(p.value)}
                  className={cn(
                    "size-8 rounded-md border-2 transition-colors",
                    position === p.value ? "border-brand bg-brand" : "border-border-strong hover:border-brand",
                  )}
                />
              ))}
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted">Posição selecionada: {POSITIONS.find((p) => p.value === position)?.label}</p>
        </div>
      }
      options={
        <>
          <OptionGroup title="Formato">
            <Field label="Texto">
              {(p) => (
                <Select {...p} value={format} onChange={(e) => setFormat(e.target.value as NumberFormat)}>
                  <option value="n">1, 2, 3…</option>
                  <option value="n-total">1 / N</option>
                  <option value="pagina-n-de-total">Página 1 de N</option>
                  <option value="pag-n">Pág. 1</option>
                </Select>
              )}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Começar em">
                {(p) => <Input {...p} type="number" min={0} value={startAt} onChange={(e) => setStartAt(Math.max(0, Math.floor(Number(e.target.value))))} />}
              </Field>
              <Field label="Cor">
                {(p) => <Input {...p} type="color" value={color} onChange={(e) => setColor(e.target.value)} className="p-1" />}
              </Field>
            </div>
            <Slider label="Tamanho da fonte" value={fontSize} onChange={setFontSize} min={6} max={36} format={(v) => `${v} pt`} />
            <Slider label="Distância da borda" value={margin} onChange={setMargin} min={6} max={72} format={(v) => `${v} pt`} />
          </OptionGroup>
          <OptionGroup title="Páginas">
            <Segmented
              label="Numerar"
              value={scope}
              onChange={setScope}
              options={[
                { value: "all", label: "Todas" },
                { value: "range", label: "Intervalo" },
              ]}
            />
            {scope === "range" && (
              <Field label="Páginas a numerar" hint="Ex.: 2-10 (pula a capa)" error={rangeError}>
                {(p) => <Input {...p} value={range} onChange={(e) => setRange(e.target.value)} />}
              </Field>
            )}
          </OptionGroup>
        </>
      }
      actionLabel={actionLabel}
      disabledReason={rangeError}
      busy={runner.busy}
      progress={runner.progress}
      error={runner.error}
      onAction={() =>
        runner.run(async () => {
          const out = await (await pdfOps()).addPageNumbers(input.bytes, {
            position,
            format,
            startAt,
            fontSize,
            margin,
            color,
            pages: Array.isArray(pages) ? pages : undefined,
          });
          return { files: [{ name: `${baseName(input.file.name)}_numerado.pdf`, blob: pdfBlob(out) }], meta: { count } };
        })
      }
    />
  );
}
