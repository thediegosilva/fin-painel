import type { Metadata } from "next";
import { StatusPanel } from "./status-panel";

export const metadata: Metadata = {
  title: "Status do serviço",
  description: "Disponibilidade das ferramentas do FIN-Painel neste servidor.",
};

export default function StatusPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Status do serviço</h1>
      <p className="mt-3 text-muted">Consulta em tempo real ao servidor desta instalação.</p>
      <StatusPanel />
    </div>
  );
}
