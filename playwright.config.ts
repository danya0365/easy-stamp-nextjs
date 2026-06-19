import { defineConfig } from "@playwright/test";

const PORT = 3100;

// E2E smoke: boots the real Next app against a fresh migrated SQLite file
// (tests/e2e/global-setup.ts) and checks public pages render end-to-end.
// Business logic is covered by the fast unit/integration suite (npm test);
// E2E only verifies the app wires together and serves.
export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 30_000,
  fullyParallel: true,
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 120_000,
    reuseExistingServer: true,
    env: {
      TURSO_DATABASE_URL: "file:./.e2e.db",
      TURSO_AUTH_TOKEN: "",
    },
  },
});
