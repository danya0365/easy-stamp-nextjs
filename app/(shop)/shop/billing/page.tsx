import { requireRole } from "@/src/infrastructure/auth/session";
import { getBillingState } from "@/src/infrastructure/auth/billing-guard";
import { container } from "@/src/infrastructure/di/container";
import { renderPromptPayQR } from "@/src/infrastructure/services/promptpay";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { PromptPayQR } from "@/src/presentation/components/billing/PromptPayQR";
import { SlipUploadForm } from "@/src/presentation/components/billing/SlipUploadForm";
import { satangToBaht } from "@/src/presentation/lib/money";
import type { PaymentStatus } from "@/src/domain/entities";

export const dynamic = "force-dynamic";

const PAYMENT_BADGE: Record<
  PaymentStatus,
  { tone: "warning" | "success" | "danger"; label: string }
> = {
  pending: { tone: "warning", label: "รอตรวจสอบ" },
  approved: { tone: "success", label: "อนุมัติแล้ว" },
  rejected: { tone: "danger", label: "ปฏิเสธ" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ShopBillingPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { subscription, status } = await getBillingState(shopId);
  const payments = await container.paymentRepository.listByShop(shopId, 10);
  const target = process.env.PROMPTPAY_TARGET || "0000000000";

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <Card>
        <CardHeader title="สถานะค่าบริการรายเดือน" />
        {!subscription ? (
          <EmptyState
            icon="📦"
            title="ยังไม่มีแพ็กเกจ"
            description="กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดใช้งาน"
          />
        ) : (
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">สถานะ</span>
              {status.isSuspended ? (
                <Badge tone="danger">ถูกระงับ (ค้างชำระ)</Badge>
              ) : status.state === "overdue" ? (
                <Badge tone="warning">ค้างชำระ {status.daysOverdue} วัน</Badge>
              ) : (
                <Badge tone="success">ใช้งานปกติ</Badge>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted">ครบกำหนดชำระ</span>
              <span className="text-foreground">
                {fmtDate(subscription.currentPeriodDueAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">ยอดชำระ/เดือน</span>
              <span className="font-semibold text-foreground">
                ฿{satangToBaht(subscription.amountSatang)}
              </span>
            </div>
          </div>
        )}
      </Card>

      {subscription && (
        <Card>
          <CardHeader
            title="ชำระเงิน"
            subtitle="สแกนจ่ายผ่าน PromptPay แล้วอัปโหลดสลิปเพื่อให้ผู้ดูแลตรวจสอบ"
          />
          <div className="flex flex-col items-center gap-4">
            <PromptPayQR
              qrImageUrl={await renderPromptPayQR(target, subscription.amountSatang)}
              amountSatang={subscription.amountSatang}
              target={target}
            />
            <div className="w-full">
              <SlipUploadForm />
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="ประวัติการชำระเงิน" />
        {payments.length === 0 ? (
          <EmptyState icon="🧾" title="ยังไม่มีประวัติ" />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {payments.map((p) => {
              const badge = PAYMENT_BADGE[p.status];
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <div>
                    <p className="text-foreground">฿{satangToBaht(p.amountSatang)}</p>
                    <p className="text-xs text-muted">{fmtDate(p.createdAt)}</p>
                    {p.status === "rejected" && p.rejectReason && (
                      <p className="text-xs text-error">เหตุผล: {p.rejectReason}</p>
                    )}
                  </div>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
