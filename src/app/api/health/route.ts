import { connection } from "next/server";
import { getCapabilities } from "@/lib/server/capabilities";
import { serverConfig } from "@/lib/server/config";

/** Estado do serviço e capacidades de processamento no servidor. */
export async function GET() {
  await connection();
  const caps = await getCapabilities();
  return Response.json(
    {
      status: "ok",
      capabilities: {
        ghostscript: caps.ghostscript.available,
        libreoffice: caps.libreoffice.available,
      },
      limits: { maxUploadMb: serverConfig.maxUploadMb },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
