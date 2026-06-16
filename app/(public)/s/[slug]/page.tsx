import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Camera, PauseCircle, Smartphone, TriangleAlert } from "lucide-react";

import { container } from "@/src/infrastructure/di/container";
import { GetCardByDeviceTokenUseCase } from "@/src/application/use-cases/member/GetCardByDeviceTokenUseCase";
import { getMemberToken } from "@/src/infrastructure/auth/member";
import { renderQrDataUrl } from "@/src/infrastructure/services/qr";
import { getBaseUrl } from "@/src/presentation/lib/base-url";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { CardBalance } from "@/src/presentation/components/stamp/CardBalance";
import { RedemptionList } from "@/src/presentation/components/stamp/RedemptionList";
import { buildCustomerRedemptionItems } from "@/src/presentation/components/stamp/redemption-items";
import { MemberQr } from "@/src/presentation/components/stamp/MemberQr";
import { InstallHint } from "@/src/presentation/components/pwa/InstallHint";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shop = await container.shopRepository.findBySlug(slug);
  return {
    title: shop ? `${shop.name} · สะสมแสตมป์` : "ไม่พบร้านค้า",
    // Per-shop manifest → installed icon opens this shop's card.
    manifest: shop ? `/s/${slug}/site.webmanifest` : undefined,
  };
}

export default async function PublicShopCheckPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ bind?: string }>;
}) {
  const { slug } = await params;
  const { bind } = await searchParams;

  const shop = await container.shopRepository.findBySlug(slug);
  if (!shop) notFound();

  // Temporarily-closed shops: show a notice but keep the card viewable.
  const subscription = await container.subscriptionRepository.findByShop(shop.id);
  const isPaused = !!subscription?.pausedAt;

  // Card view comes ONLY from a bound device (secret token cookie).
  const token = await getMemberToken(slug);
  const view = token
    ? await new GetCardByDeviceTokenUseCase(
        container.shopRepository,
        container.customerDeviceRepository,
        container.stampCardRepository,
        container.stampTypeRepository,
        container.stampBalanceRepository,
      ).execute(shop.id, token)
    : null;

  const personalQrUrl = view
    ? await renderQrDataUrl(
        `${await getBaseUrl()}/s/${slug}?c=${view.customer.publicCode}`,
      )
    : null;

  // The customer's own redemption history for this shop (cursor-paginated).
  const historyPage = view
    ? await container.rewardRedemptionRepository.pageByCustomer(
        shop.id,
        view.customer.id,
      )
    : { items: [], nextCursor: null };
  const historyItems = view
    ? await buildCustomerRedemptionItems(shop.id, historyPage.items)
    : [];

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-4 py-8">
      {isPaused && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
          <PauseCircle className="mr-1 inline size-4 align-text-bottom" />
          ร้านนี้ปิดให้บริการชั่วคราว — ดูแต้มสะสมได้ แต่ยังสะสม/แลกไม่ได้จนกว่าจะเปิดอีกครั้ง
        </p>
      )}
      {view ? (
        <>
          <Card>
            <CardBalance view={view} shopName={shop.name} dotSize="md" />
          </Card>
          {personalQrUrl && <MemberQr qrImageUrl={personalQrUrl} />}

          <p className="rounded-xl bg-brand-50 px-4 py-3 text-center text-sm text-brand-700 ring-1 ring-brand-100">
            <Camera className="mr-1 inline size-4 align-text-bottom" />
            <strong>เปิดบัตรซ้ำง่ายๆ:</strong> ครั้งหน้าแค่สแกน QR ที่ร้านอีกครั้ง
            — ไม่ต้องติดตั้งอะไร
          </p>

          <details className="text-center">
            <summary className="cursor-pointer text-xs text-muted">
              หรือเพิ่มลงหน้าจอหลัก (ไม่บังคับ)
            </summary>
            <div className="mt-2">
              <InstallHint />
            </div>
          </details>

          {historyItems.length > 0 && (
            <Card>
              <CardHeader title="ประวัติการแลกรางวัล" />
              <RedemptionList
                initialItems={historyItems}
                initialCursor={historyPage.nextCursor}
                mode="my"
                slug={slug}
              />
            </Card>
          )}
        </>
      ) : (
        <>
          <header className="text-center">
            <h1 className="text-2xl font-bold text-brand-700">{shop.name}</h1>
            <p className="text-sm text-muted">บัตรสะสมแสตมป์</p>
          </header>
          <EmptyState
            icon={bind === "invalid" ? <TriangleAlert /> : <Smartphone />}
            title={
              bind === "invalid"
                ? "QR ผูกบัตรหมดอายุหรือถูกใช้แล้ว"
                : "ยังไม่ได้ผูกอุปกรณ์นี้"
            }
            description="แจ้งพนักงานที่ร้านให้ออก QR ผูกบัตร แล้วสแกนด้วยกล้องมือถือของคุณ เพื่อดูแต้มสะสม"
          />
        </>
      )}

      <Link
        href="/privacy"
        className="mt-auto text-center text-xs text-muted hover:underline"
      >
        นโยบายความเป็นส่วนตัว
      </Link>
    </main>
  );
}
