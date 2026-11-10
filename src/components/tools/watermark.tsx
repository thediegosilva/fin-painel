"use client";

import { useMemo, useState } from "react";
import { OptionGroup, Workspace } from "@/components/tool/workspace";
import { PageThumb } from "@/components/tool/page-thumb";
import { SinglePdfTool, type Runner } from "@/components/tool/single-pdf-tool";
import type { ToolProps } from "@/components/tool/tool-client";
import { Checkbox, Field, Input, Segmented, Slider } from "@/components/ui/form";
import { usePdfjsDoc } from "@/hooks/use-pdfjs-doc";
import type { PdfInput } from "@/hooks/use-pdf-input";
import { pdfBlob } from "@/lib/client/download";
import { baseName, plural } from "@/lib/format";
import { isPdfError } from "@/lib/pdf/errors";
import { pdfOps } from "@/lib/pdf/lazy";
import { parseRangeSet } from "@/lib/pdf/ranges";

export default function WatermarkTool({ tool }: ToolProps) {
  return (
    <SinglePdfTool tool={tool} summary={(meta) => `Marca d'água aplicada em ${plural(Number(meta?.count), "página", "páginas")}.`}>
      {(input, runner) => <Editor input={input} runner={runner} actionLabel={tool.actionLabel} />}
    </SinglePdfTool>
  );
}

function Editor({ input, runner, actionLabel }: { input: PdfInput; runner: Runner; actionLabel: string }) {
  const { doc } = usePdfjsDoc(input.bytes);
  const [text, setText] = useState("CONFIDENCIAL");
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#c4352d");
  const [opacity, setOpacity] = useState(0.25);
  const [angle, setAngle] = useState(45);
  const [layout, setLayout] = useState<"center" | "mosaic">("center");
  const [bold, setBold] = useState(true);
  const [scope, setScope] = useState<"all" | "range">("all");
  const [range, setRange] = useState("1");

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

  return (
    <Workspace
      main={
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium">Prévia aproximada (página 1)</p>
          <div className="relative mx-auto max-w-sm overflow-hidden rounded-xl bg-surface-2 p-3">
            <PageThumb doc={doc} pageNumber={1} width={360} />
            <div className="pointer-events-none absolute inset-3 flex items-center justify-center overflow-hidden" aria-hidden>
              <span
                className="whitespace-nowrap"
                style={{
                  color,
                  opacity,
                  fontWeight: bold ? 700 : 400,
                  fontSize: `${Math.max(8, fontSize * 0.45)}px`,
                  transform: `rotate(${-angle}deg)`,
                  fontFamily: "Helvetica, Arial, sans-serif",
                }}
              >
                {text}
              </span>
            </div>
          </div>
        </div>
      }
      options={
        <>
          <OptionGroup title="Texto">
            <Field label="Texto da marca d'água" hint={`${text.length}/120`}>
              {(p) => <Input {...p} value={text} maxLength={120} onChange={(e) => setText(e.target.value)} />}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cor">
                {(p) => <Input {...p} type="color" value={color} onChange={(e) => setColor(e.target.value)} className="p-1" />}
              </Field>
              <div className="flex items-end pb-2">
                <Checkbox label="Negrito" checked={bold} onChange={setBold} />
              </div>
            </div>
            <Slider label="Tamanho" value={fontSize} onChange={setFontSize} min={10} max={160} format={(v) => `${v} pt`} />
            <Slider label="Opacidade" value={Math.round(opacity * 100)} onChange={(v) => setOpacity(v / 100)} min={5} max={100} format={(v) => `${v}%`} />
            <Slider label="Ângulo" value={angle} onChange={setAngle} min={-90} max={90} format={(v) => `${v}°`} />
          </OptionGroup>
          <OptionGroup title="Disposição">
            <Segmented
              label="Layout"
              value={layout}
              onChange={setLayout}
              options={[
                { value: "center", label: "Centralizada" },
                { value: "mosaic", label: "Mosaico" },
              ]}
            />
            <Segmented
              label="Páginas"
              value={scope}
              onChange={setScope}
              options={[
                { value: "all", label: "Todas" },
                { value: "range", label: "Intervalo" },
              ]}
            />
            {scope === "range" && (
              <Field label="Páginas" hint="Ex.: 1-3, 5" error={rangeError}>
                {(p) => <Input {...p} value={range} onChange={(e) => setRange(e.target.value)} />}
              </Field>
            )}
          </OptionGroup>
        </>
      }
      actionLabel={actionLabel}
      disabledReason={!text.trim() ? "Digite o texto da marca d'água." : rangeError}
      busy={runner.busy}
      progress={runner.progress}
      error={runner.error}
      onAction={() =>
        runner.run(async () => {
          const out = await (await pdfOps()).addWatermark(input.bytes, {
            text,
            fontSize,
            color,
            opacity,
            angle,
            layout,
            bold,
            pages: Array.isArray(pages) ? pages : undefined,
          });
          return { files: [{ name: `${baseName(input.file.name)}_marca-dagua.pdf`, blob: pdfBlob(out) }], meta: { count } };
        })
      }
    />
  );
}
