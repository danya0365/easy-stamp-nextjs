/**
 * Pure-function tests for the multi-type card view.
 * Run: npx tsx --test src/domain/services/card-view.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { buildCardView } from "./card-view";
import type { Customer, StampBalance, StampType } from "../entities";

const customer: Customer = {
  id: "c1",
  shopId: "s1",
  phone: "0810000000",
  displayName: null,
  publicCode: "pub1",
  createdAt: "x",
  updatedAt: "x",
};

function type(id: string, threshold: number, sortOrder: number): StampType {
  return {
    id,
    shopId: "s1",
    name: id,
    threshold,
    rewardText: `reward-${id}`,
    priceSatang: null,
    isActive: true,
    isDefault: id === "A",
    sortOrder,
    createdAt: "x",
    updatedAt: "x",
  };
}

function bal(stampTypeId: string, currentStamps: number): StampBalance {
  return {
    id: `b-${stampTypeId}`,
    cardId: "card1",
    stampTypeId,
    currentStamps,
    lifetimeStamps: currentStamps,
    rewardsEarned: 0,
    updatedAt: "x",
  };
}

test("each type derives eligibility/remaining from its own threshold", () => {
  const view = buildCardView(
    [type("A", 5, 0), type("B", 10, 1)],
    customer,
    [bal("A", 5), bal("B", 3)],
  );
  assert.equal(view.types.length, 2);

  const a = view.types[0];
  assert.equal(a.type.id, "A");
  assert.equal(a.currentStamps, 5);
  assert.equal(a.eligibleToRedeem, true);
  assert.equal(a.remaining, 0);

  const b = view.types[1];
  assert.equal(b.type.id, "B");
  assert.equal(b.currentStamps, 3);
  assert.equal(b.eligibleToRedeem, false);
  assert.equal(b.remaining, 7);
});

test("a type with no balance row reads as zero", () => {
  const view = buildCardView([type("A", 5, 0)], customer, []);
  assert.equal(view.types[0].currentStamps, 0);
  assert.equal(view.types[0].eligibleToRedeem, false);
  assert.equal(view.types[0].remaining, 5);
});

test("types follow the order passed in; balances match by id (not order)", () => {
  const view = buildCardView(
    [type("A", 5, 0), type("B", 2, 1)],
    customer,
    [bal("B", 2), bal("A", 1)],
  );
  assert.equal(view.types[0].type.id, "A");
  assert.equal(view.types[0].currentStamps, 1);
  assert.equal(view.types[1].type.id, "B");
  assert.equal(view.types[1].currentStamps, 2);
  assert.equal(view.types[1].eligibleToRedeem, true);
});

test("over-threshold balance stays eligible with remaining 0", () => {
  const view = buildCardView([type("A", 5, 0)], customer, [bal("A", 8)]);
  assert.equal(view.types[0].eligibleToRedeem, true);
  assert.equal(view.types[0].remaining, 0);
});
