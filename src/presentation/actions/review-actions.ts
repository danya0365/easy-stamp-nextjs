"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { container } from "@/src/infrastructure/di/container";
import { getMemberToken } from "@/src/infrastructure/auth/member";
import { SubmitReviewUseCase } from "@/src/application/use-cases/review/SubmitReviewUseCase";
import type { Page } from "@/src/application/repositories/pagination";
import type { ShopReview } from "@/src/domain/entities";

export interface ReviewFormState {
  error?: string;
  success?: string;
}

/**
 * Resolve the bound customer for a shop from the device token cookie. Returns
 * null when the device isn't bound to this shop (not eligible to review).
 */
async function memberCustomer(slug: string, shopId: string) {
  const token = await getMemberToken(slug);
  if (!token) return null;
  const found = await container.customerDeviceRepository.findByToken(token);
  if (!found || found.customer.shopId !== shopId) return null;
  return found.customer;
}

/** Customer submits/updates their review for a shop (bound devices only). */
export async function submitReviewAction(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  try {
    const slug = String(formData.get("slug") ?? "");
    const shop = await container.shopRepository.findBySlug(slug);
    if (!shop) throw new Error("ไม่พบร้าน");

    const customer = await memberCustomer(slug, shop.id);
    if (!customer) {
      throw new Error("ต้องผูกบัตรสมาชิกกับร้านนี้ก่อนจึงจะรีวิวได้");
    }

    const { review, isNewReview } = await new SubmitReviewUseCase(
      container.shopReviewRepository,
    ).execute({
      shopId: shop.id,
      customerId: customer.id,
      rating: Number(formData.get("rating") ?? 0),
      comment: String(formData.get("comment") ?? "") || null,
    });

    revalidatePath(`/s/${slug}`);

    // Notify the shop owner AFTER the response is sent, so the customer's submit
    // never waits on an in-app write + LINE push (the cause of the hang).
    if (isNewReview) {
      const { rating, comment } = review;
      after(() =>
        container.notificationService.notifyShopOwner(shop.id, {
          type: "shop_received_review",
          title: "ได้รับรีวิวใหม่ ⭐",
          body: `ลูกค้าให้คะแนน ${rating} ดาว${comment ? ` — "${comment.slice(0, 60)}"` : ""}`,
          linkUrl: "/shop/reviews",
        }),
      );
    }

    return { success: "ขอบคุณสำหรับรีวิว 🙏" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Next page of a shop's public reviews (hidden excluded). */
export async function loadMorePublicReviewsAction(
  shopId: string,
  cursor: string,
): Promise<Page<ShopReview>> {
  return container.shopReviewRepository.pageByShop(shopId, { cursor });
}
