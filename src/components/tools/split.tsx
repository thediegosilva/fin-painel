"use client";

import { useMemo, useState } from "react";
import { OptionGroup, Workspace } from "@/components/tool/workspace";
import { PageThumb } from "@/components/tool/page-thumb";
import { SinglePdfTool, type Runner } from "@/components/tool/single-pdf-tool";
import type { ToolProps } from "@/components/tool/tool-client";
import { Field, Input, Segmented } from "@/components/ui/form";
import { usePdfjsDoc } from "@/hooks/use-pdfjs-doc";
import type { PdfInput } from "@/hooks/use-pdf-input";
import { pdfBlob } from "@/lib/client/download";
import { baseName, plural } from "@/lib/format";
import { isPdfError } from "@/lib/pdf/errors";
import { pdfOps } from "@/lib/pdf/lazy";
import { groupsEvery } from "@/lib/pdf/ranges";
import { formatRange, parseRangeGroups } from "@/lib/pdf/ranges";

type Mode = "ranges" | "every" | "all";

export default function SplitTool({ tool }: ToolProps) {
  return (
    <SinglePdfTool
      tool={tool}
      zipName={(i) => `${baseName(i.file.name)}_dividido.zip`}
      summary={(meta) => `${plural(Number(meta?.count), "arquivo gerado", "arquivos gerados")}.`}
    >
      {(input, runner) => <Editor input={input} runner={runner} actionLabel={tool.actionLabel} />}
    </SinglePdfTool>
  );
}

function Editor({ input, runner, actionLabel }: { input: PdfInput; runner: Runner; actionLabel: string }) {
  const { doc } = usePdfjsDoc(input.bytes);
  const n = input.pageCount;
  const [mode, setMode] = useState<Mode>(n > 1 ? "ranges" : "all");
  const [ranges, setRanges] = useState(n > 1 ? `1-${Math.ceil(n / 2)}, ${Math.ceil(n / 2) + 1}-${n}` : "1");
  const [every, setEvery] = useState(Math.min(2, n));

  const plan = useMemo((): { groups: number[][] } | { error: string } => {
    try {
      if (mode === "all") return { groups: groupsEvery(n, 1) };
      if (mode === "every") return { groups: groupsEvery(n, every) };
      return { groups: parseRangeGroups(ranges, n) };
    } catch (e) {
      return { error: isPdfError(e) ? e.message : "Configuração inválida." };
    }
  }, [mode, ranges, every, n]);

  const groups = "groups" in plan ? plan.groups : [];
  const base = baseName(input.file.name);

  return (
    <Workspace
      main={
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium">
            {"error" in plan ? "Prévia indisponível" : `Prévia: ${plural(groups.length, "arquivo", "arquivos")}`}
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {groups.slice(0, 60).map((g, k) => (
              <li key={k} className="rounded-xl border border-border bg-surface-2 p-3">
                <div className="flex items-center gap-2">
                  <PageThumb doc={doc} pageNumber={g[0] + 1} className="w-16 shrink-0" width={120} />
                  {g.length > 1 && (
                    <>
                      <span className="text-subtle" aria-hidden>…</span>
                      <PageThumb doc={doc} pageNumber={g[g.length - 1] + 1} className="w-16 shrink-0" width={120} />
                    </>
                  )}
                </div>
                <p className="mt-2 text-xs font-medium">Arquivo {k + 1}</p>
                <p className="text-xs text-muted">
                  {g.length === 1 ? `Página ${g[0] + 1}` : `Páginas ${formatRange(g)}`} · {plural(g.length, "pág.", "págs.")}
                </p>
              </li>
            ))}
          </ul>
          {groups.length > 60 && <p className="mt-3 text-xs text-muted">… e mais {groups.length - 60} arquivos.</p>}
        </div>
      }
      options={
        <OptionGroup title="Modo de divisão">
          <Segmented
            label="Como dividir"
            value={mode}
            onChange={setMode}
            columns={1}
            options={[
              { value: "ranges", label: "Por intervalos", description: "Cada intervalo vira um arquivo." },
              { value: "every", label: "A cada N páginas", description: "Blocos de tamanho fixo." },
              { value: "all", label: "Todas as páginas", description: "Um arquivo por página." },
            ]}
          />
          {mode === "ranges" && (
            <Field label="Intervalos" hint="Separe com vírgulas. Ex.: 1-3, 4-6, 7" error={"error" in plan ? plan.error : undefined}>
              {(p) => <Input {...p} value={ranges} onChange={(e) => setRanges(e.target.value)} />}
            </Field>
          )}
          {mode === "every" && (
            <Field label="Páginas por arquivo" error={"error" in plan ? plan.error : undefined}>
              {(p) => (
                <Input
                  {...p}
                  type="number"
                  min={1}
                  max={n}
                  value={every}
                  onChange={(e) => setEvery(Math.max(0, Math.floor(Number(e.target.value))))}
                />
              )}
            </Field>
          )}
        </OptionGroup>
      }
      actionLabel={actionLabel}
      disabledReason={"error" in plan ? plan.error : null}
      busy={runner.busy}
      progress={runner.progress}
      error={runner.error}
      onAction={() =>
        runner.run(async () => {
          const outs = await (await pdfOps()).splitByGroups(input.bytes, groups);
          return {
            files: outs.map((o, k) => ({
              name: `${base}_${groups[k].length === 1 ? `pagina-${groups[k][0] + 1}` : `paginas-${groups[k][0] + 1}-${groups[k][groups[k].length - 1] + 1}`}.pdf`,
              blob: pdfBlob(o),
            })),
            meta: { count: outs.length },
          };
        })
      }
    />
  );
}
