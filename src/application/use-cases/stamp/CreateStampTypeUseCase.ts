import type { StampType } from "@/src/domain/entities";
import type { IStampTypeRepository } from "@/src/application/repositories/IStampTypeRepository";

export interface CreateStampTypeInput {
  shopId: string;
  name: string;
  threshold: number;
  rewardText: string;
  priceSatang?: number | null;
}

const MAX_TYPES_PER_SHOP = 20;

/** Add a new stamp type to a shop. */
export class CreateStampTypeUseCase {
  constructor(private readonly stampTypes: IStampTypeRepository) {}

  async execute(input: CreateStampTypeInput): Promise<StampType> {
    const name = input.name.trim();
    if (!name) throw new Error("กรุณาตั้งชื่อประเภทแสตมป์");
    const threshold = Math.floor(input.threshold);
    if (!Number.isFinite(threshold) || threshold < 1 || threshold > 100) {
      throw new Error("จำนวนสะสมต้องอยู่ระหว่าง 1–100");
    }

    const existing = await this.stampTypes.listByShop(input.shopId);
    if (existing.length >= MAX_TYPES_PER_SHOP) {
      throw new Error(`มีประเภทแสตมป์ได้สูงสุด ${MAX_TYPES_PER_SHOP} ประเภท`);
    }

    return this.stampTypes.create({
      shopId: input.shopId,
      name,
      threshold,
      rewardText: input.rewardText.trim(),
      priceSatang: input.priceSatang ?? null,
      isActive: true,
      isDefault: false,
      sortOrder: existing.length,
    });
  }
}
