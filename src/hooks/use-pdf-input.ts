"use client";

import { useCallback, useState } from "react";
import { LOCAL_MAX_MB, readBytes, sniffFile } from "@/lib/client/files";
import { toUserMessage } from "@/lib/pdf/errors";
import { pdfOps } from "@/lib/pdf/lazy";
import { formatBytes } from "@/lib/format";

export interface PdfInput {
  file: File;
  bytes: Uint8Array;
  pageCount: number;
}

/**
 * Seleção de UM PDF para ferramentas locais: valida tipo, tamanho e se o
 * documento pode ser lido (inclusive se está protegido por senha).
 */
export function usePdfInput(opts: { maxMb?: number; allowEncrypted?: boolean } = {}) {
  const maxMb = opts.maxMb ?? LOCAL_MAX_MB;
  const [input, setInput] = useState<PdfInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const select = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setError(null);
      if (file.size > maxMb * 1024 * 1024) {
        setError(`O arquivo tem ${formatBytes(file.size)}. O limite é ${maxMb} MB.`);
        return;
      }
      setLoading(true);
      try {
        if ((await sniffFile(file)) !== "pdf") {
          setError(`“${file.name}” não é um PDF válido.`);
          return;
        }
        const bytes = await readBytes(file);
        let pageCount = 0;
        try {
          pageCount = await (await pdfOps()).getPageCount(bytes);
        } catch (e) {
          if (!(opts.allowEncrypted && e && typeof e === "object" && "code" in e && e.code === "encrypted")) throw e;
        }
        setInput({ file, bytes, pageCount });
      } catch (e) {
        setError(toUserMessage(e));
      } finally {
        setLoading(false);
      }
    },
    [maxMb, opts.allowEncrypted],
  );

  const reset = useCallback(() => {
    setInput(null);
    setError(null);
  }, []);

  return { input, error, loading, select, reset, setError };
}
