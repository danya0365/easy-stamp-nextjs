"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import {
  uploadShopImageAction,
  deleteShopImageAction,
  type FormState,
} from "@/src/presentation/actions/shop-actions";
import type { ShopImage } from "@/src/domain/entities";
import { Button } from "@/src/presentation/components/ui/Button";
import { ImageCropField } from "@/src/presentation/components/ui/ImageCropField";

// Lock the crop ratio to how each image renders on the public shop page:
// cover is a wide banner, profile/gallery are squares.
const ASPECT_BY_KIND: Record<"profile" | "gallery" | "cover", number> = {
  cover: 16 / 9,
  profile: 1,
  gallery: 1,
};

function UploadForm({
  kind,
  label,
}: {
  kind: "profile" | "gallery" | "cover";
  label: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    uploadShopImageAction,
    {},
  );
  const [ready, setReady] = useState(false);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="kind" value={kind} />
      <ImageCropField
        name="image"
        aspect={ASPECT_BY_KIND[kind]}
        label="เลือกรูป"
        onReadyChange={setReady}
      />
      {state.error && <p className="text-sm text-error">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={pending || !ready}
      >
        {pending ? "กำลังอัปโหลด…" : label}
      </Button>
    </form>
  );
}

function DeleteButton({ imageId }: { imageId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await deleteShopImageAction(imageId);
          if (res.error) setError(res.error);
          else router.refresh();
        })
      }
      className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70 disabled:opacity-50"
      aria-label="ลบรูป"
      title={error ?? "ลบรูป"}
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}

export function ShopImagesManager({ images }: { images: ShopImage[] }) {
  const cover = images.find((i) => i.kind === "cover") ?? null;
  const profile = images.find((i) => i.kind === "profile") ?? null;
  const gallery = images.filter((i) => i.kind === "gallery");

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">
          รูปปก (Cover) — แบนเนอร์กว้างบนหน้าร้าน
        </p>
        {cover ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/shop-images/${cover.id}`}
              alt="รูปปกร้าน"
              className="h-32 w-full rounded-xl border border-border object-cover"
            />
            <DeleteButton imageId={cover.id} />
          </div>
        ) : (
          <p className="text-xs text-muted">ยังไม่มีรูปปก</p>
        )}
        <UploadForm
          kind="cover"
          label={cover ? "เปลี่ยนรูปปก" : "อัปโหลดรูปปก"}
        />
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">รูปโปรไฟล์ร้าน</p>
        {profile ? (
          <div className="relative w-28">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/shop-images/${profile.id}`}
              alt="โปรไฟล์ร้าน"
              className="h-28 w-28 rounded-2xl border border-border object-cover"
            />
            <DeleteButton imageId={profile.id} />
          </div>
        ) : (
          <p className="text-xs text-muted">ยังไม่มีรูปโปรไฟล์</p>
        )}
        <UploadForm kind="profile" label={profile ? "เปลี่ยนรูปโปรไฟล์" : "อัปโหลดรูปโปรไฟล์"} />
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">
          แกลเลอรี่ ({gallery.length})
        </p>
        {gallery.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {gallery.map((img) => (
              <div key={img.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/shop-images/${img.id}`}
                  alt="ภาพร้าน"
                  className="aspect-square w-full rounded-lg border border-border object-cover"
                />
                <DeleteButton imageId={img.id} />
              </div>
            ))}
          </div>
        )}
        <UploadForm kind="gallery" label="เพิ่มรูปแกลเลอรี่" />
      </section>
    </div>
  );
}
