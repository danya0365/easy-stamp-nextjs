---
name: testing-setup
description: Test suite — node:test runner (unit/integration via in-memory libSQL) + Playwright E2E smoke; how to add tests
metadata: 
  node_type: memory
  type: project
  originSessionId: 67955480-3ace-4361-beb6-449c7329deb7
---

Tests run on **node:test + tsx** (no Vitest). Scripts: `npm test` (all `*.test.ts` under src/), `npm run test:cov` (+ `--experimental-test-coverage`), `npm run test:e2e` (Playwright). CI not set up yet (deferred).

**Runner** `scripts/test.mjs`: recursively finds `*.test.ts`, runs `node --import tsx --test` with env `TSX_TSCONFIG_PATH=tsconfig.test.json` + `TURSO_DATABASE_URL=:memory:`. The test tsconfig maps `server-only`/`client-only` → `src/test/empty.ts` (those are build-time Next aliases with EMPTY node_modules dirs → can't resolve in plain node; this stub fixes it). Each test FILE runs in its own subprocess → fresh in-memory DB.

**Integration pattern (high-value, low-code):** drive REAL use cases + REAL Drizzle repos via the DI `container` against an in-memory libSQL DB. In a `before()` call `migrateTestDb()` from `src/test/helpers.ts` (runs `migrate(db, {migrationsFolder:"drizzle"})`); `seedShop(slug)` there onboards a real shop+owner+trial+default-stamp-type. SQLite **FK enforcement is ON** → `performedBy`/`createdBy` must be real user ids (use the owner/admin id, not "tester"). Examples: `stamp-flow.integration.test.ts`, `review-flow.integration.test.ts`, `convert-lead.integration.test.ts`, `repos.integration.test.ts`.

**Coverage profile (intentional, critical-first):** ~75% line / 82% branch overall; use-cases/domain/critical repos 94–100%; UI/server-actions/presentational deliberately uncovered (covered by E2E wiring + thin-wrapper argument). 80 unit/integration tests + 4 Playwright public smokes.

**E2E** (`playwright.config.ts` + `tests/e2e/`): webServer runs `next dev -p 3100` against `file:./.e2e.db`; `global-setup.ts` rm+migrates that DB (drizzle-kit, no app import → no server-only issue). Smoke = public pages render + auth redirect. Deep business logic stays in fast integration tests (testing pyramid), not E2E. `.e2e.db`/`test-results`/`playwright-report` gitignored.

To add a test: pure logic → co-located `*.test.ts` importing the fn; flow → integration test using `container` + `seedShop`. Related: [[css-lint-enforcement]], [[project-easy-stamp]].
