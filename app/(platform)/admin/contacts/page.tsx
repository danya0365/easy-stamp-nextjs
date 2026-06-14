import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { Button } from "@/src/presentation/components/ui/Button";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { MessageSquare } from "lucide-react";
import { resolveContactAction } from "@/src/presentation/actions/contact-actions";
import { formatDateTime } from "@/src/presentation/lib/format-date";

export const dynamic = "force-dynamic";

export default async function AdminContactsPage() {
  await requireRole("platform_admin");
  const [requests, shops] = await Promise.all([
    container.contactRequestRepository.listRecent(100),
    container.shopRepository.list(),
  ]);
  const shopName = new Map(shops.map((s) => [s.id, s.name]));

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader title={`คำขอติดต่อ (${requests.length})`} />
        {requests.length === 0 ? (
          <EmptyState icon={<MessageSquare />} title="ยังไม่มีคำขอติดต่อ" />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{r.subject}</p>
                    <p className="text-xs text-muted">
                      {shopName.get(r.shopId) ?? "-"} ·{" "}
                      {formatDateTime(r.createdAt)}
                    </p>
                  </div>
                  {r.status === "open" ? (
                    <Badge tone="warning">รอดำเนินการ</Badge>
                  ) : (
                    <Badge tone="success">แก้ไขแล้ว</Badge>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {r.message}
                </p>
                <p className="text-sm text-brand-700">
                  ติดต่อกลับ: {r.contactChannel}
                </p>
                {r.status === "open" && (
                  <form action={resolveContactAction.bind(null, r.id)}>
                    <Button type="submit" size="sm" variant="outline">
                      ทำเครื่องหมายแก้ไขแล้ว
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
