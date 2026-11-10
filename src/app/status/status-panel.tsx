"use client";

import { CircleCheck, CircleX, Laptop, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useHealth } from "@/hooks/use-health";
import { TOOLS } from "@/lib/tools";

export function StatusPanel() {
  const health = useHealth();

  if (health.state === "loading") {
    return <p className="mt-10 text-sm text-muted" role="status">Consultando o servidor…</p>;
  }
  if (health.state === "error") {
    return (
      <Alert tone="danger" className="mt-10" title="Servidor inacessível" action={<Button size="sm" variant="outline" onClick={health.retry}>Tentar novamente</Button>}>
        Não foi possível obter o status. As ferramentas que rodam no navegador continuam funcionando.
      </Alert>
    );
  }
  const caps = health.data.capabilities;
  return (
    <div className="mt-10 space-y-6">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="size-2.5 rounded-full bg-success shadow-[0_0_0_4px_var(--success-soft)]" aria-hidden />
          <div>
            <p className="font-medium">Servidor operacional</p>
            <p className="text-sm text-muted">Limite de upload: {health.data.limits.maxUploadMb} MB por arquivo</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" icon={<RefreshCw className="size-4" />} onClick={health.retry}>
          Atualizar
        </Button>
      </div>
      <ul className="divide-y divide-border rounded-2xl border border-border bg-surface shadow-sm">
        {TOOLS.map((t) => {
          const ok = t.mode === "local" || (t.capability ? caps[t.capability] : true);
          return (
            <li key={t.slug} className="flex items-center gap-3 px-5 py-3">
              {t.mode === "local" ? (
                <Laptop className="size-4 text-brand" aria-hidden />
              ) : ok ? (
                <CircleCheck className="size-4 text-success" aria-hidden />
              ) : (
                <CircleX className="size-4 text-danger" aria-hidden />
              )}
              <Link href={`/${t.slug}`} className="flex-1 text-sm font-medium hover:underline">
                {t.name}
              </Link>
              <span className="text-xs text-muted">
                {t.mode === "local" ? "No navegador" : ok ? "Disponível" : `Indisponível (${t.capability === "ghostscript" ? "Ghostscript" : "LibreOffice"} ausente)`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
