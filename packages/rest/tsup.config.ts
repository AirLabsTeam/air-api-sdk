import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: { resolve: true, compilerOptions: { composite: false } },
  target: "node18",
  outDir: "dist",
  clean: true,
  noExternal: ["@air/api-core"],
});
