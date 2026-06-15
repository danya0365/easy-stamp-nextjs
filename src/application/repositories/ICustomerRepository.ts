import type { Customer } from "@/src/domain/entities";
import type { Page, PageOpts } from "./pagination";

export interface ICustomerRepository {
  findByPhone(shopId: string, phone: string): Promise<Customer | null>;
  /** Resolve a customer from the opaque QR code, scoped to the shop. */
  findByPublicCode(shopId: string, code: string): Promise<Customer | null>;
  /** Find an existing customer for (shop, phone) or create one. */
  findOrCreate(
    shopId: string,
    phone: string,
    displayName?: string | null,
  ): Promise<Customer>;
  listByShop(shopId: string, search?: string): Promise<Customer[]>;
  /** Cursor-paginated, newest first; optional phone/name search. */
  pageByShop(
    shopId: string,
    opts?: PageOpts & { search?: string },
  ): Promise<Page<Customer>>;
}
