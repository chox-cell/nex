import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nex/core", "@nex/ssot"],
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
