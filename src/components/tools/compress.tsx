"use client";

import { useState } from "react";
import { ServerGate } from "@/components/tool/server-gate";
import { SinglePdfTool, type Runner } from "@/components/tool/single-pdf-tool";
import type { ToolProps } from "@/components/tool/tool-client";
import { Workspace } from "@/components/tool/workspace";
import { Segmented } from "@/components/ui/form";
import type { PdfInput } from "@/hooks/use-pdf-input";
import { baseName, formatBytes } from "@/lib/format";
import { uploadForProcessing } from "./server-upload";

type Level = "extrema" | "recomendada" | "baixa";

export default function CompressTool({ tool }: ToolProps) {
  return (
    <ServerGate tool={tool}>
      {(health) => (
        <SinglePdfTool
          tool={tool}
          maxMb={health.limits.maxUploadMb}
          resultTitle="Compressão concluída"
          summary={(meta) => {
            const before = Number(meta?.before);
            const after = Number(meta?.after);
            if (meta?.noGain) {
              return `Este PDF já está otimizado: a compressão não reduziria o tamanho (${formatBytes(before)}). Você pode baixar o arquivo original.`;
            }
            const pct = Math.round((1 - after / before) * 100);
            return (
              <span>
                De <strong>{formatBytes(before)}</strong> para <strong>{formatBytes(after)}</strong> — redução de{" "}
                <strong className="text-success">{pct}%</strong>.
              </span>
            );
          }}
        >
          {(input, runner) => <Editor input={input} runner={runner} actionLabel={tool.actionLabel} />}
        </SinglePdfTool>
      )}
    </ServerGate>
  );
}

function Editor({ input, runner, actionLabel }: { input: PdfInput; runner: Runner; actionLabel: string }) {
  const [level, setLevel] = useState<Level>("recomendada");
  return (
    <Workspace
      main={
        <Segmented
          label="Nível de compressão"
          value={level}
          onChange={setLevel}
          columns={1}
          options={[
            { value: "extrema", label: "Compressão extrema", description: "Menor tamanho possível; imagens com qualidade reduzida (~72 DPI)." },
            { value: "recomendada", label: "Recomendada", description: "Bom equilíbrio entre tamanho e qualidade (~150 DPI)." },
            { value: "baixa", label: "Baixa compressão", description: "Alta qualidade, adequada para impressão (~300 DPI)." },
          ]}
        />
      }
      options={
        <p className="text-sm text-muted">
          O PDF será reescrito no servidor com Ghostscript. Formulários interativos e assinaturas digitais podem não ser
          preservados. Se o resultado ficar maior que o original, você recebe o arquivo original.
        </p>
      }
      actionLabel={actionLabel}
      busy={runner.busy}
      progress={runner.progress}
      error={runner.error}
      onCancel={runner.cancel}
      onAction={() =>
        runner.run(async (ctx) => {
          const res = await uploadForProcessing("/api/pdf/compress", input.file, { level }, ctx);
          const noGain = res.headers("x-no-gain") === "1";
          return {
            files: [{ name: `${baseName(input.file.name)}_comprimido.pdf`, blob: res.blob }],
            meta: { before: Number(res.headers("x-original-size") ?? input.file.size), after: res.blob.size, noGain },
          };
        })
      }
    />
  );
}
