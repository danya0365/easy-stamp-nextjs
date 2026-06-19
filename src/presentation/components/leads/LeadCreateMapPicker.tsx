"use client";

import dynamic from "next/dynamic";

// maplibre-gl touches `window`, so the picker is client-only (no SSR) and
// lazy-loaded, matching the other lead map wrappers.
const LeadCreateMapPickerView = dynamic(
  () => import("./LeadCreateMapPickerView"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 w-full items-center justify-center rounded-lg border border-border bg-muted-surface text-sm text-muted">
        กำลังโหลดแผนที่…
      </div>
    ),
  },
);

export function LeadCreateMapPicker({
  categories,
}: {
  categories: { id: string; name: string; slug: string }[];
}) {
  return <LeadCreateMapPickerView categories={categories} />;
}
