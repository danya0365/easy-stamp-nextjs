/**
 * Pure, deterministic logic for the promotional-poster studio (/shop/promote).
 *
 * One "promo goal" drives BOTH:
 *   - the ready-made template copy (path A), and
 *   - the AI image-generation prompt skeleton (path B),
 * so a shop's promo stays on-concept no matter which path the owner picks.
 *
 * No I/O, no framework, no repositories — just data → strings. Mirrors the pure
 * style of topup-pricing.ts and is covered by promo-poster.test.ts.
 */

/** The marketing intent the owner is creating a poster for. */
export type PromoGoal =
  | "new_customer" // ดึงลูกค้าใหม่
  | "reward_highlight" // โปรโมทของรางวัล
  | "festival" // เทศกาล / วันสำคัญ
  | "weekday_boost" // กระตุ้นยอดวันธรรมดา
  | "reopen_news"; // เปิดใหม่ / ข่าวสารร้าน

/** Output sizes the studio can export. Pixel dims are the exported PNG size. */
export type PosterSize = "ig_square" | "story_9x16" | "a4_print" | "table_tent";

export interface PosterDimensions {
  id: PosterSize;
  label: string;
  /** Exported pixel width/height. */
  w: number;
  h: number;
  /** Human aspect phrase fed into the AI prompt (path B). */
  aspectPhrase: string;
}

/**
 * 1:1 social, 9:16 story/LINE, A4 at ~150dpi (1240×1754), and a tall A5-ish
 * table tent. Width/height drive both the preview aspect and the export size.
 */
export const POSTER_SIZES: readonly PosterDimensions[] = [
  {
    id: "ig_square",
    label: "IG / Facebook โพสต์ (1:1)",
    w: 1080,
    h: 1080,
    aspectPhrase: "square 1:1 aspect ratio",
  },
  {
    id: "story_9x16",
    label: "Story / LINE (9:16)",
    w: 1080,
    h: 1920,
    aspectPhrase: "vertical 9:16 aspect ratio",
  },
  {
    id: "a4_print",
    label: "A4 ปรินต์",
    w: 1240,
    h: 1754,
    aspectPhrase: "A4 portrait poster, roughly 3:4 aspect ratio",
  },
  {
    id: "table_tent",
    label: "ป้ายตั้งโต๊ะ",
    w: 1004,
    h: 1417,
    aspectPhrase: "tall A5 table-tent card, portrait",
  },
];

export function getPosterSize(id: PosterSize): PosterDimensions {
  const size = POSTER_SIZES.find((s) => s.id === id);
  if (!size) throw new Error(`Unknown poster size: ${id}`);
  return size;
}

export interface PromoGoalPreset {
  goal: PromoGoal;
  /** Thai label shown in the goal selector. */
  label: string;
  /** Short helper line under the label. */
  hint: string;
  /** Path A — hero copy (may contain {shopName}/{reward}/{threshold}). */
  headline: string;
  /** Path A — supporting line under the headline. */
  subcopy: string;
  /**
   * Path A — reassurance line above the QR. Emphasizes that customers earn
   * stamps automatically at the shop — NO signup / login / app / scan-to-earn.
   */
  valueLine: string;
  /** Path B — LOCKED mood segment of the AI prompt. */
  promptMood: string;
  /** Path B — EDITABLE default "vibe/detail" the owner can tweak. */
  promptVibeSeed: string;
}

/**
 * The five presets. Each one feeds template copy (A) AND the AI prompt vibe (B)
 * from a single selection, which is what keeps the concept consistent.
 *
 * Copy reflects how Easy Stamp actually works: the customer buys at the shop and
 * staff add stamps on the spot. Customers do NOT register, log in, install an
 * app, or scan to earn — so copy never says "สมัครสมาชิก / สแกนเพื่อสมัคร".
 */
export const PROMO_GOAL_PRESETS: readonly PromoGoalPreset[] = [
  {
    goal: "new_customer",
    label: "ดึงลูกค้าใหม่",
    hint: "ชวนลูกค้าใหม่มาสะสมแสตมป์",
    headline: "ซื้อที่ร้าน รับแสตมป์ทันที",
    subcopy: "สะสมครบ {threshold} ดวง แลกฟรี {reward}",
    valueLine: "ไม่ต้องสมัคร ไม่ต้องโหลดแอป — รับแสตมป์ที่ร้านได้เลย",
    promptMood: "warm, welcoming, friendly mood",
    promptVibeSeed: "ภาพต้อนรับอบอุ่น บรรยากาศเป็นมิตร ชวนเข้าร้าน",
  },
  {
    goal: "reward_highlight",
    label: "โปรโมทของรางวัล",
    hint: "เน้นของรางวัลที่แลกได้",
    headline: "สะสม {threshold} ดวง แลกฟรี {reward}",
    subcopy: "ที่ {shopName} — ยิ่งซื้อ ยิ่งคุ้ม",
    valueLine: "ซื้อรับแสตมป์ทุกครั้ง สะสมครบแลกได้เลย",
    promptMood: "appetizing, premium, eye-catching mood",
    promptVibeSeed: "ของรางวัลเด่นกลางภาพ ดูน่ารับประทาน/น่าใช้ แสงสวย",
  },
  {
    goal: "festival",
    label: "เทศกาล / วันสำคัญ",
    hint: "โปรช่วงเทศกาล",
    headline: "ฉลองเทศกาลกับ {shopName}",
    subcopy: "ซื้อรับแสตมป์ สะสมครบ {threshold} ดวง แลกฟรี {reward}",
    valueLine: "รับแสตมป์ทันทีหน้าร้าน ช่วงเทศกาลนี้",
    promptMood: "festive, celebratory, vibrant mood",
    promptVibeSeed: "บรรยากาศเทศกาล โทนสีสดใส มีของตกแต่งตามฤดูกาล",
  },
  {
    goal: "weekday_boost",
    label: "กระตุ้นวันธรรมดา",
    hint: "เพิ่มลูกค้าวันคนน้อย",
    headline: "วันธรรมดาแวะรับแสตมป์ที่ {shopName}",
    subcopy: "สะสมครบ {threshold} ดวง แลกฟรี {reward}",
    valueLine: "ซื้อรับแสตมป์ทันที ง่ายๆ ที่ร้าน",
    promptMood: "relaxed, cozy, easygoing mood",
    promptVibeSeed: "ภาพสบายๆ ผ่อนคลายกลางสัปดาห์ บรรยากาศนั่งชิล",
  },
  {
    goal: "reopen_news",
    label: "เปิดใหม่ / ข่าวสาร",
    hint: "ประกาศข่าว เปิดร้าน/สาขาใหม่",
    headline: "{shopName} เปิดให้สะสมแสตมป์แล้ว!",
    subcopy: "ซื้อรับแสตมป์ สะสมครบ {threshold} ดวง แลกฟรี {reward}",
    valueLine: "รับแสตมป์ที่ร้านได้เลย ไม่ต้องสมัคร ไม่ต้องสแกน",
    promptMood: "fresh, exciting, announcement mood",
    promptVibeSeed: "ภาพประกาศข่าว สดใหม่ น่าตื่นเต้น ดูเป็นทางการนิดๆ",
  },
];

export function getPromoPreset(goal: PromoGoal): PromoGoalPreset {
  const preset = PROMO_GOAL_PRESETS.find((p) => p.goal === goal);
  if (!preset) throw new Error(`Unknown promo goal: ${goal}`);
  return preset;
}

/** Shop facts available to fill template copy and seed AI prompts. */
export interface PromoCopyContext {
  shopName: string;
  /** Reward text for the chosen stamp track (or shop default). */
  rewardText: string;
  /** Stamps needed to earn the reward. */
  stampThreshold: number;
}

/** Replace {shopName}/{reward}/{threshold} placeholders with shop data. */
function fill(template: string, ctx: PromoCopyContext): string {
  return template
    .replaceAll("{shopName}", ctx.shopName)
    .replaceAll("{reward}", ctx.rewardText)
    .replaceAll("{threshold}", String(ctx.stampThreshold));
}

export interface TemplateCopy {
  headline: string;
  subcopy: string;
  /** Reassurance line above the QR (earn-at-shop, no signup). */
  valueLine: string;
}

/** Path A: resolve a preset's copy block against the shop's data. */
export function buildTemplateCopy(
  goal: PromoGoal,
  ctx: PromoCopyContext,
): TemplateCopy {
  const preset = getPromoPreset(goal);
  return {
    headline: fill(preset.headline, ctx),
    subcopy: fill(preset.subcopy, ctx),
    valueLine: fill(preset.valueLine, ctx),
  };
}

export interface PromptSegments {
  /** Fixed segments that keep the image on-concept — owner cannot edit these. */
  locked: {
    style: string;
    mood: string;
    noText: string;
    aspect: string;
  };
  /** Owner-editable detail seeds. */
  editable: {
    subject: string;
    vibe: string;
  };
}

const LOCKED_STYLE =
  "professional marketing poster background, clean composition, high detail, photorealistic, soft studio lighting";

/**
 * Critical concept-lock: forbids garbled text and reserves empty space so the
 * shop's QR + reward overlay (the CTA layer) can sit on top without clutter.
 */
const LOCKED_NO_TEXT =
  "no text, no letters, no words, no logos, no garbled typography; leave clear empty space in the lower third for an overlay";

/** Path B: build the segmented prompt from goal + shop data + target size. */
export function buildAiPromptSegments(
  goal: PromoGoal,
  ctx: PromoCopyContext,
  size: PosterSize,
): PromptSegments {
  const preset = getPromoPreset(goal);
  const dims = getPosterSize(size);
  return {
    locked: {
      style: LOCKED_STYLE,
      mood: preset.promptMood,
      noText: LOCKED_NO_TEXT,
      aspect: dims.aspectPhrase,
    },
    editable: {
      subject: `ภาพสำหรับร้าน "${ctx.shopName}" — ใส่รายละเอียดสินค้า/บรรยากาศที่ต้องการ`,
      vibe: preset.promptVibeSeed,
    },
  };
}

/**
 * Flatten segments (locked + possibly-edited editable) into the final prompt
 * string the owner copies into their AI tool. The locked "no text" + aspect
 * segments are ALWAYS present, even after the owner edits the editable fields.
 */
export function composeAiPrompt(segments: PromptSegments): string {
  const { locked, editable } = segments;
  return [
    editable.subject.trim(),
    editable.vibe.trim(),
    locked.style,
    locked.mood,
    locked.aspect,
    locked.noText,
  ]
    .filter((part) => part.length > 0)
    .join(", ");
}
