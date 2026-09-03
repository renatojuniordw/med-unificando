import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const cspHeader = [
  `default-src 'self'`,
  `img-src 'self' https: data:`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com data:`,
  // Next.js App Router requer 'unsafe-inline' para scripts de hidratação/chunks.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://static.cloudflareinsights.com`,
  `connect-src 'self' https://dados.anvisa.gov.br https://cloudflareinsights.com`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
].join("; ");

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: cspHeader },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["xlsx", "pdf-parse", "iconv-lite", "pdfmake"],

  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
    ];
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
