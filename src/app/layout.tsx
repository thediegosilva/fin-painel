import type { Metadata, Viewport } from "next";
import { Caveat, Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { THEME_SCRIPT } from "@/components/layout/theme-toggle";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Fonte cursiva para assinaturas digitadas (carregada sob demanda).
const caveat = Caveat({ variable: "--font-signature-family", subsets: ["latin"], preload: false, weight: ["500", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "FIN-Painel — Ferramentas de PDF online, rápidas e privadas",
    template: "%s · FIN-Painel",
  },
  description:
    "Junte, divida, comprima, converta, assine e proteja PDFs. A maioria das ferramentas roda no seu navegador: seus arquivos não saem do seu dispositivo.",
  applicationName: "FIN-Painel",
  authors: [{ name: "Diego Silva", url: "https://github.com/thediegosilva" }],
  creator: "Diego Silva",
  openGraph: { type: "website", locale: "pt_BR", siteName: "FIN-Painel" },
  appleWebApp: { capable: true, title: "FIN-Painel", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f17" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#conteudo"
          className="sr-only z-50 rounded-lg bg-brand px-4 py-2 text-on-brand focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Pular para o conteúdo
        </a>
        <Header />
        <main id="conteudo" className="flex flex-1 flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
