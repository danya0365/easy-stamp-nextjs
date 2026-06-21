"use client";

import { useActionState, useState } from "react";

import {
  createShopAction,
  type AdminFormState,
} from "@/src/presentation/actions/admin-actions";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { GeneratedPasswordField } from "@/src/presentation/components/ui/GeneratedPasswordField";
import { ShopCredentialsHandoff } from "@/src/presentation/components/admin/ShopCredentialsHandoff";
import type { ShopHandoff } from "@/src/presentation/lib/shop-handoff";

export function CreateShopForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(
    createShopAction,
    {},
  );
  // Dismissed-by-reference so the NEXT create still shows its own handoff.
  const [dismissed, setDismissed] = useState<ShopHandoff | null>(null);

  // After a successful create, show the credentials handoff above the form.
  if (state.handoff && state.handoff !== dismissed) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-success">{state.success}</p>
        <ShopCredentialsHandoff handoff={state.handoff} />
        <Button
          type="button"
          variant="outline"
          onClick={() => setDismissed(state.handoff ?? null)}
        >
          สร้างร้านอื่นต่อ
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="ชื่อร้าน" htmlFor="name">
          <Input id="name" name="name" required />
        </FormField>
        <FormField label="slug (ลิงก์ /s/...)" htmlFor="slug">
          <Input id="slug" name="slug" placeholder="coffee-shop" required />
        </FormField>
        <FormField label="อีเมลเจ้าของร้าน" htmlFor="ownerEmail">
          <Input id="ownerEmail" name="ownerEmail" type="email" required />
        </FormField>
        <FormField label="รหัสผ่านเจ้าของร้าน" htmlFor="ownerPassword">
          <GeneratedPasswordField />
        </FormField>
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
        <FormField label="เกณฑ์แสตมป์เริ่มต้น" htmlFor="stampThreshold">
          <Input
            id="stampThreshold"
            name="stampThreshold"
            type="number"
            min={1}
            max={100}
            defaultValue={10}
          />
        </FormField>
        <FormField label="หมวดหมู่ร้าน" htmlFor="categoryId">
          <select
            id="categoryId"
            name="categoryId"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            <option value="">— ไม่ระบุ —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField label="ของรางวัลเริ่มต้น (ข้อความ)" htmlFor="rewardText">
        <Input id="rewardText" name="rewardText" placeholder="เครื่องดื่มฟรี 1 แก้ว" />
      </FormField>
      <p className="text-xs text-muted">
        ระบบจะสร้าง “ประเภทแสตมป์เริ่มต้น” ให้จากค่านี้ — เจ้าของร้านเพิ่มประเภทอื่นได้เองในหน้าตั้งค่า
      </p>

      {state.error && <p className="text-sm text-error">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "กำลังสร้าง…" : "สร้างร้านค้า"}
      </Button>
    </form>
  );
}
