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
import { ShopHero } from "@/src/presentation/components/shop/ShopHero";
import { ShopGallery } from "@/src/presentation/components/shop/ShopGallery";
import { ShopDetails } from "@/src/presentation/components/shop/ShopDetails";
import { ShopReviewsSection } from "@/src/presentation/components/reviews/ShopReviewsSection";

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

  // Shop imagery + reviews (public).
  const images = await container.shopImageRepository.listByShop(shop.id);
  const coverImage = images.find((i) => i.kind === "cover") ?? null;
  const profileImage = images.find((i) => i.kind === "profile") ?? null;
  const gallery = images.filter((i) => i.kind === "gallery");
  const [reviewSummary, reviewsPage, myReview, category, profile, stampTypes, branches] =
    await Promise.all([
      container.shopReviewRepository.summary(shop.id),
      container.shopReviewRepository.pageByShop(shop.id),
      view
        ? container.shopReviewRepository.findByCustomer(shop.id, view.customer.id)
        : Promise.resolve(null),
      shop.categoryId
        ? container.shopCategoryRepository.findById(shop.categoryId)
        : Promise.resolve(null),
      container.shopProfileRepository.get(shop.id),
      container.stampTypeRepository.listByShop(shop.id, { activeOnly: true }),
      container.branchRepository.listByShop(shop.id),
    ]);
  // Prefer a branch that has coordinates (for the navigate button).
  const primaryBranch =
    branches.find((b) => b.latitude !== null && b.longitude !== null) ??
    branches[0] ??
    null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-4 py-8">
      {isPaused && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
          <PauseCircle className="mr-1 inline size-4 align-text-bottom" />
          ร้านนี้ปิดให้บริการชั่วคราว — ดูแต้มสะสมได้ แต่ยังสะสม/แลกไม่ได้จนกว่าจะเปิดอีกครั้ง
        </p>
      )}

      <ShopHero
        coverImage={coverImage}
        profileImage={profileImage}
        shopName={shop.name}
        categoryName={category?.name ?? null}
        rating={reviewSummary}
      />
      <ShopGallery images={gallery} />

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
      ) : bind === "invalid" ? (
        <EmptyState
          icon={<TriangleAlert />}
          title="QR ผูกบัตรหมดอายุหรือถูกใช้แล้ว"
          description="แจ้งพนักงานที่ร้านให้ออก QR ผูกบัตรใหม่ แล้วสแกนด้วยกล้องมือถือของคุณ"
        />
      ) : (
        <Card className="bg-brand-50 ring-brand-100">
          <p className="flex items-center gap-2 text-sm text-brand-700">
            <Smartphone className="size-5 shrink-0" />
            <span>
              <strong>อยากสะสมแสตมป์ร้านนี้?</strong> สแกน QR ผูกบัตรที่ร้าน
              แล้วสะสมแต้ม/ดูรางวัลได้เลย
            </span>
          </p>
        </Card>
      )}

      <ShopDetails
        profile={profile}
        stampTypes={stampTypes}
        branch={primaryBranch}
      />

      <ShopReviewsSection
        slug={slug}
        shopId={shop.id}
        summary={reviewSummary}
        initial={reviewsPage}
        myReview={myReview}
        canReview={!!view}
      />

      <Link
        href="/privacy"
        className="mt-auto text-center text-xs text-muted hover:underline"
      >
        นโยบายความเป็นส่วนตัว
      </Link>
    </main>
  );
}
