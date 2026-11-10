"use client";

import { GripVertical } from "lucide-react";
import type { DragHandleProps } from "./sortable";

export function DragHandle({ handle, label }: { handle: DragHandleProps; label: string }) {
  return <HandleButton setActivator={handle.setActivator} attributes={handle.attributes} listeners={handle.listeners} label={label} />;
}

function HandleButton({
  setActivator,
  attributes,
  listeners,
  label,
}: DragHandleProps & { label: string }) {
  return (
    <button
      type="button"
      ref={setActivator}
      {...attributes}
      {...listeners}
      aria-label={label}
      className="inline-flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-subtle hover:bg-surface-2 hover:text-text active:cursor-grabbing"
    >
      <GripVertical className="size-4" aria-hidden />
    </button>
  );
}
