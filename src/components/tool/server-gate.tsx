"use client";

import { ServerOff } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useHealth, type Health } from "@/hooks/use-health";
import type { ToolDefinition } from "@/lib/tools";

const SOFTWARE: Record<string, string> = { ghostscript: "Ghostscript", libreoffice: "LibreOffice" };

/** Só exibe a ferramenta se o servidor tiver o software necessário. */
export function ServerGate({ tool, children }: { tool: ToolDefinition; children: (health: Health) => ReactNode }) {
  const health = useHealth();

  if (health.state === "loading") {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-3xl border-2 border-dashed border-border-strong bg-surface" role="status">
        <span className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden />
        <span className="sr-only">Verificando disponibilidade do servidor…</span>
      </div>
    );
  }
  if (health.state === "error") {
    return (
      <Alert tone="danger" title="Não foi possível contatar o servidor" action={<Button variant="outline" size="sm" onClick={health.retry}>Tentar novamente</Button>}>
        Esta ferramenta precisa do servidor do FIN-Painel. Verifique sua conexão.
      </Alert>
    );
  }
  if (tool.capability && !health.data.capabilities[tool.capability]) {
    return (
      <div className="rounded-3xl border border-border bg-surface px-6 py-12 text-center shadow-sm">
        <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-warning-soft text-warning">
          <ServerOff className="size-7" aria-hidden />
        </span>
        <h2 className="mt-4 text-xl font-semibold">Ferramenta indisponível neste servidor</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
          {tool.name} depende do {SOFTWARE[tool.capability]}, que não está instalado nesta instalação do FIN-Painel. O
          administrador pode habilitá-la instalando o software (veja a documentação de deploy).
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/status" className="text-sm font-medium text-brand hover:underline">
            Ver status do serviço
          </Link>
        </div>
      </div>
    );
  }
  return <>{children(health.data)}</>;
}
