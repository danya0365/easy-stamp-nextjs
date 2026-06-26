import { useTranslations } from "next-intl";

import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";

/**
 * Progressive phone lookup form. Submits via GET to `action`, adding ?phone=...
 * — works without JS (public check page reads searchParams.phone).
 */
export function PhoneLookupForm({
  action,
  defaultPhone = "",
  placeholder,
  submitLabel,
}: {
  action: string;
  defaultPhone?: string;
  placeholder?: string;
  submitLabel?: string;
}) {
  const t = useTranslations("stamp");
  return (
    <form action={action} method="get" className="flex gap-2">
      <Input
        name="phone"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        defaultValue={defaultPhone}
        placeholder={placeholder ?? t("lookupPlaceholder")}
        required
      />
      <Button type="submit">{submitLabel ?? t("lookupSubmit")}</Button>
    </form>
  );
}
