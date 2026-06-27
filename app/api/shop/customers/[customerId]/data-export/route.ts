import { requireShopWrite } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { ExportCustomerDataUseCase } from "@/src/application/use-cases/customer/ExportCustomerDataUseCase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PDPA data-access export: a shop owner (or impersonating admin) downloads
 * everything the shop holds about one of its customers as JSON. Scoped to the
 * caller's shop — a customer id from another shop resolves to "not found".
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ customerId: string }> },
) {
  let shopId: string;
  try {
    ({ shopId } = await requireShopWrite());
  } catch {
    return new Response("Unauthorized", { status: 403 });
  }

  const { customerId } = await params;
  try {
    const data = await new ExportCustomerDataUseCase(
      container.shopRepository,
      container.customerRepository,
      container.stampCardRepository,
      container.stampBalanceRepository,
      container.stampTypeRepository,
      container.stampTransactionRepository,
      container.rewardRedemptionRepository,
      container.shopReviewRepository,
    ).execute(shopId, customerId);

    return Response.json(data, {
      headers: {
        "Content-Disposition": `attachment; filename="customer-${customerId}-data.json"`,
      },
    });
  } catch (e) {
    return new Response((e as Error).message, { status: 404 });
  }
}
