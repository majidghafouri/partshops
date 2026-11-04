import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: path.resolve(".") },
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
};

export default nextConfig;
