import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Slim self-contained build for the Docker image (deploy/)
  output: "standalone",
};

export default nextConfig;
