"use client";

import { useTransition } from "react";

import {
  toggleBranchAction,
  toggleStaffAction,
} from "@/src/presentation/actions/shop-actions";
import { cn } from "@/src/presentation/components/ui/cn";
import { useConfirm } from "@/src/presentation/components/ui/ConfirmDialog";

export function ToggleActiveButton({
  kind,
  id,
  isActive,
}: {
  kind: "branch" | "staff";
  id: string;
  isActive: boolean;
}) {
  const [pending, start] = useTransition();
  const confirm = useConfirm();

  function apply() {
    start(async () => {
      if (kind === "branch") await toggleBranchAction(id, !isActive);
      else await toggleStaffAction(id, !isActive);
    });
  }

  async function onClick() {
    // Re-activating is safe; confirm only when turning something OFF.
    if (!isActive) return apply();
    const label = kind === "branch" ? "สาขานี้" : "พนักงานคนนี้";
    const ok = await confirm({
      title: "ปิดใช้งาน?",
      message:
        kind === "branch"
          ? "ปิดใช้งานสาขานี้ — จะไม่ถูกใช้ในระบบจนกว่าจะเปิดอีกครั้ง"
          : "ปิดใช้งานพนักงานคนนี้ — จะเข้าระบบไม่ได้จนกว่าจะเปิดอีกครั้ง",
      confirmLabel: `ปิดใช้งาน${label}`,
      tone: "danger",
    });
    if (ok) apply();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium transition disabled:opacity-50",
        isActive
          ? "bg-success-surface text-success hover:opacity-80"
          : "bg-muted-surface text-muted hover:opacity-80",
      )}
    >
      {isActive ? "ใช้งาน" : "ปิดอยู่"}
    </button>
  );
}
