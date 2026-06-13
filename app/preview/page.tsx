import { Inbox } from "lucide-react";

import type { CustomerCardView } from "@/src/domain/entities";
import { computeBillingState } from "@/src/domain/services/subscription-status";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Spinner,
  StampDots,
} from "@/src/presentation/components/ui";
import { SuspensionBanner } from "@/src/presentation/components/billing/SuspensionBanner";
import { PromptPayQR } from "@/src/presentation/components/billing/PromptPayQR";
import { PhoneLookupForm } from "@/src/presentation/components/stamp/PhoneLookupForm";
import { CardBalance } from "@/src/presentation/components/stamp/CardBalance";
import { ThemeSwitcher } from "@/src/presentation/components/theme-switcher";

// Dev-only design-system showcase. Safe to delete before production.
export const metadata = { title: "Preview · Design System" };

const now = new Date();

function mockView(currentStamps: number): CustomerCardView {
  const threshold = 10;
  return {
    customer: {
      id: "c1",
      shopId: "s1",
      phone: "0812345678",
      displayName: null,
      publicCode: "preview-code",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    card: {
      id: "card1",
      shopId: "s1",
      customerId: "c1",
      currentStamps,
      lifetimeStamps: currentStamps,
      rewardsEarned: 0,
      updatedAt: now.toISOString(),
    },
    threshold,
    rewardText: "เลือกเครื่องดื่มในร้านฟรี 1 แก้ว",
    eligibleToRedeem: currentStamps >= threshold,
    remaining: Math.max(0, threshold - currentStamps),
  };
}

// Levels of dunning: 3 days overdue, and 6 days overdue (urgent).
function overdueStatus(daysAgo: number) {
  const due = new Date(now.getTime() - daysAgo * 864e5).toISOString();
  return computeBillingState({ currentPeriodDueAt: due }, now);
}

const placeholderQr =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='white'/><text x='100' y='105' font-size='14' text-anchor='middle' fill='#94a3b8'>QR ตัวอย่าง</text></svg>`,
  );

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-700">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function PreviewPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Design System</h1>
          <p className="text-muted">สลับธีมเพื่อดูผล (cafe / minimal / retro + โหมดมืด)</p>
        </div>
        <ThemeSwitcher />
      </header>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary">หลัก</Button>
          <Button variant="accent">ชมพู</Button>
          <Button variant="outline">ขอบ</Button>
          <Button variant="ghost">โปร่ง</Button>
          <Button variant="danger">ลบ</Button>
          <Button disabled>ปิดใช้งาน</Button>
          <Button>
            <Spinner /> กำลังโหลด
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm">เล็ก</Button>
          <Button size="md">กลาง</Button>
          <Button size="lg">ใหญ่</Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>neutral</Badge>
          <Badge tone="brand">brand</Badge>
          <Badge tone="success">สำเร็จ</Badge>
          <Badge tone="warning">เตือน</Badge>
          <Badge tone="danger">อันตราย</Badge>
        </div>
      </Section>

      <Section title="Form">
        <Card className="max-w-sm">
          <FormField label="เบอร์โทร" htmlFor="p" hint="กรอกเฉพาะตัวเลข">
            <Input id="p" placeholder="0812345678" />
          </FormField>
          <div className="mt-3">
            <FormField label="อีเมล" htmlFor="e" error="อีเมลไม่ถูกต้อง">
              <Input id="e" invalid defaultValue="not-an-email" />
            </FormField>
          </div>
        </Card>
      </Section>

      <Section title="Phone lookup">
        <Card>
          <PhoneLookupForm action="/preview" submitLabel="ค้นหาแต้ม" />
        </Card>
      </Section>

      <Section title="Stamp dots">
        <Card className="flex flex-col gap-4">
          <StampDots current={3} threshold={10} />
          <StampDots current={10} threshold={10} />
          <StampDots current={5} threshold={8} size="sm" />
        </Card>
      </Section>

      <Section title="Card balance (ลูกค้า)">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardBalance view={mockView(5)} />
          </Card>
          <Card>
            <CardBalance view={mockView(10)} />
          </Card>
        </div>
      </Section>

      <Section title="Suspension banner">
        <div className="overflow-hidden rounded-xl ring-1 ring-border">
          <SuspensionBanner status={overdueStatus(3)} />
          <SuspensionBanner status={overdueStatus(6)} />
        </div>
      </Section>

      <Section title="PromptPay QR">
        <div className="max-w-xs">
          <PromptPayQR
            qrImageUrl={placeholderQr}
            amountSatang={29900}
            target="081-234-5678"
          />
        </div>
      </Section>

      <Section title="Empty state">
        <EmptyState
          icon={<Inbox />}
          title="ยังไม่มีลูกค้า"
          description="เริ่มเพิ่มแสตมป์ให้ลูกค้าคนแรกของคุณ"
          action={<Button size="sm">เพิ่มลูกค้า</Button>}
        />
      </Section>
    </main>
  );
}
