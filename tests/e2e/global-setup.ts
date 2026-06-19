import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

/** Create a fresh, migrated SQLite file the E2E web server will serve from. */
export default async function globalSetup() {
  rmSync(".e2e.db", { force: true });
  execSync("npx drizzle-kit migrate", {
    stdio: "inherit",
    env: {
      ...process.env,
      TURSO_DATABASE_URL: "file:./.e2e.db",
      TURSO_AUTH_TOKEN: "",
    },
  });
}
