import type { ShopImage } from "@/src/domain/entities";

/** Shop banner: profile image (if any) above the shop name. */
export function ShopProfileHeader({
  profileImage,
  shopName,
}: {
  profileImage: ShopImage | null;
  shopName: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      {profileImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/shop-images/${profileImage.id}`}
          alt={shopName}
          className="h-28 w-28 rounded-2xl border border-border object-cover shadow-sm"
        />
      )}
      <h1 className="text-2xl font-bold text-brand-700">{shopName}</h1>
    </div>
  );
}
