"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";

import { Badge } from "@/src/presentation/components/ui/Badge";
import { resetPeerTwoFactorAction } from "@/src/presentation/actions/admin-actions";

export interface AdminRow {
  id: string;
  email: string;
  totpEnabled: boolean;
}

/** Lists platform admins with their 2FA status + a break-glass "reset 2FA" for peers. */
export function PeerAdminList({
  admins,
  currentAdminId,
}: {
  admins: AdminRow[];
  currentAdminId: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resetIds, setResetIds] = useState<Set<string>>(new Set());

  function reset(a: AdminRow) {
    if (!confirm(`รีเซ็ต 2FA ของ ${a.email}? เขาจะต้องตั้งค่าใหม่ตอนเข้าระบบครั้งหน้า`)) {
      return;
    }
    setError(null);
    start(async () => {
      const res = await resetPeerTwoFactorAction(a.id);
      if (res.error) setError(res.error);
      else setResetIds((prev) => new Set(prev).add(a.id));
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col divide-y divide-border">
        {admins.map((a) => {
          const isSelf = a.id === currentAdminId;
          const wasReset = resetIds.has(a.id);
          const enabled = a.totpEnabled && !wasReset;
          return (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">
                  {a.email}
                  {isSelf && <span className="ml-1 text-xs text-muted">(คุณ)</span>}
                </span>
                {enabled ? (
                  <span className="flex items-center gap-1 text-xs text-success">
                    <ShieldCheck className="size-3.5" /> เปิด 2FA
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <ShieldOff className="size-3.5" /> ยังไม่เปิด 2FA
                  </span>
                )}
              </span>
              {!isSelf && enabled && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => reset(a)}
                  className="shrink-0 rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:text-error disabled:opacity-60"
                >
                  รีเซ็ต 2FA
                </button>
              )}
              {wasReset && <Badge tone="warning">รีเซ็ตแล้ว</Badge>}
            </li>
          );
        })}
      </ul>
      {error && <p className="text-sm text-error">{error}</p>}
      <p className="text-xs text-muted">
        รีเซ็ต 2FA ของตัวเองทำที่นี่ไม่ได้ — ใช้ <code>npm run reset-2fa &lt;email&gt;</code> (break-glass)
      </p>
    </div>
  );
}
