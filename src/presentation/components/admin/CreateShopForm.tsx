"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("admin");
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
          {t("csCreateAnother")}
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label={t("csShopName")} htmlFor="name">
          <Input id="name" name="name" required />
        </FormField>
        <FormField label={t("csSlug")} htmlFor="slug">
          <Input id="slug" name="slug" placeholder="coffee-shop" required />
        </FormField>
        <FormField label={t("csOwnerEmail")} htmlFor="ownerEmail">
          <Input id="ownerEmail" name="ownerEmail" type="email" required />
        </FormField>
        <FormField label={t("csOwnerPassword")} htmlFor="ownerPassword">
          <GeneratedPasswordField />
        </FormField>
        <FormField label={t("csPricePerDay")} htmlFor="pricePerDayBaht">
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
        <FormField label={t("csStampThreshold")} htmlFor="stampThreshold">
          <Input
            id="stampThreshold"
            name="stampThreshold"
            type="number"
            min={1}
            max={100}
            defaultValue={10}
          />
        </FormField>
        <FormField label={t("csCategory")} htmlFor="categoryId">
          <select
            id="categoryId"
            name="categoryId"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            <option value="">{t("csCategoryNone")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField label={t("csRewardLabel")} htmlFor="rewardText">
        <Input id="rewardText" name="rewardText" placeholder={t("csRewardPlaceholder")} />
      </FormField>
      <p className="text-xs text-muted">{t("csHint")}</p>

      {state.error && <p className="text-sm text-error">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? t("csCreating") : t("csCreate")}
      </Button>
    </form>
  );
}
