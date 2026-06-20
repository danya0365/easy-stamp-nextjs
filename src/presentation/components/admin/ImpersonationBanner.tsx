import { Eye } from "lucide-react";

import { stopImpersonationAction } from "@/src/presentation/actions/admin-actions";

/**
 * Sticky banner shown while a platform_admin is viewing a shop read-only.
 * Makes the impersonation obvious and offers a one-click exit. Writes are
 * blocked regardless (the admin's role can't pass shop_owner mutation guards).
 */
export function ImpersonationBanner({ shopName }: { shopName: string }) {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-2 border-b border-warning bg-warning-surface px-4 py-2 text-sm text-warning">
      <span className="flex min-w-0 items-center gap-1.5">
        <Eye className="size-4 shrink-0" />
        <span className="truncate">
          กำลังดูในนามร้าน <strong>{shopName}</strong> · อ่านอย่างเดียว
        </span>
      </span>
      <form action={stopImpersonationAction}>
        <button
          type="submit"
          className="shrink-0 rounded-md border border-warning px-2.5 py-1 text-xs font-medium hover:bg-warning/10"
        >
          ออกจากการดู
        </button>
      </form>
    </div>
  );
}
