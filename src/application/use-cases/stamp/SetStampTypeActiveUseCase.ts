import type { StampType } from "@/src/domain/entities";
import type { IStampTypeRepository } from "@/src/application/repositories/IStampTypeRepository";

/** Activate/deactivate a stamp type. A shop must always keep ≥1 active type. */
export class SetStampTypeActiveUseCase {
  constructor(private readonly stampTypes: IStampTypeRepository) {}

  async execute(
    shopId: string,
    typeId: string,
    isActive: boolean,
  ): Promise<StampType> {
    const type = await this.stampTypes.findById(typeId);
    if (!type || type.shopId !== shopId) {
      throw new Error("ไม่พบประเภทแสตมป์ในร้านนี้");
    }
    if (!isActive) {
      const active = await this.stampTypes.countActive(shopId);
      if (active <= 1) {
        throw new Error("ต้องมีประเภทแสตมป์ที่เปิดใช้งานอย่างน้อย 1 ประเภท");
      }
    }
    return this.stampTypes.setActive(typeId, isActive);
  }
}
