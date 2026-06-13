"use client";

import { useTransition } from "react";

import {
  toggleBranchAction,
  toggleStaffAction,
} from "@/src/presentation/actions/shop-actions";
import { cn } from "@/src/presentation/components/ui/cn";

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

  function onClick() {
    start(async () => {
      if (kind === "branch") await toggleBranchAction(id, !isActive);
      else await toggleStaffAction(id, !isActive);
    });
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
