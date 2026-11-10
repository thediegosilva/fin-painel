"use client";

import { useCallback, useState } from "react";
import { LOCAL_MAX_MB } from "@/lib/client/files";
import { toUserMessage } from "@/lib/pdf/errors";
import { formatBytes } from "@/lib/format";

export interface CollectionItem<T> {
  id: string;
  file: File;
  data: T;
}

let counter = 0;

/**
 * Lista de arquivos com validação individual: arquivos inválidos são
 * rejeitados com mensagem própria, sem bloquear os válidos.
 */
export function useFileCollection<T>(load: (file: File) => Promise<T>, opts: { maxMb?: number; maxFiles?: number } = {}) {
  const maxMb = opts.maxMb ?? LOCAL_MAX_MB;
  const maxFiles = opts.maxFiles ?? 100;
  const [items, setItems] = useState<CollectionItem<T>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const add = useCallback(
    async (files: File[]) => {
      setLoading(true);
      const errs: string[] = [];
      const added: CollectionItem<T>[] = [];
      const room = maxFiles - items.length;
      if (files.length > room) errs.push(`Limite de ${maxFiles} arquivos: ${files.length - Math.max(0, room)} foram ignorados.`);
      for (const file of files.slice(0, Math.max(0, room))) {
        if (file.size > maxMb * 1024 * 1024) {
          errs.push(`“${file.name}” tem ${formatBytes(file.size)} e excede o limite de ${maxMb} MB.`);
          continue;
        }
        try {
          added.push({ id: `f${++counter}`, file, data: await load(file) });
        } catch (e) {
          errs.push(`“${file.name}”: ${toUserMessage(e)}`);
        }
      }
      setItems((prev) => [...prev, ...added]);
      setErrors(errs);
      setLoading(false);
    },
    [items.length, load, maxFiles, maxMb],
  );

  return {
    items,
    setItems,
    errors,
    loading,
    add,
    remove: (id: string) => setItems((prev) => prev.filter((i) => i.id !== id)),
    clear: () => {
      setItems([]);
      setErrors([]);
    },
    dismissErrors: () => setErrors([]),
  };
}
