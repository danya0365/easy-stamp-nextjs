"use server";

import { revalidatePath } from "next/cache";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";

export interface ContactFormState {
  error?: string;
  success?: string;
}

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

    return { success: "ส่งคำขอติดต่อแล้ว ผู้ดูแลจะติดต่อกลับโดยเร็ว" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Admin marks a contact request as resolved. */
export async function resolveContactAction(id: string): Promise<void> {
  const admin = await requireRole("platform_admin");
  await container.contactRequestRepository.resolve(id, admin.id);
  revalidatePath("/admin/contacts");
}
