"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1>Algo deu errado</h1>
          <p>Ocorreu um erro inesperado. Tente recarregar a página.</p>
          <button onClick={reset} style={{ padding: "10px 20px", borderRadius: 10, border: 0, background: "#0c7a64", color: "#fff", cursor: "pointer" }}>
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
