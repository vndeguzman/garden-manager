import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@garden/shared": new URL("../shared/src/index.ts", import.meta.url).pathname,
    },
  },
});
