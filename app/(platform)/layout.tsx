import { requireRole } from "@/src/infrastructure/auth/session";
import { AppHeader, type NavLink } from "@/src/presentation/components/layout/AppHeader";

const LINKS: NavLink[] = [
  { href: "/admin", label: "ภาพรวม" },
  { href: "/admin/shops", label: "ร้านค้า" },
  { href: "/admin/payments", label: "การชำระเงิน" },
];

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("platform_admin");
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader brand="Easy Stamp · Admin" links={LINKS} userEmail={user.email} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
