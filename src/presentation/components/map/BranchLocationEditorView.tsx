"use client";

import { useActionState, useRef, useState } from "react";
import Map, {
  Marker,
  NavigationControl,
  type MapRef,
} from "react-map-gl/maplibre";
import { LocateFixed, MapPin } from "lucide-react";
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
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const mapRef = useRef<MapRef>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateBranchLocationAction,
    {},
  );

  function detectCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoError("อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const lng = p.coords.longitude;
        const lat = p.coords.latitude;
        setPos({ lng, lat });
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 16 });
        setLocating(false);
      },
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "กรุณาอนุญาตให้เข้าถึงตำแหน่งในเบราว์เซอร์"
            : "ระบุตำแหน่งไม่สำเร็จ ลองใหม่อีกครั้ง",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const initialViewState = pos
    ? { longitude: pos.lng, latitude: pos.lat, zoom: 15 }
    : DEFAULT_CENTER;

  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted">
          แตะบนแผนที่เพื่อปักหมุด หรือลากหมุดเพื่อปรับตำแหน่ง
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={detectCurrentLocation}
          disabled={locating}
        >
          <LocateFixed size={14} />
          {locating ? "กำลังหาตำแหน่ง…" : "ตำแหน่งปัจจุบัน"}
        </Button>
      </div>
      {geoError && <p className="text-xs text-error">{geoError}</p>}

      <div className="h-56 w-full overflow-hidden rounded-lg border border-border">
        <Map
          ref={mapRef}
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
              <MapPin
                size={30}
                className="cursor-grab fill-brand-500 text-white drop-shadow active:cursor-grabbing"
              />
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
