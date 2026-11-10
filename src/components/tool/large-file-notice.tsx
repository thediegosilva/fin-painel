import { Alert } from "@/components/ui/alert";
import { LARGE_FILE_MB } from "@/lib/client/files";
import { formatBytes } from "@/lib/format";

/** Aviso não bloqueante para arquivos grandes (processamento pesado no dispositivo ou no envio). */
export function LargeFileNotice({ bytes, mode = "local" }: { bytes: number; mode?: "local" | "servidor" }) {
  if (bytes <= LARGE_FILE_MB * 1024 * 1024) return null;
  return (
    <Alert tone="warning" title={`Arquivo grande (${formatBytes(bytes)})`}>
      {mode === "local"
        ? "O processamento acontece no seu dispositivo e pode levar alguns minutos e usar bastante memória. Prefira um computador e feche outras abas pesadas. No celular, o navegador pode interromper a página."
        : "O envio e o processamento podem levar vários minutos, dependendo da sua conexão. Mantenha esta página aberta até o fim."}
    </Alert>
  );
}
