"use client";

import { useRef, useState } from "react";
import { Cropper, type ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { ImagePlus } from "lucide-react";

import type {
  PosterDimensions,
  TemplateCopy,
} from "@/src/domain/services/promo-poster";
import { Button } from "@/src/presentation/components/ui/Button";
import { Modal } from "@/src/presentation/components/ui/Modal";
import { canvasToCompressedFile } from "@/src/presentation/lib/crop-image";
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
  const cropperRef = useRef<ReactCropperElement>(null);
  const pickRef = useRef<HTMLInputElement>(null);

  const [src, setSrc] = useState<string | null>(null);
  const [baseName, setBaseName] = useState("ai-image");

  const [bgDataUrl, setBgDataUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspect = size.w / size.h;

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (pickRef.current) pickRef.current.value = "";
    if (!file) return;
    setError(null);
    setBaseName(file.name);
    setSrc(URL.createObjectURL(file));
  }

  function closeCropper() {
    setSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  async function confirmCrop() {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    setProcessing(true);
    try {
      const canvas = cropper.getCroppedCanvas({
        maxWidth: 2000,
        maxHeight: 2000,
        imageSmoothingQuality: "high",
      });
      if (!canvas) throw new Error("ครอปรูปไม่สำเร็จ ลองใหม่อีกครั้ง");
      const file = await canvasToCompressedFile(canvas, baseName);
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
              disabled={processing}
              onClick={confirmCrop}
            >
              {processing ? "กำลังประมวลผล…" : "ยืนยัน"}
            </Button>
          </>
        }
      >
        {src && (
          <Cropper
            ref={cropperRef}
            src={src}
            className="h-72 w-full"
            aspectRatio={aspect}
            viewMode={1}
            dragMode="move"
            autoCropArea={1}
            background={false}
            responsive
            restore
            checkOrientation
            guides
          />
        )}
      </Modal>
    </div>
  );
}
