import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: { compilerOptions: { composite: false } },
  target: "node18",
  outDir: "dist",
  clean: true,
  external: ["@air/api-core", "@air/api-rest"],
});
