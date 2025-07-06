import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Ignores ESLint errors during production builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
