import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  output: "standalone" as const,
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@liveagent/shared"],
};

export default nextConfig;
