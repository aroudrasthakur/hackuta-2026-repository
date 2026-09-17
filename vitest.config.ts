import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    setupFiles: ["./tests/unit/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "istanbul",
      include: [
        "src/**/*.{ts,tsx}",
        "shared/**/*.ts",
        "convex/**/*.ts",
        "security/**/*.ts",
      ],
      exclude: [
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "src/main.tsx",
        "convex/_generated/**",
        // Browser-only WebGL/cursor effects; covered by Playwright e2e.
        "src/components/HeroAtmosphere.tsx",
        "src/components/HeroWaves.tsx",
        "src/components/cursor/CustomCursor.tsx",
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        branches: 72,
        functions: 80,
      },
      reportsDirectory: "./.nyc_output",
      reporter: ["text", "json", "json-summary"],
    },
  },
});
