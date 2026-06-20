"use client";

import { ShieldAlert, ShieldCheck, Shield } from "lucide-react";

import { LoadMore } from "@/src/presentation/components/ui/LoadMore";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { loadMoreAuditAction } from "@/src/presentation/actions/security-actions";
import { loadMoreShopAuditAction } from "@/src/presentation/actions/shop-actions";
import { formatDateTime } from "@/src/presentation/lib/format-date";
import { ROLE_LABEL } from "@/src/domain/types/roles";
import type { AuditLog } from "@/src/domain/entities";

/** Thai labels for well-known audit actions; unknown actions show the raw name. */
const ACTION_LABEL: Record<string, string> = {
  login_succeeded: "เข้าสู่ระบบสำเร็จ",
  login_failed: "เข้าสู่ระบบล้มเหลว",
  otp_failed: "OTP ไม่ถูกต้อง",
  account_locked: "บัญชีถูกล็อก",
  password_changed: "เปลี่ยนรหัสผ่าน",
  password_reset_by_admin: "แอดมินรีเซ็ตรหัสผ่าน",
  staff_created: "เพิ่มพนักงาน",
  shop_status_changed: "เปลี่ยนสถานะร้าน",
  shop_paused: "พักร้าน",
  shop_resumed: "เปิดร้านต่อ",
  payment_verified: "ตรวจสลิป",
  sessions_revoked: "ออกจากระบบทุกอุปกรณ์",
  force_logout: "บังคับออกจากระบบ",
  impersonation_started: "เริ่มสวมสิทธิ์ร้าน",
  impersonation_stopped: "ออกจากสวมสิทธิ์ร้าน",
  abuse_velocity_tripped: "พบกิจกรรมผิดปกติ",
  two_factor_enabled: "เปิด 2FA",
  two_factor_disabled: "ปิด 2FA",
};

/** Actions that signal a problem → render with a warning tone. */
const ALERT_ACTIONS = new Set([
  "login_failed",
  "otp_failed",
  "account_locked",
  "abuse_velocity_tripped",
]);

function tone(action: string): "danger" | "success" | "neutral" {
  if (ALERT_ACTIONS.has(action)) return "danger";
  if (action === "login_succeeded") return "success";
  return "neutral";
}

function Icon({ action }: { action: string }) {
  const t = tone(action);
  if (t === "danger") return <ShieldAlert className="size-4 shrink-0 text-error" />;
  if (t === "success") return <ShieldCheck className="size-4 shrink-0 text-success" />;
  return <Shield className="size-4 shrink-0 text-muted" />;
}

function summarize(e: AuditLog): string {
  const parts: string[] = [];
  if (e.actorRole) parts.push(ROLE_LABEL[e.actorRole]);
  if (e.metadata) {
    try {
      const m = JSON.parse(e.metadata) as Record<string, unknown>;
      if (m.email) parts.push(String(m.email));
      if (m.method) parts.push(String(m.method));
      if (m.reason) parts.push(String(m.reason));
    } catch {
      /* ignore malformed metadata */
    }
  }
  if (e.ip && e.ip !== "unknown") parts.push(`IP ${e.ip}`);
  return parts.join(" · ");
}

export function AuditTimeline({
  initialItems,
  initialCursor,
  action = "",
  scope = "admin",
}: {
  initialItems: AuditLog[];
  initialCursor: string | null;
  /** Admin scope only: filter by a single action name. */
  action?: string;
  /** "admin" = whole platform; "shop" = the owner's own shop only. */
  scope?: "admin" | "shop";
}) {
  const loadMore =
    scope === "shop"
      ? (cursor: string) => loadMoreShopAuditAction(cursor)
      : (cursor: string) => loadMoreAuditAction(action, cursor);
  return (
    <LoadMore<AuditLog>
      initialItems={initialItems}
      initialCursor={initialCursor}
      loadMore={loadMore}
      getKey={(e) => e.id}
      renderItem={(e) => (
        <li className="flex items-start justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-medium text-foreground">
              <Icon action={e.action} />
              {ACTION_LABEL[e.action] ?? e.action}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted">
              {summarize(e) || "—"}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-xs text-muted">{formatDateTime(e.createdAt)}</span>
            {tone(e.action) === "danger" && <Badge tone="danger">ตรวจสอบ</Badge>}
          </div>
        </li>
      )}
    />
  );
}
