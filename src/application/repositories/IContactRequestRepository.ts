import type { ContactRequest, ContactRequestStatus } from "@/src/domain/entities";

export interface CreateContactRequestInput {
  shopId: string;
  createdBy: string;
  subject: string;
  message: string;
  contactChannel: string;
}

export interface IContactRequestRepository {
  create(input: CreateContactRequestInput): Promise<ContactRequest>;
  /** Recent requests, optionally filtered by status. open-first then newest. */
  listRecent(limit?: number): Promise<ContactRequest[]>;
  countByStatus(status: ContactRequestStatus): Promise<number>;
  resolve(id: string, resolvedBy: string): Promise<void>;
}
