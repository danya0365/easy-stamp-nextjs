import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { StampDots } from "@/src/presentation/components/ui/StampDots";

export const metadata: Metadata = {
  title: "Easy Stamp · ระบบบัตรสะสมแสตมป์",
  description:
    "บัตรสะสมแสตมป์ออนไลน์สำหรับร้านค้าหลายสาขา — ลูกค้าสะสมแต้มไม่ต้องพกบัตร ร้านค้าจัดการง่ายในที่เดียว",
};

interface Feature {
  icon: string;
  title: string;
  blurb: string;
  badge: string;
  tone: "brand" | "success" | "warning" | "neutral";
}

const SHOP_FEATURES: Feature[] = [
  {
    icon: "🏪",
    title: "หลายร้าน หลายสาขา",
    blurb: "เปิดได้หลายร้านในระบบเดียว แต่ละร้านมีสาขาของตัวเอง แยกข้อมูลชัดเจน",
    badge: "Multi-shop",
    tone: "brand",
  },
  {
    icon: "📷",
    title: "เพิ่มแต้มเร็ว",
    blurb: "สแกน QR จากมือถือลูกค้า ไม่ต้องพิมพ์เบอร์ทุกครั้ง กดเพิ่มแต้มได้ทันที",
    badge: "สแกนแล้วจบ",
    tone: "success",
  },
  {
    icon: "🎯",
    title: "ตั้งเกณฑ์ + รางวัลเอง",
    blurb: "กำหนดจำนวนดวงที่ต้องสะสมและของรางวัลได้เองในแต่ละร้าน",
    badge: "ยืดหยุ่น",
    tone: "brand",
  },
  {
    icon: "🎁",
    title: "แลกรางวัล + ประวัติ",
    blurb: "กดปุ่มแลกรางวัลเมื่อลูกค้าสะสมครบ เก็บประวัติการให้/แลกแต้มทุกครั้ง",
    badge: "มี ledger",
    tone: "neutral",
  },
  {
    icon: "💸",
    title: "ค่าบริการรายเดือน",
    blurb: "จ่ายผ่าน PromptPay QR แล้วอัปโหลดสลิป แอดมินตรวจสอบและเปิดใช้งานให้",
    badge: "PromptPay",
    tone: "success",
  },
  {
    icon: "🔔",
    title: "เตือนค้างชำระอัตโนมัติ",
    blurb: "แจ้งเตือนในแอปเมื่อใกล้/เลยกำหนด และระงับการใช้งานอัตโนมัติหลัง 7 วัน",
    badge: "อัตโนมัติ",
    tone: "warning",
  },
  {
    icon: "👥",
    title: "3 บทบาทผู้ใช้",
    blurb: "แอดมินดูแลระบบ · เจ้าของร้านจัดการร้าน · พนักงานสาขาเพิ่ม/แลกแต้ม",
    badge: "แยกสิทธิ์",
    tone: "brand",
  },
];

interface Step {
  icon: string;
  title: string;
  detail: string;
}

const CUSTOMER_STEPS: Step[] = [
  {
    icon: "🛍️",
    title: "ซื้อของที่ร้าน",
    detail: "พนักงานเพิ่มแต้มให้ตามยอดซื้อ — คุณไม่ต้องพกบัตรหรือสมัครอะไร",
  },
  {
    icon: "📲",
    title: "สแกน QR ครั้งแรก",
    detail:
      "สแกน QR ที่ร้านด้วยกล้องมือถือ เพื่อผูกบัตรกับเครื่องของคุณ (กันคนอื่นสวมสิทธิ)",
  },
  {
    icon: "⚡",
    title: "กลับมาอีกครั้ง แค่สแกน",
    detail: "ครั้งต่อไปแค่สแกน QR ที่ร้าน บัตรเปิดทันที ไม่ต้องติดตั้งหรือจำ URL",
  },
  {
    icon: "🎉",
    title: "สะสมครบ แลกรางวัล",
    detail: "เมื่อแต้มครบตามเกณฑ์ แจ้งพนักงานเพื่อแลกของรางวัลได้เลย",
  },
  {
    icon: "👜",
    title: "ใช้หลายร้าน รวมที่เดียว",
    detail: 'หน้า "บัตรของฉัน" รวมบัตรทุกร้านบนเครื่องนี้ และเพิ่มลงหน้าจอหลักได้',
  },
];

export default function InfoPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-10 px-4 py-10">
      {/* Hero */}
      <header className="flex flex-col items-center gap-4 text-center">
        <span className="text-4xl">☕️</span>
        <h1 className="text-3xl font-bold text-brand-700">Easy Stamp</h1>
        <p className="max-w-md text-muted">
          บัตรสะสมแสตมป์ออนไลน์สำหรับร้านค้าหลายสาขา — ลูกค้าสะสมแต้มไม่ต้องพกบัตร
          ร้านค้าจัดการง่ายในที่เดียว
        </p>
        <div className="mt-2 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-brand-100">
          <p className="mb-2 text-sm font-medium text-brand-700">ตัวอย่างบัตร</p>
          <StampDots current={7} threshold={10} size="md" />
          <p className="mt-2 text-xs text-muted">สะสม 7/10 · อีก 3 ดวงครบรางวัล</p>
        </div>
      </header>

      {/* Section A — for shops */}
      <section className="flex flex-col gap-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">สำหรับร้านค้า 🏪</h2>
          <p className="text-sm text-muted">
            ทุกอย่างที่ร้านต้องใช้ ครบในระบบเดียว
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {SHOP_FEATURES.map((f) => (
            <Card key={f.title} className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl">{f.icon}</span>
                <Badge tone={f.tone}>{f.badge}</Badge>
              </div>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted">{f.blurb}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Section B — for customers */}
      <section className="flex flex-col gap-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">วิธีสะสมแต้ม 🎟️</h2>
          <p className="text-sm text-muted">สำหรับลูกค้า — ง่ายใน 5 ขั้นตอน</p>
        </div>
        <ol className="flex flex-col gap-3">
          {CUSTOMER_STEPS.map((s, i) => (
            <li key={s.title}>
              <Card className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white shadow-sm">
                  {i + 1}
                </div>
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-semibold text-foreground">
                    <span className="mr-1">{s.icon}</span>
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted">{s.detail}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* CTAs */}
      <footer className="flex flex-col items-center gap-3 pb-4">
        <Link
          href="/login"
          className="w-full max-w-xs rounded-full bg-brand-500 px-6 py-3 text-center font-medium text-white shadow-sm transition hover:bg-brand-600"
        >
          เข้าสู่ระบบผู้ดูแล
        </Link>
        <Link
          href="/me"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          👜 ดูบัตรสะสมแต้มของฉัน
        </Link>
        <Link
          href="/privacy"
          className="text-xs text-muted hover:underline"
        >
          นโยบายความเป็นส่วนตัว
        </Link>
      </footer>
    </main>
  );
}
