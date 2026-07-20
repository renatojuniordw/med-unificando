import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { ThemeProvider } from "@/lib/theme-provider";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ToastProvider } from "@/components/ui/toast";
import { ConsoleCredits } from "@/components/ui/console-credits";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Unificando Med — Medicamentos Intercambiáveis",
    template: "%s | Unificando Med",
  },
  description:
    "Consulte medicamentos similares e seus respectivos medicamentos de referência conforme lista ANVISA.",
  openGraph: {
    title: "Unificando Med — Medicamentos Intercambiáveis",
    description:
      "Consulte medicamentos similares e seus respectivos medicamentos de referência conforme dados abertos ANVISA.",
    type: "website",
    locale: "pt_BR",
    siteName: "Unificando Med",
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
      </head>
      <body className="antialiased min-h-screen flex flex-col">
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
