"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface DragHandleProps {
  setActivator: (el: HTMLElement | null) => void;
  attributes: Record<string, unknown>;
  listeners: Record<string, unknown> | undefined;
}

function Item({ id, children }: { id: string; children: (h: DragHandleProps, dragging: boolean) => ReactNode }) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10")}
    >
      {children(
        { setActivator: setActivatorNodeRef, attributes: attributes as unknown as Record<string, unknown>, listeners },
        isDragging,
      )}
    </li>
  );
}

/** Lista ordenável por mouse, toque (pressionar e arrastar) e teclado (espaço + setas). */
export function SortableGrid<T>({
  items,
  getId,
  onReorder,
  children,
  className,
}: {
  items: T[];
  getId: (item: T) => string;
  onReorder: (items: T[]) => void;
  children: (item: T, index: number, handle: DragHandleProps, dragging: boolean) => ReactNode;
  className?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map(getId);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(items, from, to));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        screenReaderInstructions: {
          draggable: "Para reordenar, pressione espaço, use as setas para mover e espaço novamente para soltar. Esc cancela.",
        },
        announcements: {
          onDragStart: ({ active }) => `Item ${ids.indexOf(String(active.id)) + 1} selecionado.`,
          onDragOver: ({ over }) => (over ? `Sobre a posição ${ids.indexOf(String(over.id)) + 1}.` : "Fora da lista."),
          onDragEnd: ({ over }) => (over ? `Item movido para a posição ${ids.indexOf(String(over.id)) + 1}.` : "Movimento cancelado."),
          onDragCancel: () => "Movimento cancelado.",
        },
      }}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <ul className={className}>
          {items.map((item, i) => (
            <Item key={getId(item)} id={getId(item)}>
              {(handle, dragging) => children(item, i, handle, dragging)}
            </Item>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
