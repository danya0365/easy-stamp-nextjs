import { CalendarClock, Package, Receipt, TriangleAlert } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { getBillingState } from "@/src/infrastructure/auth/billing-guard";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { TopupForm } from "@/src/presentation/components/billing/TopupForm";
import { PaymentHistoryList } from "@/src/presentation/components/billing/PaymentHistoryList";
import { TopupHistoryList } from "@/src/presentation/components/billing/TopupHistoryList";
import { ContactAdminButton } from "@/src/presentation/components/shop/ContactAdminButton";
import { formatDate } from "@/src/presentation/lib/format-date";

export const dynamic = "force-dynamic";

export default async function ShopBillingPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { subscription, status } = await getBillingState(shopId);
  const paymentsPage = await container.paymentRepository.pageByShop(shopId);
  const topupsPage = await container.topupTransactionRepository.pageByShop(shopId);
  const customers = await container.customerRepository.listByShop(shopId);

  return (
    <div className="flex flex-col gap-4">
      {/* Loss-aversion lock notice */}
      {status.isSuspended && (
        <Card className="bg-error-surface ring-1 ring-red-200">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-6 shrink-0 text-error" />
            <div>
              <p className="font-semibold text-error">
                ระบบถูกระงับ — เติมวันเพื่อเปิดใช้งานต่อ
              </p>
              <p className="mt-1 text-sm text-foreground">
                ตอนนี้พนักงานกดแสตมป์และแลกของรางวัลให้ลูกค้าไม่ได้
                ลูกค้า <strong>{customers.length} คน</strong> ของคุณกำลังสะสมแต้มค้างอยู่
                และจะสะสมต่อไม่ได้จนกว่าคุณจะเติมวัน — ทุกวันที่ปล่อยไว้
                คือโอกาสที่ลูกค้าจะหายไปหาคู่แข่ง
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Status */}
      <Card>
        <CardHeader title="วันใช้งานคงเหลือ" />
        {!subscription ? (
          <EmptyState
            icon={<Package />}
            title="ยังไม่มีแพ็กเกจ"
            description="กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดใช้งาน"
          />
        ) : (
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">สถานะ</span>
              {status.isSuspended ? (
                <Badge tone="danger">ถูกระงับ (หมดอายุ)</Badge>
              ) : status.state === "overdue" ? (
                <Badge tone="warning">
                  หมดอายุแล้ว {status.daysOverdue} วัน
                </Badge>
              ) : subscription.status === "trialing" ? (
                <Badge tone="success">ทดลองใช้งาน</Badge>
              ) : (
                <Badge tone="success">ใช้งานปกติ</Badge>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted">ใช้งานได้ถึง</span>
              <span className="inline-flex items-center gap-1.5 text-foreground">
                <CalendarClock className="size-4 text-muted" />
                {formatDate(subscription.currentPeriodDueAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">คงเหลือ</span>
              <span className="font-semibold text-foreground">
                {status.state === "active"
                  ? `${status.daysUntilDue} วัน`
                  : status.isSuspended
                    ? "—"
                    : `หมดอายุ — เติมได้อีก ${status.graceDaysLeft} วันก่อนถูกระงับ`}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Top up */}
      {subscription && (
        <Card>
          <CardHeader
            title="เติมวัน"
            subtitle="เลือกแพ็กเกจหรือเติมวันอิสระ — เติมยิ่งเยอะ ยิ่งได้วันแถม"
          />
          <TopupForm pricePerDaySatang={subscription.pricePerDaySatang} />
        </Card>
      )}

      {/* Days credited (ledger) */}
      {topupsPage.items.length > 0 && (
        <Card>
          <CardHeader
            title="ประวัติวันใช้งานที่ได้รับ"
            subtitle="วันที่ถูกเติมเข้าระบบ (รวมที่แอดมินปรับให้)"
          />
          <TopupHistoryList
            initialItems={topupsPage.items}
            initialCursor={topupsPage.nextCursor}
          />
        </Card>
      )}

      {/* Slip submission history */}
      <Card>
        <CardHeader title="ประวัติการแจ้งชำระเงิน" />
        {paymentsPage.items.length === 0 ? (
          <EmptyState icon={<Receipt />} title="ยังไม่มีประวัติ" />
        ) : (
          <PaymentHistoryList
            initialItems={paymentsPage.items}
            initialCursor={paymentsPage.nextCursor}
          />
        )}
      </Card>

      {/* Help: contacting the admin is most useful here (rejected / suspended). */}
      <Card>
        <CardHeader
          title="มีปัญหาการชำระเงิน?"
          subtitle="ถูกปฏิเสธ โอนแล้วยังไม่ได้รับวัน หรือสอบถามอื่น ๆ ติดต่อผู้ดูแลได้เลย"
        />
        <ContactAdminButton />
      </Card>
    </div>
  );
}
