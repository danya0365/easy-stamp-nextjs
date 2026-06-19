import type { ShopImage } from "@/src/domain/entities";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";

/** Public gallery grid of a shop's photos. Renders nothing when empty. */
export function ShopGallery({ images }: { images: ShopImage[] }) {
  if (images.length === 0) return null;
  return (
    <Card>
      <CardHeader title="ภาพร้าน" />
      <div className="grid grid-cols-3 gap-2">
        {images.map((img) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={img.id}
            src={`/api/shop-images/${img.id}`}
            alt="ภาพร้าน"
            className="aspect-square w-full rounded-lg border border-border object-cover"
          />
        ))}
      </div>
    </Card>
  );
}
