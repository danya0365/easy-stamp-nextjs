"use client";

import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ImagePlus } from "lucide-react";

import type {
  PosterDimensions,
  TemplateCopy,
} from "@/src/domain/services/promo-poster";
import { Button } from "@/src/presentation/components/ui/Button";
import { Modal } from "@/src/presentation/components/ui/Modal";
import {
  getCroppedImageFile,
  type CropPixels,
} from "@/src/presentation/lib/crop-image";
import { PosterExportArea } from "./PosterExportArea";
import type { PromoSeedData } from "./types";

const ACCEPT = "image/png,image/jpeg,image/webp";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("อ่านไฟล์รูปไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

/**
 * Path C — owner uploads an AI-generated image; we crop it to the poster aspect
 * (reusing the upload crop pipeline) and overlay the loyalty CTA layer, so even
 * an off-the-wall AI image still carries the shop's QR + reward on-concept.
 */
export function UploadBgPanel({
  size,
  copy,
  seed,
}: {
  size: PosterDimensions;
  copy: TemplateCopy;
  seed: PromoSeedData;
}) {
  const pickRef = useRef<HTMLInputElement>(null);

  const [src, setSrc] = useState<string | null>(null);
  const [baseName, setBaseName] = useState("ai-image");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<CropPixels | null>(null);

  const [bgDataUrl, setBgDataUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspect = size.w / size.h;

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBaseName(file.name);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setSrc(URL.createObjectURL(file));
    if (pickRef.current) pickRef.current.value = "";
  }

  const onCropComplete = useCallback((_a: Area, pixels: Area) => {
    setAreaPixels(pixels);
  }, []);

  function closeCropper() {
    if (src) URL.revokeObjectURL(src);
    setSrc(null);
  }

  async function confirmCrop() {
    if (!src || !areaPixels) return;
    setProcessing(true);
    try {
      const file = await getCroppedImageFile(src, areaPixels, baseName);
      setBgDataUrl(await fileToDataUrl(file));
      setError(null);
      closeCropper();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        อัปรูปที่สร้างจาก AI (หรือรูปร้านของคุณ) แล้วระบบจะวางป้ายสะสมแต้ม + QR
        ทับให้ตรงคอนเซ็ปต์เสมอ
      </p>

      <input
        ref={pickRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={onPick}
      />

      <div>
        <Button
          variant="outline"
          disabled={processing}
          onClick={() => pickRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          {bgDataUrl ? "เปลี่ยนรูป" : "เลือกรูป"}
        </Button>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      {bgDataUrl ? (
        <PosterExportArea
          size={size}
          copy={copy}
          seed={seed}
          design={{ kind: "image", src: bgDataUrl }}
          fileName={`promote-${seed.shopName}`}
        />
      ) : (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
          ยังไม่ได้เลือกรูป
        </p>
      )}

      <Modal
        open={src !== null}
        onClose={closeCropper}
        title="ครอบรูปให้พอดีกับขนาดโปสเตอร์"
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={closeCropper}>
              ยกเลิก
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={processing || !areaPixels}
              onClick={confirmCrop}
            >
              {processing ? "กำลังประมวลผล…" : "ยืนยัน"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="relative h-64 w-full overflow-hidden rounded-lg bg-black/80">
            {src && (
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <label className="flex items-center gap-2 text-xs text-muted">
            ซูม
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-brand-500"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
