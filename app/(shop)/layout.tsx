import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireRole } from "@/src/infrastructure/auth/session";
import { getBillingState } from "@/src/infrastructure/auth/billing-guard";
import { container } from "@/src/infrastructure/di/container";
import { AppHeader } from "@/src/presentation/components/layout/AppHeader";
import { AppTabBar } from "@/src/presentation/components/layout/AppTabBar";
import { AppVersion } from "@/src/presentation/components/layout/AppVersion";
import { SuspensionBanner } from "@/src/presentation/components/billing/SuspensionBanner";
import { PreExpiryBanner } from "@/src/presentation/components/billing/PreExpiryBanner";
import { PausedBanner } from "@/src/presentation/components/billing/PausedBanner";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("shop_owner");
  const { status } = await getBillingState(user.shopId!);
  const pathname = (await headers()).get("x-pathname") ?? "";
  const unread = await container.notificationRepository.countUnread(user.id);

  // Suspended: block everything except the billing page (so they can pay).
  if (status.isSuspended && !pathname.startsWith("/shop/billing")) {
    redirect("/shop/billing");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader
        brand="Easy Stamp"
        role="ร้านค้า"
        userEmail={user.email}
        notifications={{ href: "/shop/notifications", unread }}
      />
      <SuspensionBanner status={status} />
      <PreExpiryBanner status={status} />
      <PausedBanner status={status} resumable />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+5rem)]">
        {children}
        <AppVersion />
      </main>
      <AppTabBar nav="shop" />
    </div>
  );
}
