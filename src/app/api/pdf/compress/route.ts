import { getCapabilities } from "@/lib/server/capabilities";
import { compressPdf, isCompressionLevel } from "@/lib/server/ghostscript";
import { ApiError, checkRateLimit, handleError, pdfResponse, readUpload } from "@/lib/server/http";

export async function POST(request: Request) {
  try {
    checkRateLimit(request);
    if (!(await getCapabilities()).ghostscript.available) {
      throw new ApiError("unavailable", "A compressão não está disponível neste servidor (Ghostscript não instalado).");
    }
    const upload = await readUpload(request, "pdf");
    const level = upload.fields.get("level") ?? "recomendada";
    if (!isCompressionLevel(level)) throw new ApiError("bad-request", "Nível de compressão inválido.");

    const result = await compressPdf(upload.bytes, level);
    // Se a compressão não reduzir o arquivo, devolvemos o original (nunca pioramos o resultado).
    const noGain = result.byteLength >= upload.bytes.byteLength;
    const out = noGain ? upload.bytes : result;
    return pdfResponse(out, "comprimido.pdf", {
      "X-Original-Size": String(upload.bytes.byteLength),
      "X-Result-Size": String(out.byteLength),
      "X-No-Gain": noGain ? "1" : "0",
    });
  } catch (e) {
    return handleError(e);
  }
}
