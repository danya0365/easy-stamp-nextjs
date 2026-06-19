import { nanoid } from "nanoid";

import type { ShopImage, ShopImageKind } from "@/src/domain/entities";
import type { IShopImageRepository } from "@/src/application/repositories/IShopImageRepository";
import type { ISlipStorage } from "@/src/application/services/ISlipStorage";
import {
  extForContentType,
  shopImageKey,
} from "@/src/infrastructure/services/slip-media";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/heic"];
const MAX_GALLERY = 12;

export interface SaveShopImageInput {
  shopId: string;
  kind: ShopImageKind;
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}

/** Upload a shop profile image (replaces the old one) or add a gallery photo. */
export class SaveShopImageUseCase {
  constructor(
    private readonly images: IShopImageRepository,
    private readonly storage: ISlipStorage,
  ) {}

  async execute(input: SaveShopImageInput): Promise<ShopImage> {
    if (!ALLOWED_TYPES.includes(input.contentType)) {
      throw new Error("รองรับเฉพาะรูปภาพ (PNG/JPG/WEBP)");
    }
    if (input.bytes.byteLength === 0) throw new Error("ไม่พบไฟล์รูป");
    if (input.bytes.byteLength > MAX_IMAGE_BYTES) {
      throw new Error("ไฟล์ใหญ่เกิน 5MB");
    }

    if (input.kind === "gallery") {
      const existing = await this.images.listByShop(input.shopId);
      const galleryCount = existing.filter((i) => i.kind === "gallery").length;
      if (galleryCount >= MAX_GALLERY) {
        throw new Error(`เพิ่มรูปแกลเลอรี่ได้สูงสุด ${MAX_GALLERY} รูป`);
      }
    }

    const imageId = nanoid();
    const key = shopImageKey(
      input.shopId,
      imageId,
      extForContentType(input.contentType, input.filename),
    );
    await this.storage.saveObject({
      key,
      contentType: input.contentType,
      bytes: input.bytes,
    });

    // Profile is single — remove the previous one (row + object) first.
    if (input.kind === "profile") {
      const prev = await this.images.findProfile(input.shopId);
      if (prev) {
        await this.images.delete(prev.id);
        await this.storage.delete(prev.storageKey);
      }
    }

    return this.images.create({
      id: imageId,
      shopId: input.shopId,
      kind: input.kind,
      storageKey: key,
    });
  }
}
