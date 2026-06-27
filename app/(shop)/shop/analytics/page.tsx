import Link from "next/link";
import { BarChart3, Trophy } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { requireShopAccess } from "@/src/infrastructure/auth/session";
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
  const { shopId } = await requireShopAccess();
  const t = await getTranslations("shopPages");
  const { range } = await searchParams;
  const parsed = Number(range);
  const rangeDays: RangeDays = isValidRange(parsed) ? parsed : DEFAULT_RANGE;

  const view = await new GetShopAnalyticsUseCase(
    container.analyticsRepository,
  ).execute(shopId, rangeDays);

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
              href={`/shop/analytics?range=${d}`}
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label={t("statStampsIssued")} value={summary.stampsIssued} hint={t("hintInDays", { days: rangeDays })} />
        <StatCard label={t("statRedemptions")} value={summary.redemptions} hint={t("hintInDays", { days: rangeDays })} />
        <StatCard label={t("statActiveCustomers")} value={summary.activeCustomers} hint={t("hintInDays", { days: rangeDays })} />
        <StatCard label={t("statRedemptionRate")} value={`${redemptionRate}%`} hint={t("hintOfActive")} />
        <StatCard label={t("statNewCustomers")} value={summary.newCustomers} hint={t("hintInDays", { days: rangeDays })} />
        <StatCard label={t("statTotalCustomers")} value={summary.totalCustomers} hint={t("hintSinceOpen")} />
      </div>

      {!hasActivity ? (
        <Card>
          <EmptyState
            icon={<BarChart3 />}
            title={t("noDataTitle")}
            description={t("noDataDesc")}
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

          {view.byType.length > 0 && (
            <Card>
              <CardHeader title={t("byTypeTitle")} />
              <BreakdownList rows={view.byType} />
            </Card>
          )}

          {view.byBranch.length > 0 && (
            <Card>
              <CardHeader title={t("byBranchTitle")} />
              <BreakdownList rows={view.byBranch} />
            </Card>
          )}

          {view.topCustomers.length > 0 && (
            <Card>
              <CardHeader title={t("topCustomersTitle")} />
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
                    <span className="text-muted">{t("stampsUnit", { count: c.stamps })}</span>
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
