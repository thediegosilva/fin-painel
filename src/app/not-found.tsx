import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-mono text-sm text-brand">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Página não encontrada</h1>
      <p className="mt-3 text-muted">O endereço pode ter sido digitado incorretamente ou a página não existe mais.</p>
      <LinkButton href="/" className="mt-8">
        Ver todas as ferramentas
      </LinkButton>
    </div>
  );
}
