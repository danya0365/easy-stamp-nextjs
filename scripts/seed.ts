/**
 * Seed orchestrator. Runs one or more data buckets:
 *
 *   initial  — required to boot the system (platform admin). Production-safe.
 *   starter  — reference data (shop categories) + 1 clean example shop. Prod-safe.
 *   mock     — fake-but-realistic demo data (shops/customers/stamps). DEV ONLY.
 *
 * Usage:
 *   npm run db:seed              → initial + starter + mock   (default, dev)
 *   npm run db:seed:core         → initial + starter          (production launch)
 *   tsx scripts/seed.ts starter  → just that bucket
 *
 * Every bucket is idempotent, so re-running is safe.
 */
import bcrypt from "bcryptjs";

import { createSeedDb, DEFAULT_PASSWORD, type SeedContext } from "./seed/_db";
import { seedInitial } from "./seed/initial";
import { seedStarter } from "./seed/starter";
import { seedMock } from "./seed/mock";

type Bucket = "initial" | "starter" | "mock";
const ALL: Bucket[] = ["initial", "starter", "mock"];

const runners: Record<Bucket, (ctx: SeedContext) => Promise<void>> = {
  initial: seedInitial,
  starter: seedStarter,
  mock: seedMock,
};

function selectedBuckets(): Bucket[] {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  if (args.length === 0) return ALL;
  const picked = args.filter((a): a is Bucket => (ALL as string[]).includes(a));
  if (picked.length === 0) {
    throw new Error(`Unknown bucket(s): ${args.join(", ")}. Use: ${ALL.join(", ")}`);
  }
  return picked;
}

async function main() {
  const buckets = selectedBuckets();
  const { db, client } = createSeedDb();
  const ctx: SeedContext = {
    db,
    passwordHash: await bcrypt.hash(DEFAULT_PASSWORD, 10),
    log: (msg) => console.log(`  ${msg}`),
  };

  console.log(`▶ Seeding: ${buckets.join(", ")}`);
  for (const bucket of buckets) {
    await runners[bucket](ctx);
  }

  if (buckets.includes("mock") || buckets.includes("starter")) {
    console.log("\nLogins (password: " + DEFAULT_PASSWORD + ")");
    console.log("  admin:        admin@easystamp.test");
    if (buckets.includes("starter"))
      console.log("  example shop: owner@demo.easystamp.test  (/s/demo)");
    if (buckets.includes("mock")) {
      console.log("  mock owner:   owner@coffee-a.test  (active)");
      console.log("  mock owner:   owner@bakery-b.test  (overdue/suspended)");
      console.log("  mock staff:   staff1@coffee-a.test");
    }
  }
  console.log("\n✓ Seed complete");
  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
