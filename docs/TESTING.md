# Testing

The suite favors **fast in-process integration tests** over mocks: real use cases run against a
real (in-memory) libSQL database wired through the actual DI container.

## Commands
```bash
npm test            # all *.test.ts under src/ (node:test via tsx)
npm run test:cov    # + experimental coverage report
npm run test:e2e    # Playwright smoke tests (starts the app on port 3100)
```

## How it works
- [`scripts/test.mjs`](../scripts/test.mjs) enumerates every `src/**/*.test.ts`, then runs them with
  `node --import tsx --test`. Each test **file** runs in its own subprocess (node:test isolation).
- It sets `TSX_TSCONFIG_PATH=tsconfig.test.json`, which maps `server-only` / `client-only` to an
  empty stub ([`src/test/empty.ts`](../src/test/empty.ts)) so server-only modules import under tsx.
- Integration tests point the DB client at an **in-memory libSQL** (`:memory:`) DB — set for the
  whole run — so each file gets a fresh schema + data.

> ⚠️ Running a single file directly with `node --import tsx --test path/to/x.test.ts` will **fail**
> on `import "server-only"` because it skips the tsconfig stub. Always go through `npm test`
> (run one file by temporarily narrowing `findTests` or via `node --import tsx --test --test-name-pattern`).

## Helpers ([`src/test/helpers.ts`](../src/test/helpers.ts))
- `migrateTestDb()` — applies all `drizzle/` migrations; call once in a `before()` hook.
- `seedShop(slug)` — onboards a real shop (shop + owner + trial subscription + default stamp type)
  via `CreateShopUseCase`; returns `{ shop, ownerId, defaultType }`.

## Pattern for a new integration test
```ts
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { migrateTestDb, seedShop } from "@/src/test/helpers";
import { container } from "@/src/infrastructure/di/container";

before(migrateTestDb);

test("adds a stamp scoped to the shop", async () => {
  const { shop } = await seedShop("coffee-a");
  // ...exercise a use case via container repos, then assert on the DB state.
  assert.equal(/* ... */, /* ... */);
});
```
- **Domain/unit tests** (pure functions in `src/domain/**`) need no DB — just import and assert.
- Prefer asserting on **observable state** (repo reads) over implementation details.

## What to cover when extending (see [TEMPLATE_AUDIT.md](TEMPLATE_AUDIT.md) P2)
- Each new use case: happy path + the key guard (e.g. wrong tenant, expired, over-limit).
- **Tenant isolation**: a negative test that shop A cannot read/write shop B's data.
- Server actions / API routes currently lack tests — add them as you touch them.

## E2E
- [`tests/e2e/`](../tests/e2e) Playwright specs run against a built app on port 3100 (smoke: homepage,
  login, redirect guards). Add flows here for critical journeys (auth, billing) as they stabilize.
