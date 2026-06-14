"use client";

import { useActionState } from "react";

import {
  changeMyPasswordAction,
  type PasswordFormState,
} from "@/src/presentation/actions/auth-actions";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { FormField } from "@/src/presentation/components/ui/FormField";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<PasswordFormState, FormData>(
    changeMyPasswordAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <FormField label="รหัสผ่านปัจจุบัน" htmlFor="currentPassword">
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </FormField>
      <FormField
        label="รหัสผ่านใหม่"
        htmlFor="newPassword"
        hint="อย่างน้อย 6 ตัวอักษร"
      >
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </FormField>
      <FormField label="ยืนยันรหัสผ่านใหม่" htmlFor="confirmPassword">
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </FormField>
      {state.error && <p className="text-sm text-error">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
      </Button>
    </form>
  );
}
