import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Mirror the tsconfig path aliases so unit-tested core modules can use the same
// "@/..." imports as the app (e.g. core/jsonld → core/seo → i18n/config). Order
// matters: the specific @/core|modules|infra prefixes resolve before the @/* root.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: [
      { find: /^@\/core\//, replacement: r("./src/core/") },
      { find: /^@\/modules\//, replacement: r("./src/modules/") },
      { find: /^@\/infra\//, replacement: r("./src/infra/") },
      { find: /^@\//, replacement: r("./") },
    ],
  },
});
