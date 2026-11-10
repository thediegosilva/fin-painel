import type { RunContext } from "@/hooks/use-runner";
import { postForm } from "@/lib/client/api";

/** Envia o arquivo para uma rota de processamento, reportando o progresso. */
export async function uploadForProcessing(
  url: string,
  file: Blob,
  fields: Record<string, string>,
  { setProgress, signal }: RunContext,
) {
  const form = new FormData();
  form.append("file", file, file instanceof File ? file.name : "documento.pdf");
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  setProgress(0, "Enviando… 0%");
  return postForm(url, form, {
    signal,
    onUploadProgress: (f) => {
      if (f >= 1) setProgress(null, "Processando no servidor…");
      else setProgress(f, `Enviando… ${Math.round(f * 100)}%`);
    },
  });
}
