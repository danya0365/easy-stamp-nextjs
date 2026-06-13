import type { Shop } from "@/src/domain/entities";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";

export interface UpdateSettingsInput {
  stampThreshold: number;
  rewardText: string;
}

export class UpdateShopSettingsUseCase {
  constructor(private readonly shops: IShopRepository) {}

  async execute(shopId: string, input: UpdateSettingsInput): Promise<Shop> {
    const threshold = Math.floor(input.stampThreshold);
    if (!Number.isFinite(threshold) || threshold < 1 || threshold > 100) {
      throw new Error("เกณฑ์แสตมป์ต้องอยู่ระหว่าง 1–100");
    }
    const rewardText = input.rewardText.trim();
    if (rewardText.length > 200) {
      throw new Error("ข้อความรางวัลต้องไม่เกิน 200 ตัวอักษร");
    }
    return this.shops.updateSettings(shopId, {
      stampThreshold: threshold,
      rewardText,
    });
  }
}
