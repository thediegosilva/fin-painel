"use client";

import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ActionProps {
  actionLabel: string;
  onAction: () => void;
  disabledReason?: string | null;
  busy: boolean;
  progress: { value: number | null; label?: string } | null;
  onCancel?: () => void;
  idSuffix: string;
}

function ActionBlock({ actionLabel, onAction, disabledReason, busy, progress, onCancel, idSuffix }: ActionProps) {
  const reasonId = `acao-motivo-${idSuffix}`;
  return (
    <div className="space-y-2">
      <Button
        size="lg"
        className="w-full"
        onClick={onAction}
        loading={busy}
        disabled={!!disabledReason}
        aria-describedby={disabledReason ? reasonId : undefined}
      >
        {busy ? progress?.label ?? "Processando…" : actionLabel}
      </Button>
      {disabledReason && !busy && (
        <p id={reasonId} className="text-center text-xs text-muted">
          {disabledReason}
        </p>
      )}
      {busy && (
        <div className="space-y-2" role="status" aria-live="polite">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-surface-3">
            {progress?.value != null ? (
              <div className="h-full rounded-full bg-brand transition-[width] duration-200" style={{ width: `${Math.round(progress.value * 100)}%` }} />
            ) : (
              <div className="absolute inset-y-0 w-2/5 rounded-full bg-brand animate-indeterminate" />
            )}
          </div>
          {onCancel && (
            <button type="button" onClick={onCancel} className="w-full text-center text-xs font-medium text-muted hover:text-text">
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Layout padrão de configuração: conteúdo principal + painel de opções.
 * Em telas pequenas, a ação principal fica numa barra fixa no rodapé, sempre
 * ao alcance — mesmo com dezenas de miniaturas na tela.
 */
export function Workspace({
  main,
  options,
  error,
  ...action
}: {
  main: ReactNode;
  options?: ReactNode;
  actionLabel: string;
  onAction: () => void;
  /** Quando definido, desabilita a ação e explica o motivo. */
  disabledReason?: string | null;
  busy: boolean;
  progress: { value: number | null; label?: string } | null;
  error: string | null;
  onCancel?: () => void;
}) {
  const desktop = useMediaQuery("(min-width: 1024px)", true);
  return (
    <div className="grid gap-6 pb-40 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:pb-0">
      <div className="min-w-0 space-y-4">{main}</div>
      <aside className="space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-sm lg:sticky lg:top-20" aria-label="Opções">
        {options && <div className="space-y-5">{options}</div>}
        {desktop && error && <Alert tone="danger">{error}</Alert>}
        {desktop && <ActionBlock {...action} idSuffix="lateral" />}
      </aside>
      {!desktop && (
        <div className="fixed inset-x-0 bottom-0 z-30 space-y-2 border-t border-border bg-[color-mix(in_srgb,var(--surface)_94%,transparent)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg backdrop-blur-md">
          {error && <Alert tone="danger" className="max-h-28 overflow-y-auto">{error}</Alert>}
          <ActionBlock {...action} idSuffix="rodape" />
        </div>
      )}
    </div>
  );
}

export function OptionGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-subtle">{title}</h2>
      {children}
    </section>
  );
}
