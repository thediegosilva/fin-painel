import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Badge({
  children,
  tone = "neutral",
  className,
  title,
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "warning" | "info";
  className?: string;
  title?: string;
}) {
  const tones = {
    neutral: "bg-surface-2 text-muted",
    brand: "bg-brand-soft text-brand",
    warning: "bg-warning-soft text-warning",
    info: "bg-info-soft text-info",
  };
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
