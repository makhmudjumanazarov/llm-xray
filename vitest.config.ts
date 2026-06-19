import { defineConfig } from "vitest/config";

// Core domain is pure (no aliases needed) — tests use relative imports.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
