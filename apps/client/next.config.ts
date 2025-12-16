import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/types"],
  eslint: { ignoreDuringBuilds: true }
};

export default nextConfig;
