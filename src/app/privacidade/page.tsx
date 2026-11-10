import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/content/prose";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Como o FIN-Painel trata seus arquivos e dados.",
};

export default function Privacy() {
  return (
    <ProsePage title="Política de privacidade" lead="Resumo: não queremos seus arquivos. Processamos o mínimo necessário e não guardamos nada.">
      <section>
        <h2>Arquivos processados no navegador</h2>
        <p>
          Nas ferramentas identificadas como “No navegador”, seus documentos nunca saem do seu dispositivo. Não temos
          acesso ao conteúdo, ao nome ou ao tamanho desses arquivos.
        </p>
      </section>
      <section>
        <h2>Arquivos processados no servidor</h2>
        <ul>
          <li>O arquivo é recebido por conexão HTTPS (em produção) e gravado em uma pasta temporária exclusiva.</li>
          <li>Após o processamento, a pasta é apagada imediatamente, inclusive em caso de erro.</li>
          <li>Senhas informadas nas ferramentas Proteger e Desbloquear são usadas apenas durante o processamento e não são armazenadas nem registradas em log.</li>
          <li>O conteúdo dos arquivos não é registrado em logs.</li>
        </ul>
      </section>
      <section>
        <h2>Dados coletados</h2>
        <p>
          O FIN-Painel não exige cadastro, não usa cookies de rastreamento e não inclui ferramentas de análise de
          terceiros. A preferência de tema (claro/escuro) é salva apenas no armazenamento local do seu navegador.
        </p>
        <p>
          Para limitar abusos, o servidor mantém em memória, por até um minuto, um contador de requisições (por endereço
          IP, quando o servidor está configurado atrás de um proxy reverso). Esse contador não é persistido.
        </p>
      </section>
      <section>
        <h2>Mais informações</h2>
        <p>
          Veja <Link href="/como-funciona">como funciona</Link> o processamento de cada ferramenta e os{" "}
          <Link href="/termos">termos de uso</Link>.
        </p>
      </section>
    </ProsePage>
  );
}
