/**
 * INITIAL data — the minimum required for the system to function.
 * Safe to run in every environment (incl. production). Idempotent.
 *
 * Admin credentials come from env so production gets a real password:
 *   SEED_ADMIN_EMAIL     (default: admin@easystamp.test)
 *   SEED_ADMIN_PASSWORD  (default: DEFAULT_PASSWORD — dev only)
 * Seeding the default password against a remote DB is refused (see guard below),
 * because the app has no in-app password change.
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { isRemoteDb, schema, type SeedContext } from "./_db";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@easystamp.test";

export async function seedInitial({ db, passwordHash, log }: SeedContext) {
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.email, ADMIN_EMAIL),
  });
  if (existing) {
    log(`initial: admin already exists (${ADMIN_EMAIL}) — skip`);
    return;
  }

  // Prod must supply a real password; dev falls back to the shared default hash.
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (isRemoteDb() && !adminPassword) {
    throw new Error(
      "Refusing to create a default-password admin on a remote DB. " +
        "Set SEED_ADMIN_PASSWORD (and optionally SEED_ADMIN_EMAIL) before seeding production.",
    );
  }
  const adminHash = adminPassword ? await bcrypt.hash(adminPassword, 10) : passwordHash;

  await db.insert(schema.users).values({
    id: nanoid(),
    email: ADMIN_EMAIL,
    passwordHash: adminHash,
    role: "platform_admin",
    shopId: null,
    branchId: null,
  });
  log(`initial: created platform admin ${ADMIN_EMAIL}`);
}
