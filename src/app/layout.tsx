import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ThemeProvider } from "@/lib/theme";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

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
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#020617" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white text-brutalist-black antialiased min-h-screen flex flex-col">
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}
