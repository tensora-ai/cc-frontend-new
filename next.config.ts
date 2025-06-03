import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "app-count-intern-dev-backend.azurewebsites.net",
      },
      {
        protocol: "https",
        hostname: "app-count-intern-prd-backend.azurewebsites.net",
      },
      {
        protocol: "http",
        hostname: "localhost",
      }
    ],
  },
};

export default nextConfig;
