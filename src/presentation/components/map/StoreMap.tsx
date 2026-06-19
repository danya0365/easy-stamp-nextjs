"use client";

import dynamic from "next/dynamic";

import type { MapShopLocation } from "./StoreMapView";

// maplibre-gl touches `window`, so the map is client-only (no SSR) and
// lazy-loaded — it stays out of the initial bundle until the homepage mounts.
const StoreMapView = dynamic(() => import("./StoreMapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted-surface text-sm text-muted">
      กำลังโหลดแผนที่…
    </div>
  ),
});

export function StoreMap({ locations }: { locations: MapShopLocation[] }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <StoreMapView locations={locations} />
      {locations.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
          <p className="pointer-events-auto rounded-full bg-card/90 px-4 py-1.5 text-xs text-muted shadow-sm backdrop-blur">
            ยังไม่มีร้านค้าที่ปักหมุดตำแหน่ง
          </p>
        </div>
      )}
    </div>
  );
}
