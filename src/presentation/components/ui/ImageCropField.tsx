"use client";

import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ImagePlus } from "lucide-react";

import { Button } from "./Button";
import { Modal } from "./Modal";
import { getCroppedImageFile, type CropPixels } from "@/src/presentation/lib/crop-image";

const ACCEPT = "image/png,image/jpeg,image/webp";

/**
 * File picker that lets the user crop + zoom a photo to a fixed aspect ratio,
 * then stages a downscaled JPEG into a hidden `<input name={name}>` so the
 * surrounding `<form action={...}>` submits the cropped image, not the raw one.
 *
 * `aspect` locks the crop ratio (e.g. 16/9 for a cover banner); pass `null`
 * to crop freely at the photo's own ratio (zoom/pan only).
 */
export function ImageCropField({
  name,
  aspect,
  label,
  disabled,
  onReadyChange,
}: {
  name: string;
  aspect: number | null;
  label: string;
  disabled?: boolean;
  /** Fired with `true` once a cropped file is staged, `false` while empty/busy. */
  onReadyChange?: (ready: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pickRef = useRef<HTMLInputElement>(null);

  const [src, setSrc] = useState<string | null>(null);
  const [baseName, setBaseName] = useState("image");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [effectiveAspect, setEffectiveAspect] = useState(aspect ?? 4 / 3);
  const [areaPixels, setAreaPixels] = useState<CropPixels | null>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [sizeKb, setSizeKb] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setReady = useCallback(
    (ready: boolean) => onReadyChange?.(ready),
    [onReadyChange],
  );

  function onPickRaw(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBaseName(file.name);
    setEffectiveAspect(aspect ?? 4 / 3);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setSrc(URL.createObjectURL(file));
    // Picker only feeds the cropper — clear it so the raw file is never submitted.
    if (pickRef.current) pickRef.current.value = "";
  }

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setAreaPixels(pixels);
  }, []);

  function closeCropper() {
    if (src) URL.revokeObjectURL(src);
    setSrc(null);
  }

  async function confirmCrop() {
    if (!src || !areaPixels) return;
    setProcessing(true);
    setReady(false);
    try {
      const file = await getCroppedImageFile(src, areaPixels, baseName);
      const dt = new DataTransfer();
      dt.items.add(file);
      if (fileRef.current) fileRef.current.files = dt.files;
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      setSizeKb(Math.round(file.size / 1024));
      setError(null);
      setReady(true);
      closeCropper();
    } catch (e) {
      setError((e as Error).message);
      setReady(false);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Submitted by the parent form; populated only after a successful crop. */}
      <input ref={fileRef} type="file" name={name} accept={ACCEPT} className="hidden" />
      <input
        ref={pickRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={onPickRaw}
      />

      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="ตัวอย่างรูป"
          className="max-h-48 w-full rounded-lg border border-border object-contain bg-muted-surface"
        />
      ) : null}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || processing}
          onClick={() => pickRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          {processing ? "กำลังประมวลผล…" : preview ? "เปลี่ยนรูป" : label}
        </Button>
        {sizeKb !== null && (
          <span className="text-xs text-muted">พร้อมส่ง: {sizeKb} KB</span>
        )}
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <Modal
        open={src !== null}
        onClose={closeCropper}
        title="ปรับรูปก่อนอัปโหลด"
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
                aspect={effectiveAspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                onMediaLoaded={(media) => {
                  if (aspect === null) {
                    setEffectiveAspect(media.naturalWidth / media.naturalHeight);
                  }
                }}
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
