"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

import {
  generateLineLinkCodeAction,
  unlinkLineAction,
} from "@/src/presentation/actions/line-actions";
import { Button } from "@/src/presentation/components/ui/Button";
import { ChannelRow } from "./ChannelRow";

/** Channels not wired yet — shown as a "coming soon" teaser (UI only). */
const COMING_SOON: { name: string; description: string; icon: LucideIcon }[] = [
  { name: "Telegram", description: "รับการแจ้งเตือน + เข้าสู่ระบบด้วย OTP ผ่าน Telegram", icon: Send },
  { name: "อีเมล (Email OTP)", description: "รับรหัส OTP เข้าสู่ระบบทางอีเมล", icon: Mail },
  { name: "WhatsApp", description: "รับการแจ้งเตือน + OTP ผ่าน WhatsApp", icon: MessageCircle },
  { name: "SMS", description: "รับรหัส OTP เข้าสู่ระบบทาง SMS", icon: Smartphone },
];

function SoonBadge() {
  return (
    <span className="rounded-full bg-muted-surface px-2 py-0.5 text-[11px] text-muted">
      เร็วๆ นี้
    </span>
  );
}

/**
 * Connections & security section: the channels an operator can link to receive
 * notifications and sign in via OTP. LINE is live; the rest are teasers.
 */
export function ConnectionsSection({
  linked,
  addUrl,
}: {
  linked: boolean;
  addUrl?: string;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const lineTrailing = linked ? (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1 text-sm text-success">
        <CheckCircle2 size={16} />
        เชื่อมแล้ว
      </span>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => start(async () => void (await unlinkLineAction()))}
      >
        ยกเลิก
      </Button>
    </div>
  ) : code ? null : (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await generateLineLinkCodeAction();
          setCode(r.code);
        })
      }
    >
      เชื่อมต่อ
    </Button>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-xs text-brand-800">
        <ShieldCheck className="size-4 shrink-0" />
        <span>
          เชื่อมอย่างน้อย 1 ช่องทางเพื่อความปลอดภัย — ใช้รับการแจ้งเตือน และเข้าสู่ระบบด้วยรหัส
          OTP โดยไม่ต้องใช้รหัสผ่าน
        </span>
      </div>

      <ul className="flex flex-col divide-y divide-border">
        <li>
          <ChannelRow
            icon={MessageCircle}
            iconClassName="bg-[#06C755]/10 text-[#06C755]"
            name="LINE"
            description="รับการแจ้งเตือน และเข้าสู่ระบบด้วยรหัส OTP"
            badge={
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                ใช้เข้าสู่ระบบได้
              </span>
            }
            trailing={lineTrailing}
          >
            {!linked && !addUrl && (
              <p className="text-xs text-warning">
                * ระบบยังไม่ได้ตั้งค่า LINE OA — เชื่อมต่อได้เมื่อผู้ดูแลตั้งค่าเสร็จ
              </p>
            )}
            {!linked && code && (
              <div className="flex flex-col gap-2 rounded-xl bg-muted-surface p-4 text-sm">
                <p className="font-medium text-foreground">วิธีเชื่อมต่อ</p>
                <ol className="list-decimal space-y-1 pl-5 text-muted">
                  <li>
                    {addUrl ? (
                      <>
                        เพิ่มเพื่อน LINE OA:{" "}
                        <a
                          className="text-brand-700 underline"
                          href={addUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          กดเพิ่มเพื่อน
                        </a>
                      </>
                    ) : (
                      "เพิ่มเพื่อน LINE OA ของระบบ"
                    )}
                  </li>
                  <li>พิมพ์โค้ดนี้ส่งในแชท:</li>
                </ol>
                <p className="select-all rounded-lg bg-card px-3 py-2 text-center text-lg font-bold tracking-widest text-brand-700">
                  {code}
                </p>
                <p className="text-xs text-muted">
                  เมื่อส่งโค้ดแล้วระบบจะตอบกลับว่าเชื่อมต่อสำเร็จ จากนั้นรีเฟรชหน้านี้
                </p>
              </div>
            )}
          </ChannelRow>
        </li>

        {COMING_SOON.map((c) => (
          <li key={c.name}>
            <ChannelRow
              icon={c.icon}
              name={c.name}
              description={c.description}
              muted
              trailing={<SoonBadge />}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
