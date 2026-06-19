"use client";

import { useActionState } from "react";

import {
  updateShopProfileAction,
  type FormState,
} from "@/src/presentation/actions/shop-actions";
import type { ShopProfile } from "@/src/domain/entities";
import { Input } from "@/src/presentation/components/ui/Input";
import { Textarea } from "@/src/presentation/components/ui/Textarea";
import { Button } from "@/src/presentation/components/ui/Button";
import { FormField } from "@/src/presentation/components/ui/FormField";

export function ShopProfileForm({ profile }: { profile: ShopProfile | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateShopProfileAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormField label="เกี่ยวกับร้าน" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          placeholder="แนะนำร้าน จุดเด่น เมนูแนะนำ ฯลฯ"
          defaultValue={profile?.description ?? ""}
        />
      </FormField>

      <FormField label="เวลาทำการ" htmlFor="openingHours">
        <Textarea
          id="openingHours"
          name="openingHours"
          rows={2}
          maxLength={500}
          placeholder="เช่น จ–ศ 8:00–18:00 · ส–อา 9:00–17:00"
          defaultValue={profile?.openingHours ?? ""}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="เบอร์โทร" htmlFor="phone">
          <Input
            id="phone"
            name="phone"
            inputMode="tel"
            defaultValue={profile?.phone ?? ""}
          />
        </FormField>
        <FormField label="ลิงก์ LINE" htmlFor="lineUrl">
          <Input
            id="lineUrl"
            name="lineUrl"
            placeholder="https://lin.ee/..."
            defaultValue={profile?.lineUrl ?? ""}
          />
        </FormField>
        <FormField label="Facebook" htmlFor="facebookUrl">
          <Input
            id="facebookUrl"
            name="facebookUrl"
            placeholder="https://facebook.com/..."
            defaultValue={profile?.facebookUrl ?? ""}
          />
        </FormField>
        <FormField label="Instagram" htmlFor="instagramUrl">
          <Input
            id="instagramUrl"
            name="instagramUrl"
            placeholder="https://instagram.com/..."
            defaultValue={profile?.instagramUrl ?? ""}
          />
        </FormField>
        <FormField label="เว็บไซต์" htmlFor="websiteUrl">
          <Input
            id="websiteUrl"
            name="websiteUrl"
            placeholder="https://..."
            defaultValue={profile?.websiteUrl ?? ""}
          />
        </FormField>
      </div>

      {state.error && <p className="text-sm text-error">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "กำลังบันทึก…" : "บันทึก"}
      </Button>
    </form>
  );
}
