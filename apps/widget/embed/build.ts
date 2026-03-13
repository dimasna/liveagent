import * as esbuild from "esbuild";

/**
 * Build script that bundles embed/widget.ts into a single
 * self-contained IIFE JavaScript file at public/widget.js.
 *
 * Usage: npx tsx embed/build.ts
 * Or via package.json: pnpm build:embed
 */
async function build() {
  try {
    const result = await esbuild.build({
      entryPoints: ["embed/widget.ts"],
      bundle: true,
      format: "iife",
      outfile: "public/widget.js",
      minify: true,
      target: ["es2020"],
      sourcemap: false,
      logLevel: "info",
    });

    if (result.errors.length > 0) {
      console.error("Build failed with errors:", result.errors);
      process.exit(1);
    }

    console.log("Embed script built successfully: public/widget.js");
  } catch (err) {
    console.error("Build failed:", err);
    process.exit(1);
  }
}

build();
