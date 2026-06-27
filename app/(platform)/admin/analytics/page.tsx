import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations("adminPages");
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
        <h1 className="text-xl font-bold text-foreground">{t("analyticsTitle")}</h1>
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
              {t("rangeDays", { days: d })}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("statStampsIssued")} value={summary.stampsIssued} hint={t("hintInDays", { days: rangeDays })} />
        <StatCard label={t("statRedemptions")} value={summary.redemptions} hint={t("hintInDays", { days: rangeDays })} />
        <StatCard label={t("statActiveCustomers")} value={summary.activeCustomers} hint={t("hintInDays", { days: rangeDays })} />
        <StatCard label={t("statRedemptionRate")} value={`${redemptionRate}%`} hint={t("hintOfActive")} />
        <StatCard label={t("statNewCustomers")} value={summary.newCustomers} hint={t("hintInDays", { days: rangeDays })} />
        <StatCard label={t("statTotalCustomers")} value={summary.totalCustomers} hint={t("hintAllShops")} />
        <StatCard label={t("statTotalShops")} value={summary.totalShops} hint={t("hintInSystem")} />
        <StatCard label={t("statActiveShops")} value={summary.activeShops} hint={t("hintInDays", { days: rangeDays })} />
      </div>

      {!hasActivity ? (
        <Card>
          <EmptyState
            icon={<BarChart3 />}
            title={t("noDataTitle")}
            description={t("noDataDescPlatform")}
          />
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader
              title={t("dailyTrendTitle")}
              subtitle={t("dailyTrendSubtitle")}
            />
            <DailyTrendChart data={view.daily} />
          </Card>

          {view.byShop.length > 0 && (
            <Card>
              <CardHeader
                title={t("topShopsTitle")}
                subtitle={t("topShopsSubtitle")}
              />
              <BreakdownList rows={view.byShop} />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
