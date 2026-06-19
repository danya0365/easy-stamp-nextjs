"use client";

import { useState, useTransition } from "react";

import { setLeadStatusAction } from "@/src/presentation/actions/lead-actions";
import type { Lead, LeadLostReason, LeadStatus } from "@/src/domain/entities";
import { Button } from "@/src/presentation/components/ui/Button";
import {
  LEAD_LOST_REASON_LABEL,
  LEAD_LOST_REASON_ORDER,
  LEAD_STATUS_LABEL,
  LEAD_STATUS_ORDER,
} from "@/src/presentation/lib/lead-display";

const SELECT_CLASS =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function LeadStatusControl({ lead }: { lead: Lead }) {
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [lostReason, setLostReason] = useState<LeadLostReason>(
    lead.lostReason ?? "not_interested",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty =
    status !== lead.status ||
    (status === "lost" && lostReason !== lead.lostReason);

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await setLeadStatusAction(
        lead.id,
        status,
        status === "lost" ? lostReason : null,
      );
      if (res.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as LeadStatus)}
        className={SELECT_CLASS}
        disabled={pending}
      >
        {LEAD_STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {LEAD_STATUS_LABEL[s]}
          </option>
        ))}
      </select>

      {status === "lost" && (
        <select
          value={lostReason}
          onChange={(e) => setLostReason(e.target.value as LeadLostReason)}
          className={SELECT_CLASS}
          disabled={pending}
        >
          {LEAD_LOST_REASON_ORDER.map((r) => (
            <option key={r} value={r}>
              {LEAD_LOST_REASON_LABEL[r]}
            </option>
          ))}
        </select>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      <Button
        type="button"
        size="sm"
        onClick={save}
        disabled={pending || !dirty}
      >
        {pending ? "กำลังบันทึก…" : "อัปเดตสถานะ"}
      </Button>
    </div>
  );
}
