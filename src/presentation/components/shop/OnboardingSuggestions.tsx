"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Gift,
  MessageCircle,
  QrCode,
  UserCog,
  X,
  type LucideIcon,
} from "lucide-react";

import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { useOnboardingStore } from "@/src/presentation/stores/onboarding.store";

type Item = {
  key: string;
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  description: string;
  href: string;
};

/**
 * Smart "getting started" card: surfaces only the next steps the shop hasn't
 * done yet. An item disappears once its condition is satisfied OR the owner
 * dismisses it (✕). Dismissals persist per-shop in localStorage. The whole card
 * renders nothing when there's nothing left to show.
 */
export function OnboardingSuggestions({
  shopId,
  rewardConfigured,
  lineLinked,
  hasCustomers,
  hasStaff,
}: {
  shopId: string;
  rewardConfigured: boolean;
  lineLinked: boolean;
  hasCustomers: boolean;
  hasStaff: boolean;
}) {
  const all: Item[] = [];
  if (!rewardConfigured) {
    all.push({
      key: "reward",
      icon: Gift,
      iconClassName: "bg-brand-100 text-brand-700",
      title: "ตั้งค่าประเภทแสตมป์และของรางวัล",
      description: "กำหนดจำนวนดวงที่ครบและของรางวัลที่ลูกค้าจะได้รับ",
      href: "/shop/settings",
    });
  }
  if (!lineLinked) {
    all.push({
      key: "line",
      icon: MessageCircle,
      iconClassName: "bg-[#06C755]/10 text-[#06C755]",
      title: "เชื่อม LINE",
      description: "รับแจ้งเตือนผลอนุมัติชำระเงิน และเข้าสู่ระบบด้วยรหัส OTP",
      href: "/shop/settings",
    });
  }
  if (!hasCustomers) {
    all.push({
      key: "qr",
      icon: QrCode,
      iconClassName: "bg-brand-100 text-brand-700",
      title: "พิมพ์ป้าย QR ติดหน้าร้าน",
      description: "ให้ลูกค้าสแกนสมัครและสะสมแสตมป์ได้เองโดยไม่ต้องพกบัตร",
      href: "/shop/qr",
    });
  }
  if (!hasStaff) {
    all.push({
      key: "staff",
      icon: UserCog,
      iconClassName: "bg-brand-100 text-brand-700",
      title: "เพิ่มพนักงาน",
      description: "ให้พนักงานช่วยกดแสตมป์/แลกรางวัลที่เคาน์เตอร์ได้",
      href: "/shop/staff",
    });
  }

  const dismissedList = useOnboardingStore((s) => s.dismissed[shopId]);
  const dismiss = useOnboardingStore((s) => s.dismiss);

  // Rehydrate from localStorage after mount (store uses skipHydration so the
  // first render matches the server — no hydration mismatch).
  useEffect(() => {
    useOnboardingStore.persist.rehydrate();
  }, []);

  const dismissedSet = new Set(dismissedList ?? []);
  const visible = all.filter((i) => !dismissedSet.has(i.key));

  if (visible.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title="เริ่มต้นใช้งาน"
        subtitle="ทำให้ครบเพื่อใช้ Easy Stamp ได้เต็มที่"
        action={<Badge tone="brand">เหลือ {visible.length} ข้อ</Badge>}
      />
      <ul className="flex flex-col divide-y divide-border">
        {visible.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.key} className="flex items-center gap-1">
              <Link
                href={item.href}
                className="group flex min-w-0 flex-1 items-center gap-3 py-3"
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
              <button
                type="button"
                onClick={() => dismiss(shopId, item.key)}
                aria-label="ปิดคำแนะนำนี้"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-muted-surface hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
