"use client";

import { useState } from "react";
import { ServerGate } from "@/components/tool/server-gate";
import { SinglePdfTool, type Runner } from "@/components/tool/single-pdf-tool";
import type { ToolProps } from "@/components/tool/tool-client";
import { Workspace } from "@/components/tool/workspace";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/form";
import type { PdfInput } from "@/hooks/use-pdf-input";
import { baseName } from "@/lib/format";
import { PASSWORD_PATTERN, PasswordInput } from "./password-input";
import { uploadForProcessing } from "./server-upload";

export default function ProtectTool({ tool }: ToolProps) {
  return (
    <ServerGate tool={tool}>
      {(health) => (
        <SinglePdfTool tool={tool} maxMb={health.limits.maxUploadMb} resultTitle="PDF protegido" summary={() => "O arquivo agora exige a senha definida para ser aberto. Guarde-a em local seguro: ela não pode ser recuperada."}>
          {(input, runner) => <Editor input={input} runner={runner} actionLabel={tool.actionLabel} />}
        </SinglePdfTool>
      )}
    </ServerGate>
  );
}

function validate(pw: string, confirm: string): string | null {
  if (!pw) return "Defina uma senha.";
  if (pw.length < 4) return "A senha deve ter pelo menos 4 caracteres.";
  if (pw.length > 64) return "A senha deve ter no máximo 64 caracteres.";
  if (!PASSWORD_PATTERN.test(pw)) return "Use apenas letras sem acento, números, espaços e símbolos comuns.";
  if (pw !== confirm) return "As senhas não coincidem.";
  return null;
}

function Editor({ input, runner, actionLabel }: { input: PdfInput; runner: Runner; actionLabel: string }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const problem = validate(pw, confirm);

  return (
    <Workspace
      main={
        <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <Field label="Senha" hint="De 4 a 64 caracteres. Sem acentos, para funcionar em qualquer leitor de PDF.">
            {(p) => <PasswordInput {...p} value={pw} autoComplete="new-password" onChange={(e) => setPw(e.target.value)} onBlur={() => setTouched(true)} />}
          </Field>
          <Field label="Confirme a senha" error={touched && confirm && pw !== confirm ? "As senhas não coincidem." : undefined}>
            {(p) => <PasswordInput {...p} value={confirm} autoComplete="new-password" onChange={(e) => setConfirm(e.target.value)} onBlur={() => setTouched(true)} />}
          </Field>
        </div>
      }
      options={
        <Alert tone="info">
          Criptografia padrão PDF (RC4 128 bits), compatível com todos os leitores. A senha trafega por conexão segura
          (HTTPS em produção) e não é armazenada.
        </Alert>
      }
      actionLabel={actionLabel}
      disabledReason={problem}
      busy={runner.busy}
      progress={runner.progress}
      error={runner.error}
      onCancel={runner.cancel}
      onAction={() =>
        runner.run(async (ctx) => {
          const res = await uploadForProcessing("/api/pdf/protect", input.file, { password: pw }, ctx);
          return { files: [{ name: `${baseName(input.file.name)}_protegido.pdf`, blob: res.blob }] };
        })
      }
    />
  );
}
