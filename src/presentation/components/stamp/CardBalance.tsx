import { Store, Gift, PartyPopper } from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  CustomerCardView,
  StampTypeProgress,
} from "@/src/domain/entities";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { StampDots } from "@/src/presentation/components/ui/StampDots";
import { formatPhone } from "@/src/domain/services/phone";
import { satangToBaht } from "@/src/presentation/lib/money";

function TypeProgress({
  p,
  dotSize,
}: {
  p: StampTypeProgress;
  dotSize: "sm" | "md" | "lg";
}) {
  const t = useTranslations("stamp");
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-3 ring-1 ring-border">
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate font-medium text-foreground">
          {p.type.name}
          {p.type.priceSatang != null && (
            <span className="ml-1 text-xs text-muted">
              (฿{satangToBaht(p.type.priceSatang)})
            </span>
          )}
        </p>
        {p.eligibleToRedeem ? (
          <Badge tone="success">
            <PartyPopper className="size-3.5" />
            {t("readyToRedeem")}
          </Badge>
        ) : (
          <Badge tone="brand">
            {t("progressBadge", {
              current: p.currentStamps,
              threshold: p.type.threshold,
            })}
          </Badge>
        )}
      </div>

      <StampDots
        current={p.currentStamps}
        threshold={p.type.threshold}
        size={dotSize}
      />

      <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-foreground">
        <Gift className="size-4 shrink-0 text-brand-600" />
        <span>
          {p.eligibleToRedeem ? (
            <>
              {t("redeemGet")}{" "}
              <strong className="text-brand-700">
                {p.type.rewardText || t("defaultReward")}
              </strong>
            </>
          ) : (
            <>
              {t.rich("remainingStamps", {
                remaining: p.remaining,
                b: (chunks) => (
                  <strong className="text-brand-700">{chunks}</strong>
                ),
              })}
              {p.type.rewardText ? (
                <span className="text-muted"> · {p.type.rewardText}</span>
              ) : null}
            </>
          )}
        </span>
      </div>
    </div>
  );
}

/** Presentational customer stamp-card summary (all stamp types). */
export function CardBalance({
  view,
  shopName,
  dotSize = "md",
}: {
  view: CustomerCardView;
  /** When given, the card is titled by the shop; the customer becomes subtitle. */
  shopName?: string;
  dotSize?: "sm" | "md" | "lg";
}) {
  const t = useTranslations("stamp");
  const { customer, types } = view;
  const customerLabel = customer.displayName || formatPhone(customer.phone);
  const title = shopName ?? customerLabel;
  const subtitle = shopName
    ? customerLabel
    : customer.displayName
      ? formatPhone(customer.phone)
      : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          <Store className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{title}</p>
          {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
        </div>
      </div>

      {types.length === 0 ? (
        <p className="text-sm text-muted">{t("noStampTypes")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {types.map((p) => (
            <TypeProgress key={p.type.id} p={p} dotSize={dotSize} />
          ))}
        </div>
      )}
    </div>
  );
}
