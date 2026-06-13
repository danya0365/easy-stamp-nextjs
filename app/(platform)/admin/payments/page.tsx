import Link from "next/link";
import { CircleCheck } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { PaymentReview } from "@/src/presentation/components/admin/PaymentReview";
import { satangToBaht } from "@/src/presentation/lib/money";

export const dynamic = "force-dynamic";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPaymentsPage() {
  await requireRole("platform_admin");
  const pending = await container.paymentRepository.listByStatus("pending");
  const shops = await container.shopRepository.list();
  const shopName = new Map(shops.map((s) => [s.id, s.name]));

  return (
    <Card>
      <CardHeader title={`คิวตรวจสอบการชำระเงิน (${pending.length})`} />
      {pending.length === 0 ? (
        <EmptyState icon={<CircleCheck />} title="ไม่มีรายการรอตรวจสอบ" />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {pending.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="font-medium text-foreground">
                  {shopName.get(p.shopId) ?? p.shopId}
                </p>
                <p className="text-sm text-muted">
                  ฿{satangToBaht(p.amountSatang)} · {fmtDate(p.createdAt)}
                </p>
                <Link
                  href={`/api/slips/${p.id}`}
                  target="_blank"
                  className="text-xs text-brand-600 hover:underline"
                >
                  ดูสลิป →
                </Link>
              </div>
              <PaymentReview paymentId={p.id} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
