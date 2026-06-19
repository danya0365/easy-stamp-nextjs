import Link from "next/link";
import { Map as MapIcon, Store } from "lucide-react";

import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import {
  ShopDirectoryCard,
  type ShopDirectoryItem,
} from "@/src/presentation/components/shop/ShopDirectoryCard";
import { cn } from "@/src/presentation/components/ui/cn";

export const dynamic = "force-dynamic";

export default async function ShopsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const [shops, categories] = await Promise.all([
    container.shopRepository.list(),
    container.shopCategoryRepository.listActive(),
  ]);
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const slugById = new Map(categories.map((c) => [c.id, c.slug]));

  // Public directory: active shops only, optional category filter.
  const active = shops.filter(
    (s) =>
      s.status === "active" &&
      (!category || slugById.get(s.categoryId ?? "") === category),
  );

  const shopIds = active.map((s) => s.id);
  const [summaries, profiles] = await Promise.all([
    container.shopReviewRepository.summariesByShop(shopIds),
    container.shopImageRepository.profilesByShop(shopIds),
  ]);

  const items: ShopDirectoryItem[] = active
    .map((s) => ({
      slug: s.slug,
      name: s.name,
      categoryName: s.categoryId ? categoryName.get(s.categoryId) ?? null : null,
      rating: summaries[s.id] ?? { average: 0, count: 0 },
      profileImageId: profiles[s.id] ?? null,
    }))
    // Highest-rated first, then most-reviewed, then by name.
    .sort(
      (a, b) =>
        b.rating.average - a.rating.average ||
        b.rating.count - a.rating.count ||
        a.name.localeCompare(b.name, "th"),
    );

  const filters = [
    { slug: null as string | null, label: "ทั้งหมด" },
    ...categories.map((c) => ({ slug: c.slug, label: c.name })),
  ];

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-foreground">ร้านค้าทั้งหมด</h1>
        <Link href="/">
          <Button variant="outline" size="sm">
            <MapIcon size={14} />
            แผนที่
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => {
          const activeChip = (f.slug ?? null) === (category ?? null);
          return (
            <Link
              key={f.slug ?? "all"}
              href={f.slug ? `/shops?category=${f.slug}` : "/shops"}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                activeChip
                  ? "bg-brand-500 text-on-brand"
                  : "bg-muted-surface text-muted hover:text-foreground",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader title={`${items.length} ร้าน`} />
        {items.length === 0 ? (
          <EmptyState icon={<Store />} title="ยังไม่มีร้านในหมวดนี้" />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {items.map((shop) => (
              <ShopDirectoryCard key={shop.slug} shop={shop} />
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
