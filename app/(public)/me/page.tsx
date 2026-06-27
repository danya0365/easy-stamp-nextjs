import type { Metadata } from "next";
import Link from "next/link";
import {
  Smartphone,
  ShoppingBag,
  PartyPopper,
  Store,
  ChevronRight,
} from "lucide-react";

import { getTranslations } from "next-intl/server";

import { container } from "@/src/infrastructure/di/container";
import { getAllMemberTokens } from "@/src/infrastructure/auth/member";
import { GetBoundCardsUseCase } from "@/src/application/use-cases/member/GetBoundCardsUseCase";
import { Card } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { StampDots } from "@/src/presentation/components/ui/StampDots";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { InstallHint } from "@/src/presentation/components/pwa/InstallHint";
import { BRAND } from "@/src/config/brand";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getTranslations("publicPages");
  return {
    title: tr("metaMyCards", { brand: BRAND.name }),
    manifest: "/me/site.webmanifest",
  };
}

export default async function MyCardsPage() {
  const tr = await getTranslations("publicPages");
  const tokens = await getAllMemberTokens();
  const cards = await new GetBoundCardsUseCase(
    container.shopRepository,
    container.customerDeviceRepository,
    container.stampCardRepository,
    container.stampTypeRepository,
    container.stampBalanceRepository,
  ).execute(tokens.map((t) => t.token));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-4 py-8">
      <header className="text-center">
        <h1 className="inline-flex items-center justify-center gap-2 text-2xl font-bold text-brand-700">
          <ShoppingBag className="size-6" />
          {tr("myCardsTitle")}
        </h1>
        <p className="text-sm text-muted">{tr("myCardsSubtitle")}</p>
      </header>

      {cards.length === 0 ? (
        <EmptyState
          icon={<Smartphone />}
          title={tr("noCardsTitle")}
          description={tr("noCardsDesc")}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {cards.map(({ shopName, slug, view }) => {
            const eligibleCount = view.types.filter(
              (t) => t.eligibleToRedeem,
            ).length;
            return (
              <Link key={slug} href={`/s/${slug}`}>
                <Card className="flex flex-col gap-3 transition hover:ring-brand-300">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                      <Store className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold text-foreground">
                      {shopName}
                    </span>
                    {eligibleCount > 0 && (
                      <Badge tone="success">
                        <PartyPopper className="size-3.5" />
                        {eligibleCount > 1
                          ? tr("readyToRedeemN", { count: eligibleCount })
                          : tr("readyToRedeem")}
                      </Badge>
                    )}
                    <ChevronRight className="size-4 shrink-0 text-muted" />
                  </div>
                  <div className="flex flex-col gap-2">
                    {view.types.map((t) => (
                      <div key={t.type.id} className="flex items-center gap-2">
                        <span className="w-20 shrink-0 truncate text-xs text-muted">
                          {t.type.name}
                        </span>
                        <div className="min-w-0 flex-1">
                          <StampDots
                            current={t.currentStamps}
                            threshold={t.type.threshold}
                            size="sm"
                          />
                        </div>
                        <span className="shrink-0 text-xs text-muted">
                          {t.currentStamps}/{t.type.threshold}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </Link>
            );
          })}
          <InstallHint />
        </div>
      )}

      <Link
        href="/privacy"
        className="mt-2 text-center text-xs text-muted hover:underline"
      >
        {tr("privacyPolicy")}
      </Link>
    </main>
  );
}
