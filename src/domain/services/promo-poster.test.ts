/**
 * Pure-function tests. Run via Node's built-in runner + tsx:
 *   node scripts/test.mjs   (enumerates *.test.ts under src/)
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  PROMO_GOAL_PRESETS,
  POSTER_SIZES,
  getPosterSize,
  getPromoPreset,
  buildTemplateCopy,
  buildAiPromptSegments,
  composeAiPrompt,
  type PromoCopyContext,
  type PromoGoal,
  type PosterSize,
} from "./promo-poster";

const CTX: PromoCopyContext = {
  shopName: "ร้านกาแฟดีดี",
  rewardText: "กาแฟร้อน 1 แก้ว",
  stampThreshold: 10,
};

const ALL_GOALS: PromoGoal[] = PROMO_GOAL_PRESETS.map((p) => p.goal);
const ALL_SIZES: PosterSize[] = POSTER_SIZES.map((s) => s.id);

test("every preset is resolvable and has non-empty copy + prompt seeds", () => {
  assert.equal(PROMO_GOAL_PRESETS.length, 5);
  for (const goal of ALL_GOALS) {
    const p = getPromoPreset(goal);
    assert.ok(p.label.length > 0, `${goal} label`);
    assert.ok(p.headline.length > 0, `${goal} headline`);
    assert.ok(p.ctaText.length > 0, `${goal} cta`);
    assert.ok(p.promptMood.length > 0, `${goal} mood`);
    assert.ok(p.promptVibeSeed.length > 0, `${goal} vibe`);
  }
});

test("unknown goal / size throw", () => {
  assert.throws(() => getPromoPreset("nope" as PromoGoal));
  assert.throws(() => getPosterSize("nope" as PosterSize));
});

test("template copy substitutes every placeholder (no stray braces)", () => {
  for (const goal of ALL_GOALS) {
    const copy = buildTemplateCopy(goal, CTX);
    for (const line of [copy.headline, copy.subcopy, copy.ctaText]) {
      assert.ok(!/[{}]/.test(line), `unsubstituted placeholder in: ${line}`);
    }
  }
});

test("template copy actually injects shop data", () => {
  // reward_highlight headline = "สะสม {threshold} ดวง แลกฟรี {reward}"
  const copy = buildTemplateCopy("reward_highlight", CTX);
  assert.ok(copy.headline.includes("10"), "threshold injected");
  assert.ok(copy.headline.includes("กาแฟร้อน 1 แก้ว"), "reward injected");
  // new_customer headline references the shop name.
  assert.ok(
    buildTemplateCopy("new_customer", CTX).headline.includes("ร้านกาแฟดีดี"),
    "shopName injected",
  );
});

test("AI prompt aspect segment matches each size", () => {
  for (const size of ALL_SIZES) {
    const segs = buildAiPromptSegments("festival", CTX, size);
    assert.equal(segs.locked.aspect, getPosterSize(size).aspectPhrase);
  }
});

test("composeAiPrompt always keeps locked no-text + aspect, even after edits", () => {
  const segs = buildAiPromptSegments("new_customer", CTX, "ig_square");
  // Owner edits the editable fields freely.
  segs.editable.subject = "ลาเต้อาร์ตในแก้วใส";
  segs.editable.vibe = "โทนพาสเทล";
  const prompt = composeAiPrompt(segs);

  assert.ok(prompt.includes("ลาเต้อาร์ตในแก้วใส"), "edited subject kept");
  assert.ok(prompt.includes("โทนพาสเทล"), "edited vibe kept");
  assert.ok(prompt.includes(segs.locked.noText), "locked no-text kept");
  assert.ok(prompt.includes(segs.locked.aspect), "locked aspect kept");
  assert.ok(prompt.includes(segs.locked.style), "locked style kept");
});

test("composeAiPrompt drops empty editable parts without leaving dangling commas", () => {
  const segs = buildAiPromptSegments("weekday_boost", CTX, "story_9x16");
  segs.editable.subject = "";
  segs.editable.vibe = "";
  const prompt = composeAiPrompt(segs);
  assert.ok(!prompt.includes(", ,"), "no empty segment artifacts");
  assert.ok(!prompt.startsWith(","), "no leading comma");
  // Locked segments still present.
  assert.ok(prompt.includes(segs.locked.noText));
});

test("all poster sizes have positive pixel dimensions", () => {
  assert.equal(POSTER_SIZES.length, 4);
  for (const s of POSTER_SIZES) {
    assert.ok(s.w > 0 && s.h > 0, `${s.id} dims`);
    assert.ok(s.aspectPhrase.length > 0, `${s.id} aspect phrase`);
  }
});
