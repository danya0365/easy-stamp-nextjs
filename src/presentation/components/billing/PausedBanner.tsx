import { PauseCircle } from "lucide-react";

import type { BillingStatus } from "@/src/domain/services/subscription-status";
import { ResumeShopButton } from "./ResumeShopButton";

/**
 * Shown while a shop is temporarily paused (closed). Billing is frozen.
 * `resumable` (owner context) adds a one-click reopen button.
 */
export function PausedBanner({
  status,
  resumable,
}: {
  status: BillingStatus;
  resumable?: boolean;
}) {
  if (!status.isPaused) return null;
  return (
    <div className="bg-amber-50 px-4 py-3 text-amber-800 print:hidden">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <PauseCircle className="size-4 shrink-0" />
          <span>
            ร้านปิดชั่วคราวอยู่ — วันใช้งานถูกหยุดไว้ ({status.daysUntilDue} วัน)
            ไม่ถูกหักระหว่างปิด
            {status.frozenDaysSoFar >= 1
              ? ` · กดเปิดจะคืน ${status.frozenDaysSoFar} วัน`
              : " · ยังไม่ครบ 1 วัน (กดเปิดตอนนี้ยังไม่ได้วันคืน)"}
          </span>
        </span>
        {resumable && <ResumeShopButton />}
      </div>
    </div>
  );
}
