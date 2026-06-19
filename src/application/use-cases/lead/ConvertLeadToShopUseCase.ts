import type { Branch, Shop } from "@/src/domain/entities";
import type { ILeadRepository } from "@/src/application/repositories/ILeadRepository";
import type { ILeadVisitLogRepository } from "@/src/application/repositories/ILeadVisitLogRepository";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { IShopCategoryRepository } from "@/src/application/repositories/IShopCategoryRepository";
import type { IBranchRepository } from "@/src/application/repositories/IBranchRepository";
import type { IUserRepository } from "@/src/application/repositories/IUserRepository";
import type { ISubscriptionRepository } from "@/src/application/repositories/ISubscriptionRepository";
import type { IStampTypeRepository } from "@/src/application/repositories/IStampTypeRepository";
import type { IPasswordHasher } from "@/src/application/services/IPasswordHasher";
import { CreateShopUseCase } from "@/src/application/use-cases/shop/CreateShopUseCase";
import { CreateBranchUseCase } from "@/src/application/use-cases/shop/CreateBranchUseCase";

export interface ConvertLeadToShopInput {
  leadId: string;
  slug: string;
  ownerEmail: string;
  ownerPassword: string;
  pricePerDaySatang?: number;
  stampThreshold?: number;
  rewardText?: string;
  performedBy: string;
}

/** Default name for the first branch created from a converted lead. */
const DEFAULT_BRANCH_NAME = "สาขาหลัก";

/**
 * Turn a won lead into a real billable shop: create shop + owner + trial
 * subscription (via CreateShopUseCase), then a first branch carrying the lead's
 * coordinates/address so it appears on the public map immediately. The lead is
 * linked to the new shop and a "converted" visit log is recorded.
 *
 * Note: multiple writes without a wrapping transaction (matches CreateShopUseCase
 * house style); a mid-way failure could leave a shop created but the lead unlinked.
 */
export class ConvertLeadToShopUseCase {
  constructor(
    private readonly leads: ILeadRepository,
    private readonly leadVisitLogs: ILeadVisitLogRepository,
    private readonly shops: IShopRepository,
    private readonly users: IUserRepository,
    private readonly subscriptions: ISubscriptionRepository,
    private readonly hasher: IPasswordHasher,
    private readonly categories: IShopCategoryRepository,
    private readonly stampTypes: IStampTypeRepository,
    private readonly branches: IBranchRepository,
  ) {}

  async execute(
    input: ConvertLeadToShopInput,
  ): Promise<{ shop: Shop; branch: Branch }> {
    const lead = await this.leads.findById(input.leadId);
    if (!lead) throw new Error("ไม่พบลีด");
    if (lead.convertedShopId) {
      throw new Error("ลีดนี้ถูกแปลงเป็นร้านแล้ว");
    }
    if (lead.status !== "won") {
      throw new Error('ต้องตั้งสถานะลีดเป็น "ปิดการขายได้" ก่อนแปลงเป็นร้าน');
    }

    const shop = await new CreateShopUseCase(
      this.shops,
      this.users,
      this.subscriptions,
      this.hasher,
      this.categories,
      this.stampTypes,
    ).execute({
      name: lead.name,
      slug: input.slug,
      ownerEmail: input.ownerEmail,
      ownerPassword: input.ownerPassword,
      pricePerDaySatang: input.pricePerDaySatang,
      categoryId: lead.categoryId,
      stampThreshold: input.stampThreshold,
      rewardText: input.rewardText,
    });

    // CreateShopUseCase does not create a branch — make the first one and carry
    // the lead's location across so the new shop plots on the public map.
    const branch = await new CreateBranchUseCase(this.branches).execute(
      shop.id,
      DEFAULT_BRANCH_NAME,
    );
    if (lead.latitude !== null && lead.longitude !== null) {
      await this.branches.updateLocation(branch.id, {
        latitude: lead.latitude,
        longitude: lead.longitude,
        address: lead.address,
      });
    }

    await this.leads.markConverted(lead.id, shop.id);
    await this.leadVisitLogs.create({
      leadId: lead.id,
      reaction: "positive",
      statusBefore: lead.status,
      statusAfter: "won",
      note: `แปลงเป็นร้าน "${shop.name}" (/${shop.slug})`,
      performedBy: input.performedBy,
    });

    return { shop, branch };
  }
}
