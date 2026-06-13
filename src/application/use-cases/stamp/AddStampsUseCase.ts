import type { CustomerCardView } from "@/src/domain/entities";
import { buildCardView } from "@/src/domain/services/card-view";
import { normalizePhone, isValidThaiPhone } from "@/src/domain/services/phone";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { ICustomerRepository } from "@/src/application/repositories/ICustomerRepository";
import type { IStampCardRepository } from "@/src/application/repositories/IStampCardRepository";
import type { IStampTransactionRepository } from "@/src/application/repositories/IStampTransactionRepository";

export interface AddStampsInput {
  shopId: string;
  branchId?: string | null;
  phone: string;
  quantity: number;
  performedBy: string;
  displayName?: string | null;
  note?: string | null;
}

const MAX_PER_TX = 50;

/** Add N stamps to a customer's card (creating customer/card on first visit). */
export class AddStampsUseCase {
  constructor(
    private readonly shops: IShopRepository,
    private readonly customers: ICustomerRepository,
    private readonly cards: IStampCardRepository,
    private readonly transactions: IStampTransactionRepository,
  ) {}

  async execute(input: AddStampsInput): Promise<CustomerCardView> {
    const quantity = Math.floor(input.quantity);
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_PER_TX) {
      throw new Error(`จำนวนแสตมป์ต้องอยู่ระหว่าง 1–${MAX_PER_TX}`);
    }
    const phone = normalizePhone(input.phone);
    if (!isValidThaiPhone(phone)) {
      throw new Error("เบอร์โทรไม่ถูกต้อง");
    }

    const shop = await this.shops.findById(input.shopId);
    if (!shop) throw new Error("ไม่พบร้านค้า");

    const customer = await this.customers.findOrCreate(
      input.shopId,
      phone,
      input.displayName,
    );
    const card = await this.cards.findOrCreate(input.shopId, customer.id);
    const updated = await this.cards.addStamps(card.id, quantity);

    await this.transactions.create({
      shopId: input.shopId,
      branchId: input.branchId ?? null,
      customerId: customer.id,
      cardId: card.id,
      type: "earn",
      quantity,
      performedBy: input.performedBy,
      note: input.note ?? null,
    });

    return buildCardView(shop, customer, updated);
  }
}
