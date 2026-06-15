"use server";

import { revalidatePath } from "next/cache";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";

export interface ContactFormState {
  error?: string;
  success?: string;
}

/** Anti-spam: must wait this long after the previous request before sending again. */
const CONTACT_COOLDOWN_MS = 5 * 60_000; // 5 นาที

/** Shop owner sends a contact request to the platform admin. */
export async function contactAdminAction(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  try {
    const user = await requireRole("shop_owner");
    if (!user.shopId) throw new Error("บัญชีนี้ไม่ได้ผูกกับร้านค้า");

    const subject = String(formData.get("subject") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    const contactChannel = String(formData.get("contactChannel") ?? "").trim();
    if (!subject || !message || !contactChannel) {
      throw new Error("กรุณากรอกหัวข้อ ข้อความ และช่องทางติดต่อกลับให้ครบ");
    }

    // Anti-spam (server-side, covers every entry point): one open request per
    // shop, plus a short cooldown between submissions.
    const latest =
      await container.contactRequestRepository.findLatestByShop(user.shopId);
    if (latest?.status === "open") {
      throw new Error(
        "คุณมีคำขอที่รอผู้ดูแลตอบกลับอยู่แล้ว กรุณารอการติดต่อกลับก่อนส่งใหม่",
      );
    }
    if (latest) {
      // Here the latest is resolved (open case returned above). Measure cooldown
      // from the resolution time, so a quick admin resolve doesn't block a
      // legitimate follow-up sooner than intended.
      const since = new Date(latest.resolvedAt ?? latest.createdAt).getTime();
      const elapsed = Date.now() - since;
      if (elapsed < CONTACT_COOLDOWN_MS) {
        const mins = Math.ceil((CONTACT_COOLDOWN_MS - elapsed) / 60_000);
        throw new Error(`กรุณารออีกประมาณ ${mins} นาที ก่อนส่งคำขอใหม่`);
      }
    }

    await container.contactRequestRepository.create({
      shopId: user.shopId,
      createdBy: user.id,
      subject,
      message,
      contactChannel,
    });

    const shop = await container.shopRepository.findById(user.shopId);
    await container.notificationService.notifyAdmins({
      type: "contact_request",
      title: `คำขอติดต่อจากร้าน ${shop?.name ?? "-"}`,
      body: `${subject} — ติดต่อกลับ: ${contactChannel}`,
      linkUrl: "/admin/contacts",
    });

    revalidatePath("/shop/contact");
    return { success: "ส่งคำขอติดต่อแล้ว ผู้ดูแลจะติดต่อกลับโดยเร็ว" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Admin marks a contact request as resolved (and tells the shop owner). */
export async function resolveContactAction(id: string): Promise<void> {
  const admin = await requireRole("platform_admin");
  const resolved = await container.contactRequestRepository.resolve(id, admin.id);

  // Close the loop: notify the owner who raised it (in-app + LINE).
  if (resolved) {
    await container.notificationService.notify(resolved.createdBy, {
      type: "contact_resolved",
      title: "ผู้ดูแลรับเรื่องของคุณแล้ว",
      body: `คำขอ "${resolved.subject}" ได้รับการดำเนินการแล้ว`,
      linkUrl: "/shop/contact",
    });
  }

  revalidatePath("/admin/contacts");
  revalidatePath("/shop/contact");
}
