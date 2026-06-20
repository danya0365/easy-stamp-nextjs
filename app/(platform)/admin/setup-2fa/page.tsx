import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { TwoFactorPanel } from "@/src/presentation/components/auth/TwoFactorPanel";

export const dynamic = "force-dynamic";

/**
 * Mandatory 2FA enrollment gate. The (platform) layout redirects any admin
 * without 2FA here until they enable it, so the rest of the admin area stays
 * locked behind a second factor.
 */
export default async function Setup2faPage() {
  const user = await requireRole("platform_admin");

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div className="flex items-start gap-2 rounded-lg border border-warning bg-warning-surface px-4 py-3 text-sm text-warning">
        <ShieldAlert className="mt-0.5 size-5 shrink-0" />
        <p>
          ผู้ดูแลระบบต้องเปิดการยืนยันตัวตน 2 ชั้นก่อนใช้งาน เพื่อความปลอดภัยของบัญชี
          — ตั้งค่าให้เสร็จเพื่อเข้าใช้งานส่วนอื่น
        </p>
      </div>
      <Card>
        <CardHeader
          title="ตั้งค่า 2FA"
          subtitle="สแกน QR ด้วยแอป Authenticator (Google Authenticator, Authy, 1Password ฯลฯ)"
        />
        <TwoFactorPanel enabled={user.totpEnabled} redirectTo="/admin" />
      </Card>
      {user.totpEnabled && (
        <Link
          href="/admin"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-on-brand hover:bg-brand-700"
        >
          เข้าสู่แดชบอร์ดผู้ดูแล
          <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
