import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/content/prose";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Como funciona",
  description: "Entenda onde e como o FIN-Painel processa seus documentos.",
};

export default function HowItWorks() {
  const local = TOOLS.filter((t) => t.mode === "local");
  const server = TOOLS.filter((t) => t.mode === "servidor");
  return (
    <ProsePage title="Como funciona" lead="Transparência total sobre onde seus arquivos são processados.">
      <section>
        <h2>Processamento no navegador</h2>
        <p>
          Estas ferramentas usam bibliotecas de código aberto (pdf-lib e PDF.js) executadas pelo seu navegador. O
          arquivo é lido na memória do seu dispositivo, processado e oferecido para download — ele não é enviado pela
          rede:
        </p>
        <ul>
          {local.map((t) => (
            <li key={t.slug}>
              <Link href={`/${t.slug}`}>{t.name}</Link> — {t.summary}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Processamento no servidor</h2>
        <p>
          Algumas operações exigem softwares especializados que não rodam no navegador. Nesses casos, o arquivo é enviado
          ao servidor do FIN-Painel, gravado em uma pasta temporária exclusiva, processado e apagado assim que a resposta
          é enviada — com ou sem erro:
        </p>
        <ul>
          {server.map((t) => (
            <li key={t.slug}>
              <Link href={`/${t.slug}`}>{t.name}</Link> — usa {t.capability === "ghostscript" ? "Ghostscript" : "LibreOffice"}.
            </li>
          ))}
        </ul>
        <p>
          A disponibilidade dessas ferramentas depende da instalação do servidor. Consulte a página de{" "}
          <Link href="/status">status do serviço</Link>.
        </p>
      </section>
      <section>
        <h2>Limites</h2>
        <ul>
          <li>Ferramentas no navegador: até 950 MB por arquivo. Acima de 300 MB, o processamento usa bastante memória e é recomendado usar um computador.</li>
          <li>Ferramentas no servidor: limite definido pelo administrador, exibido na própria ferramenta.</li>
          <li>PDFs protegidos por senha precisam ser desbloqueados antes de usar as demais ferramentas.</li>
        </ul>
      </section>
    </ProsePage>
  );
}
