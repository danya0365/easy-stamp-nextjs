"use client";

import { useActionState, useState } from "react";
import { MessageSquare } from "lucide-react";

import {
  contactAdminAction,
  type ContactFormState,
} from "@/src/presentation/actions/contact-actions";
import { Button } from "@/src/presentation/components/ui/Button";
import { Input } from "@/src/presentation/components/ui/Input";
import { Modal } from "@/src/presentation/components/ui/Modal";

export function ContactAdminButton() {
  const [open, setOpen] = useState(false);
  // Close the modal as part of handling the action result (not in an effect).
  const [state, action, pending] = useActionState<ContactFormState, FormData>(
    async (prev, formData) => {
      const result = await contactAdminAction(prev, formData);
      if (result.success) setOpen(false);
      return result;
    },
    {},
  );

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <MessageSquare size={16} />
        ติดต่อผู้ดูแล
      </Button>
      {state.success && (
        <p className="mt-2 text-sm text-success">{state.success}</p>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="ติดต่อผู้ดูแล">
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
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "กำลังส่ง…" : "ส่งคำขอ"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
