"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";

import {
  contactAdminPublicAction,
  type ContactFormState,
} from "@/src/presentation/actions/contact-actions";
import { Button } from "@/src/presentation/components/ui/Button";
import { Input } from "@/src/presentation/components/ui/Input";
import { Textarea } from "@/src/presentation/components/ui/Textarea";
import { TurnstileWidget } from "./TurnstileWidget";

/**
 * Unauthenticated "contact admin" form on the login page (for users locked out).
 * Server action adds honeypot + CAPTCHA + per-IP rate-limit.
 */
export function PublicContactForm({ onCancel }: { onCancel?: () => void }) {
  const [state, action, pending] = useActionState<ContactFormState, FormData>(
    contactAdminPublicAction,
    {},
  );

  if (state.success) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="inline-flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="size-5 shrink-0" />
          {state.success}
        </p>
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            ปิด
          </Button>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        เข้าสู่ระบบไม่ได้? แจ้งผู้ดูแลให้ติดต่อกลับโดยเร็วที่สุด
      </p>
      <Input name="email" type="email" placeholder="อีเมลบัญชีของคุณ" maxLength={200} required />
      <Input name="subject" placeholder="หัวข้อ (เช่น เข้าสู่ระบบไม่ได้)" maxLength={120} required />
      <Textarea
        name="message"
        placeholder="อธิบายปัญหาที่พบ"
        rows={4}
        maxLength={1000}
        required
      />
      <Input
        name="contactChannel"
        placeholder="ช่องทางติดต่อกลับ (เบอร์โทร / LINE ID / อีเมล)"
        maxLength={200}
        required
      />
      {/* Honeypot — hidden from humans; bots tend to fill it. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />
      <TurnstileWidget siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
      {state.error && <p className="text-sm text-error">{state.error}</p>}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            ยกเลิก
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "กำลังส่ง…" : "ส่งคำขอ"}
        </Button>
      </div>
    </form>
  );
}
