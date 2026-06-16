import Link from "next/link";
import {
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  History,
  MessageCircle,
  PauseCircle,
  QrCode,
  Stamp,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Card, CardHeader } from "@/src/presentation/components/ui/Card";

/** Full catalog of shop features — always visible so nothing is buried in the
 * bottom-bar "more" overflow. Each tile links straight to the feature. */
const FEATURES: {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
}[] = [
  {
    icon: Stamp,
    label: "เพิ่ม/แลกแสตมป์",
    description: "กดแสตมป์หรือแลกรางวัลที่เคาน์เตอร์",
    href: "/shop/stamps",
  },
  {
    icon: Users,
    label: "ลูกค้า",
    description: "รายชื่อลูกค้าและแต้มสะสม",
    href: "/shop/customers",
  },
  {
    icon: BarChart3,
    label: "สถิติร้าน",
    description: "ยอดแสตมป์ แลกรางวัล ลูกค้าใหม่",
    href: "/shop/analytics",
  },
  {
    icon: QrCode,
    label: "ป้าย QR",
    description: "พิมพ์ติดหน้าร้านให้ลูกค้าสแกน",
    href: "/shop/qr",
  },
  {
    icon: Building2,
    label: "สาขา",
    description: "จัดการสาขาและตำแหน่งบนแผนที่",
    href: "/shop/branches",
  },
  {
    icon: UserCog,
    label: "พนักงาน",
    description: "เพิ่ม/จัดการบัญชีพนักงานสาขา",
    href: "/shop/staff",
  },
  {
    icon: PauseCircle,
    label: "ปิดร้านชั่วคราว",
    description: "หยุดนับวันใช้งานช่วงปิดร้าน",
    href: "/shop/settings",
  },
  {
    icon: MessageCircle,
    label: "เชื่อม LINE / ความปลอดภัย",
    description: "แจ้งเตือน + เข้าสู่ระบบด้วย OTP",
    href: "/shop/settings",
  },
  {
    icon: CreditCard,
    label: "ชำระเงิน / เติมวัน",
    description: "เติมวันใช้งานและส่งสลิป",
    href: "/shop/billing",
  },
  {
    icon: Bell,
    label: "แจ้งเตือน",
    description: "ข้อความและการแจ้งเตือนในแอป",
    href: "/shop/notifications",
  },
  {
    icon: History,
    label: "ประวัติแลกรางวัล",
    description: "รายการแลกรางวัลทั้งหมด",
    href: "/shop/redemptions",
  },
];

export function FeatureGrid() {
  return (
    <Card>
      <CardHeader
        title="ฟีเจอร์ทั้งหมด"
        subtitle="ทุกเครื่องมือสำหรับจัดการร้านของคุณ"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <Link
              key={f.label}
              href={f.href}
              className="group flex flex-col gap-2 rounded-xl p-3 ring-1 ring-border transition hover:ring-brand-300 hover:bg-brand-50/50"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-brand-100 text-brand-700">
                <Icon className="size-5" />
              </span>
              <span className="block text-sm font-medium text-foreground">
                {f.label}
              </span>
              <span className="block text-xs text-muted">{f.description}</span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
