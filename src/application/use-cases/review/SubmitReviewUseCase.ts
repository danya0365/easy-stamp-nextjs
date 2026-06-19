import type { ShopReview } from "@/src/domain/entities";
import type { IShopReviewRepository } from "@/src/application/repositories/IShopReviewRepository";
import type { NotificationService } from "@/src/application/services/NotificationService";

export interface SubmitReviewInput {
  shopId: string;
  customerId: string;
  rating: number;
  comment: string | null;
}

/** Create/update a customer's review and notify the shop owner. */
export class SubmitReviewUseCase {
  constructor(
    private readonly reviews: IShopReviewRepository,
    private readonly notifications: NotificationService,
  ) {}

  async execute(input: SubmitReviewInput): Promise<ShopReview> {
    const rating = Math.round(input.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new Error("กรุณาให้ดาว 1–5");
    }
    const comment = input.comment?.trim() || null;
    if (comment && comment.length > 1000) {
      throw new Error("ข้อความรีวิวยาวเกินไป");
    }

    const existed = await this.reviews.findByCustomer(
      input.shopId,
      input.customerId,
    );

    const review = await this.reviews.upsert({
      shopId: input.shopId,
      customerId: input.customerId,
      rating,
      comment,
    });

    // Notify only on a brand-new review (not every edit), best-effort.
    if (!existed) {
      await this.notifications.notifyShopOwner(input.shopId, {
        type: "shop_received_review",
        title: "ได้รับรีวิวใหม่ ⭐",
        body: `ลูกค้าให้คะแนน ${rating} ดาว${comment ? ` — "${comment.slice(0, 60)}"` : ""}`,
        linkUrl: "/shop/reviews",
      });
    }

    return review;
  }
}
