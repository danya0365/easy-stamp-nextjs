import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireRole } from "@/src/infrastructure/auth/session";
import { getBillingState } from "@/src/infrastructure/auth/billing-guard";
import {
  AppHeader,
  type NavLink,
} from "@/src/presentation/components/layout/AppHeader";
import { SuspensionBanner } from "@/src/presentation/components/billing/SuspensionBanner";
import { PreExpiryBanner } from "@/src/presentation/components/billing/PreExpiryBanner";

const LINKS: NavLink[] = [
  { href: "/shop", label: "แดชบอร์ด" },
  { href: "/shop/stamps", label: "เพิ่ม/แลกแสตมป์" },
  { href: "/shop/customers", label: "ลูกค้า" },
  { href: "/shop/branches", label: "สาขา" },
  { href: "/shop/staff", label: "พนักงาน" },
  { href: "/shop/qr", label: "ป้าย QR" },
  { href: "/shop/settings", label: "ตั้งค่า" },
  { href: "/shop/billing", label: "ชำระเงิน" },
];

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
      <AppHeader brand="Easy Stamp · ร้านค้า" links={LINKS} userEmail={user.email} />
      <SuspensionBanner status={status} />
      <PreExpiryBanner status={status} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
