"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";

import {
  contactAdminAction,
  type ContactFormState,
} from "@/src/presentation/actions/contact-actions";
import { Button } from "@/src/presentation/components/ui/Button";
import { Input } from "@/src/presentation/components/ui/Input";

/**
 * The contact-admin form itself (fields + submit). Rendered inline on the
 * /shop/contact page and inside a Modal by ContactAdminButton. Pass `onCancel`
 * to show a cancel/close button (modal mode).
 */
export function ContactAdminForm({ onCancel }: { onCancel?: () => void }) {
  const [state, action, pending] = useActionState<ContactFormState, FormData>(
    contactAdminAction,
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
      <Input name="subject" placeholder="หัวข้อ" maxLength={120} required />
      <textarea
        name="message"
        placeholder="รายละเอียดที่ต้องการแจ้ง"
        rows={4}
        maxLength={1000}
        required
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
      />
      <Input
        name="contactChannel"
        placeholder="ช่องทางติดต่อกลับ (เบอร์โทร / LINE ID / อีเมล)"
        maxLength={200}
        required
      />
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
