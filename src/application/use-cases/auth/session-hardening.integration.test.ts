import { before, test } from "node:test";
import assert from "node:assert/strict";

import { migrateTestDb, seedShop } from "@/src/test/helpers";
import { container } from "@/src/infrastructure/di/container";
import { ChangePasswordUseCase } from "./ChangePasswordUseCase";
import { ResetPasswordUseCase } from "./ResetPasswordUseCase";

before(async () => {
  await migrateTestDb();
});

const future = () => new Date(Date.now() + 3_600_000).toISOString();

test("changing password revokes all existing sessions", async () => {
  const { ownerId } = await seedShop("sess-change");
  const s = await container.sessionRepository.create({
    userId: ownerId,
    expiresAt: future(),
  });
  await new ChangePasswordUseCase(
    container.userRepository,
    container.passwordHasher,
    container.sessionRepository,
  ).execute(ownerId, "password123", "newpass456");

  const valid = await container.sessionRepository.findValid(s.id, new Date());
  assert.equal(valid, null, "old session is dead after password change");
});

test("admin reset revokes the target's sessions", async () => {
  const { ownerId } = await seedShop("sess-reset");
  const s = await container.sessionRepository.create({
    userId: ownerId,
    expiresAt: future(),
  });
  await new ResetPasswordUseCase(
    container.userRepository,
    container.passwordHasher,
    container.sessionRepository,
  ).execute(ownerId, "resetpass789");

  assert.equal(
    await container.sessionRepository.findValid(s.id, new Date()),
    null,
    "target session revoked after admin reset",
  );
});
