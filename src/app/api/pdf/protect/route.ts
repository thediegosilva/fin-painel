import { getCapabilities } from "@/lib/server/capabilities";
import { protectPdf, validatePassword } from "@/lib/server/ghostscript";
import { ApiError, checkRateLimit, handleError, pdfResponse, readUpload } from "@/lib/server/http";

export async function POST(request: Request) {
  try {
    checkRateLimit(request);
    if (!(await getCapabilities()).ghostscript.available) {
      throw new ApiError("unavailable", "A proteção por senha não está disponível neste servidor (Ghostscript não instalado).");
    }
    const upload = await readUpload(request, "pdf");
    const password = validatePassword(upload.fields.get("password"));
    if (password.length < 4) throw new ApiError("bad-request", "A senha deve ter pelo menos 4 caracteres.");
    const result = await protectPdf(upload.bytes, password);
    return pdfResponse(result, "protegido.pdf");
  } catch (e) {
    return handleError(e);
  }
}
