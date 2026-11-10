"use client";

import { Button, LinkButton } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Algo deu errado</h1>
      <p className="mt-3 text-muted">Ocorreu um erro inesperado ao exibir esta página. Seus arquivos não foram afetados.</p>
      <div className="mt-8 flex gap-2">
        <Button onClick={reset}>Tentar novamente</Button>
        <LinkButton href="/" variant="outline">
          Ir para o início
        </LinkButton>
      </div>
    </div>
  );
}
