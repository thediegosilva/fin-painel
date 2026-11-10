"use client";

import { useEffect, useState } from "react";
import { Workspace } from "@/components/tool/workspace";
import { SinglePdfTool, type Runner } from "@/components/tool/single-pdf-tool";
import type { ToolProps } from "@/components/tool/tool-client";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/form";
import type { PdfInput } from "@/hooks/use-pdf-input";
import { pdfBlob } from "@/lib/client/download";
import { baseName } from "@/lib/format";
import { pdfOps } from "@/lib/pdf/lazy";
import type { PdfMetadata } from "@/lib/pdf/ops";

export default function MetadataTool({ tool }: ToolProps) {
  return (
    <SinglePdfTool tool={tool} summary={() => "Metadados atualizados."}>
      {(input, runner) => <Editor input={input} runner={runner} actionLabel={tool.actionLabel} />}
    </SinglePdfTool>
  );
}

const FIELDS: { key: Exclude<keyof PdfMetadata, "producer">; label: string; hint?: string }[] = [
  { key: "title", label: "Título" },
  { key: "author", label: "Autor" },
  { key: "subject", label: "Assunto" },
  { key: "keywords", label: "Palavras-chave", hint: "Separe por vírgulas." },
  { key: "creator", label: "Aplicativo criador" },
];

function Editor({ input, runner, actionLabel }: { input: PdfInput; runner: Runner; actionLabel: string }) {
  const [meta, setMeta] = useState<PdfMetadata | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    pdfOps()
      .then((ops) => ops.readMetadata(input.bytes))
      .then((m) => alive && setMeta(m))
      .catch(() => alive && setLoadError("Não foi possível ler os metadados deste PDF."));
    return () => {
      alive = false;
    };
  }, [input.bytes]);

  if (loadError) return <Alert tone="danger">{loadError}</Alert>;
  if (!meta) return <p className="text-sm text-muted" role="status">Lendo metadados…</p>;

  return (
    <Workspace
      main={
        <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          {FIELDS.map((f) => (
            <Field key={f.key} label={f.label} hint={f.hint}>
              {(p) => (
                <Input {...p} value={meta[f.key]} maxLength={500} onChange={(e) => setMeta({ ...meta, [f.key]: e.target.value })} />
              )}
            </Field>
          ))}
          <p className="text-xs text-muted">
            Produtor atual: {meta.producer || "não informado"}. Ao salvar, o produtor passa a ser “FIN-Painel”.
          </p>
        </div>
      }
      options={<p className="text-sm text-muted">Deixe um campo vazio para removê-lo do documento.</p>}
      actionLabel={actionLabel}
      busy={runner.busy}
      progress={runner.progress}
      error={runner.error}
      onAction={() =>
        runner.run(async () => {
          const out = await (await pdfOps()).writeMetadata(input.bytes, meta);
          return { files: [{ name: `${baseName(input.file.name)}.pdf`, blob: pdfBlob(out) }] };
        })
      }
    />
  );
}
