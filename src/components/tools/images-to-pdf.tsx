"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DragHandle } from "@/components/tool/drag-handle";
import { AddFilesButton, Dropzone } from "@/components/tool/dropzone";
import { LargeFileNotice } from "@/components/tool/large-file-notice";
import { ResultView } from "@/components/tool/result-view";
import { SortableGrid } from "@/components/tool/sortable";
import type { ToolProps } from "@/components/tool/tool-client";
import { OptionGroup, Workspace } from "@/components/tool/workspace";
import { Alert } from "@/components/ui/alert";
import { Segmented } from "@/components/ui/form";
import { useFileCollection } from "@/hooks/use-file-collection";
import { useRunner } from "@/hooks/use-runner";
import { pdfBlob } from "@/lib/client/download";
import { LOCAL_MAX_MB, jpegOrientation, kindMatches, readBytes, sniffFile, type SniffedKind } from "@/lib/client/files";
import { baseName, formatBytes, plural } from "@/lib/format";
import { PdfError } from "@/lib/pdf/errors";
import { pdfOps } from "@/lib/pdf/lazy";
import type { ImageInput, OrientationOption, PageSizeOption } from "@/lib/pdf/ops";

interface ImageData {
  kind: SniffedKind;
  url: string;
}

async function loadImage(file: File): Promise<ImageData> {
  const kind = await sniffFile(file);
  if (!kindMatches("image", kind)) throw new PdfError("invalid-image", "formato de imagem não suportado.");
  return { kind, url: URL.createObjectURL(file) };
}

/** Re-codifica a imagem via canvas (aplica orientação EXIF e converte formatos não suportados pelo PDF). */
async function reencode(file: File, type: "image/png" | "image/jpeg"): Promise<Uint8Array> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new PdfError("invalid-image", `Não foi possível ler a imagem “${file.name}”.`);
  }
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  if (type === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.92));
  canvas.width = canvas.height = 0;
  if (!blob) throw new PdfError("invalid-image", `Não foi possível converter “${file.name}”.`);
  return readBytes(blob);
}

async function prepare(file: File, kind: SniffedKind): Promise<ImageInput> {
  if (kind === "jpg") {
    const bytes = await readBytes(file);
    if (jpegOrientation(bytes) === 1) return { bytes, kind: "jpg" };
    return { bytes: await reencode(file, "image/jpeg"), kind: "jpg" };
  }
  if (kind === "png") return { bytes: await readBytes(file), kind: "png" };
  return { bytes: await reencode(file, "image/png"), kind: "png" };
}

export default function ImagesToPdfTool({ tool }: ToolProps) {
  const files = useFileCollection(loadImage, { maxFiles: 300 });
  const runner = useRunner();
  const [pageSize, setPageSize] = useState<PageSizeOption>("a4");
  const [orientation, setOrientation] = useState<OrientationOption>("auto");
  const [margin, setMargin] = useState(20);

  // Libera as URLs de prévia de itens removidos. (Não revogamos no unmount: com
  // Cache Components a rota fica oculta via <Activity> e pode voltar a ser exibida.)
  const urls = useRef(new Set<string>());
  useEffect(() => {
    const current = new Set(files.items.map((i) => i.data.url));
    for (const u of urls.current) if (!current.has(u)) URL.revokeObjectURL(u);
    urls.current = current;
  }, [files.items]);

  const restart = () => {
    runner.reset();
    files.clear();
  };

  if (runner.result) {
    return (
      <ResultView
        tool={tool}
        files={runner.result.files}
        summary={`PDF criado com ${plural(files.items.length, "página", "páginas")}.`}
        onRestart={restart}
        onBack={runner.clearResult}
      />
    );
  }

  if (files.items.length === 0) {
    return (
      <Dropzone accept="image" multiple maxMb={LOCAL_MAX_MB} loading={files.loading} error={files.errors.join(" ") || null} onFiles={files.add} title="Selecionar imagens" />
    );
  }

  return (
    <Workspace
      main={
        <div className="rounded-2xl border border-border bg-surface shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
            <p className="mr-auto text-sm font-medium">{plural(files.items.length, "imagem", "imagens")}</p>
            <AddFilesButton accept="image" onFiles={files.add} label="Adicionar imagens" />
          </div>
          <div className="px-4 pt-4 empty:hidden">
            <LargeFileNotice bytes={files.items.reduce((sum, i) => sum + i.file.size, 0)} />
          </div>
          {files.errors.length > 0 && (
            <div className="px-4 pt-4">
              <Alert tone="danger" title="Algumas imagens não foram adicionadas">
                <ul className="list-disc pl-4">
                  {files.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </Alert>
            </div>
          )}
          <SortableGrid items={files.items} getId={(i) => i.id} onReorder={files.setItems} className="grid grid-cols-2 gap-3 p-4 min-[480px]:grid-cols-3 md:grid-cols-4">
            {(item, index, handle, dragging) => (
              <div className={`rounded-xl border bg-surface-2 p-2 ${dragging ? "border-brand shadow-lg" : "border-transparent"}`}>
                <div className="mb-1 flex items-center justify-between">
                  <DragHandle handle={handle} label={`Mover ${item.file.name} (posição ${index + 1})`} />
                  <span className="text-xs font-semibold text-muted">{index + 1}</span>
                  <button type="button" onClick={() => files.remove(item.id)} className="inline-flex size-8 items-center justify-center rounded-lg text-subtle hover:bg-danger-soft hover:text-danger" aria-label={`Remover ${item.file.name}`}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.data.url} alt={item.file.name} className="max-h-full max-w-full object-contain" draggable={false} />
                </div>
                <p className="mt-2 truncate text-xs font-medium" title={item.file.name}>{item.file.name}</p>
                <p className="text-[11px] text-muted">{formatBytes(item.file.size)}</p>
              </div>
            )}
          </SortableGrid>
        </div>
      }
      options={
        <OptionGroup title="Página">
          <Segmented
            label="Tamanho"
            value={pageSize}
            onChange={setPageSize}
            options={[
              { value: "a4", label: "A4" },
              { value: "letter", label: "Carta" },
              { value: "fit", label: "Ajustar" },
            ]}
          />
          {pageSize !== "fit" && (
            <Segmented
              label="Orientação"
              value={orientation}
              onChange={setOrientation}
              options={[
                { value: "auto", label: "Auto" },
                { value: "portrait", label: "Retrato" },
                { value: "landscape", label: "Paisagem" },
              ]}
            />
          )}
          <Segmented
            label="Margem"
            value={margin}
            onChange={setMargin}
            options={[
              { value: 0, label: "Nenhuma" },
              { value: 20, label: "Pequena" },
              { value: 48, label: "Grande" },
            ]}
          />
          <p className="text-xs text-muted">“Ajustar” cria cada página do tamanho exato da imagem. Fotos com rotação EXIF são corrigidas automaticamente.</p>
        </OptionGroup>
      }
      actionLabel={tool.actionLabel}
      busy={runner.busy}
      progress={runner.progress}
      error={runner.error}
      onAction={() =>
        runner.run(async ({ setProgress }) => {
          const inputs: ImageInput[] = [];
          for (let k = 0; k < files.items.length; k++) {
            setProgress(k / files.items.length, `Preparando imagem ${k + 1} de ${files.items.length}…`);
            inputs.push(await prepare(files.items[k].file, files.items[k].data.kind));
          }
          setProgress(null, "Gerando PDF…");
          const out = await (await pdfOps()).imagesToPdf(inputs, { pageSize, orientation, margin });
          const name = files.items.length === 1 ? baseName(files.items[0].file.name) : "imagens";
          return { files: [{ name: `${name}.pdf`, blob: pdfBlob(out) }] };
        })
      }
    />
  );
}
