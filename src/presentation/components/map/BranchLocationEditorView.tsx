"use client";

import { useActionState, useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  updateBranchLocationAction,
  type FormState,
} from "@/src/presentation/actions/shop-actions";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { OSM_STYLE, DEFAULT_CENTER } from "./osm-style";

interface Props {
  branchId: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

export default function BranchLocationEditorView({
  branchId,
  latitude,
  longitude,
  address,
}: Props) {
  const [pos, setPos] = useState<{ lng: number; lat: number } | null>(
    latitude !== null && longitude !== null
      ? { lng: longitude, lat: latitude }
      : null,
  );
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateBranchLocationAction,
    {},
  );

  const initialViewState = pos
    ? { longitude: pos.lng, latitude: pos.lat, zoom: 15 }
    : DEFAULT_CENTER;

  return (
    <form action={action} className="flex flex-col gap-2">
      <p className="text-xs text-muted">
        แตะบนแผนที่เพื่อปักหมุด หรือลากหมุดเพื่อปรับตำแหน่ง
      </p>

      <div className="h-56 w-full overflow-hidden rounded-lg border border-border">
        <Map
          initialViewState={initialViewState}
          mapStyle={OSM_STYLE}
          style={{ width: "100%", height: "100%" }}
          attributionControl={{ compact: true }}
          onClick={(e) => setPos({ lng: e.lngLat.lng, lat: e.lngLat.lat })}
        >
          <NavigationControl position="top-right" showCompass={false} />
          {pos && (
            <Marker
              longitude={pos.lng}
              latitude={pos.lat}
              anchor="bottom"
              draggable
              onDragEnd={(e) =>
                setPos({ lng: e.lngLat.lng, lat: e.lngLat.lat })
              }
            >
              <span className="text-2xl drop-shadow" aria-hidden>
                📍
              </span>
            </Marker>
          )}
        </Map>
      </div>

      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="latitude" value={pos ? pos.lat : ""} />
      <input type="hidden" name="longitude" value={pos ? pos.lng : ""} />

      <Input
        name="address"
        placeholder="ที่อยู่ / จุดสังเกต (ไม่บังคับ)"
        defaultValue={address ?? ""}
        maxLength={200}
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted">
          {pos
            ? `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`
            : "ยังไม่ได้ปักหมุด"}
        </span>
        <div className="flex gap-2">
          {pos && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPos(null)}
            >
              ล้างหมุด
            </Button>
          )}
          <Button type="submit" size="sm" disabled={pending}>
            บันทึกตำแหน่ง
          </Button>
        </div>
      </div>

      {state.error && <p className="text-sm text-error">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}
    </form>
  );
}
