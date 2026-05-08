import type { NextConfig } from "next";

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
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};

export default nextConfig;
