import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

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
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#020617" />
      </head>
      <body className="bg-white text-brutalist-black antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}
