import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  target: "node18",
  outDir: "dist",
  clean: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  external: ["@air/api-rest", "@air/api-core", "@modelcontextprotocol/sdk"],
});
