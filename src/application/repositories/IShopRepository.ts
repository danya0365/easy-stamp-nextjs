import type { Shop, ShopStatus } from "@/src/domain/entities";

export interface CreateShopInput {
  name: string;
  slug: string;
  categoryId?: string | null;
  stampThreshold?: number;
  rewardText?: string;
}

export interface UpdateShopSettingsInput {
  stampThreshold?: number;
  rewardText?: string;
}

export interface IShopRepository {
  create(input: CreateShopInput): Promise<Shop>;
  findById(id: string): Promise<Shop | null>;
  findBySlug(slug: string): Promise<Shop | null>;
  list(): Promise<Shop[]>;
  updateSettings(id: string, input: UpdateShopSettingsInput): Promise<Shop>;
  setStatus(id: string, status: ShopStatus): Promise<Shop>;
}
