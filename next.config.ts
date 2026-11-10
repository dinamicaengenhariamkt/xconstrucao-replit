import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const replitDevDomain = process.env.REPLIT_DEV_DOMAIN || "";

const devOrigins = [
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  process.env.NEXT_PUBLIC_BASE_URL,
  process.env.NEXTAUTH_URL,
  replitDevDomain ? `https://${replitDevDomain}` : "",
  replitDevDomain ? replitDevDomain : "",
].filter(Boolean) as string[];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  serverExternalPackages: ["pg", "bcryptjs"],
  allowedDevOrigins: devOrigins,
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
      {
        // PUB-06 — link público da obra: o token está na URL. Não indexar, não
        // vazar a URL por Referer ao abrir links externos e não deixar a página
        // ser embutida em iframe de terceiros.
        source: "/publico/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
      {
        source: "/acesso-plataforma",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  telemetry: false,
});
