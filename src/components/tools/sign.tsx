"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useCallback, useEffect, useRef, useState } from "react";
import { SinglePdfTool, type Runner } from "@/components/tool/single-pdf-tool";
import type { ToolProps } from "@/components/tool/tool-client";
import { OptionGroup, Workspace } from "@/components/tool/workspace";
import { Segmented } from "@/components/ui/form";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePdfjsDoc } from "@/hooks/use-pdfjs-doc";
import type { PdfInput } from "@/hooks/use-pdf-input";
import { pdfBlob } from "@/lib/client/download";
import { renderPage } from "@/lib/client/pdfjs";
import { baseName, plural } from "@/lib/format";
import { pdfOps } from "@/lib/pdf/lazy";
import { SignaturePad, type SignatureImage } from "./signature-pad";

export default function SignTool({ tool }: ToolProps) {
  return (
    <SinglePdfTool tool={tool} resultTitle="Documento assinado" summary={(meta) => `Assinatura inserida em ${plural(Number(meta?.count), "página", "páginas")}.`}>
      {(input, runner) => <Editor input={input} runner={runner} actionLabel={tool.actionLabel} />}
    </SinglePdfTool>
  );
}

interface Box {
  nx: number;
  ny: number;
  nw: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Renderiza uma página no tamanho do contêiner e informa suas dimensões. */
function PagePreview({ doc, pageNumber, onSize }: { doc: PDFDocumentProxy | null; pageNumber: number; onSize: (w: number, h: number) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!doc) return;
    let alive = true;
    let created: string | null = null;
    (async () => {
      try {
        const page = await doc.getPage(pageNumber);
        const base = page.getViewport({ scale: 1 });
        onSize(base.width, base.height);
        const canvas = await renderPage(page, { scale: Math.min(2.5, 1100 / base.width) });
        const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
        if (!blob || !alive) return;
        created = URL.createObjectURL(blob);
        setUrl(created);
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
      if (created) URL.revokeObjectURL(created);
    };
  }, [doc, pageNumber, onSize]);

  if (failed) return <div className="flex aspect-[3/4] items-center justify-center text-sm text-muted">Não foi possível exibir a página.</div>;
  if (!url) return <div className="aspect-[3/4] w-full animate-pulse bg-surface-3" aria-hidden />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={`Página ${pageNumber}`} className="block w-full select-none" draggable={false} />;
}

function Editor({ input, runner, actionLabel }: { input: PdfInput; runner: Runner; actionLabel: string }) {
  const { doc } = usePdfjsDoc(input.bytes);
  const [sig, setSig] = useState<SignatureImage | null>(null);
  const [page, setPage] = useState(0);
  const [pageAspect, setPageAspect] = useState(1 / Math.SQRT2); // largura / altura
  const [box, setBox] = useState<Box>({ nx: 0.55, ny: 0.78, nw: 0.3 });
  const [scope, setScope] = useState<"this" | "all">("this");
  const areaRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ kind: "move" | "resize"; startX: number; startY: number; box: Box } | null>(null);

  // Libera a URL da assinatura anterior.
  const prevUrl = useRef<string | null>(null);
  const onSig = useCallback((s: SignatureImage | null) => {
    if (prevUrl.current && prevUrl.current !== s?.url) URL.revokeObjectURL(prevUrl.current);
    prevUrl.current = s?.url ?? null;
    setSig(s);
  }, []);

  const onSize = useCallback((w: number, h: number) => setPageAspect(w / h), []);

  // No desktop, mostra a assinatura recém-criada na prévia (ela nasce no rodapé da página).
  const desktop = useMediaQuery("(min-width: 1024px)");
  const boxRef = useRef<HTMLDivElement>(null);
  const hasSig = !!sig;
  useEffect(() => {
    if (hasSig && desktop) boxRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [hasSig, desktop]);

  // Altura normalizada do retângulo para a proporção atual da assinatura e da página.
  const nh = sig ? (box.nw * pageAspect) / sig.aspect : 0.08;

  const constrain = useCallback(
    (b: Box): Box => {
      const nw = clamp(b.nw, 0.05, 1);
      const h = sig ? (nw * pageAspect) / sig.aspect : 0.08;
      return { nw, nx: clamp(b.nx, 0, 1 - nw), ny: clamp(b.ny, 0, Math.max(0, 1 - h)) };
    },
    [sig, pageAspect],
  );

  function onPointerDown(e: React.PointerEvent, kind: "move" | "resize") {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { kind, startX: e.clientX, startY: e.clientY, box };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    const area = areaRef.current;
    if (!d || !area) return;
    const r = area.getBoundingClientRect();
    const dx = (e.clientX - d.startX) / r.width;
    const dy = (e.clientY - d.startY) / r.height;
    if (d.kind === "move") setBox(constrain({ ...d.box, nx: d.box.nx + dx, ny: d.box.ny + dy }));
    else setBox(constrain({ ...d.box, nw: d.box.nw + dx }));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const step = e.shiftKey ? 0.05 : 0.01;
    const map: Record<string, Partial<Box>> = {
      ArrowLeft: { nx: box.nx - step },
      ArrowRight: { nx: box.nx + step },
      ArrowUp: { ny: box.ny - step },
      ArrowDown: { ny: box.ny + step },
      "+": { nw: box.nw + step },
      "=": { nw: box.nw + step },
      "-": { nw: box.nw - step },
    };
    const change = map[e.key];
    if (change) {
      e.preventDefault();
      setBox(constrain({ ...box, ...change }));
    }
  }

  const pageCount = input.pageCount;

  return (
    <Workspace
      main={
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{sig ? "Arraste a assinatura para posicioná-la" : "Crie sua assinatura no painel ao lado"}</p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} aria-label="Página anterior" className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 disabled:opacity-30">
                <ChevronLeft className="size-4" />
              </button>
              <span className="min-w-20 text-center text-sm tabular-nums" aria-live="polite">
                {page + 1} / {pageCount}
              </span>
              <button type="button" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1} aria-label="Próxima página" className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 disabled:opacity-30">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
          <div className="rounded-lg bg-surface-2 p-2 sm:p-4">
            {/* A página inteira cabe na tela: largura limitada pela altura disponível. */}
            <div
              ref={areaRef}
              style={{ width: `min(100%, calc((100svh - 13rem) * ${pageAspect.toFixed(4)}))` }}
              className="relative mx-auto overflow-hidden bg-white shadow ring-1 ring-black/10" onPointerMove={onPointerMove} onPointerUp={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)}>
              <PagePreview doc={doc} pageNumber={page + 1} onSize={onSize} />
              {sig && (
                <div
                  ref={boxRef}
                  role="group"
                  tabIndex={0}
                  aria-label="Assinatura. Use as setas para mover e + ou - para redimensionar."
                  onKeyDown={onKeyDown}
                  onPointerDown={(e) => onPointerDown(e, "move")}
                  className="absolute cursor-move touch-none rounded-sm outline-2 outline-dashed outline-brand focus-visible:outline-solid"
                  style={{ left: `${box.nx * 100}%`, top: `${box.ny * 100}%`, width: `${box.nw * 100}%`, height: `${nh * 100}%` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sig.url} alt="" className="pointer-events-none size-full" draggable={false} />
                  <span
                    onPointerDown={(e) => onPointerDown(e, "resize")}
                    className="absolute -bottom-2 -right-2 size-4 cursor-nwse-resize touch-none rounded-full border-2 border-white bg-brand shadow"
                    aria-hidden
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      }
      options={
        <>
          <SignaturePad onChange={onSig} />
          <OptionGroup title="Aplicar em">
            <Segmented
              label="Páginas"
              value={scope}
              onChange={setScope}
              options={[
                { value: "this", label: `Página ${page + 1}` },
                { value: "all", label: "Todas" },
              ]}
            />
          </OptionGroup>
          <p className="text-xs text-muted">
            Assinatura visual (imagem). Não substitui assinatura digital com certificado ICP-Brasil.
          </p>
        </>
      }
      actionLabel={actionLabel}
      disabledReason={!sig ? "Crie sua assinatura primeiro." : null}
      busy={runner.busy}
      progress={runner.progress}
      error={runner.error}
      onAction={() =>
        runner.run(async () => {
          if (!sig) throw new Error("Sem assinatura");
          const pages = scope === "all" ? Array.from({ length: pageCount }, (_, i) => i) : [page];
          const out = await (await pdfOps()).stampImage(
            input.bytes,
            sig.png,
            pages.map((p) => ({ pageIndex: p, nx: box.nx, ny: box.ny, nw: box.nw })),
          );
          return { files: [{ name: `${baseName(input.file.name)}_assinado.pdf`, blob: pdfBlob(out) }], meta: { count: pages.length } };
        })
      }
    />
  );
}
