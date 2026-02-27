import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  async rewrites() {
    return [
      {
        source: "/v1/:path*",
        destination: "http://localhost:8080/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
