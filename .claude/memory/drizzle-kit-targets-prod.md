---
name: drizzle-kit-targets-prod
description: "drizzle-kit (db:migrate/push/generate) loads .env.production.local and hits the REMOTE Turso prod DB, not local.db"
metadata: 
  node_type: memory
  type: project
  originSessionId: 9ecdb9f2-58de-4578-a913-30ed0ec3a1a9
---

`drizzle.config.ts` calls `loadEnvConfig(process.cwd())` with no dev flag → it
loads in **production** mode, so `.env.production.local` (which holds the real
`TURSO_DATABASE_URL` = `libsql://easy-stamp-...turso.io` + auth token) wins over
`.env.local` (`file:./local.db`). Therefore any `npm run db:migrate` / `db:push`
run from a normal shell targets **production Turso**, NOT local.

The seed (`npm run db:seed` = `tsx scripts/seed.ts`) does NOT load env files, so it
defaults to `file:./local.db` — opposite target from drizzle-kit. This mismatch
is a trap.

**How to apply:** To act on LOCAL only, override env inline, e.g.
`TURSO_DATABASE_URL="file:./local.db" TURSO_AUTH_TOKEN="" npx drizzle-kit migrate`
(loadEnvConfig won't override vars already in process.env). Production migrations
normally run via the Vercel build (`scripts/vercel-migrate.mjs`, gated on
`VERCEL_ENV=production`) — don't run `db:migrate` ad-hoc unless you intend to hit
prod. Related: [[project-easy-stamp]].
