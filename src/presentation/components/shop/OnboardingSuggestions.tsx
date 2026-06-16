import Link from "next/link";
import {
  ArrowRight,
  Gift,
  MessageCircle,
  QrCode,
  UserCog,
  type LucideIcon,
} from "lucide-react";

import type { StampType } from "@/src/domain/entities";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";

/**
 * Smart "getting started" card: surfaces only the next steps the shop hasn't
 * done yet. Each item disappears once its condition is satisfied, and the whole
 * card renders nothing when everything is set up. Purely state-driven — no
 * dismiss state is persisted.
 */
export function OnboardingSuggestions({
  lineLinked,
  customerCount,
  staffCount,
  stampTypes,
}: {
  lineLinked: boolean;
  customerCount: number;
  staffCount: number;
  stampTypes: StampType[];
}) {
  const rewardConfigured =
    stampTypes.length > 0 && stampTypes.some((t) => t.rewardText.trim() !== "");

  const items: {
    icon: LucideIcon;
    iconClassName: string;
    title: string;
    description: string;
    href: string;
  }[] = [];

  if (!rewardConfigured) {
    items.push({
      icon: Gift,
      iconClassName: "bg-brand-100 text-brand-700",
      title: "ตั้งค่าประเภทแสตมป์และของรางวัล",
      description: "กำหนดจำนวนดวงที่ครบและของรางวัลที่ลูกค้าจะได้รับ",
      href: "/shop/settings",
    });
  }
  if (!lineLinked) {
    items.push({
      icon: MessageCircle,
      iconClassName: "bg-[#06C755]/10 text-[#06C755]",
      title: "เชื่อม LINE",
      description: "รับแจ้งเตือนผลอนุมัติชำระเงิน และเข้าสู่ระบบด้วยรหัส OTP",
      href: "/shop/settings",
    });
  }
  if (customerCount === 0) {
    items.push({
      icon: QrCode,
      iconClassName: "bg-brand-100 text-brand-700",
      title: "พิมพ์ป้าย QR ติดหน้าร้าน",
      description: "ให้ลูกค้าสแกนสมัครและสะสมแสตมป์ได้เองโดยไม่ต้องพกบัตร",
      href: "/shop/qr",
    });
  }
  if (staffCount === 0) {
    items.push({
      icon: UserCog,
      iconClassName: "bg-brand-100 text-brand-700",
      title: "เพิ่มพนักงาน",
      description: "ให้พนักงานช่วยกดแสตมป์/แลกรางวัลที่เคาน์เตอร์ได้",
      href: "/shop/staff",
    });
  }

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title="เริ่มต้นใช้งาน"
        subtitle="ทำให้ครบเพื่อใช้ Easy Stamp ได้เต็มที่"
        action={<Badge tone="brand">เหลือ {items.length} ข้อ</Badge>}
      />
      <ul className="flex flex-col divide-y divide-border">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.title}>
              <Link
                href={item.href}
                className="group flex items-center gap-3 py-3"
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${item.iconClassName}`}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">
                    {item.title}
                  </span>
                  <span className="block text-sm text-muted">
                    {item.description}
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
