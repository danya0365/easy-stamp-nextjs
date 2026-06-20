"use client";

import { useState, useTransition } from "react";
import { Monitor } from "lucide-react";

import { Badge } from "@/src/presentation/components/ui/Badge";
import { revokeSessionAction } from "@/src/presentation/actions/auth-actions";
import { formatDateTime } from "@/src/presentation/lib/format-date";

export interface DeviceRow {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  isCurrent: boolean;
}

/** Rough, friendly label from a UA string (browser · OS). */
function deviceLabel(ua: string | null): string {
  if (!ua) return "อุปกรณ์ไม่ทราบ";
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X|Macintosh/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "อื่นๆ";
  const br = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "เบราว์เซอร์";
  return `${br} · ${os}`;
}

export function DeviceList({ devices }: { devices: DeviceRow[] }) {
  const [pending, start] = useTransition();
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  function revoke(id: string) {
    setError(null);
    start(async () => {
      const res = await revokeSessionAction(id);
      if (res.error) setError(res.error);
      else setGone((prev) => new Set(prev).add(id));
    });
  }

  const visible = devices.filter((d) => !gone.has(d.id));

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col divide-y divide-border">
        {visible.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
            <span className="flex min-w-0 items-start gap-2">
              <Monitor className="mt-0.5 size-4 shrink-0 text-muted" />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  {deviceLabel(d.userAgent)}
                  {d.isCurrent && (
                    <Badge tone="success" className="ml-2">
                      เครื่องนี้
                    </Badge>
                  )}
                </span>
                <span className="block truncate text-xs text-muted">
                  {d.ip && d.ip !== "unknown" ? `IP ${d.ip} · ` : ""}
                  เข้าเมื่อ {formatDateTime(d.createdAt)}
                </span>
              </span>
            </span>
            {!d.isCurrent && (
              <button
                type="button"
                disabled={pending}
                onClick={() => revoke(d.id)}
                className="shrink-0 rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:text-error disabled:opacity-60"
              >
                ออกจากระบบ
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
