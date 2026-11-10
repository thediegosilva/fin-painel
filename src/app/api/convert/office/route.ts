import { getCapabilities } from "@/lib/server/capabilities";
import { ApiError, checkRateLimit, handleError, pdfResponse, readUpload } from "@/lib/server/http";
import { officeToPdf } from "@/lib/server/libreoffice";

export async function POST(request: Request) {
  try {
    checkRateLimit(request);
    if (!(await getCapabilities()).libreoffice.available) {
      throw new ApiError("unavailable", "A conversão de documentos Office não está disponível neste servidor (LibreOffice não instalado).");
    }
    const upload = await readUpload(request, "office");
    const result = await officeToPdf(upload.bytes, upload.ext);
    return pdfResponse(result, "convertido.pdf");
  } catch (e) {
    return handleError(e);
  }
}
