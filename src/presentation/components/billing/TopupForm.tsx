/* eslint-disable @next/next/no-img-element */
"use client";

import { useActionState, useEffect, useState, useTransition } from "react";

import {
  submitSlipAction,
  topupQuoteAction,
  type BillingFormState,
} from "@/src/presentation/actions/billing-actions";
import { Button } from "@/src/presentation/components/ui/Button";
import {
  TOPUP_PRESETS,
  resolveTopupQuote,
  computeSavingsPercent,
  MIN_CUSTOM_DAYS,
  MAX_CUSTOM_DAYS,
  type TopupQuote,
} from "@/src/domain/services/topup-pricing";
import { satangToBaht } from "@/src/presentation/lib/money";

type Selection = { kind: "preset"; id: string } | { kind: "custom" };

const BADGE_LABEL: Record<NonNullable<(typeof TOPUP_PRESETS)[number]["badge"]>, string> = {
  popular: "ยอดนิยม",
  best_value: "คุ้มที่สุด",
};

export function TopupForm({
  pricePerDaySatang,
}: {
  pricePerDaySatang: number;
}) {
  const [selection, setSelection] = useState<Selection>({
    kind: "preset",
    id: "d180",
  });
  const [customDays, setCustomDays] = useState("90");
  const [qr, setQr] = useState<{ amountSatang: number; qrDataUrl: string; target: string } | null>(
    null,
  );
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrPending, startQr] = useTransition();
  const [state, action, pending] = useActionState<BillingFormState, FormData>(
    submitSlipAction,
    {},
  );

  const packageId = selection.kind === "preset" ? selection.id : null;
  const customDaysNum = selection.kind === "custom" ? Number(customDays) : null;

  // Instant client-side preview (the server QR confirms the authoritative amount).
  let preview: TopupQuote | null = null;
  let previewError: string | null = null;
  try {
    preview = resolveTopupQuote({ packageId, customDays: customDaysNum }, pricePerDaySatang);
  } catch (e) {
    previewError = (e as Error).message;
  }
  const savings = preview ? computeSavingsPercent(preview, pricePerDaySatang) : 0;

  // Fetch the matching QR whenever the (valid) selection changes.
  useEffect(() => {
    const delay = selection.kind === "custom" ? 400 : 0;
    const handle = setTimeout(() => {
      if (previewError) {
        setQr(null);
        return;
      }
      startQr(async () => {
        const res = await topupQuoteAction({ packageId, customDays: customDaysNum });
        if (res.ok) {
          setQr({ amountSatang: res.amountSatang, qrDataUrl: res.qrDataUrl, target: res.target });
          setQrError(null);
        } else {
          setQr(null);
          setQrError(res.error);
        }
      });
    }, delay);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId, customDaysNum, previewError]);

  return (
    <div className="flex flex-col gap-4">
      {/* Preset packages */}
      <div className="grid grid-cols-2 gap-2">
        {TOPUP_PRESETS.map((p) => {
          const q = resolveTopupQuote({ packageId: p.id }, pricePerDaySatang);
          const pct = computeSavingsPercent(q, pricePerDaySatang);
          const selected = selection.kind === "preset" && selection.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelection({ kind: "preset", id: p.id })}
              className={`relative flex flex-col gap-0.5 rounded-2xl p-3 text-left ring-1 transition ${
                selected
                  ? "bg-brand-50 ring-2 ring-brand-500"
                  : "bg-card ring-border hover:ring-brand-300"
              }`}
            >
              {p.badge && (
                <span className="absolute -top-2 right-2 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-medium text-white">
                  {BADGE_LABEL[p.badge]}
                </span>
              )}
              <span className="text-base font-bold text-foreground">{p.label}</span>
              {p.bonusDays > 0 ? (
                <span className="text-xs font-medium text-success">
                  + แถม {p.bonusDays} วัน
                </span>
              ) : (
                <span className="text-xs text-muted">&nbsp;</span>
              )}
              <span className="mt-1 text-sm font-semibold text-foreground">
                ฿{satangToBaht(p.priceSatang)}
              </span>
              {pct > 0 && (
                <span className="text-xs text-brand-600">ประหยัด {pct}%</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom days */}
      <button
        type="button"
        onClick={() => setSelection({ kind: "custom" })}
        className={`flex flex-col gap-2 rounded-2xl p-3 text-left ring-1 transition ${
          selection.kind === "custom"
            ? "bg-brand-50 ring-2 ring-brand-500"
            : "bg-card ring-border hover:ring-brand-300"
        }`}
      >
        <span className="text-sm font-medium text-foreground">
          เติมวันอิสระ (ใส่จำนวนวันเอง)
        </span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={MIN_CUSTOM_DAYS}
            max={MAX_CUSTOM_DAYS}
            value={customDays}
            onChange={(e) => {
              setCustomDays(e.target.value);
              setSelection({ kind: "custom" });
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-28 rounded-lg border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
          <span className="text-sm text-muted">วัน</span>
        </div>
        <span className="text-xs text-muted">
          เติม 90 วัน+ แถม 7 วัน · 150 วัน+ แถม 30 วัน · 365 วัน+ แถม 45 วัน
        </span>
      </button>

      {/* Live preview */}
      {previewError ? (
        <p className="text-sm text-error">{previewError}</p>
      ) : preview ? (
        <div className="rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted">รวมที่จะได้รับ</span>
            <span className="text-lg font-bold text-foreground">
              {preview.totalDays} วัน
            </span>
          </div>
          {preview.bonusDays > 0 && (
            <p className="text-xs text-success">
              ({preview.baseDays} วัน + แถม {preview.bonusDays} วัน)
            </p>
          )}
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-sm text-muted">ยอดชำระ</span>
            <span className="text-2xl font-bold text-foreground">
              ฿{satangToBaht(preview.amountSatang)}
            </span>
          </div>
          {savings > 0 && (
            <p className="mt-1 text-right text-xs font-medium text-brand-600">
              คุ้มกว่าเติมรายเดือน ~{savings}%
            </p>
          )}
        </div>
      ) : null}

      {/* QR + slip upload */}
      {preview && (
        <form action={action} className="flex flex-col items-center gap-3">
          <input type="hidden" name="packageId" value={packageId ?? ""} />
          <input
            type="hidden"
            name="customDays"
            value={customDaysNum ?? ""}
          />

          <div className="flex w-full flex-col items-center gap-2 rounded-2xl bg-muted-surface p-4">
            <span className="text-sm font-medium text-brand-700">
              สแกนจ่ายผ่าน PromptPay
            </span>
            {qrPending || !qr ? (
              <div className="flex h-52 w-52 items-center justify-center rounded-xl bg-card text-sm text-muted">
                {qrError ?? "กำลังสร้าง QR..."}
              </div>
            ) : (
              <>
                <img
                  src={qr.qrDataUrl}
                  alt="PromptPay QR"
                  width={208}
                  height={208}
                  className="h-52 w-52 rounded-xl bg-card object-contain p-2 shadow-sm"
                />
                <p className="text-2xl font-bold text-foreground">
                  ฿{satangToBaht(qr.amountSatang)}
                </p>
                <p className="text-xs text-muted">พร้อมเพย์: {qr.target}</p>
              </>
            )}
          </div>

          <div className="w-full">
            <p className="mb-2 text-sm text-muted">
              โอนแล้วแนบสลิปเพื่อให้ผู้ดูแลตรวจสอบและเติมวันให้
            </p>
            <input
              type="file"
              name="slip"
              accept="image/png,image/jpeg,image/webp"
              required
              className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand-100 file:px-4 file:py-2 file:text-brand-700"
            />
            {state.error && (
              <p className="mt-2 text-sm text-error">{state.error}</p>
            )}
            {state.success && (
              <p className="mt-2 text-sm text-success">{state.success}</p>
            )}
            <Button type="submit" disabled={pending} className="mt-3 w-full">
              {pending ? "กำลังส่ง..." : "ส่งสลิปการชำระเงิน"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
