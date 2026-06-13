/**
 * INITIAL data — the minimum required for the system to function.
 * Safe to run in every environment (incl. production). Idempotent.
 */
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { schema, type SeedContext } from "./_db";

const ADMIN_EMAIL = "admin@easystamp.test";

export async function seedInitial({ db, passwordHash, log }: SeedContext) {
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.email, ADMIN_EMAIL),
  });
  if (existing) {
    log(`initial: admin already exists (${ADMIN_EMAIL}) — skip`);
    return;
  }

  await db.insert(schema.users).values({
    id: nanoid(),
    email: ADMIN_EMAIL,
    passwordHash,
    role: "platform_admin",
    shopId: null,
    branchId: null,
  });
  log(`initial: created platform admin ${ADMIN_EMAIL}`);
}
