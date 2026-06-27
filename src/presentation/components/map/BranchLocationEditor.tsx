"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

import { MapLoading } from "./MapLoading";

const EditorView = dynamic(() => import("./BranchLocationEditorView"), {
  ssr: false,
  loading: () => <MapLoading className="h-56 rounded-lg border border-border" />,
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
  const t = useTranslations("map");
  const [open, setOpen] = useState(false);
  const hasLocation = latitude !== null && longitude !== null;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 self-start text-xs font-medium text-brand-700 hover:underline"
      >
        {hasLocation ? <MapPin size={14} /> : <Plus size={14} />}
        {hasLocation ? t("editLocation") : t("setLocation")}
        {open ? (
          <ChevronUp size={14} className="text-muted" />
        ) : (
          <ChevronDown size={14} className="text-muted" />
        )}
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
