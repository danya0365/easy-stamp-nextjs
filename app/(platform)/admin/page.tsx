import Link from "next/link";

import {
  requireRole,
  getCurrentSessionToken,
} from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { LogOut } from "lucide-react";

import { ChangePasswordForm } from "@/src/presentation/components/auth/ChangePasswordForm";
import { TwoFactorPanel } from "@/src/presentation/components/auth/TwoFactorPanel";
import { DeviceList } from "@/src/presentation/components/auth/DeviceList";
import { ConnectionsSection } from "@/src/presentation/components/channels/ConnectionsSection";
import { signOutEverywhereAction } from "@/src/presentation/actions/auth-actions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireRole("platform_admin");
  const [shops, pending, openContacts, totpState, sessions, currentToken] =
    await Promise.all([
      container.shopRepository.list(),
      container.paymentRepository.listByStatus("pending"),
      container.contactRequestRepository.countByStatus("open"),
      container.userRepository.getTotpState(user.id),
      container.sessionRepository.listByUser(user.id, new Date()),
      getCurrentSessionToken(),
    ]);
  const devices = sessions.map((s) => ({
    id: s.id,
    userAgent: s.userAgent,
    ip: s.ip,
    createdAt: s.createdAt,
    isCurrent: s.id === currentToken,
  }));

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-foreground">ภาพรวมระบบ</h1>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/admin/shops">
          <Card className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-brand-600">
              {shops.length}
            </span>
            <span className="text-sm text-muted">ร้านค้าทั้งหมด</span>
          </Card>
        </Link>
        <Link href="/admin/payments">
          <Card className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-accent-500">
              {pending.length}
            </span>
            <span className="text-sm text-muted">รอตรวจสอบการชำระเงิน</span>
          </Card>
        </Link>
        <Link href="/admin/contacts">
          <Card className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-accent-500">
              {openContacts}
            </span>
            <span className="text-sm text-muted">คำขอติดต่อรอดำเนินการ</span>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader
          title="ช่องทางเชื่อมต่อ & ความปลอดภัย"
          subtitle="เชื่อมช่องทางเพื่อรับการแจ้งเตือน (แจ้งชำระเงิน/คำขอติดต่อ) และเข้าสู่ระบบด้วยรหัส OTP"
        />
        <ConnectionsSection
          linked={!!user.lineUserId}
          addUrl={process.env.NEXT_PUBLIC_LINE_OA_ADD_URL}
        />
      </Card>

      <Card>
        <CardHeader
          title="การยืนยันตัวตน 2 ชั้น (2FA)"
          subtitle="ป้องกันบัญชีผู้ดูแลด้วย TOTP — แนะนำให้เปิดใช้งาน"
        />
        <TwoFactorPanel
          enabled={user.totpEnabled}
          recoveryRemaining={totpState?.recoveryCodes.length}
        />
      </Card>

      <Card>
        <CardHeader title="เปลี่ยนรหัสผ่าน" />
        <ChangePasswordForm />
      </Card>

      <Card>
        <CardHeader
          title="อุปกรณ์ที่เข้าสู่ระบบ"
          subtitle="อุปกรณ์ที่มี session ใช้งานอยู่ — ออกจากระบบรายเครื่อง หรือทุกเครื่องยกเว้นนี้"
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
            ออกจากระบบบนอุปกรณ์อื่นทั้งหมด
          </button>
        </form>
      </Card>
    </div>
  );
}
