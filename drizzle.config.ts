import { defineConfig } from "drizzle-kit";

// Local dev defaults to a file DB; production reads Turso creds from env.
const url = process.env.TURSO_DATABASE_URL ?? "file:./local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

export default defineConfig({
  dialect: "turso",
  schema: "./src/infrastructure/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url,
    ...(authToken ? { authToken } : {}),
  },
  casing: "snake_case",
});
