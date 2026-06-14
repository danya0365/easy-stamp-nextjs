import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireRole } from "@/src/infrastructure/auth/session";
import { getBillingState } from "@/src/infrastructure/auth/billing-guard";
import { AppHeader } from "@/src/presentation/components/layout/AppHeader";
import { AppTabBar } from "@/src/presentation/components/layout/AppTabBar";
import { SuspensionBanner } from "@/src/presentation/components/billing/SuspensionBanner";
import { PreExpiryBanner } from "@/src/presentation/components/billing/PreExpiryBanner";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("shop_owner");
  const { status } = await getBillingState(user.shopId!);
  const pathname = (await headers()).get("x-pathname") ?? "";

  // Suspended: block everything except the billing page (so they can pay).
  if (status.isSuspended && !pathname.startsWith("/shop/billing")) {
    redirect("/shop/billing");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader brand="Easy Stamp · ร้านค้า" userEmail={user.email} />
      <SuspensionBanner status={status} />
      <PreExpiryBanner status={status} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+5rem)]">
        {children}
      </main>
      <AppTabBar nav="shop" />
    </div>
  );
}
