"use client";

import { Badge } from "@/src/presentation/components/ui/Badge";
import { LoadMore } from "@/src/presentation/components/ui/LoadMore";
import { formatPhone } from "@/src/domain/services/phone";
import { loadMoreCustomersAction } from "@/src/presentation/actions/shop-actions";
import type { CustomerRow } from "./customer-rows";

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
          {eligible > 0 && (
            <Badge tone="success">
              ครบ แลกได้{eligible > 1 ? ` ${eligible} ประเภท` : ""}
            </Badge>
          )}
        </li>
      )}
    />
  );
}
