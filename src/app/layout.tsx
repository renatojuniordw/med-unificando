import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PwaRegister } from "@/components/pwa-register";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { ThemeProvider } from "@/lib/theme-provider";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ToastProvider } from "@/components/ui/toast";
import { ConsoleCredits } from "@/components/ui/console-credits";
import { SITE } from "@/lib/config";
import { safeJsonLd } from "@/lib/safe-json-ld";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.BASE_URL),
  title: {
    default: "Med Unificando — Medicamentos Intercambiáveis",
    template: "%s | Med Unificando",
  },
  description:
    "Consulte medicamentos similares e seus respectivos medicamentos de referência conforme lista ANVISA. Busca por descrição, preços CMED, classificação ATC e comparação lado a lado.",
  keywords: [
    "medicamentos", "ANVISA", "intercambiáveis", "similares", "referência",
    "princípio ativo", "preços CMED", "classificação ATC", "medicamento similar",
    "consulta medicamento", "lista ANVISA", "RDC 58/2014",
  ],
  authors: [{ name: "Renato Bezerra", url: "https://renatobezerra.com.br" }],
  creator: "Renato Bezerra",
  publisher: "Unificando",
  openGraph: {
    title: "Med Unificando — Medicamentos Intercambiáveis",
    description:
      "Consulte medicamentos similares e seus respectivos medicamentos de referência conforme dados abertos ANVISA. Busca por descrição, preços CMED e comparação.",
    type: "website",
    locale: "pt_BR",
    siteName: "Med Unificando",
    url: SITE.BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Med Unificando — Medicamentos Intercambiáveis",
    description:
      "Consulte medicamentos similares conforme dados abertos ANVISA. Busca por descrição.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE.BASE_URL,
    languages: {
      "pt-BR": SITE.BASE_URL,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="dns-prefetch" href={SITE.BASE_URL} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Med Unificando",
              alternateName: "Med Unificando",
              url: SITE.BASE_URL,
              description: "Consulta de medicamentos intercambiáveis ANVISA com busca por descrição",
              publisher: {
                "@type": "Organization",
                name: "Unificando",
                url: "https://unificando.com.br",
                logo: "https://unificando.com.br/logo.svg",
              },
              author: {
                "@type": "Person",
                name: "Renato Bezerra",
                url: "https://renatobezerra.com.br",
              },
              inLanguage: "pt-BR",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${SITE.BASE_URL}/buscar-avancado?reference={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <PwaRegister />
        <ThemeProvider>
          <ToastProvider>
          <ConsoleCredits />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-brand-yellow focus:text-brand-black focus:px-4 focus:py-2 focus:rounded-sm focus:font-semibold focus:shadow-card"
          >
            Pular para o conteúdo
          </a>
          <Header />
          <main id="main-content" className="flex-1">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <Footer />
          <ScrollToTop />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
