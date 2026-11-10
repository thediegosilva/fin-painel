import { Heart, QrCode, Server, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { AUTHOR } from "@/lib/author";
import { PIX, PIX_PAYLOAD } from "@/lib/donation";
import { CopyButton } from "./copy-button";

export const metadata: Metadata = {
  title: "Apoie o projeto",
  description: "O FIN-Painel é gratuito e de código aberto. Contribua com qualquer valor via Pix.",
};

export default async function SupportPage() {
  // Gerado no build: nenhum serviço externo envolvido.
  const svg = await QRCode.toString(PIX_PAYLOAD, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#000000", light: "#ffffff" } });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:items-start">
        <div>
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--cat-seguranca-soft)] text-[var(--cat-seguranca)]">
            <Heart className="size-6" aria-hidden />
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight">Apoie o FIN-Painel</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            O FIN-Painel é gratuito, sem anúncios, sem cadastro e de código aberto. Ele é mantido por{" "}
            <a href={AUTHOR.github} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
              {AUTHOR.name}
            </a>
            . Se ele te ajudou, considere contribuir com <strong className="text-text">qualquer valor</strong> — você
            escolhe quanto no aplicativo do seu banco.
          </p>

          <h2 className="mt-10 text-sm font-semibold uppercase tracking-wider text-subtle">Para onde vai sua contribuição</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            <li className="rounded-2xl border border-border bg-surface p-4">
              <Server className="size-5 text-brand" aria-hidden />
              <p className="mt-2 font-medium">Servidor e domínio</p>
              <p className="text-sm text-muted">Mantém as ferramentas online e rápidas.</p>
            </li>
            <li className="rounded-2xl border border-border bg-surface p-4">
              <Heart className="size-5 text-brand" aria-hidden />
              <p className="mt-2 font-medium">Novas ferramentas</p>
              <p className="text-sm text-muted">Tempo para desenvolver e manter o projeto.</p>
            </li>
          </ul>

          <h2 className="mt-10 text-sm font-semibold uppercase tracking-wider text-subtle">Como contribuir</h2>
          <ol className="mt-4 space-y-3 text-sm">
            <li className="flex gap-3">
              <QrCode className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              <span>
                <strong>Vendo esta página no computador:</strong> abra o app do banco no celular, escolha “Pagar com
                Pix” e escaneie o QR Code.
              </span>
            </li>
            <li className="flex gap-3">
              <Smartphone className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              <span>
                <strong>Neste mesmo celular:</strong> toque em “Copiar código Pix” e cole em “Pix Copia e Cola” no app do
                banco.
              </span>
            </li>
          </ol>
          <p className="mt-6 text-sm text-muted">
            Usar o FIN-Painel continua sendo gratuito, com ou sem contribuição. Obrigado! 💚
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-6 text-center shadow-md">
          <p className="text-sm font-semibold">Pix — valor livre</p>
          <div
            className="mx-auto mt-4 w-full max-w-[280px] rounded-2xl bg-white p-3 [&>svg]:h-auto [&>svg]:w-full"
            role="img"
            aria-label="QR Code Pix para contribuição ao FIN-Painel"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <dl className="mt-4 space-y-1 text-sm">
            <div>
              <dt className="sr-only">Recebedor</dt>
              <dd className="font-medium">{PIX.name}</dd>
            </div>
            <div>
              <dt className="sr-only">Chave aleatória</dt>
              <dd className="break-all font-mono text-xs text-muted">Chave aleatória: {PIX.key}</dd>
            </div>
          </dl>
          <div className="mt-5">
            <CopyButton text={PIX_PAYLOAD} label="Copiar código Pix" />
          </div>
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-center text-xs font-medium text-muted hover:text-text">Ver código Pix Copia e Cola</summary>
            <p data-testid="pix-payload" className="mt-2 select-all break-all rounded-lg bg-surface-2 p-3 font-mono text-[11px] leading-relaxed">
              {PIX_PAYLOAD}
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
