import { defineConfig } from "vitest/config";
import { config } from "dotenv";
config({ path: ".env.test" });
export default defineConfig({
  test: {
    include: ["tests/e2e/**/*.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 30_000,
  },
});
