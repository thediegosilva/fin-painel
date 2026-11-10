"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback para navegadores/contextos sem a Clipboard API (ex.: HTTP sem TLS).
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function CopyButton({ text, label, className }: { text: string; label: string; className?: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  return (
    <>
      <button
        type="button"
        onClick={async () => {
          setState((await copyText(text)) ? "ok" : "fail");
          setTimeout(() => setState("idle"), 2500);
        }}
        className={cn(
          "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold shadow-sm transition-colors",
          state === "ok" ? "bg-success text-white" : "bg-brand text-on-brand hover:bg-brand-hover",
          className,
        )}
      >
        {state === "ok" ? <Check className="size-5" aria-hidden /> : <Copy className="size-5" aria-hidden />}
        {state === "ok" ? "Copiado!" : label}
      </button>
      <p role="status" aria-live="polite" className="sr-only">
        {state === "ok" ? "Código copiado para a área de transferência." : state === "fail" ? "Não foi possível copiar." : ""}
      </p>
      {state === "fail" && <p className="mt-2 text-center text-xs text-danger">Não foi possível copiar automaticamente. Selecione o código abaixo e copie manualmente.</p>}
    </>
  );
}
