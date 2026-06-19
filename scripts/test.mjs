// Runs the node:test suite over all `*.test.ts` files under src/ via the tsx
// loader. Node 20's --test does not glob .ts, so we enumerate files ourselves.
//
//   node scripts/test.mjs            # run all tests
//   node scripts/test.mjs --coverage # + experimental coverage report
//
// Integration tests point the DB client at an in-memory libSQL DB (set here for
// the whole run; unit tests don't touch the DB). Each test file runs in its own
// subprocess (node:test default isolation) → its own fresh in-memory DB.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

function findTests(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) findTests(full, acc);
    else if (entry.name.endsWith(".test.ts")) acc.push(full);
  }
  return acc;
}

const coverage = process.argv.includes("--coverage");
const files = findTests("src").sort();
if (files.length === 0) {
  console.error("No *.test.ts files found under src/");
  process.exit(1);
}

const args = ["--import", "tsx", "--test"];
if (coverage) args.push("--experimental-test-coverage");
args.push(...files);

const res = spawnSync(process.execPath, args, {
  stdio: "inherit",
  env: {
    ...process.env,
    // tsx uses this tsconfig → maps server-only/client-only to an empty stub.
    TSX_TSCONFIG_PATH: "tsconfig.test.json",
    // Integration tests migrate this fresh in-memory DB per subprocess.
    TURSO_DATABASE_URL: ":memory:",
    TURSO_AUTH_TOKEN: "",
  },
});
process.exit(res.status ?? 1);
