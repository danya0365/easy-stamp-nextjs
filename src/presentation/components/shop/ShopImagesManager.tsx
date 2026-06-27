"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  uploadShopImageAction,
  deleteShopImageAction,
  type FormState,
} from "@/src/presentation/actions/shop-actions";
import type { ShopImage } from "@/src/domain/entities";
import { Button } from "@/src/presentation/components/ui/Button";
import { ImageCropField } from "@/src/presentation/components/ui/ImageCropField";
import { useToast } from "@/src/presentation/components/ui/Toast";
import { useConfirm } from "@/src/presentation/components/ui/ConfirmDialog";
import { useActionToast } from "@/src/presentation/hooks/useActionToast";

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
  const t = useTranslations("shop");
  const [state, action, pending] = useActionState<FormState, FormData>(
    uploadShopImageAction,
    {},
  );
  useActionToast(state);
  const [ready, setReady] = useState(false);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="kind" value={kind} />
      <ImageCropField
        name="image"
        aspect={ASPECT_BY_KIND[kind]}
        label={t("imgChoosePhoto")}
        onReadyChange={setReady}
      />
      {state.error && <p className="text-sm text-error">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}
      <Button
        type="submit"
        size="sm"
        variant="outline"
        loading={pending}
        disabled={!ready}
      >
        {pending ? t("imgUploading") : label}
      </Button>
    </form>
  );
}

function DeleteButton({ imageId }: { imageId: string }) {
  const t = useTranslations("shop");
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  async function onClick() {
    const ok = await confirm({
      title: t("imgDeleteConfirmTitle"),
      message: t("imgDeleteConfirmMessage"),
      confirmLabel: t("imgDeleteConfirmLabel"),
      tone: "danger",
    });
    if (!ok) return;
    start(async () => {
      const res = await deleteShopImageAction(imageId);
      if (res.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success(t("imgDeleted"));
        router.refresh();
      }
    });
  }
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70 disabled:opacity-50"
      aria-label={t("imgDeleteAria")}
      title={error ?? t("imgDeleteAria")}
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}

export function ShopImagesManager({ images }: { images: ShopImage[] }) {
  const t = useTranslations("shop");
  const cover = images.find((i) => i.kind === "cover") ?? null;
  const profile = images.find((i) => i.kind === "profile") ?? null;
  const gallery = images.filter((i) => i.kind === "gallery");

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">
          {t("imgCoverSectionTitle")}
        </p>
        {cover ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/shop-images/${cover.id}`}
              alt={t("imgCoverAlt")}
              className="h-32 w-full rounded-xl border border-border object-cover"
            />
            <DeleteButton imageId={cover.id} />
          </div>
        ) : (
          <p className="text-xs text-muted">{t("imgNoCover")}</p>
        )}
        <UploadForm
          kind="cover"
          label={cover ? t("imgChangeCover") : t("imgUploadCover")}
        />
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">{t("imgProfileSectionTitle")}</p>
        {profile ? (
          <div className="relative w-28">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/shop-images/${profile.id}`}
              alt={t("imgProfileAlt")}
              className="h-28 w-28 rounded-2xl border border-border object-cover"
            />
            <DeleteButton imageId={profile.id} />
          </div>
        ) : (
          <p className="text-xs text-muted">{t("imgNoProfile")}</p>
        )}
        <UploadForm kind="profile" label={profile ? t("imgChangeProfile") : t("imgUploadProfile")} />
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">
          {t("imgGallerySectionTitle", { count: gallery.length })}
        </p>
        {gallery.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {gallery.map((img) => (
              <div key={img.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/shop-images/${img.id}`}
                  alt={t("imgGalleryAlt")}
                  className="aspect-square w-full rounded-lg border border-border object-cover"
                />
                <DeleteButton imageId={img.id} />
              </div>
            ))}
          </div>
        )}
        <UploadForm kind="gallery" label={t("imgAddGallery")} />
      </section>
    </div>
  );
}
