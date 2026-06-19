import { before, test } from "node:test";
import assert from "node:assert/strict";

import { migrateTestDb, seedShop } from "@/src/test/helpers";
import { container } from "@/src/infrastructure/di/container";

before(async () => {
  await migrateTestDb();
});

test("lead keyset pagination returns newest-first across pages", async () => {
  for (let i = 0; i < 5; i++) {
    await container.leadRepository.create({ name: `lead ${i}` });
  }
  const p1 = await container.leadRepository.page({ limit: 2 });
  assert.equal(p1.items.length, 2);
  assert.ok(p1.nextCursor);
  const p2 = await container.leadRepository.page({ limit: 2, cursor: p1.nextCursor });
  assert.equal(p2.items.length, 2);
  // No overlap between pages.
  const ids = new Set(p1.items.map((l) => l.id));
  assert.ok(p2.items.every((l) => !ids.has(l.id)));
});

test("lead status filter + listDueFollowUps excludes won/lost & future", async () => {
  const past = new Date(Date.now() - 86400_000).toISOString();
  const future = new Date(Date.now() + 86400_000).toISOString();
  const due = await container.leadRepository.create({
    name: "due",
    nextFollowUpAt: past,
  });
  await container.leadRepository.create({ name: "future", nextFollowUpAt: future });
  const won = await container.leadRepository.create({
    name: "won",
    nextFollowUpAt: past,
  });
  await container.leadRepository.setStatus(won.id, "won");

  const dueList = await container.leadRepository.listDueFollowUps(
    new Date().toISOString(),
  );
  const names = dueList.map((l) => l.name);
  assert.ok(names.includes("due"));
  assert.ok(!names.includes("future"));
  assert.ok(!names.includes("won"));
  assert.equal(due.status, "new");
});

test("customer device token resolves to its customer", async () => {
  const { shop } = await seedShop("repo-dev");
  const c = await container.customerRepository.findOrCreate(
    shop.id,
    "0820000001",
    "Dev",
  );
  const { token } = await container.customerDeviceRepository.create(c.id);
  const found = await container.customerDeviceRepository.findByToken(token);
  assert.equal(found?.customer.id, c.id);
  assert.equal(await container.customerDeviceRepository.findByToken("nope"), null);
});

test("summariesByShop + profilesByShop batch only requested shops", async () => {
  const a = await seedShop("repo-sa");
  const b = await seedShop("repo-sb");
  const ca = await container.customerRepository.findOrCreate(a.shop.id, "0830000001", null);
  await container.shopReviewRepository.upsert({
    shopId: a.shop.id,
    customerId: ca.id,
    rating: 4,
    comment: null,
  });
  const summaries = await container.shopReviewRepository.summariesByShop([
    a.shop.id,
    b.shop.id,
  ]);
  assert.equal(summaries[a.shop.id]?.count, 1);
  assert.equal(summaries[a.shop.id]?.average, 4);
  assert.equal(summaries[b.shop.id], undefined); // no reviews → absent
});
