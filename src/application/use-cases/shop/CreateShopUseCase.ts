import type { Shop } from "@/src/domain/entities";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { IShopCategoryRepository } from "@/src/application/repositories/IShopCategoryRepository";
import type { IUserRepository } from "@/src/application/repositories/IUserRepository";
import type { ISubscriptionRepository } from "@/src/application/repositories/ISubscriptionRepository";
import type { IPasswordHasher } from "@/src/application/services/IPasswordHasher";

const PERIOD_DAYS = 30;

export interface CreateShopInput {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerPassword: string;
  amountSatang: number;
  categoryId?: string | null;
  stampThreshold?: number;
  rewardText?: string;
}

/** Onboard a new tenant: shop + owner account + monthly subscription. */
export class CreateShopUseCase {
  constructor(
    private readonly shops: IShopRepository,
    private readonly users: IUserRepository,
    private readonly subscriptions: ISubscriptionRepository,
    private readonly hasher: IPasswordHasher,
    private readonly categories: IShopCategoryRepository,
  ) {}

  async execute(input: CreateShopInput): Promise<Shop> {
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
    if (!Number.isFinite(input.amountSatang) || input.amountSatang < 0) {
      throw new Error("ยอดค่าบริการไม่ถูกต้อง");
    }
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

    const now = Date.now();
    await this.subscriptions.create({
      shopId: shop.id,
      amountSatang: input.amountSatang,
      status: "active",
      currentPeriodStartAt: new Date(now).toISOString(),
      currentPeriodDueAt: new Date(now + PERIOD_DAYS * 864e5).toISOString(),
    });

    const passwordHash = await this.hasher.hash(input.ownerPassword);
    await this.users.create({
      email,
      passwordHash,
      role: "shop_owner",
      shopId: shop.id,
      branchId: null,
    });

    return shop;
  }
}
