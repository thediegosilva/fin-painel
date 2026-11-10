import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "danger";

const tones: Record<Tone, { cls: string; Icon: typeof Info }> = {
  info: { cls: "bg-info-soft text-info", Icon: Info },
  success: { cls: "bg-success-soft text-success", Icon: CircleCheck },
  warning: { cls: "bg-warning-soft text-warning", Icon: TriangleAlert },
  danger: { cls: "bg-danger-soft text-danger", Icon: CircleAlert },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
  action,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  const { cls, Icon } = tones[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-xl px-4 py-3 text-sm animate-fade-in", cls, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn("text-text/85", title && "mt-0.5")}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}
