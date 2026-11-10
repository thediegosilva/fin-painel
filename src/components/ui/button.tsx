import Link from "next/link";
import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap select-none transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-on-brand shadow-sm hover:bg-brand-hover",
  secondary: "bg-surface-2 text-text hover:bg-surface-3",
  outline: "border border-border-strong bg-surface text-text hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-text",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, icon, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : (
        icon
      )}
      {children}
    </button>
  );
});

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
}

export function LinkButton({ variant = "primary", size = "md", className, ...rest }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
