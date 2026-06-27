import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { LogOut } from "lucide-react";

import {
  requireShopAccess,
  getCurrentSessionToken,
} from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { getBillingState } from "@/src/infrastructure/auth/billing-guard";
import { PAUSE_MAX_PER_30D } from "@/src/domain/services/subscription-status";
import { signOutEverywhereAction } from "@/src/presentation/actions/auth-actions";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { StampTypesManager } from "@/src/presentation/components/shop/StampTypesManager";
import { ChangePasswordForm } from "@/src/presentation/components/auth/ChangePasswordForm";
import { DeviceList } from "@/src/presentation/components/auth/DeviceList";
import { ContactAdminButton } from "@/src/presentation/components/shop/ContactAdminButton";
import { ConnectionsSection } from "@/src/presentation/components/channels/ConnectionsSection";
import { PauseShopControl } from "@/src/presentation/components/shop/PauseShopControl";
import { ShopImagesManager } from "@/src/presentation/components/shop/ShopImagesManager";
import { ShopProfileForm } from "@/src/presentation/components/shop/ShopProfileForm";
import { SettingsTabs } from "@/src/presentation/components/settings/SettingsTabs";

export const dynamic = "force-dynamic";

export default async function ShopSettingsPage() {
  const { user, shopId, impersonating } = await requireShopAccess();
  const t = await getTranslations("shopPages");
  const shop = await container.shopRepository.findById(shopId);
  if (!shop) return null;
  const [
    stampTypes,
    subscription,
    shopImages,
    shopProfile,
    sessions,
    currentToken,
    billing,
    pauseCapPeek,
    pauseCdPeek,
  ] = await Promise.all([
    container.stampTypeRepository.listByShop(shop.id),
    container.subscriptionRepository.findByShop(shop.id),
    container.shopImageRepository.listByShop(shop.id),
    container.shopProfileRepository.get(shop.id),
    // Device list is the owner's own account; skip while an admin impersonates.
    impersonating
      ? Promise.resolve([])
      : container.sessionRepository.listByUser(user.id, new Date()),
    impersonating ? Promise.resolve(null) : getCurrentSessionToken(),
    getBillingState(shop.id),
    container.rateLimitRepository.peek(`shop_pause_cap:${shop.id}`),
    container.rateLimitRepository.peek(`shop_pause_cd:${shop.id}`),
  ]);

  // Pause quota/cooldown snapshot for the UI (read-only — does not consume).
  const pausesUsed = pauseCapPeek?.count ?? 0;
  const cooldownRemainingSec = pauseCdPeek
    ? Math.max(
        0,
        Math.ceil(
          (new Date(pauseCdPeek.resetAt).getTime() - new Date().getTime()) /
            1000,
        ),
      )
    : 0;
  const devices = sessions.map((s) => ({
    id: s.id,
    userAgent: s.userAgent,
    ip: s.ip,
    createdAt: s.createdAt,
    isCurrent: s.id === currentToken,
  }));

  return (
    <SettingsTabs
      tabs={[
        {
          id: "shop",
          label: t("tabShop"),
          icon: "stamp",
          content: (
            <>
              <Card>
                <CardHeader
                  title={t("stampTypesTitle")}
                  subtitle={
                    <>
                      {t("stampTypesSubtitlePrefix")}{" "}
                      <a
                        href={`/s/${shop.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {t("openShopLink", { slug: shop.slug })}
                      </a>
                    </>
                  }
                />
                <StampTypesManager types={stampTypes} />
                <Link
                  href="/shop/qr"
                  className="mt-4 inline-flex items-center gap-1 text-sm text-brand-700 hover:underline"
                >
                  <ArrowRight className="size-4" />
                  {t("openQrPoster")}
                </Link>
              </Card>

              <Card>
                <CardHeader
                  title={t("pauseShopTitle")}
                  subtitle={t("pauseShopSubtitle")}
                />
                <PauseShopControl
                  paused={!!subscription?.pausedAt}
                  daysUntilDue={billing.status.daysUntilDue}
                  frozenDaysSoFar={billing.status.frozenDaysSoFar}
                  pausesUsed={pausesUsed}
                  pauseCap={PAUSE_MAX_PER_30D}
                  cooldownRemainingSec={cooldownRemainingSec}
                />
              </Card>
            </>
          ),
        },
        {
          id: "details",
          label: t("tabDetails"),
          icon: "info",
          content: (
            <Card>
              <CardHeader
                title={t("shopDetailsTitle")}
                subtitle={t("shopDetailsSubtitle", { slug: shop.slug })}
              />
              <ShopProfileForm profile={shopProfile} />
            </Card>
          ),
        },
        {
          id: "images",
          label: t("tabImages"),
          icon: "image",
          content: (
            <Card>
              <CardHeader
                title={t("imagesTitle")}
                subtitle={
                  <>
                    {t("imagesSubtitlePrefix")}{" "}
                    <a
                      href={`/s/${shop.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {t("myShopLink")}
                    </a>
                  </>
                }
              />
              <ShopImagesManager images={shopImages} />
            </Card>
          ),
        },
        {
          id: "security",
          label: t("tabSecurity"),
          icon: "shield",
          content: (
            <>
              <Card>
                <CardHeader title={t("changePasswordTitle")} />
                <ChangePasswordForm />
              </Card>

              <Card>
                <CardHeader
                  title={t("connectionsTitle")}
                  subtitle={t("connectionsSubtitle")}
                />
                <ConnectionsSection
                  linked={!!user.lineUserId}
                  addUrl={process.env.NEXT_PUBLIC_LINE_OA_ADD_URL}
                />
              </Card>

              {!impersonating && (
                <Card>
                  <CardHeader
                    title={t("devicesTitle")}
                    subtitle={t("devicesSubtitle")}
                  />
                  <DeviceList devices={devices} />
                  <form
                    className="mt-3"
                    action={async () => {
                      "use server";
                      await signOutEverywhereAction();
                    }}
                  >
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted-surface"
                    >
                      <LogOut className="size-4" />
                      {t("signOutOthers")}
                    </button>
                  </form>
                </Card>
              )}
            </>
          ),
        },
      ]}
      footer={
        <Card>
          <CardHeader
            title={t("contactAdminTitle")}
            subtitle={t("contactAdminSubtitle")}
          />
          <ContactAdminButton />
        </Card>
      }
    />
  );
}
