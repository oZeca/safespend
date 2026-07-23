import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  experimental: { cpus: 1, webpackBuildWorker: false, serverActions: { bodySizeLimit: "6mb" } },
};

export default nextConfig;
