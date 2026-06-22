"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, Trash2 } from "lucide-react";

import {
  uploadShopImageAction,
  deleteShopImageAction,
  type FormState,
} from "@/src/presentation/actions/shop-actions";
import type { ShopImage } from "@/src/domain/entities";
import { Button } from "@/src/presentation/components/ui/Button";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { cn } from "@/src/presentation/components/ui/cn";
import { ImageCropField } from "@/src/presentation/components/ui/ImageCropField";
import { Modal } from "@/src/presentation/components/ui/Modal";
import { useConfirm } from "@/src/presentation/components/ui/ConfirmDialog";
import { useToast } from "@/src/presentation/components/ui/Toast";
import { useActionToast } from "@/src/presentation/hooks/useActionToast";

type EditableKind = "cover" | "profile" | "gallery";

// Lock the crop ratio to how each image renders on the public shop page (mirror
// of ShopImagesManager's ASPECT_BY_KIND): cover is a wide banner, profile and
// gallery are squares.
const ASPECT_BY_KIND: Record<EditableKind, number> = {
  cover: 16 / 9,
  profile: 1,
  gallery: 1,
};

const KIND_LABEL: Record<EditableKind, string> = {
  cover: "รูปปก",
  profile: "รูปโปรไฟล์",
  gallery: "รูปแกลเลอรี่",
};

/** Confirm + delete one image, then refresh the page. Shared by the dialog and gallery tiles. */
function useDeleteImage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [pending, start] = useTransition();

  const remove = (imageId: string, onDone?: () => void) =>
    void (async () => {
      const ok = await confirm({
        title: "ลบรูปนี้?",
        message: "รูปจะถูกลบออกจากหน้าร้านถาวร",
        confirmLabel: "ลบรูป",
        tone: "danger",
      });
      if (!ok) return;
      start(async () => {
        const res = await deleteShopImageAction(imageId);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("ลบรูปแล้ว");
          router.refresh();
          onDone?.();
        }
      });
    })();

  return { remove, pending };
}

/**
 * Dialog (mounted only while open) that uploads a cropped photo for `kind` via
 * uploadShopImageAction, then refreshes the page so the new image shows in
 * place. For cover/profile it also offers a delete button when an image exists.
 */
function UploadDialog({
  kind,
  imageId,
  onClose,
}: {
  kind: EditableKind;
  imageId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<FormState, FormData>(
    uploadShopImageAction,
    {},
  );
  const [ready, setReady] = useState(false);
  const { remove, pending: deleting } = useDeleteImage();
  useActionToast(state);

  // Close + refresh once the upload succeeds (ref-guards against re-running).
  const closedRef = useRef(false);
  useEffect(() => {
    if (state.success && !closedRef.current) {
      closedRef.current = true;
      router.refresh();
      onClose();
    }
  }, [state.success, router, onClose]);

  return (
    <Modal
      open
      onClose={onClose}
      title={imageId ? `เปลี่ยน${KIND_LABEL[kind]}` : `เพิ่ม${KIND_LABEL[kind]}`}
    >
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="kind" value={kind} />
        <ImageCropField
          name="image"
          aspect={ASPECT_BY_KIND[kind]}
          label="เลือกรูป"
          onReadyChange={setReady}
        />
        {state.error && <p className="text-sm text-error">{state.error}</p>}
        <div className="flex items-center justify-between gap-2">
          {imageId ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              loading={deleting}
              onClick={() => remove(imageId, onClose)}
            >
              <Trash2 className="size-4" />
              ลบรูป
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" size="sm" loading={pending} disabled={!ready}>
              {pending ? "กำลังอัปโหลด…" : "บันทึก"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Facebook-style camera overlay for a single image (cover or profile). Tapping
 * it opens the upload dialog. Render this into ShopHero's overlay slots; only
 * the shop owner should be given it.
 */
export function ShopImageEditButton({
  kind,
  imageId,
  className,
}: {
  kind: "cover" | "profile";
  imageId?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={imageId ? `เปลี่ยน${KIND_LABEL[kind]}` : `เพิ่ม${KIND_LABEL[kind]}`}
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white shadow-sm backdrop-blur transition hover:bg-black/70",
          className,
        )}
      >
        <Camera className="size-3.5" />
        {imageId ? "เปลี่ยนรูป" : "เพิ่มรูป"}
      </button>
      {open && (
        <UploadDialog kind={kind} imageId={imageId} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function GalleryTile({ image }: { image: ShopImage }) {
  const { remove, pending } = useDeleteImage();
  return (
    <div className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/shop-images/${image.id}`}
        alt="ภาพร้าน"
        className="aspect-square w-full rounded-xl object-cover ring-1 ring-border"
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => remove(image.id)}
        aria-label="ลบรูป"
        className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white transition hover:bg-black/70 disabled:opacity-50"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

function AddGalleryTile() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted transition hover:border-brand-300 hover:text-brand-600"
      >
        <ImagePlus className="size-6" />
        <span className="text-xs font-medium">เพิ่มรูป</span>
      </button>
      {open && <UploadDialog kind="gallery" onClose={() => setOpen(false)} />}
    </>
  );
}

/**
 * Owner-mode gallery: same grid as the public ShopGallery, plus a delete badge
 * on each photo and an "add photo" tile (max 12 enforced by the use case).
 */
export function EditableShopGallery({ images }: { images: ShopImage[] }) {
  return (
    <Card>
      <CardHeader title="ภาพร้าน" />
      <div className="grid grid-cols-3 gap-2.5">
        {images.map((img) => (
          <GalleryTile key={img.id} image={img} />
        ))}
        <AddGalleryTile />
      </div>
    </Card>
  );
}
