import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: "../../",
  transpilePackages: ["@liveagent/ui", "@liveagent/shared"],
  outputFileTracingIncludes: {
    "/**": [
      "../../node_modules/.prisma/client/**",
      "../../node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/**",
    ],
  },
};

export default nextConfig;
