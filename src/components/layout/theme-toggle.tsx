"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

const getTheme = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => DEFAULT_THEME);
  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("fp-theme", next);
        } catch {
          /* armazenamento indisponível: o tema vale apenas para esta sessão */
        }
      }}
      className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-text"
      aria-label={next === "dark" ? "Ativar tema escuro" : "Ativar tema claro"}
      title={next === "dark" ? "Tema escuro" : "Tema claro"}
    >
      {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}

/** Script inline executado antes da pintura para evitar "flash" de tema. */
/** Tema padrão do site: escuro. O claro só é usado se a pessoa escolher pelo botão. */
export const DEFAULT_THEME: Theme = "dark";

export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('fp-theme');if(t!=='light'&&t!=='dark'){t='dark'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}})();`;
