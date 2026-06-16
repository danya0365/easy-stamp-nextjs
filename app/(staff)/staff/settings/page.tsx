import { requireRole } from "@/src/infrastructure/auth/session";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { ConnectionsSection } from "@/src/presentation/components/channels/ConnectionsSection";
import { ChangePasswordForm } from "@/src/presentation/components/auth/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function StaffSettingsPage() {
  const user = await requireRole("branch_staff");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-foreground">ตั้งค่า</h1>

      <div className="grid items-start gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader
          title="ช่องทางเชื่อมต่อ & ความปลอดภัย"
          subtitle="เชื่อม LINE เพื่อรับการแจ้งเตือน และเข้าสู่ระบบด้วยรหัส OTP"
        />
        <ConnectionsSection
          linked={!!user.lineUserId}
          addUrl={process.env.NEXT_PUBLIC_LINE_OA_ADD_URL}
        />
      </Card>

      <Card>
        <CardHeader title="เปลี่ยนรหัสผ่าน" />
        <ChangePasswordForm />
      </Card>
      </div>
    </div>
  );
}
