"use client";

import { useState } from "react";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
} from "react-map-gl/maplibre";
import { ArrowRight, MapPin, Navigation } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";

import type { LeadMapLocation } from "@/src/domain/entities";
import {
  OSM_STYLE,
  DEFAULT_CENTER,
  boundsOf,
} from "@/src/presentation/components/map/osm-style";
import {
  LEAD_STATUS_LABEL,
  LEAD_STATUS_PIN,
} from "@/src/presentation/lib/lead-display";

export default function LeadMapView({
  locations,
}: {
  locations: LeadMapLocation[];
}) {
  const [active, setActive] = useState<LeadMapLocation | null>(null);

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
      <GeolocateControl
        position="top-right"
        positionOptions={{ enableHighAccuracy: true }}
        trackUserLocation
        showUserLocation
      />

      {locations.map((loc) => (
        <Marker
          key={loc.leadId}
          longitude={loc.longitude}
          latitude={loc.latitude}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setActive(loc);
          }}
        >
          <MapPin
            size={30}
            className="cursor-pointer text-white drop-shadow"
            style={{ fill: LEAD_STATUS_PIN[loc.status] }}
          />
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
            <p className="font-semibold text-gray-900">{active.name}</p>
            <p className="text-xs text-gray-500">
              {LEAD_STATUS_LABEL[active.status]}
              {active.phone ? ` · ${active.phone}` : ""}
            </p>
            {active.address && (
              <p className="text-xs text-gray-600">{active.address}</p>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${active.latitude},${active.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
            >
              <Navigation className="size-3.5" />
              นำทางด้วย Google Maps
            </a>
            <a
              href={`/admin/leads/${active.leadId}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
            >
              ดูรายละเอียดลีด
              <ArrowRight className="size-3.5" />
            </a>
          </div>
        </Popup>
      )}
    </Map>
  );
}
