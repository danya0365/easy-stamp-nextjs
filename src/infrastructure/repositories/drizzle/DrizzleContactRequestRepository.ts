import { asc, desc, eq, count } from "drizzle-orm";
import { db, schema } from "@/src/infrastructure/db/client";
import type { ContactRequest, ContactRequestStatus } from "@/src/domain/entities";
import type {
  CreateContactRequestInput,
  IContactRequestRepository,
} from "@/src/application/repositories/IContactRequestRepository";

type Row = typeof schema.contactRequests.$inferSelect;

function toContactRequest(r: Row): ContactRequest {
  return {
    id: r.id,
    shopId: r.shopId,
    createdBy: r.createdBy,
    subject: r.subject,
    message: r.message,
    contactChannel: r.contactChannel,
    status: r.status,
    resolvedBy: r.resolvedBy,
    resolvedAt: r.resolvedAt,
    createdAt: r.createdAt,
  };
}

export class DrizzleContactRequestRepository
  implements IContactRequestRepository
{
  async create(input: CreateContactRequestInput): Promise<ContactRequest> {
    const [r] = await db
      .insert(schema.contactRequests)
      .values({
        shopId: input.shopId,
        createdBy: input.createdBy,
        subject: input.subject,
        message: input.message,
        contactChannel: input.contactChannel,
      })
      .returning();
    return toContactRequest(r);
  }

  async listRecent(limit = 50): Promise<ContactRequest[]> {
    const rows = await db.query.contactRequests.findMany({
      // open before resolved, then newest first.
      orderBy: [
        asc(schema.contactRequests.status),
        desc(schema.contactRequests.createdAt),
      ],
      limit,
    });
    return rows.map(toContactRequest);
  }

  async countByStatus(status: ContactRequestStatus): Promise<number> {
    const [r] = await db
      .select({ value: count() })
      .from(schema.contactRequests)
      .where(eq(schema.contactRequests.status, status));
    return r?.value ?? 0;
  }

  async resolve(id: string, resolvedBy: string): Promise<void> {
    await db
      .update(schema.contactRequests)
      .set({ status: "resolved", resolvedBy, resolvedAt: new Date().toISOString() })
      .where(eq(schema.contactRequests.id, id));
  }
}
