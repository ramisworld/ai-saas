import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Disable ESLint during builds
  },
  images: {
    domains: [
      "oaidalleapiprodscus.blob.core.windows.net"
    ]
  }
};

export default nextConfig;