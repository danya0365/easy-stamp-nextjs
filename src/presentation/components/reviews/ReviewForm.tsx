"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  submitReviewAction,
  type ReviewFormState,
} from "@/src/presentation/actions/review-actions";
import type { ShopReview } from "@/src/domain/entities";
import { StarRatingInput } from "@/src/presentation/components/ui/StarRatingInput";
import { Textarea } from "@/src/presentation/components/ui/Textarea";
import { Button } from "@/src/presentation/components/ui/Button";
import { useActionToast } from "@/src/presentation/hooks/useActionToast";

/** Customer review form (bound members only). Shows existing review for editing. */
export function ReviewForm({
  slug,
  existing,
}: {
  slug: string;
  existing: ShopReview | null;
}) {
  const t = useTranslations("reviews");
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(
    submitReviewAction,
    {},
  );
  useActionToast(state);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="slug" value={slug} />
      <p className="text-sm font-medium text-foreground">
        {existing ? t("editYours") : t("rateShop")}
      </p>
      <StarRatingInput defaultValue={existing?.rating ?? 0} />
      <Textarea
        name="comment"
        rows={3}
        maxLength={1000}
        placeholder={t("commentPlaceholder")}
        defaultValue={existing?.comment ?? ""}
      />
      {state.error && <p className="text-sm text-error">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}
      <Button type="submit" size="sm" loading={pending}>
        {pending ? t("submitting") : existing ? t("saveReview") : t("submitReview")}
      </Button>
    </form>
  );
}
