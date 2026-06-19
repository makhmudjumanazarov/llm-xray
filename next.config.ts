import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-host: emit a minimal standalone server for the Docker runtime image.
  output: "standalone",
  // Keep native/WASM DB drivers out of the bundle — load from node_modules at runtime.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
};

export default nextConfig;
