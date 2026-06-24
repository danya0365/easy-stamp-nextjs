import { before, test } from "node:test";
import assert from "node:assert/strict";

import { migrateTestDb, seedShop } from "@/src/test/helpers";
import { container } from "@/src/infrastructure/di/container";
import { AddStampsUseCase } from "@/src/application/use-cases/stamp/AddStampsUseCase";
import { AnonymizeCustomerUseCase } from "./AnonymizeCustomerUseCase";

before(migrateTestDb);

function addStamps() {
  return new AddStampsUseCase(
    container.shopRepository,
    container.customerRepository,
    container.stampCardRepository,
    container.stampTypeRepository,
    container.stampBalanceRepository,
    container.stampTransactionRepository,
  );
}

function anonymize() {
  return new AnonymizeCustomerUseCase(
    container.customerRepository,
    container.customerDeviceRepository,
  );
}

test("erasure strips PII + device bindings but keeps stamp aggregates", async () => {
  const { shop, defaultType, ownerId } = await seedShop("erase-a");
  const phone = "0830000010";
  await addStamps().execute({
    shopId: shop.id,
    phone,
    stampTypeId: defaultType.id,
    quantity: 4,
    performedBy: ownerId,
  });
  const customer = (await container.customerRepository.findByPhone(shop.id, phone))!;
  const card = (await container.stampCardRepository.findByCustomer(shop.id, customer.id))!;
  const { token } = await container.customerDeviceRepository.create(customer.id);

  await anonymize().execute(shop.id, customer.id);

  // PII gone: the real phone + public code + device token no longer resolve.
  assert.equal(await container.customerRepository.findByPhone(shop.id, phone), null);
  assert.equal(
    await container.customerRepository.findByPublicCode(shop.id, customer.publicCode),
    null,
  );
  assert.equal(await container.customerDeviceRepository.findByToken(token), null);

  // Row still exists (tombstoned) so aggregates stay consistent.
  const after = (await container.customerRepository.findById(shop.id, customer.id))!;
  assert.equal(after.displayName, "(ลบข้อมูลแล้ว)");
  assert.notEqual(after.phone, phone);
  const bal = await container.stampBalanceRepository.findByCardAndType(card.id, defaultType.id);
  assert.equal(bal?.currentStamps, 4); // stamp history preserved
});

test("a shop cannot erase another shop's customer", async () => {
  const a = await seedShop("erase-x");
  const b = await seedShop("erase-y");
  const phone = "0830000011";
  await addStamps().execute({
    shopId: a.shop.id,
    phone,
    stampTypeId: a.defaultType.id,
    quantity: 1,
    performedBy: a.ownerId,
  });
  const customerA = (await container.customerRepository.findByPhone(a.shop.id, phone))!;

  await assert.rejects(anonymize().execute(b.shop.id, customerA.id), /ไม่พบลูกค้า/);
  // A's customer is untouched.
  assert.ok(await container.customerRepository.findByPhone(a.shop.id, phone));
});
