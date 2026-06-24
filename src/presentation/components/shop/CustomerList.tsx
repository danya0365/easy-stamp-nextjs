"use client";

import { Download } from "lucide-react";

import { Badge } from "@/src/presentation/components/ui/Badge";
import { LoadMore } from "@/src/presentation/components/ui/LoadMore";
import { formatPhone } from "@/src/domain/services/phone";
import { loadMoreCustomersAction } from "@/src/presentation/actions/shop-actions";
import type { CustomerRow } from "@/src/application/use-cases/stamp/AnnotateCustomerEligibilityUseCase";

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
          <span className="text-foreground">
            {customer.displayName || formatPhone(customer.phone)}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {eligible > 0 && (
              <Badge tone="success">
                ครบ แลกได้{eligible > 1 ? ` ${eligible} ประเภท` : ""}
              </Badge>
            )}
            <a
              href={`/api/shop/customers/${customer.id}/data-export`}
              download
              aria-label="ดาวน์โหลดข้อมูลลูกค้า (PDPA)"
              title="ดาวน์โหลดข้อมูลลูกค้า (PDPA)"
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-muted-surface hover:text-foreground"
            >
              <Download className="size-4" />
            </a>
          </span>
        </li>
      )}
    />
  );
}
