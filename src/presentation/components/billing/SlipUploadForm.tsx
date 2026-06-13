"use client";

import { useActionState } from "react";

import {
  submitSlipAction,
  type BillingFormState,
} from "@/src/presentation/actions/billing-actions";
import { Button } from "@/src/presentation/components/ui/Button";

export function SlipUploadForm() {
  const [state, action, pending] = useActionState<BillingFormState, FormData>(
    submitSlipAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        type="file"
        name="slip"
        accept="image/png,image/jpeg,image/webp"
        required
        className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand-100 file:px-4 file:py-2 file:text-brand-700"
      />
      {state.error && <p className="text-sm text-error">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "กำลังส่ง..." : "ส่งสลิปการชำระเงิน"}
      </Button>
    </form>
  );
}
