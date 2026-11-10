import type { Metadata } from "next";
import { ProsePage } from "@/components/content/prose";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Condições de uso do FIN-Painel.",
};

export default function Terms() {
  return (
    <ProsePage title="Termos de uso">
      <section>
        <h2>Uso permitido</h2>
        <p>
          Você pode usar o FIN-Painel para processar documentos que lhe pertencem ou que você tem autorização para
          manipular. É proibido usar a ferramenta Desbloquear PDF para contornar proteções de documentos aos quais você
          não tem direito de acesso.
        </p>
      </section>
      <section>
        <h2>Responsabilidade sobre os arquivos</h2>
        <p>
          Recomendamos manter sempre uma cópia do arquivo original. O serviço é fornecido “no estado em que se
          encontra”, sem garantia de que todo documento será processado sem perdas — por exemplo, a compressão e a
          proteção reescrevem o PDF e podem não preservar formulários interativos ou assinaturas digitais.
        </p>
      </section>
      <section>
        <h2>Assinatura</h2>
        <p>
          A ferramenta Assinar PDF insere uma imagem da assinatura no documento. Ela não constitui assinatura digital
          certificada (ICP-Brasil) e sua validade jurídica depende do contexto e da aceitação das partes envolvidas.
        </p>
      </section>
      <section>
        <h2>Limites e disponibilidade</h2>
        <p>
          Podemos limitar o tamanho dos arquivos e a quantidade de requisições para garantir a estabilidade do serviço.
          Ferramentas que dependem do servidor podem ficar indisponíveis.
        </p>
      </section>
    </ProsePage>
  );
}
