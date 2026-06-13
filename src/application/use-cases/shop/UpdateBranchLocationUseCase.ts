import type { Branch } from "@/src/domain/entities";
import type {
  IBranchRepository,
  UpdateBranchLocationInput,
} from "@/src/application/repositories/IBranchRepository";

export class UpdateBranchLocationUseCase {
  constructor(private readonly branches: IBranchRepository) {}

  /**
   * Sets (or clears) a branch's location. The branch must belong to `shopId`.
   * Pass null lat/lng to remove the pin from the map.
   */
  async execute(
    shopId: string,
    branchId: string,
    input: UpdateBranchLocationInput,
  ): Promise<Branch> {
    const branch = await this.branches.findById(branchId);
    if (!branch || branch.shopId !== shopId) {
      throw new Error("ไม่พบสาขาในร้านนี้");
    }

    const { latitude, longitude } = input;
    const hasLat = latitude !== null;
    const hasLng = longitude !== null;
    if (hasLat !== hasLng) {
      throw new Error("ต้องระบุทั้งละติจูดและลองจิจูด");
    }
    if (hasLat && (latitude! < -90 || latitude! > 90)) {
      throw new Error("ละติจูดต้องอยู่ระหว่าง -90 ถึง 90");
    }
    if (hasLng && (longitude! < -180 || longitude! > 180)) {
      throw new Error("ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180");
    }

    const address = input.address?.trim() || null;
    if (address && address.length > 200) {
      throw new Error("ที่อยู่ต้องไม่เกิน 200 ตัวอักษร");
    }

    return this.branches.updateLocation(branchId, { latitude, longitude, address });
  }
}
