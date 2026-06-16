"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  PauseCircle,
  QrCode,
  type LucideIcon,
} from "lucide-react";

type Slide = {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  badge?: string;
};

/** Curated highlights to promote — not every feature (that's FeatureGrid). */
const SLIDES: Slide[] = [
  {
    icon: PauseCircle,
    title: "ปิดร้านชั่วคราวได้แล้ว",
    description: "ปิดช่วงหยุดยาว/ปรับปรุงร้าน วันใช้งานที่เหลือไม่ถูกหัก",
    href: "/shop/settings",
    badge: "ใหม่",
  },
  {
    icon: MessageCircle,
    title: "เชื่อม LINE กับร้าน",
    description: "รับแจ้งเตือน และเข้าสู่ระบบด้วยรหัส OTP ไม่ต้องใช้รหัสผ่าน",
    href: "/shop/settings",
  },
  {
    icon: BarChart3,
    title: "ดูสถิติร้านของคุณ",
    description: "ยอดแสตมป์ ลูกค้าใหม่ และอัตราการแลกรางวัล",
    href: "/shop/analytics",
  },
  {
    icon: QrCode,
    title: "ป้าย QR หน้าร้าน",
    description: "พิมพ์ติดหน้าร้านให้ลูกค้าสแกนสมัครและสะสมแสตมป์เองได้",
    href: "/shop/qr",
  },
];

const INTERVAL_MS = 5000;
const count = SLIDES.length;

/**
 * Auto-sliding highlights banner. Pauses on hover/focus, exposes manual
 * arrows + dots, and respects prefers-reduced-motion (no auto-advance).
 */
export function FeatureCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(t);
  }, [paused]);

  const go = (i: number) => setIndex((i + count) % count);

  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="ไฮไลต์ฟีเจอร์"
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {SLIDES.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.title}
              href={s.href}
              className="flex min-h-[7rem] w-full shrink-0 items-center gap-4 bg-gradient-to-r from-brand-500 to-brand-600 p-5 pr-10 text-on-brand"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-on-brand/15">
                <Icon className="size-7" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-semibold">{s.title}</span>
                  {s.badge && (
                    <span className="rounded-full bg-on-brand/20 px-2 py-0.5 text-[11px] font-medium">
                      {s.badge}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-sm text-on-brand/80">
                  {s.description}
                </span>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-on-brand/15 px-3 py-1 text-xs font-medium">
                  ดูเลย
                  <ArrowRight className="size-3.5" />
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="สไลด์ก่อนหน้า"
        onClick={() => go(index - 1)}
        className="absolute left-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-on-brand/15 text-on-brand transition hover:bg-on-brand/25"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        aria-label="สไลด์ถัดไป"
        onClick={() => go(index + 1)}
        className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-on-brand/15 text-on-brand transition hover:bg-on-brand/25"
      >
        <ChevronRight className="size-5" />
      </button>

      <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            type="button"
            aria-label={`ไปสไลด์ที่ ${i + 1}`}
            aria-current={i === index}
            onClick={() => go(i)}
            className={`size-1.5 rounded-full transition ${
              i === index ? "w-4 bg-on-brand" : "bg-on-brand/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
