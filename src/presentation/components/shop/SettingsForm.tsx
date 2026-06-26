"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("shop");
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateSettingsAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormField label={t("setThresholdLabel")} htmlFor="stampThreshold">
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
        label={t("setRewardLabel")}
        htmlFor="rewardText"
        hint={t("setRewardHint")}
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
        {pending ? t("setSaving") : t("setSave")}
      </Button>
    </form>
  );
}
