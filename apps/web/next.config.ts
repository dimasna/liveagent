import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: "../../",
  transpilePackages: ["@liveagent/ui", "@liveagent/shared"],
};

export default nextConfig;
