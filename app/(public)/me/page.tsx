import type { Metadata } from "next";
import Link from "next/link";
import {
  Smartphone,
  ShoppingBag,
  PartyPopper,
  Store,
  ChevronRight,
} from "lucide-react";

import { container } from "@/src/infrastructure/di/container";
import { getAllMemberTokens } from "@/src/infrastructure/auth/member";
import { GetBoundCardsUseCase } from "@/src/application/use-cases/member/GetBoundCardsUseCase";
import { Card } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { StampDots } from "@/src/presentation/components/ui/StampDots";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { InstallHint } from "@/src/presentation/components/pwa/InstallHint";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "บัตรของฉัน · Easy Stamp",
  manifest: "/me/site.webmanifest",
};

export default async function MyCardsPage() {
  const tokens = await getAllMemberTokens();
  const cards = await new GetBoundCardsUseCase(
    container.shopRepository,
    container.customerDeviceRepository,
    container.stampCardRepository,
  ).execute(tokens.map((t) => t.token));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-4 py-8">
      <header className="text-center">
        <h1 className="inline-flex items-center justify-center gap-2 text-2xl font-bold text-brand-700">
          <ShoppingBag className="size-6" />
          บัตรของฉัน
        </h1>
        <p className="text-sm text-muted">บัตรสะสมแสตมป์ทุกร้านบนเครื่องนี้</p>
      </header>

      {cards.length === 0 ? (
        <EmptyState
          icon={<Smartphone />}
          title="ยังไม่มีบัตร"
          description="ไปที่ร้านแล้วให้พนักงานออก QR ผูกบัตร แล้วสแกนด้วยกล้องมือถือของคุณ"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {cards.map(({ shopName, slug, view }) => (
            <Link key={slug} href={`/s/${slug}`}>
              <Card className="flex flex-col gap-3 transition hover:ring-brand-300">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                    <Store className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-foreground">
                    {shopName}
                  </span>
                  {view.eligibleToRedeem ? (
                    <Badge tone="success">
                      <PartyPopper className="size-3.5" />
                      ครบ แลกได้
                    </Badge>
                  ) : (
                    <Badge tone="brand">
                      {view.card.currentStamps}/{view.threshold}
                    </Badge>
                  )}
                  <ChevronRight className="size-4 shrink-0 text-muted" />
                </div>
                <StampDots
                  current={view.card.currentStamps}
                  threshold={view.threshold}
                  size="sm"
                />
              </Card>
            </Link>
          ))}
          <InstallHint />
        </div>
      )}

      <Link
        href="/privacy"
        className="mt-2 text-center text-xs text-muted hover:underline"
      >
        นโยบายความเป็นส่วนตัว
      </Link>
    </main>
  );
}
