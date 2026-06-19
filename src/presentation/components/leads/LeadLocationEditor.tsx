"use client";

import dynamic from "next/dynamic";

// maplibre-gl touches `window`, so the editor is client-only (no SSR) and
// lazy-loaded, matching the public StoreMap wrapper.
const LeadLocationEditorView = dynamic(() => import("./LeadLocationEditorView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 w-full items-center justify-center rounded-lg border border-border bg-muted-surface text-sm text-muted">
      กำลังโหลดแผนที่…
    </div>
  ),
});

export function LeadLocationEditor(props: {
  leadId: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}) {
  return <LeadLocationEditorView {...props} />;
}
