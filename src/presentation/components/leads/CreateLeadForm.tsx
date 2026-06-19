"use client";

import { useActionState, useState } from "react";
import { LocateFixed } from "lucide-react";

import {
  createLeadAction,
  type LeadFormState,
} from "@/src/presentation/actions/lead-actions";
import { Input } from "@/src/presentation/components/ui/Input";
import { Textarea } from "@/src/presentation/components/ui/Textarea";
import { Button } from "@/src/presentation/components/ui/Button";
import { FormField } from "@/src/presentation/components/ui/FormField";

const SELECT_CLASS =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function CreateLeadForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<LeadFormState, FormData>(
    createLeadAction,
    {},
  );
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  function detectLocation() {
    if (!navigator.geolocation) {
      setGeoError("อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
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

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="ชื่อร้าน" htmlFor="name">
          <Input id="name" name="name" required />
        </FormField>
        <FormField label="เบอร์โทร" htmlFor="phone">
          <Input id="phone" name="phone" inputMode="tel" />
        </FormField>
        <FormField label="หมวดหมู่ร้าน" htmlFor="categoryId">
          <select id="categoryId" name="categoryId" className={SELECT_CLASS}>
            <option value="">— ไม่ระบุ —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="นัดติดตามครั้งหน้า" htmlFor="nextFollowUpAt">
          <Input id="nextFollowUpAt" name="nextFollowUpAt" type="date" />
        </FormField>
      </div>

      <FormField label="ที่อยู่ / จุดสังเกต" htmlFor="address">
        <Input id="address" name="address" maxLength={200} />
      </FormField>

      <FormField label="โน้ต" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={2} />
      </FormField>

      {/* Capture coordinates on the spot; fine-tune the pin later on the map. */}
      <input type="hidden" name="latitude" value={pos ? pos.lat : ""} />
      <input type="hidden" name="longitude" value={pos ? pos.lng : ""} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted">
          {pos
            ? `ปักหมุดที่ ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`
            : "ยังไม่ได้ปักตำแหน่ง (ตั้งได้ภายหลังในหน้าลีด)"}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={detectLocation}
          disabled={locating}
        >
          <LocateFixed size={14} />
          {locating ? "กำลังหา…" : "ดึงตำแหน่ง GPS"}
        </Button>
      </div>
      {geoError && <p className="text-xs text-error">{geoError}</p>}

      {state.error && <p className="text-sm text-error">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "กำลังเพิ่ม…" : "เพิ่มลีด"}
      </Button>
    </form>
  );
}
