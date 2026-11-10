"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { useEffect, useState } from "react";
import { closePdf, openPdf } from "@/lib/client/pdfjs";

/** Abre um documento no pdf.js para gerar miniaturas; destrói ao desmontar. */
export function usePdfjsDoc(bytes: Uint8Array | null | undefined) {
  const [state, setState] = useState<{ doc: PDFDocumentProxy | null; error: boolean; for: Uint8Array | null }>({
    doc: null,
    error: false,
    for: null,
  });

  useEffect(() => {
    if (!bytes) return;
    let alive = true;
    let loaded: PDFDocumentProxy | null = null;
    openPdf(bytes)
      .then((doc) => {
        loaded = doc;
        if (alive) setState({ doc, error: false, for: bytes });
        else void closePdf(doc);
      })
      .catch(() => alive && setState({ doc: null, error: true, for: bytes }));
    return () => {
      alive = false;
      if (loaded) void closePdf(loaded);
    };
  }, [bytes]);

  const current = state.for === bytes;
  return { doc: current ? state.doc : null, error: current && state.error };
}
