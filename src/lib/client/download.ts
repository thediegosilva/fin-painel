import { zipSync } from "fflate";

export interface OutputFile {
  name: string;
  blob: Blob;
}

/** Dispara o download de um Blob com o nome informado. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoga depois que o navegador iniciou o download.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Garante nomes únicos dentro de um ZIP. */
function uniqueNames(files: OutputFile[]): string[] {
  const used = new Map<string, number>();
  return files.map((f) => {
    const n = used.get(f.name) ?? 0;
    used.set(f.name, n + 1);
    if (n === 0) return f.name;
    const dot = f.name.lastIndexOf(".");
    return dot > 0 ? `${f.name.slice(0, dot)} (${n + 1})${f.name.slice(dot)}` : `${f.name} (${n + 1})`;
  });
}

export async function zipFiles(files: OutputFile[]): Promise<Blob> {
  const names = uniqueNames(files);
  const entries: Record<string, [Uint8Array, { level: 0 | 6 }]> = {};
  for (let i = 0; i < files.length; i++) {
    const data = new Uint8Array(await files[i].blob.arrayBuffer());
    // PDFs, JPG e PNG já são comprimidos; texto se beneficia de deflate.
    const level = /\.(txt)$/i.test(names[i]) ? 6 : 0;
    entries[names[i]] = [data, { level }];
  }
  const zipped = zipSync(entries);
  return new Blob([zipped.buffer as ArrayBuffer], { type: "application/zip" });
}

export const pdfBlob = (bytes: Uint8Array) => new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
