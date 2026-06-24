"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";

import { Badge } from "@/src/presentation/components/ui/Badge";
import { LoadMore } from "@/src/presentation/components/ui/LoadMore";
import { useConfirm } from "@/src/presentation/components/ui/ConfirmDialog";
import { useToast } from "@/src/presentation/components/ui/Toast";
import { formatPhone } from "@/src/domain/services/phone";
import {
  loadMoreCustomersAction,
  anonymizeCustomerAction,
} from "@/src/presentation/actions/shop-actions";
import type { CustomerRow } from "@/src/application/use-cases/stamp/AnnotateCustomerEligibilityUseCase";

/** Per-customer PDPA tools: download their data, or erase (anonymize) it. */
function RowActions({ customerId }: { customerId: string }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [pending, start] = useTransition();

  function erase() {
    start(async () => {
      const ok = await confirm({
        title: "ลบข้อมูลลูกค้า (PDPA)?",
        message:
          "จะลบข้อมูลส่วนตัว (เบอร์/ชื่อ/QR) ของลูกค้ารายนี้อย่างถาวร — แต้มสะสมจะยังอยู่แบบไม่ระบุตัวตน · ย้อนกลับไม่ได้",
        confirmLabel: "ลบข้อมูล",
        tone: "danger",
      });
      if (!ok) return;
      const res = await anonymizeCustomerAction(customerId);
      if (res.error) toast.error(res.error);
      else {
        toast.success("ลบข้อมูลลูกค้าแล้ว");
        router.refresh();
      }
    });
  }

  return (
    <span className="flex shrink-0 items-center gap-1">
      <a
        href={`/api/shop/customers/${customerId}/data-export`}
        download
        aria-label="ดาวน์โหลดข้อมูลลูกค้า (PDPA)"
        title="ดาวน์โหลดข้อมูลลูกค้า (PDPA)"
        className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-muted-surface hover:text-foreground"
      >
        <Download className="size-4" />
      </a>
      <button
        type="button"
        onClick={erase}
        disabled={pending}
        aria-label="ลบข้อมูลลูกค้า (PDPA)"
        title="ลบข้อมูลลูกค้า (PDPA)"
        className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-muted-surface hover:text-error disabled:opacity-50"
      >
        <Trash2 className="size-4" />
      </button>
    </span>
  );
}

/** Cursor-paginated customer list; `search` is carried into "load more". */
export function CustomerList({
  initialItems,
  initialCursor,
  search,
}: {
  initialItems: CustomerRow[];
  initialCursor: string | null;
  search: string;
}) {
  return (
    <LoadMore
      initialItems={initialItems}
      initialCursor={initialCursor}
      loadMore={(cursor) => loadMoreCustomersAction(search, cursor)}
      getKey={(r) => r.customer.id}
      renderItem={({ customer, eligible }) => (
        <li className="flex items-center justify-between gap-3 py-2.5">
          <span className="min-w-0 truncate text-foreground">
            {customer.displayName || formatPhone(customer.phone)}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {eligible > 0 && (
              <Badge tone="success">
                ครบ แลกได้{eligible > 1 ? ` ${eligible} ประเภท` : ""}
              </Badge>
            )}
            <RowActions customerId={customer.id} />
          </span>
        </li>
      )}
    />
  );
}
