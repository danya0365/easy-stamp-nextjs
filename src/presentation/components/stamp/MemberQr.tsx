/* eslint-disable @next/next/no-img-element */
import { useTranslations } from "next-intl";

/** Presentational member-QR card the customer shows for staff to scan. */
export function MemberQr({ qrImageUrl }: { qrImageUrl: string }) {
  const t = useTranslations("stamp");
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100">
      <span className="text-sm font-medium text-brand-700">
        {t("memberQrPrompt")}
      </span>
      <img
        src={qrImageUrl}
        alt={t("memberQrAlt")}
        width={192}
        height={192}
        className="h-48 w-48 rounded-xl bg-white object-contain p-2 shadow-sm"
      />
      <span className="text-xs text-muted">{t("memberQrHint")}</span>
    </div>
  );
}
