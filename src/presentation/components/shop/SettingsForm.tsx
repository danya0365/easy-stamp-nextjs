"use client";

import { useActionState } from "react";

import {
  updateSettingsAction,
  type FormState,
} from "@/src/presentation/actions/shop-actions";
import { Input } from "@/src/presentation/components/ui/Input";
import { Textarea } from "@/src/presentation/components/ui/Textarea";
import { Button } from "@/src/presentation/components/ui/Button";
import { FormField } from "@/src/presentation/components/ui/FormField";

export function SettingsForm({
  stampThreshold,
  rewardText,
}: {
  stampThreshold: number;
  rewardText: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateSettingsAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormField
        label="จำนวนแสตมป์ที่ครบเกณฑ์ (แลก 1 รางวัล)"
        htmlFor="stampThreshold"
      >
        <Input
          id="stampThreshold"
          name="stampThreshold"
          type="number"
          min={1}
          max={100}
          defaultValue={stampThreshold}
        />
      </FormField>
      <FormField
        label="ของรางวัล (ข้อความ)"
        htmlFor="rewardText"
        hint="เช่น เลือกเครื่องดื่มในร้านฟรี 1 แก้ว"
      >
        <Textarea
          id="rewardText"
          name="rewardText"
          rows={2}
          maxLength={200}
          defaultValue={rewardText}
        />
      </FormField>

      {state.error && <p className="text-sm text-error">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "กำลังบันทึก…" : "บันทึก"}
      </Button>
    </form>
  );
}
