"use client";

import { FileText } from "lucide-react";
import { Dropzone } from "@/components/tool/dropzone";
import { LargeFileNotice } from "@/components/tool/large-file-notice";
import { ResultView } from "@/components/tool/result-view";
import { ServerGate } from "@/components/tool/server-gate";
import type { ToolProps } from "@/components/tool/tool-client";
import { Workspace } from "@/components/tool/workspace";
import { useFileCollection } from "@/hooks/use-file-collection";
import { useRunner } from "@/hooks/use-runner";
import { sniffFile } from "@/lib/client/files";
import { baseName, formatBytes } from "@/lib/format";
import { PdfError } from "@/lib/pdf/errors";
import type { ToolDefinition } from "@/lib/tools";
import { uploadForProcessing } from "./server-upload";

async function checkOffice(file: File) {
  if ((await sniffFile(file)) !== "office") {
    throw new PdfError("invalid-pdf", "formato não suportado. Envie DOC, DOCX, ODT, RTF, XLS, XLSX, ODS, PPT, PPTX ou ODP.");
  }
  return null;
}

export default function OfficeToPdfTool({ tool }: ToolProps) {
  return <ServerGate tool={tool}>{(health) => <Inner tool={tool} maxMb={health.limits.maxUploadMb} />}</ServerGate>;
}

function Inner({ tool, maxMb }: { tool: ToolDefinition; maxMb: number }) {
  const files = useFileCollection(checkOffice, { maxMb, maxFiles: 1 });
  const runner = useRunner();
  const item = files.items[0];

  const restart = () => {
    runner.reset();
    files.clear();
  };

  if (runner.result) {
    return <ResultView tool={tool} files={runner.result.files} summary="Documento convertido para PDF." onRestart={restart} onBack={runner.clearResult} />;
  }
  if (!item) {
    return <Dropzone accept="office" multiple={false} maxMb={maxMb} loading={files.loading} error={files.errors.join(" ") || null} onFiles={files.add} />;
  }

  return (
    <Workspace
      main={
        <>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-surface-2 text-muted">
            <FileText className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.file.name}</p>
            <p className="text-xs text-muted">{formatBytes(item.file.size)}</p>
          </div>
          <button type="button" onClick={restart} className="h-8 rounded-lg px-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text">
            Trocar
          </button>
        </div>
        <LargeFileNotice bytes={item.file.size} mode="servidor" />
        </>
      }
      options={<p className="text-sm text-muted">A conversão usa o LibreOffice. Documentos com fontes incomuns podem ter pequenas diferenças de layout.</p>}
      actionLabel={tool.actionLabel}
      busy={runner.busy}
      progress={runner.progress}
      error={runner.error}
      onCancel={runner.cancel}
      onAction={() =>
        runner.run(async (ctx) => {
          const res = await uploadForProcessing("/api/convert/office", item.file, {}, ctx);
          return { files: [{ name: `${baseName(item.file.name)}.pdf`, blob: res.blob }] };
        })
      }
    />
  );
}
