import { before, test } from "node:test";
import assert from "node:assert/strict";

import { migrateTestDb } from "@/src/test/helpers";
import { container } from "@/src/infrastructure/di/container";
import { ConvertLeadToShopUseCase } from "./ConvertLeadToShopUseCase";

before(async () => {
  await migrateTestDb();
});

async function adminUser(email: string) {
  const passwordHash = await container.passwordHasher.hash("password123");
  return container.userRepository.create({
    email,
    passwordHash,
    role: "platform_admin",
    shopId: null,
    branchId: null,
  });
}

function convert() {
  return new ConvertLeadToShopUseCase(
    container.leadRepository,
    container.leadVisitLogRepository,
    container.shopRepository,
    container.userRepository,
    container.subscriptionRepository,
    container.passwordHasher,
    container.shopCategoryRepository,
    container.stampTypeRepository,
    container.branchRepository,
  );
}

test("convert a won lead → creates shop + branch (carrying coords) + links lead", async () => {
  const admin = await adminUser("admin-conv@test.local");
  const lead = await container.leadRepository.create({
    name: "ร้านเป้าหมาย",
    latitude: 13.7,
    longitude: 100.5,
    address: "สยาม",
  });
  await container.leadRepository.setStatus(lead.id, "won");

  const { shop, branch } = await convert().execute({
    leadId: lead.id,
    slug: "converted-shop",
    ownerEmail: "newowner@test.local",
    ownerPassword: "password123",
    performedBy: admin.id,
  });

  assert.equal(shop.name, "ร้านเป้าหมาย");
  assert.equal((await container.shopRepository.findBySlug("converted-shop"))?.id, shop.id);
  // Branch carries the lead's coordinates/address (read from DB — source of truth).
  const savedBranch = await container.branchRepository.findById(branch.id);
  assert.equal(savedBranch?.latitude, 13.7);
  assert.equal(savedBranch?.address, "สยาม");
  // Lead is now linked + marked converted.
  const after = await container.leadRepository.findById(lead.id);
  assert.equal(after?.convertedShopId, shop.id);
  assert.equal(after?.status, "won");
});

test("convert rejects a non-won lead", async () => {
  const admin = await adminUser("admin-conv2@test.local");
  const lead = await container.leadRepository.create({ name: "ยังไม่ปิด" });
  await assert.rejects(
    convert().execute({
      leadId: lead.id,
      slug: "should-fail",
      ownerEmail: "x@test.local",
      ownerPassword: "password123",
      performedBy: admin.id,
    }),
    /ปิดการขายได้/,
  );
});

test("convert rejects an already-converted lead", async () => {
  const admin = await adminUser("admin-conv3@test.local");
  const lead = await container.leadRepository.create({ name: "แปลงซ้ำ" });
  await container.leadRepository.setStatus(lead.id, "won");
  await convert().execute({
    leadId: lead.id,
    slug: "once-only",
    ownerEmail: "once@test.local",
    ownerPassword: "password123",
    performedBy: admin.id,
  });
  await assert.rejects(
    convert().execute({
      leadId: lead.id,
      slug: "twice",
      ownerEmail: "twice@test.local",
      ownerPassword: "password123",
      performedBy: admin.id,
    }),
    /ถูกแปลงเป็นร้านแล้ว/,
  );
});
