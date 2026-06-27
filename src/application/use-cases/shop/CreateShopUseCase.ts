import type { Branch, Shop } from "@/src/domain/entities";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { IShopCategoryRepository } from "@/src/application/repositories/IShopCategoryRepository";
import type { IUserRepository } from "@/src/application/repositories/IUserRepository";
import type { ISubscriptionRepository } from "@/src/application/repositories/ISubscriptionRepository";
import type { IStampTypeRepository } from "@/src/application/repositories/IStampTypeRepository";
import type { IBranchRepository } from "@/src/application/repositories/IBranchRepository";
import type { IPasswordHasher } from "@/src/application/services/IPasswordHasher";
import { DEFAULT_PRICE_PER_DAY_SATANG } from "@/src/domain/services/topup-pricing";

/** New shops get a free trial before their first top-up is required. */
const TRIAL_DAYS = 30;

/** Name of the first branch every shop is created with (location set later). */
export const DEFAULT_BRANCH_NAME = "สาขาหลัก";

export interface CreateShopInput {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerPassword: string;
  pricePerDaySatang?: number;
  categoryId?: string | null;
  stampThreshold?: number;
  rewardText?: string;
}

/**
 * Onboard a new tenant: shop + owner account + 30-day trial subscription +
 * default stamp type + a first branch ("สาขาหลัก", location unset). The branch
 * is created here so EVERY entry point (admin form + lead convert) gets one —
 * without it, staff can't be added.
 */
export class CreateShopUseCase {
  constructor(
    private readonly shops: IShopRepository,
    private readonly users: IUserRepository,
    private readonly subscriptions: ISubscriptionRepository,
    private readonly hasher: IPasswordHasher,
    private readonly categories: IShopCategoryRepository,
    private readonly stampTypes: IStampTypeRepository,
    private readonly branches: IBranchRepository,
  ) {}

  async execute(input: CreateShopInput): Promise<{ shop: Shop; branch: Branch }> {
    const slug = input.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    if (slug.length < 2) throw new Error("slug ต้องมีอย่างน้อย 2 ตัวอักษร");

    const email = input.ownerEmail.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new Error("อีเมลเจ้าของร้านไม่ถูกต้อง");
    }
    if (input.ownerPassword.length < 6) {
      throw new Error("รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร");
    }
    const pricePerDaySatang =
      input.pricePerDaySatang && input.pricePerDaySatang > 0
        ? Math.round(input.pricePerDaySatang)
        : DEFAULT_PRICE_PER_DAY_SATANG;
    if (await this.shops.findBySlug(slug)) {
      throw new Error("slug นี้ถูกใช้แล้ว");
    }
    if (await this.users.findByEmailWithSecret(email)) {
      throw new Error("อีเมลนี้ถูกใช้งานแล้ว");
    }

    let categoryId: string | null = null;
    if (input.categoryId) {
      const category = await this.categories.findById(input.categoryId);
      if (!category) throw new Error("ไม่พบหมวดหมู่ร้านที่เลือก");
      categoryId = category.id;
    }

    const shop = await this.shops.create({
      name: input.name.trim(),
      slug,
      categoryId,
      stampThreshold: input.stampThreshold ?? 10,
      rewardText: input.rewardText ?? "",
    });

    // Every shop starts with one default stamp type (the source of truth going
    // forward; shop.stampThreshold/rewardText are kept only as legacy seed).
    await this.stampTypes.create({
      shopId: shop.id,
      name: "แสตมป์",
      threshold: input.stampThreshold ?? 10,
      rewardText: input.rewardText ?? "",
      isDefault: true,
      isActive: true,
      sortOrder: 0,
    });

    const now = Date.now();
    await this.subscriptions.create({
      shopId: shop.id,
      pricePerDaySatang,
      status: "trialing",
      currentPeriodStartAt: new Date(now).toISOString(),
      currentPeriodDueAt: new Date(now + TRIAL_DAYS * 864e5).toISOString(),
    });

    const passwordHash = await this.hasher.hash(input.ownerPassword);
    await this.users.create({
      email,
      passwordHash,
      role: "shop_owner",
      shopId: shop.id,
      branchId: null,
    });

    // First branch (no coordinates yet — set later from /shop/branches; a
    // branch without a location simply doesn't appear on the public map).
    const branch = await this.branches.create({
      shopId: shop.id,
      name: DEFAULT_BRANCH_NAME,
    });

    return { shop, branch };
  }
}
