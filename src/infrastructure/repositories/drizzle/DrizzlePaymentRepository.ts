import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/src/infrastructure/db/client";
import type { Payment, PaymentStatus } from "@/src/domain/entities";
import type {
  CreatePaymentInput,
  IPaymentRepository,
  ResolvePaymentInput,
} from "@/src/application/repositories/IPaymentRepository";

type Row = typeof schema.payments.$inferSelect;

function toPayment(r: Row): Payment {
  return {
    id: r.id,
    shopId: r.shopId,
    subscriptionId: r.subscriptionId,
    amountSatang: r.amountSatang,
    slipUrl: r.slipUrl,
    status: r.status,
    submittedBy: r.submittedBy,
    verifiedBy: r.verifiedBy,
    verifiedAt: r.verifiedAt,
    rejectReason: r.rejectReason,
    coversPeriodStartAt: r.coversPeriodStartAt,
    coversPeriodDueAt: r.coversPeriodDueAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export class DrizzlePaymentRepository implements IPaymentRepository {
  async create(input: CreatePaymentInput): Promise<Payment> {
    const [r] = await db
      .insert(schema.payments)
      .values({
        shopId: input.shopId,
        subscriptionId: input.subscriptionId,
        amountSatang: input.amountSatang,
        slipUrl: input.slipUrl,
        submittedBy: input.submittedBy,
        coversPeriodStartAt: input.coversPeriodStartAt,
        coversPeriodDueAt: input.coversPeriodDueAt,
      })
      .returning();
    return toPayment(r);
  }

  async findById(id: string): Promise<Payment | null> {
    const r = await db.query.payments.findFirst({
      where: eq(schema.payments.id, id),
    });
    return r ? toPayment(r) : null;
  }

  async listByShop(shopId: string, limit = 50): Promise<Payment[]> {
    const rows = await db.query.payments.findMany({
      where: eq(schema.payments.shopId, shopId),
      orderBy: desc(schema.payments.createdAt),
      limit,
    });
    return rows.map(toPayment);
  }

  async listByStatus(status: PaymentStatus): Promise<Payment[]> {
    const rows = await db.query.payments.findMany({
      where: eq(schema.payments.status, status),
      orderBy: desc(schema.payments.createdAt),
    });
    return rows.map(toPayment);
  }

  async resolve(id: string, input: ResolvePaymentInput): Promise<Payment> {
    const [r] = await db
      .update(schema.payments)
      .set({
        status: input.status,
        verifiedBy: input.verifiedBy,
        verifiedAt: input.verifiedAt,
        rejectReason: input.rejectReason ?? null,
      })
      .where(eq(schema.payments.id, id))
      .returning();
    return toPayment(r);
  }
}
