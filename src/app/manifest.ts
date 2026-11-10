import type { MetadataRoute } from "next";

/** Manifest do app instalável (Android, Chrome/Edge desktop). Ícones em public/icons. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FIN-Painel — Ferramentas de PDF",
    short_name: "FIN-Painel",
    description: "Junte, divida, comprima, converta, assine e proteja PDFs. Rápido e privado.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "pt-BR",
    background_color: "#f6f7f9",
    theme_color: "#0c7a64",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
