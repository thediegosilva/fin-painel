"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { inputClass } from "@/components/ui/form";
import { cn } from "@/lib/cn";

export function PasswordInput({ className, ...rest }: Omit<ComponentProps<"input">, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? "text" : "password"} className={cn(inputClass, "pr-10", className)} {...rest} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-1 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-subtle hover:text-text"
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export const PASSWORD_PATTERN = /^[\x20-\x7E]*$/;
