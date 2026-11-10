"use client";

import { ChevronDown, Heart, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ToolIcon } from "@/components/ui/tool-icon";
import { cn } from "@/lib/cn";
import { CATEGORIES, TOOLS } from "@/lib/tools";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/#ferramentas", label: "Todas as ferramentas" },
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/privacidade", label: "Privacidade" },
];

/** Atalhos para as ferramentas mais usadas, sempre visíveis na barra superior. */
const QUICK = [
  { href: "/pdf-para-jpg", label: "PDF para JPG" },
  { href: "/jpg-para-pdf", label: "JPG para PDF" },
];

function ToolsMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
      {CATEGORIES.map((cat) => (
        <div key={cat.id}>
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-subtle">{cat.name}</p>
          <ul className="space-y-0.5">
            {TOOLS.filter((t) => t.category === cat.id).map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/${t.slug}`}
                  onClick={onNavigate}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-text transition-colors hover:bg-surface-2"
                >
                  <ToolIcon icon={t.icon} category={t.category} size="sm" />
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function Header() {
  const [menu, setMenu] = useState<"none" | "tools" | "mobile">("none");
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Fecha menus ao navegar.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenu("none");
  }

  useEffect(() => {
    if (menu === "none") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu("none");
        triggerRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menu === "tools" && !panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setMenu("none");
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    if (menu === "mobile") document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
      document.body.style.overflow = "";
    };
  }, [menu]);

  const close = () => setMenu("none");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Principal" className="ml-6 hidden items-center gap-1 md:flex">
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={menu === "tools"}
            aria-controls="menu-ferramentas"
            onClick={() => setMenu(menu === "tools" ? "none" : "tools")}
            className={cn(
              "inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-surface-2",
              menu === "tools" ? "bg-surface-2 text-text" : "text-muted hover:text-text",
            )}
          >
            Ferramentas
            <ChevronDown className={cn("size-4 transition-transform", menu === "tools" && "rotate-180")} aria-hidden />
          </button>
          {[...QUICK, ...NAV.slice(1)].map((n, i) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname === n.href ? "page" : undefined}
              className={cn(
                "h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors hover:bg-surface-2 hover:text-text",
                // Em telas médias, só os atalhos cabem; os demais aparecem a partir de lg.
                i < QUICK.length ? "inline-flex" : "hidden lg:inline-flex",
                pathname === n.href ? "bg-surface-2 text-text" : "text-muted",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/apoiar"
            className="mr-1 hidden h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-text transition-colors hover:border-[var(--cat-seguranca)] hover:text-[var(--cat-seguranca)] sm:inline-flex"
          >
            <Heart className="size-4 text-[var(--cat-seguranca)]" aria-hidden />
            Apoiar
          </Link>
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-text md:hidden"
            aria-label={menu === "mobile" ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menu === "mobile"}
            aria-controls="menu-mobile"
            onClick={() => setMenu(menu === "mobile" ? "none" : "mobile")}
          >
            {menu === "mobile" ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menu === "tools" && (
        <div
          id="menu-ferramentas"
          ref={panelRef}
          className="absolute inset-x-0 top-16 hidden border-b border-border bg-surface shadow-lg animate-fade-in md:block"
        >
          <div className="mx-auto max-w-7xl px-6 py-6">
            <ToolsMenu onNavigate={close} />
          </div>
        </div>
      )}

      {menu === "mobile" && (
        <div
          id="menu-mobile"
          className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto border-t border-border bg-surface px-4 pb-10 pt-4 animate-fade-in md:hidden"
        >
          <div className="mb-4 grid grid-cols-2 gap-2">
            {QUICK.map((n) => (
              <Link key={n.href} href={n.href} onClick={close} className="rounded-xl bg-brand-soft px-3 py-3 text-center text-sm font-semibold text-brand">
                {n.label}
              </Link>
            ))}
          </div>
          <nav aria-label="Menu móvel" className="mb-6 grid gap-1">
            {[...NAV, { href: "/apoiar", label: "Apoie o projeto ❤" }].map((n) => (
              <Link key={n.href} href={n.href} onClick={close} className="rounded-lg px-2 py-2.5 text-base font-medium hover:bg-surface-2">
                {n.label}
              </Link>
            ))}
          </nav>
          <ToolsMenu onNavigate={close} />
        </div>
      )}
    </header>
  );
}
