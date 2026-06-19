import Link from "next/link";
import { MapPinned, Map as MapIcon } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import type { LeadStatus } from "@/src/domain/entities";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { CreateLeadForm } from "@/src/presentation/components/leads/CreateLeadForm";
import { LeadList } from "@/src/presentation/components/leads/LeadList";
import type { LeadRow } from "@/src/presentation/actions/lead-actions";
import {
  LEAD_STATUS_LABEL,
  LEAD_STATUS_ORDER,
} from "@/src/presentation/lib/lead-display";
import { cn } from "@/src/presentation/components/ui/cn";

export const dynamic = "force-dynamic";

function parseStatus(raw: string | undefined): LeadStatus | null {
  return raw && (LEAD_STATUS_ORDER as string[]).includes(raw)
    ? (raw as LeadStatus)
    : null;
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("platform_admin");
  const { status: statusParam } = await searchParams;
  const status = parseStatus(statusParam);

  const [page, categories] = await Promise.all([
    container.leadRepository.page({ status }),
    container.shopCategoryRepository.listActive(),
  ]);
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const rows: LeadRow[] = page.items.map((lead) => ({
    lead,
    categoryName: lead.categoryId
      ? categoryName.get(lead.categoryId) ?? null
      : null,
  }));

  const filters: { value: LeadStatus | null; label: string }[] = [
    { value: null, label: "ทั้งหมด" },
    ...LEAD_STATUS_ORDER.map((s) => ({ value: s, label: LEAD_STATUS_LABEL[s] })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title="เพิ่มลีด (ร้านที่กำลังสำรวจ)"
          subtitle="เก็บข้อมูลร้านเป้าหมายก่อนลงพื้นที่ — ปักหมุดและนำทางได้จากหน้าแผนที่"
          action={
            <Link href="/admin/leads/map">
              <Button variant="outline" size="sm">
                <MapIcon size={14} />
                แผนที่
              </Button>
            </Link>
          }
        />
        <CreateLeadForm
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      </Card>

      <Card>
        <CardHeader title="ลีดทั้งหมด" />
        <div className="mb-3 flex flex-wrap gap-1.5">
          {filters.map((f) => {
            const active = f.value === status;
            return (
              <Link
                key={f.value ?? "all"}
                href={
                  f.value ? `/admin/leads?status=${f.value}` : "/admin/leads"
                }
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  active
                    ? "bg-brand-500 text-on-brand"
                    : "bg-muted-surface text-muted hover:text-foreground",
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={<MapPinned />} title="ยังไม่มีลีดในสถานะนี้" />
        ) : (
          <LeadList
            initialItems={rows}
            initialCursor={page.nextCursor}
            status={status}
          />
        )}
      </Card>
    </div>
  );
}
