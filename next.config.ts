import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  expireTime: 3600,
  experimental: {
    optimizePackageImports: ["@radix-ui/*"],
  },
  env: {
    API_URL: process.env.API_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
