"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Store } from "lucide-react";

import {
  convertLeadToShopAction,
  type LeadFormState,
} from "@/src/presentation/actions/lead-actions";
import type { Lead } from "@/src/domain/entities";
import { Button } from "@/src/presentation/components/ui/Button";
import { Input } from "@/src/presentation/components/ui/Input";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Modal } from "@/src/presentation/components/ui/Modal";
import { GeneratedPasswordField } from "@/src/presentation/components/ui/GeneratedPasswordField";
import { ShopCredentialsHandoff } from "@/src/presentation/components/admin/ShopCredentialsHandoff";

/** Suggest a URL slug from the lead name (latin/number only). */
function suggestSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Badge + public link shown once a lead is (or has been) converted. */
function ConvertedBadge({ slug }: { slug: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="success">แปลงเป็นร้านแล้ว</Badge>
      <Link
        href={`/s/${slug}`}
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
      >
        <Store size={14} />/s/{slug}
      </Link>
    </div>
  );
}

export function ConvertLeadButton({
  lead,
  convertedSlug,
}: {
  lead: Lead;
  /** Set once this lead has a shop — the page stays mounted across conversion. */
  convertedSlug: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [handoffDismissed, setHandoffDismissed] = useState(false);
  const [state, action, pending] = useActionState<LeadFormState, FormData>(
    convertLeadToShopAction,
    {},
  );

  // Just converted in this session → show the credentials handoff. This branch
  // must win even after the page refreshes `convertedSlug` in, because the
  // plaintext password lives only in this component's action state (shown once).
  if (state.handoff && !handoffDismissed) {
    return (
      <Modal
        open
        onClose={() => setHandoffDismissed(true)}
        title={`สร้างร้าน "${lead.name}" สำเร็จ`}
      >
        <div className="flex flex-col gap-4">
          <ShopCredentialsHandoff handoff={state.handoff} />
          <Button type="button" onClick={() => setHandoffDismissed(true)}>
            เสร็จสิ้น
          </Button>
        </div>
      </Modal>
    );
  }

  if (convertedSlug) return <ConvertedBadge slug={convertedSlug} />;

  if (lead.status !== "won") {
    return (
      <p className="text-sm text-muted">
        ตั้งสถานะเป็น “ปิดการขายได้” ก่อน จึงจะแปลงเป็นร้านจริงได้
      </p>
    );
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Store size={16} />
        แปลงเป็นร้านจริง
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`แปลง "${lead.name}" เป็นร้านจริง`}
      >
        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="leadId" value={lead.id} />
          <p className="text-xs text-muted">
            ระบบจะสร้างร้าน + บัญชีเจ้าของร้าน + รอบทดลองใช้ และยกพิกัด/ที่อยู่ของลีดไปเป็นสาขาแรกให้
          </p>
          <FormField label="slug (ลิงก์ /s/...)" htmlFor="slug">
            <Input
              id="slug"
              name="slug"
              defaultValue={suggestSlug(lead.name)}
              placeholder="coffee-shop"
              required
            />
          </FormField>
          <FormField label="อีเมลเจ้าของร้าน" htmlFor="ownerEmail">
            <Input id="ownerEmail" name="ownerEmail" type="email" required />
          </FormField>
          <FormField label="รหัสผ่านเจ้าของร้าน" htmlFor="ownerPassword">
            <GeneratedPasswordField />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="ราคา/วัน (บาท)" htmlFor="pricePerDayBaht">
              <Input
                id="pricePerDayBaht"
                name="pricePerDayBaht"
                type="number"
                min={1}
                step="0.5"
                defaultValue={10}
                required
              />
            </FormField>
            <FormField label="เกณฑ์แสตมป์" htmlFor="stampThreshold">
              <Input
                id="stampThreshold"
                name="stampThreshold"
                type="number"
                min={1}
                max={100}
                defaultValue={10}
              />
            </FormField>
          </div>
          <FormField label="ของรางวัล (ข้อความ)" htmlFor="rewardText">
            <Input
              id="rewardText"
              name="rewardText"
              placeholder="เครื่องดื่มฟรี 1 แก้ว"
            />
          </FormField>

          {state.error && <p className="text-sm text-error">{state.error}</p>}

          <Button type="submit" disabled={pending}>
            {pending ? "กำลังแปลง…" : "ยืนยันแปลงเป็นร้าน"}
          </Button>
        </form>
      </Modal>
    </>
  );
}
