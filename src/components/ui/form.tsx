"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export const inputClass =
  "h-10 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-text placeholder:text-subtle shadow-sm transition-colors focus:border-brand focus:outline-none focus:ring-3 focus:ring-[var(--brand-ring)] disabled:opacity-60 aria-[invalid=true]:border-danger";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-text">
        {label}
      </label>
      {children({ id, "aria-describedby": hint || error ? hintId : undefined, "aria-invalid": error ? true : undefined })}
      {(error || hint) && (
        <p id={hintId} className={cn("text-xs", error ? "text-danger" : "text-muted")}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={cn(inputClass, className)} {...rest} />;
}

export function Select({ className, children, ...rest }: ComponentProps<"select">) {
  return (
    <select className={cn(inputClass, "appearance-auto pr-8", className)} {...rest}>
      {children}
    </select>
  );
}

/** Grupo de opções exclusivas com aparência de botões segmentados (radio acessível). */
export function Segmented<T extends string | number>({
  label,
  value,
  onChange,
  options,
  columns,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; description?: ReactNode }[];
  columns?: number;
}) {
  const name = useId();
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1.5 text-sm font-medium text-text">{label}</legend>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o) => {
          const checked = o.value === value;
          return (
            <label
              key={String(o.value)}
              className={cn(
                "relative flex cursor-pointer flex-col justify-center rounded-lg border px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-[var(--brand-ring)]",
                checked
                  ? "border-brand bg-brand-soft font-medium text-text"
                  : "border-border-strong bg-surface text-muted hover:border-subtle hover:text-text",
                o.description ? "items-start text-left" : "items-center text-center",
              )}
            >
              <input
                type="radio"
                name={name}
                className="sr-only"
                checked={checked}
                onChange={() => onChange(o.value)}
              />
              <span>{o.label}</span>
              {o.description && <span className="mt-0.5 text-xs font-normal text-muted">{o.description}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
  description,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 rounded"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="font-medium text-text">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
}

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <label htmlFor={id} className="font-medium text-text">
          {label}
        </label>
        <output htmlFor={id} className="tabular-nums text-muted">
          {format ? format(value) : value}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
