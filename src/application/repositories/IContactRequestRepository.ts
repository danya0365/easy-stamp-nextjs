import type { ContactRequest, ContactRequestStatus } from "@/src/domain/entities";
import type { Page, PageOpts } from "./pagination";

export interface CreateContactRequestInput {
  shopId: string;
  createdBy: string;
  subject: string;
  message: string;
  contactChannel: string;
}

export interface IContactRequestRepository {
  create(input: CreateContactRequestInput): Promise<ContactRequest>;
  /** Recent requests across all shops. open-first then newest (admin inbox). */
  listRecent(limit?: number): Promise<ContactRequest[]>;
  /** All still-open requests, newest first (admin inbox — always small). */
  listOpen(): Promise<ContactRequest[]>;
  /** Cursor-paginated resolved requests, newest first (admin inbox tail). */
  pageResolved(opts?: PageOpts): Promise<Page<ContactRequest>>;
  /** A single shop's requests, newest first (owner status view). */
  listByShop(shopId: string, limit?: number): Promise<ContactRequest[]>;
  /** The shop's most recent request, or null — used for anti-spam guards. */
  findLatestByShop(shopId: string): Promise<ContactRequest | null>;
  countByStatus(status: ContactRequestStatus): Promise<number>;
  /** Mark resolved; returns the updated row (or null if not found). */
  resolve(id: string, resolvedBy: string): Promise<ContactRequest | null>;
}
