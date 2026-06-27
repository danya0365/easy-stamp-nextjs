"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  loadMoreReviewsAction,
  setReviewHiddenAction,
  type AdminReviewRow,
} from "@/src/presentation/actions/admin-actions";
import { LoadMore } from "@/src/presentation/components/ui/LoadMore";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { Button } from "@/src/presentation/components/ui/Button";
import { ReviewItem } from "./ReviewItem";

function HideToggle({ id, hidden }: { id: string; hidden: boolean }) {
  const t = useTranslations("reviews");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        size="sm"
        variant={hidden ? "outline" : "danger"}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await setReviewHiddenAction(id, !hidden);
            if (res.error) setError(res.error);
            else router.refresh();
          })
        }
      >
        {hidden ? <Eye size={14} /> : <EyeOff size={14} />}
        {hidden ? t("unhide") : t("hide")}
      </Button>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

function AdminReviewItem({ row }: { row: AdminReviewRow }) {
  const t = useTranslations("reviews");
  return (
    <ReviewItem
      review={row.review}
      actions={
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <Badge tone="neutral">{row.shopName}</Badge>
          {row.review.isHidden && <Badge tone="danger">{t("hiddenBadge")}</Badge>}
          <HideToggle id={row.review.id} hidden={row.review.isHidden} />
        </div>
      }
    />
  );
}

export function AdminReviewList({
  initialItems,
  initialCursor,
}: {
  initialItems: AdminReviewRow[];
  initialCursor: string | null;
}) {
  return (
    <LoadMore<AdminReviewRow>
      initialItems={initialItems}
      initialCursor={initialCursor}
      loadMore={(cursor) => loadMoreReviewsAction(cursor)}
      getKey={(row) => row.review.id}
      renderItem={(row) => <AdminReviewItem row={row} />}
    />
  );
}
