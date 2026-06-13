"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const EditorView = dynamic(() => import("./BranchLocationEditorView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 w-full items-center justify-center rounded-lg border border-border bg-muted-surface text-sm text-muted">
      กำลังโหลดแผนที่…
    </div>
  ),
});

interface Props {
  branchId: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

export function BranchLocationEditor({
  branchId,
  latitude,
  longitude,
  address,
}: Props) {
  const [open, setOpen] = useState(false);
  const hasLocation = latitude !== null && longitude !== null;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 self-start text-xs font-medium text-brand-700 hover:underline"
      >
        <span aria-hidden>{hasLocation ? "📍" : "➕"}</span>
        {hasLocation ? "แก้ไขตำแหน่งบนแผนที่" : "ตั้งตำแหน่งบนแผนที่"}
        <span className="text-muted">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <EditorView
          branchId={branchId}
          latitude={latitude}
          longitude={longitude}
          address={address}
        />
      )}
    </div>
  );
}
