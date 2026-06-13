"use client";

import { useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import type { ShopMapLocation } from "@/src/application/repositories/IBranchRepository";
import { OSM_STYLE, DEFAULT_CENTER, boundsOf } from "./osm-style";

export default function StoreMapView({
  locations,
}: {
  locations: ShopMapLocation[];
}) {
  const [active, setActive] = useState<ShopMapLocation | null>(null);

  const bounds = boundsOf(locations);
  const initialViewState = bounds
    ? { bounds, fitBoundsOptions: { padding: 48, maxZoom: 15 } }
    : DEFAULT_CENTER;

  return (
    <Map
      initialViewState={initialViewState}
      mapStyle={OSM_STYLE}
      style={{ width: "100%", height: "100%" }}
      attributionControl={{ compact: true }}
    >
      <NavigationControl position="top-right" showCompass={false} />

      {locations.map((loc) => (
        <Marker
          key={loc.branchId}
          longitude={loc.longitude}
          latitude={loc.latitude}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setActive(loc);
          }}
        >
          <span className="cursor-pointer text-2xl drop-shadow" aria-hidden>
            📍
          </span>
        </Marker>
      ))}

      {active && (
        <Popup
          longitude={active.longitude}
          latitude={active.latitude}
          anchor="bottom"
          offset={28}
          closeButton
          closeOnClick={false}
          onClose={() => setActive(null)}
          maxWidth="240px"
        >
          <div className="flex flex-col gap-1 p-1">
            <p className="font-semibold text-gray-900">{active.shopName}</p>
            <p className="text-xs text-gray-500">{active.branchName}</p>
            {active.address && (
              <p className="text-xs text-gray-600">{active.address}</p>
            )}
            <a
              href={`/s/${active.shopSlug}`}
              className="mt-1 text-xs font-medium text-brand-600 hover:underline"
            >
              ดูบัตรสะสมแสตมป์ →
            </a>
          </div>
        </Popup>
      )}
    </Map>
  );
}
