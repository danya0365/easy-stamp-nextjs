import Link from "next/link";
import { BarChart3 } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { DailyTrendChart } from "@/src/presentation/components/analytics/DailyTrendChart";
import { BreakdownList } from "@/src/presentation/components/analytics/BreakdownList";
import { GetPlatformAnalyticsUseCase } from "@/src/application/use-cases/platform/GetPlatformAnalyticsUseCase";
import {
  RANGE_OPTIONS,
  DEFAULT_RANGE,
  isValidRange,
  type RangeDays,
} from "@/src/domain/services/analytics";
import { cn } from "@/src/presentation/components/ui/cn";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireRole("platform_admin");
  const { range } = await searchParams;
  const parsed = Number(range);
  const rangeDays: RangeDays = isValidRange(parsed) ? parsed : DEFAULT_RANGE;

  const view = await new GetPlatformAnalyticsUseCase(
    container.platformAnalyticsRepository,
  ).execute(rangeDays);

  const { summary, redemptionRate } = view;
  const hasActivity = summary.stampsIssued > 0 || summary.redemptions > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-foreground">สถิติระบบ</h1>
        {/* Range selector — plain links re-render the server page */}
        <div className="inline-flex rounded-full bg-muted-surface p-0.5 text-sm">
          {RANGE_OPTIONS.map((d) => (
            <Link
              key={d}
              href={`/admin/analytics?range=${d}`}
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="แสตมป์ที่แจก" value={summary.stampsIssued} hint={`ใน ${rangeDays} วัน`} />
        <StatCard label="แลกรางวัล" value={summary.redemptions} hint={`ใน ${rangeDays} วัน`} />
        <StatCard label="ลูกค้าแอคทีฟ" value={summary.activeCustomers} hint={`ใน ${rangeDays} วัน`} />
        <StatCard label="อัตราการแลก" value={`${redemptionRate}%`} hint="ของลูกค้าแอคทีฟ" />
        <StatCard label="ลูกค้าใหม่" value={summary.newCustomers} hint={`ใน ${rangeDays} วัน`} />
        <StatCard label="ลูกค้าทั้งหมด" value={summary.totalCustomers} hint="ทุกร้านรวมกัน" />
        <StatCard label="ร้านทั้งหมด" value={summary.totalShops} hint="ในระบบ" />
        <StatCard label="ร้านที่มีกิจกรรม" value={summary.activeShops} hint={`ใน ${rangeDays} วัน`} />
      </div>

      {!hasActivity ? (
        <Card>
          <EmptyState
            icon={<BarChart3 />}
            title="ยังไม่มีข้อมูลในช่วงนี้"
            description="เมื่อมีร้านกดแสตมป์หรือแลกรางวัล สถิติจะแสดงที่นี่"
          />
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader
              title="แนวโน้มรายวัน (ทุกร้าน)"
              subtitle="แสตมป์ที่แจก (แท่ง) เทียบกับการแลกรางวัล (เส้น)"
            />
            <DailyTrendChart data={view.daily} />
          </Card>

          {view.byShop.length > 0 && (
            <Card>
              <CardHeader
                title="ร้านค้าที่แอคทีฟสูงสุด"
                subtitle="เรียงตามจำนวนแสตมป์ที่แจกในช่วงนี้"
              />
              <BreakdownList rows={view.byShop} />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
