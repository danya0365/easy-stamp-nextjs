import Link from "next/link";
import { ChevronRight, Store } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { ReviewSummary } from "@/src/domain/entities";
import { StarRating } from "@/src/presentation/components/ui/StarRating";

export interface ShopDirectoryItem {
  slug: string;
  name: string;
  categoryName: string | null;
  rating: ReviewSummary;
  profileImageId: string | null;
}

/** One row in the public shop directory. */
export async function ShopDirectoryCard({ shop }: { shop: ShopDirectoryItem }) {
  const t = await getTranslations("shop");
  return (
    <li>
      <Link
        href={`/s/${shop.slug}`}
        className="flex items-center gap-3 py-3 hover:opacity-80"
      >
        {shop.profileImageId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/shop-images/${shop.profileImageId}`}
            alt={shop.name}
            className="size-12 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted-surface text-muted">
            <Store className="size-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">
            {shop.name}
            {shop.categoryName && (
              <span className="ml-2 text-xs font-normal text-muted">
                · {shop.categoryName}
              </span>
            )}
          </p>
          {shop.rating.count > 0 ? (
            <div className="mt-0.5 flex items-center gap-1">
              <StarRating value={shop.rating.average} size="sm" />
              <span className="text-xs text-muted">
                {shop.rating.average.toFixed(1)} ({shop.rating.count})
              </span>
            </div>
          ) : (
            <p className="mt-0.5 text-xs text-muted">{t("noReviews")}</p>
          )}
        </div>

        <ChevronRight className="size-4 shrink-0 text-muted" />
      </Link>
    </li>
  );
}
