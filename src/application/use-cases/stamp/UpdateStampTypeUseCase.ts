import type { StampType } from "@/src/domain/entities";
import type { IStampTypeRepository } from "@/src/application/repositories/IStampTypeRepository";

export interface UpdateStampTypeFields {
  name?: string;
  threshold?: number;
  rewardText?: string;
  priceSatang?: number | null;
}

/** Edit a shop's stamp type (shop-scoped). */
export class UpdateStampTypeUseCase {
  constructor(private readonly stampTypes: IStampTypeRepository) {}

  async execute(
    shopId: string,
    typeId: string,
    fields: UpdateStampTypeFields,
  ): Promise<StampType> {
    const type = await this.stampTypes.findById(typeId);
    if (!type || type.shopId !== shopId) {
      throw new Error("ไม่พบประเภทแสตมป์ในร้านนี้");
    }
    if (fields.name !== undefined && !fields.name.trim()) {
      throw new Error("กรุณาตั้งชื่อประเภทแสตมป์");
    }
    if (fields.threshold !== undefined) {
      const t = Math.floor(fields.threshold);
      if (!Number.isFinite(t) || t < 1 || t > 100) {
        throw new Error("จำนวนสะสมต้องอยู่ระหว่าง 1–100");
      }
    }
    return this.stampTypes.update(typeId, {
      ...(fields.name !== undefined ? { name: fields.name.trim() } : {}),
      ...(fields.threshold !== undefined
        ? { threshold: Math.floor(fields.threshold) }
        : {}),
      ...(fields.rewardText !== undefined
        ? { rewardText: fields.rewardText.trim() }
        : {}),
      ...(fields.priceSatang !== undefined
        ? { priceSatang: fields.priceSatang }
        : {}),
    });
  }
}
