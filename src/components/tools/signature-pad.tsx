"use client";

import { Eraser } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input, Segmented } from "@/components/ui/form";
import { cn } from "@/lib/cn";

export interface SignatureImage {
  png: Uint8Array;
  url: string;
  /** largura / altura */
  aspect: number;
}

const COLORS = [
  { value: "#111827", label: "Preto" },
  { value: "#1d4ed8", label: "Azul" },
  { value: "#b91c1c", label: "Vermelho" },
];

/** Recorta as bordas transparentes do canvas e devolve um PNG. */
async function trimCanvas(src: HTMLCanvasElement): Promise<SignatureImage | null> {
  const ctx = src.getContext("2d");
  if (!ctx) return null;
  const { width, height } = src;
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  const pad = 6;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const out = document.createElement("canvas");
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  out.getContext("2d")!.drawImage(src, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  const blob = await new Promise<Blob | null>((r) => out.toBlob(r, "image/png"));
  if (!blob) return null;
  return { png: new Uint8Array(await blob.arrayBuffer()), url: URL.createObjectURL(blob), aspect: out.width / out.height };
}

function signatureFontFamily(): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-signature-family").trim();
  return v || "cursive";
}

export function SignaturePad({ onChange }: { onChange: (sig: SignatureImage | null) => void }) {
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [color, setColor] = useState(COLORS[0].value);
  const [typed, setTyped] = useState("");
  const [hasInk, setHasInk] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<{ x: number; y: number } | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Prepara o canvas em alta resolução.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || mode !== "draw") return;
    const ratio = Math.min(3, window.devicePixelRatio || 1);
    const rect = c.getBoundingClientRect();
    c.width = Math.round(rect.width * ratio);
    c.height = Math.round(rect.height * ratio);
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setHasInk(false);
    onChangeRef.current(null);
  }, [mode]);

  // Assinatura digitada → renderiza em canvas.
  useEffect(() => {
    if (mode !== "type") return;
    let alive = true;
    const text = typed.trim();
    if (!text) {
      onChangeRef.current(null);
      return;
    }
    (async () => {
      const family = signatureFontFamily();
      const font = `700 96px ${family}`;
      try {
        await document.fonts.load(font, text);
      } catch {
        /* usa a fonte de fallback */
      }
      const c = document.createElement("canvas");
      const ctx = c.getContext("2d")!;
      ctx.font = font;
      const w = Math.ceil(ctx.measureText(text).width) + 40;
      c.width = Math.min(4000, w);
      c.height = 160;
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textBaseline = "middle";
      ctx.fillText(text, 20, 84);
      const sig = await trimCanvas(c);
      if (alive) onChangeRef.current(sig);
    })();
    return () => {
      alive = false;
    };
  }, [mode, typed, color]);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  async function finishStroke() {
    drawing.current = null;
    if (canvasRef.current) onChangeRef.current(await trimCanvas(canvasRef.current));
  }

  function clear() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.restore();
    setHasInk(false);
    onChangeRef.current(null);
  }

  return (
    <div className="space-y-3">
      <Segmented
        label="Assinatura"
        value={mode}
        onChange={setMode}
        options={[
          { value: "draw", label: "Desenhar" },
          { value: "type", label: "Digitar" },
        ]}
      />
      <div className="flex items-center gap-2" role="radiogroup" aria-label="Cor da assinatura">
        {COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            role="radio"
            aria-checked={color === c.value}
            aria-label={c.label}
            onClick={() => setColor(c.value)}
            className={cn("size-7 rounded-full ring-offset-2 ring-offset-surface transition", color === c.value && "ring-2 ring-brand")}
            style={{ background: c.value }}
          />
        ))}
      </div>
      {mode === "draw" ? (
        <div className="space-y-1.5">
          <div className="relative overflow-hidden rounded-xl border border-border-strong bg-white">
            <canvas
              ref={canvasRef}
              className="block h-36 w-full cursor-crosshair touch-none"
              aria-label="Área para desenhar a assinatura"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                const p = point(e);
                drawing.current = p;
                const ctx = e.currentTarget.getContext("2d")!;
                ctx.strokeStyle = color;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
                ctx.fill();
                setHasInk(true);
              }}
              onPointerMove={(e) => {
                if (!drawing.current) return;
                const p = point(e);
                const ctx = e.currentTarget.getContext("2d")!;
                ctx.lineWidth = e.pointerType === "pen" ? 1.5 + e.pressure * 2.5 : 2.6;
                ctx.beginPath();
                ctx.moveTo(drawing.current.x, drawing.current.y);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
                drawing.current = p;
              }}
              onPointerUp={finishStroke}
              onPointerCancel={finishStroke}
            />
            {!hasInk && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                Desenhe sua assinatura aqui
              </span>
            )}
            <span className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-dashed border-gray-300" aria-hidden />
          </div>
          <button type="button" onClick={clear} disabled={!hasInk} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-text disabled:opacity-40">
            <Eraser className="size-3.5" aria-hidden /> Limpar
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Digite seu nome" maxLength={60} aria-label="Nome para assinatura" />
          <div className="flex h-24 items-center justify-center overflow-hidden rounded-xl border border-border-strong bg-white px-4">
            <span className="truncate font-signature text-5xl font-bold" style={{ color }}>
              {typed || <span className="text-2xl font-normal text-gray-400">Prévia</span>}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
