import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@reg-tech/ui", "@reg-tech/shared"],
};

export default nextConfig;
