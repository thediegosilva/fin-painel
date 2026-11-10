import { getCapabilities } from "@/lib/server/capabilities";
import { unlockPdf, validatePassword } from "@/lib/server/ghostscript";
import { ApiError, checkRateLimit, handleError, pdfResponse, readUpload } from "@/lib/server/http";

export async function POST(request: Request) {
  try {
    checkRateLimit(request);
    if (!(await getCapabilities()).ghostscript.available) {
      throw new ApiError("unavailable", "O desbloqueio não está disponível neste servidor (Ghostscript não instalado).");
    }
    const upload = await readUpload(request, "pdf");
    const raw = upload.fields.get("password");
    // Senha vazia é permitida: PDFs com apenas restrições de permissão abrem sem senha.
    const password = typeof raw === "string" && raw.length > 0 ? validatePassword(raw) : "";
    const result = await unlockPdf(upload.bytes, password);
    return pdfResponse(result, "desbloqueado.pdf");
  } catch (e) {
    return handleError(e);
  }
}
