"use client";

import { useCallback, useRef, useState } from "react";
import { toUserMessage } from "@/lib/pdf/errors";
import { ApiClientError } from "@/lib/client/api";
import type { OutputFile } from "@/lib/client/download";

export interface RunResult {
  files: OutputFile[];
  /** Informações adicionais exibidas na tela de resultado. */
  meta?: Record<string, string | number | boolean>;
}

export interface RunContext {
  setProgress: (fraction: number | null, label?: string) => void;
  signal: AbortSignal;
}

/** Controla o ciclo processar → resultado/erro de uma ferramenta. */
export function useRunner() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [progress, setProgressState] = useState<{ value: number | null; label?: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (fn: (ctx: RunContext) => Promise<RunResult>) => {
    const ac = new AbortController();
    abortRef.current = ac;
    setBusy(true);
    setError(null);
    setProgressState({ value: null });
    // Deixa o navegador pintar o estado de "processando" antes de trabalho pesado.
    await new Promise((r) => setTimeout(r, 30));
    try {
      const res = await fn({
        setProgress: (value, label) => setProgressState({ value, label }),
        signal: ac.signal,
      });
      if (!ac.signal.aborted) setResult(res);
    } catch (e) {
      if (ac.signal.aborted) return;
      console.error(e);
      setError(e instanceof ApiClientError ? e.message : toUserMessage(e));
    } finally {
      if (abortRef.current === ac) {
        setBusy(false);
        setProgressState(null);
        abortRef.current = null;
      }
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
    setProgressState(null);
  }, []);

  const reset = useCallback(() => {
    cancel();
    setError(null);
    setResult(null);
  }, [cancel]);

  return { busy, error, result, progress, run, cancel, reset, setError, clearResult: () => setResult(null) };
}
