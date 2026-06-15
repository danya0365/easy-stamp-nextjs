"use client";

import type { ContactRequest } from "@/src/domain/entities";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { Button } from "@/src/presentation/components/ui/Button";
import { LoadMore } from "@/src/presentation/components/ui/LoadMore";
import { formatDateTime } from "@/src/presentation/lib/format-date";
import {
  loadMoreResolvedContactsAction,
  resolveContactAction,
} from "@/src/presentation/actions/contact-actions";

export interface ContactRow {
  request: ContactRequest;
  shopName: string;
}

export function ContactRequestRow({ request: r, shopName }: ContactRow) {
  return (
    <li className="flex flex-col gap-2 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{r.subject}</p>
          <p className="text-xs text-muted">
            {shopName} · {formatDateTime(r.createdAt)}
          </p>
        </div>
        {r.status === "open" ? (
          <Badge tone="warning">รอดำเนินการ</Badge>
        ) : (
          <Badge tone="success">ดำเนินการแล้ว</Badge>
        )}
      </div>
      <p className="whitespace-pre-wrap text-sm text-foreground">{r.message}</p>
      <p className="text-sm text-brand-700">ติดต่อกลับ: {r.contactChannel}</p>
      {r.status === "open" && (
        <form action={resolveContactAction.bind(null, r.id)}>
          <Button type="submit" size="sm" variant="outline">
            ทำเครื่องหมายดำเนินการแล้ว
          </Button>
        </form>
      )}
    </li>
  );
}

/**
 * Admin contact inbox. `initialItems` holds all open requests followed by the
 * first page of resolved ones; "load more" appends further resolved requests.
 */
export function ContactInbox({
  initialItems,
  initialCursor,
}: {
  initialItems: ContactRow[];
  initialCursor: string | null;
}) {
  return (
    <LoadMore
      initialItems={initialItems}
      initialCursor={initialCursor}
      loadMore={loadMoreResolvedContactsAction}
      getKey={(r) => r.request.id}
      renderItem={(r) => (
        <ContactRequestRow request={r.request} shopName={r.shopName} />
      )}
    />
  );
}
