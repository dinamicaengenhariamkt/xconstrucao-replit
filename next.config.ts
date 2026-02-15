import type { NextConfig } from "next";

const devOrigins = [
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  process.env.NEXT_PUBLIC_BASE_URL,
  process.env.NEXTAUTH_URL,
].filter((origin): origin is string => Boolean(origin));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pg", "bcryptjs"],
  allowedDevOrigins: devOrigins,
};

export default nextConfig;
