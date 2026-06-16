import Link from "next/link";
import { Clock } from "lucide-react";
import type { BillingStatus } from "@/src/domain/services/subscription-status";

/**
 * Proactive "expiring soon" nudge shown in the days BEFORE expiry (within the
 * warn window). Renders nothing otherwise. Encourages topping up early so the
 * shop never lapses. The post-expiry case is handled by SuspensionBanner.
 */
export function PreExpiryBanner({ status }: { status: BillingStatus }) {
  if (status.preExpiryBannerLevel <= 0 || status.state !== "active") return null;

  const urgent = status.daysUntilDue <= 2;
  const tone = urgent
    ? "bg-amber-50 text-amber-800 ring-amber-200"
    : "bg-brand-50 text-brand-800 ring-brand-100";

  return (
    <div className={`px-4 py-3 ring-1 print:hidden ${tone}`}>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-4 shrink-0" />
          <span>
            วันใช้งานจะหมดในอีก <strong>{status.daysUntilDue} วัน</strong> —
            เติมวันล่วงหน้าเพื่อใช้งานต่อเนื่อง (วันที่เหลือไม่หาย ทบให้เลย)
          </span>
        </span>
        <Link
          href="/shop/billing"
          className="rounded-full bg-brand-500 px-3 py-1 font-medium text-on-brand hover:bg-brand-600"
        >
          เติมวัน
        </Link>
      </div>
    </div>
  );
}
