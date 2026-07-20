import type { NextConfig } from "next";

const cspHeader = [
  `default-src 'self'`,
  `img-src 'self' https: data:`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
  `connect-src 'self' https://dados.anvisa.gov.br`,
  `frame-ancestors 'none'`,
].join("; ");

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
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
