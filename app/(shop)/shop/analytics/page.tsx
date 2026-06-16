import Link from "next/link";
import { BarChart3, Trophy } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { DailyTrendChart } from "@/src/presentation/components/analytics/DailyTrendChart";
import { BreakdownList } from "@/src/presentation/components/analytics/BreakdownList";
import { GetShopAnalyticsUseCase } from "@/src/application/use-cases/shop/GetShopAnalyticsUseCase";
import {
  RANGE_OPTIONS,
  DEFAULT_RANGE,
  isValidRange,
  type RangeDays,
} from "@/src/domain/services/analytics";
import { cn } from "@/src/presentation/components/ui/cn";

export const dynamic = "force-dynamic";

export default async function ShopAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { range } = await searchParams;
  const parsed = Number(range);
  const rangeDays: RangeDays = isValidRange(parsed) ? parsed : DEFAULT_RANGE;

  const view = await new GetShopAnalyticsUseCase(
    container.analyticsRepository,
  ).execute(shopId, rangeDays);

  const { summary, redemptionRate } = view;
  const hasActivity = summary.stampsIssued > 0 || summary.redemptions > 0;

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-foreground">สถิติร้าน</h1>
        {/* Range selector — plain links re-render the server page */}
        <div className="inline-flex rounded-full bg-muted-surface p-0.5 text-sm">
          {RANGE_OPTIONS.map((d) => (
            <Link
              key={d}
              href={`/shop/analytics?range=${d}`}
              className={cn(
                "rounded-full px-3 py-1 transition",
                d === rangeDays
                  ? "bg-card font-medium text-brand-700 shadow-sm"
                  : "text-muted hover:text-foreground",
              )}
            >
              {d} วัน
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="แสตมป์ที่แจก" value={summary.stampsIssued} hint={`ใน ${rangeDays} วัน`} />
        <StatCard label="แลกรางวัล" value={summary.redemptions} hint={`ใน ${rangeDays} วัน`} />
        <StatCard label="ลูกค้าแอคทีฟ" value={summary.activeCustomers} hint={`ใน ${rangeDays} วัน`} />
        <StatCard label="อัตราการแลก" value={`${redemptionRate}%`} hint="ของลูกค้าแอคทีฟ" />
        <StatCard label="ลูกค้าใหม่" value={summary.newCustomers} hint={`ใน ${rangeDays} วัน`} />
        <StatCard label="ลูกค้าทั้งหมด" value={summary.totalCustomers} hint="ตั้งแต่เปิดร้าน" />
      </div>

      {!hasActivity ? (
        <Card>
          <EmptyState
            icon={<BarChart3 />}
            title="ยังไม่มีข้อมูลในช่วงนี้"
            description="เมื่อมีการกดแสตมป์หรือแลกรางวัล สถิติจะแสดงที่นี่"
          />
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader
              title="แนวโน้มรายวัน"
              subtitle="แสตมป์ที่แจก (แท่ง) เทียบกับการแลกรางวัล (เส้น)"
            />
            <DailyTrendChart data={view.daily} />
          </Card>

          {view.byType.length > 0 && (
            <Card>
              <CardHeader title="แยกตามประเภทแสตมป์" />
              <BreakdownList rows={view.byType} />
            </Card>
          )}

          {view.byBranch.length > 0 && (
            <Card>
              <CardHeader title="แยกตามสาขา" />
              <BreakdownList rows={view.byBranch} />
            </Card>
          )}

          {view.topCustomers.length > 0 && (
            <Card>
              <CardHeader title="ลูกค้าที่สะสมมากสุด" />
              <ul className="flex flex-col divide-y divide-border">
                {view.topCustomers.map((c, i) => (
                  <li
                    key={c.customerId}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm"
                  >
                    <span className="flex items-center gap-2 text-foreground">
                      {i === 0 && <Trophy className="size-4 text-brand-500" />}
                      {c.label}
                    </span>
                    <span className="text-muted">{c.stamps} แสตมป์</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
