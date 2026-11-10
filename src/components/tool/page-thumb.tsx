"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { memo, useEffect, useRef, useState } from "react";
import { canvasToBlob, renderPage } from "@/lib/client/pdfjs";
import { cn } from "@/lib/cn";

// Cache de miniaturas por documento e fila com concorrência limitada.
const cache = new WeakMap<PDFDocumentProxy, Map<string, string>>();
let running = 0;
const waiting: Array<() => void> = [];
const MAX_PARALLEL = 3;

async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (running >= MAX_PARALLEL) await new Promise<void>((r) => waiting.push(r));
  else running++;
  try {
    return await fn();
  } finally {
    const next = waiting.shift();
    if (next) next();
    else running--;
  }
}

async function getThumb(doc: PDFDocumentProxy, pageNumber: number, width: number): Promise<string> {
  let map = cache.get(doc);
  if (!map) {
    map = new Map();
    cache.set(doc, map);
  }
  const key = `${pageNumber}@${width}`;
  const hit = map.get(key);
  if (hit) return hit;
  const url = await slot(async () => {
    const page = await doc.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    const canvas = await renderPage(page, { scale: width / base.width });
    page.cleanup();
    return URL.createObjectURL(await canvasToBlob(canvas, "image/jpeg", 0.85));
  });
  map.set(key, url);
  return url;
}

/** Miniatura de uma página, renderizada apenas quando visível. */
export const PageThumb = memo(function PageThumb({
  doc,
  pageNumber,
  rotation = 0,
  className,
  width = 240,
}: {
  doc: PDFDocumentProxy | null;
  pageNumber: number;
  rotation?: number;
  className?: string;
  width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState<{ doc: PDFDocumentProxy; url: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const src = rendered && rendered.doc === doc ? rendered.url : null;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !doc) return;
    let alive = true;
    getThumb(doc, pageNumber, width)
      .then((url) => alive && setRendered({ doc, url }))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [visible, doc, pageNumber, width]);

  return (
    <div ref={ref} className={cn("relative flex aspect-[3/4] items-center justify-center overflow-hidden", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Página ${pageNumber}`}
          draggable={false}
          className="max-h-full max-w-full bg-white shadow-sm ring-1 ring-black/10 transition-transform duration-300"
          style={{ transform: rotation ? `rotate(${rotation}deg)${Math.abs(rotation) % 180 === 90 ? " scale(0.74)" : ""}` : undefined }}
        />
      ) : failed ? (
        <span className="text-xs text-subtle">Prévia indisponível</span>
      ) : (
        <span className="h-[85%] w-[70%] animate-pulse rounded bg-surface-3" aria-hidden />
      )}
    </div>
  );
});
