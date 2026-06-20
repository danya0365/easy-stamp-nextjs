import { ShieldAlert } from "lucide-react";

import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { TwoFactorPanel } from "@/src/presentation/components/auth/TwoFactorPanel";

/**
 * Mandatory-2FA gate rendered IN PLACE OF the admin content (not a redirect) when
 * a platform admin hasn't enrolled yet. Rendering instead of redirecting avoids
 * the App Router soft-navigation blank-screen bug that a layout-level redirect to
 * a same-layout route caused. After enrollment the panel does a full reload to
 * `/admin`, so the layout re-renders with `totpEnabled` true and shows content.
 */
export function MandatoryTwoFactorGate() {
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
        <TwoFactorPanel enabled={false} redirectTo="/admin" />
      </Card>
    </div>
  );
}
