import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  CreditCard,
  MessageSquare,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import type { Notification, NotificationType } from "@/src/domain/entities";
import { EmptyState } from "../ui/EmptyState";
import { formatDateTime } from "@/src/presentation/lib/format-date";
import { cn } from "../ui/cn";

const ICONS: Record<NotificationType, LucideIcon> = {
  payment_submitted: CreditCard,
  payment_approved: CheckCircle2,
  payment_rejected: XCircle,
  contact_request: MessageSquare,
};

function Row({ n }: { n: Notification }) {
  const Icon = ICONS[n.type] ?? Bell;
  const inner = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl px-3 py-3 transition",
        n.isRead ? "" : "bg-brand-50/60",
        n.linkUrl && "hover:bg-muted-surface",
      )}
    >
      <span className="mt-0.5 text-brand-500">
        <Icon className="size-5 shrink-0" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <span className="truncate">{n.title}</span>
          {!n.isRead && (
            <span className="size-2 shrink-0 rounded-full bg-brand-500" />
          )}
        </p>
        <p className="mt-0.5 text-sm text-muted">{n.body}</p>
        <p className="mt-1 text-xs text-muted">{formatDateTime(n.createdAt)}</p>
      </div>
    </div>
  );

  return n.linkUrl ? <Link href={n.linkUrl}>{inner}</Link> : inner;
}

export function NotificationList({ items }: { items: Notification[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Bell />}
        title="ยังไม่มีการแจ้งเตือน"
        description="เมื่อมีความเคลื่อนไหว การแจ้งเตือนจะแสดงที่นี่"
      />
    );
  }
  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((n) => (
        <li key={n.id}>
          <Row n={n} />
        </li>
      ))}
    </ul>
  );
}
