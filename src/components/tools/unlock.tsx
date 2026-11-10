"use client";

import { useEffect, useState } from "react";
import { ServerGate } from "@/components/tool/server-gate";
import { SinglePdfTool, type Runner } from "@/components/tool/single-pdf-tool";
import type { ToolProps } from "@/components/tool/tool-client";
import { Workspace } from "@/components/tool/workspace";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/form";
import type { PdfInput } from "@/hooks/use-pdf-input";
import { needsPassword } from "@/lib/client/pdfjs";
import { baseName } from "@/lib/format";
import { isPdfError } from "@/lib/pdf/errors";
import { pdfOps } from "@/lib/pdf/lazy";
import { PASSWORD_PATTERN, PasswordInput } from "./password-input";
import { uploadForProcessing } from "./server-upload";

async function checkEncrypted(input: PdfInput): Promise<string | null> {
  try {
    await (await pdfOps()).loadPdf(input.bytes);
    return "Este PDF não está protegido — não há nada a desbloquear. Você já pode usá-lo nas demais ferramentas.";
  } catch (e) {
    if (isPdfError(e) && e.code === "encrypted") return null;
    throw e;
  }
}

export default function UnlockTool({ tool }: ToolProps) {
  return (
    <ServerGate tool={tool}>
      {(health) => (
        <SinglePdfTool tool={tool} maxMb={health.limits.maxUploadMb} allowEncrypted validate={checkEncrypted} resultTitle="PDF desbloqueado" summary={() => "A proteção foi removida. O arquivo abre sem senha e pode ser usado nas demais ferramentas."}>
          {(input, runner) => <Editor input={input} runner={runner} actionLabel={tool.actionLabel} />}
        </SinglePdfTool>
      )}
    </ServerGate>
  );
}

function Editor({ input, runner, actionLabel }: { input: PdfInput; runner: Runner; actionLabel: string }) {
  const [requires, setRequires] = useState<boolean | null>(null);
  const [pw, setPw] = useState("");

  useEffect(() => {
    let alive = true;
    needsPassword(input.bytes)
      .then((r) => alive && setRequires(r))
      .catch(() => alive && setRequires(true));
    return () => {
      alive = false;
    };
  }, [input.bytes]);

  const problem =
    requires === null ? "Analisando o arquivo…" : requires && !pw ? "Informe a senha do PDF." : !PASSWORD_PATTERN.test(pw) ? "A senha contém caracteres não suportados." : null;

  return (
    <Workspace
      main={
        <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          {requires === false ? (
            <Alert tone="info" title="Senha não necessária">
              Este PDF abre sem senha, mas possui restrições (impressão, cópia ou edição). Elas serão removidas.
            </Alert>
          ) : (
            <Field label="Senha atual do PDF" hint="Necessária para abrir o arquivo.">
              {(p) => <PasswordInput {...p} value={pw} autoComplete="current-password" disabled={requires === null} onChange={(e) => setPw(e.target.value)} />}
            </Field>
          )}
        </div>
      }
      options={<p className="text-sm text-muted">Use esta ferramenta somente em documentos que você tem o direito de acessar.</p>}
      actionLabel={actionLabel}
      disabledReason={problem}
      busy={runner.busy}
      progress={runner.progress}
      error={runner.error}
      onCancel={runner.cancel}
      onAction={() =>
        runner.run(async (ctx) => {
          const res = await uploadForProcessing("/api/pdf/unlock", input.file, { password: pw }, ctx);
          return { files: [{ name: `${baseName(input.file.name)}_desbloqueado.pdf`, blob: res.blob }] };
        })
      }
    />
  );
}
