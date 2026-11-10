"use client";

import { useEffect, useState } from "react";

export interface Health {
  status: "ok";
  capabilities: { ghostscript: boolean; libreoffice: boolean };
  limits: { maxUploadMb: number };
}

export type HealthState =
  | { state: "loading" }
  | { state: "ok"; data: Health }
  | { state: "error" };

let cache: { at: number; promise: Promise<Health> } | null = null;

export function fetchHealth(force = false): Promise<Health> {
  if (!force && cache && Date.now() - cache.at < 60_000) return cache.promise;
  const promise = fetch("/api/health", { cache: "no-store" }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<Health>;
  });
  cache = { at: Date.now(), promise };
  promise.catch(() => {
    cache = null;
  });
  return promise;
}

/** Consulta o estado e as capacidades do servidor (com cache de 60 s). */
export function useHealth(): HealthState & { retry: () => void } {
  const [st, setSt] = useState<HealthState>({ state: "loading" });
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let alive = true;
    fetchHealth(nonce > 0)
      .then((data) => alive && setSt({ state: "ok", data }))
      .catch(() => alive && setSt({ state: "error" }));
    return () => {
      alive = false;
    };
  }, [nonce]);
  return {
    ...st,
    retry: () => {
      setSt({ state: "loading" });
      setNonce((n) => n + 1);
    },
  };
}
