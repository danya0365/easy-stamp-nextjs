import { requireRole } from "@/src/infrastructure/auth/session";
import { getBillingState } from "@/src/infrastructure/auth/billing-guard";
import {
  AppHeader,
  type NavLink,
} from "@/src/presentation/components/layout/AppHeader";
import { SuspensionBanner } from "@/src/presentation/components/billing/SuspensionBanner";

const LINKS: NavLink[] = [{ href: "/staff", label: "หน้าหลัก" }];

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("branch_staff");
  const { status } = await getBillingState(user.shopId!);

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader brand="Easy Stamp · พนักงาน" links={LINKS} userEmail={user.email} />
      <SuspensionBanner status={status} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {status.isSuspended ? (
          <div className="rounded-2xl bg-error-surface p-6 text-center">
            <p className="text-lg font-semibold text-error">ร้านถูกระงับการใช้งาน</p>
            <p className="mt-1 text-sm text-muted">
              เนื่องจากค้างชำระค่าบริการ กรุณาแจ้งเจ้าของร้านให้ชำระเงิน
            </p>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
