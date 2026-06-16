"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { getClientIp } from "@/src/presentation/lib/request-ip";
import type { Page } from "@/src/application/repositories/pagination";
import type { ContactRow } from "@/src/presentation/components/admin/ContactInbox";

export interface ContactFormState {
  error?: string;
  success?: string;
}

// Public (login-page) contact form: no session, so it's heavily abuse-guarded.
const PUBLIC_CONTACT_LIMIT = 3;
const PUBLIC_CONTACT_WINDOW_MS = 24 * 60 * 60_000; // 3 ครั้ง/วัน ต่อ IP

const publicContactSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  subject: z.string().trim().min(1, "กรุณากรอกหัวข้อ").max(120),
  message: z.string().trim().min(1, "กรุณากรอกข้อความ").max(1000),
  contactChannel: z.string().trim().min(1, "กรุณากรอกช่องทางติดต่อกลับ").max(200),
});

/**
 * PUBLIC contact form on the login page — for users locked out of sign-in.
 * Unauthenticated, so: honeypot + CAPTCHA (Turnstile) + per-IP rate-limit.
 */
export async function contactAdminPublicAction(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  try {
    // Honeypot: real users never fill this hidden field.
    if (String(formData.get("company") ?? "").trim() !== "") {
      return { success: "ส่งคำขอติดต่อแล้ว ผู้ดูแลจะติดต่อกลับโดยเร็ว" };
    }

    const parsed = publicContactSchema.safeParse({
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
      contactChannel: formData.get("contactChannel"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
    }

    const ip = await getClientIp();

    // CAPTCHA (no-op pass when Turnstile isn't configured, e.g. local dev).
    const captchaOk = await container.turnstile.verify(
      String(formData.get("captchaToken") ?? ""),
      ip,
    );
    if (!captchaOk) return { error: "ยืนยันว่าไม่ใช่บอทไม่สำเร็จ กรุณาลองใหม่" };

    const rl = await container.rateLimitRepository.hit(
      `contact:ip:${ip}`,
      PUBLIC_CONTACT_LIMIT,
      PUBLIC_CONTACT_WINDOW_MS,
    );
    if (!rl.allowed) {
      return { error: "ส่งคำขอบ่อยเกินไป กรุณาลองใหม่ภายหลัง" };
    }

    await container.contactRequestRepository.create({
      source: "public",
      email: parsed.data.email.trim().toLowerCase(),
      ipAddress: ip,
      subject: parsed.data.subject,
      message: parsed.data.message,
      contactChannel: parsed.data.contactChannel,
    });

    await container.notificationService.notifyAdmins({
      type: "contact_request",
      title: "ติดต่อผู้ดูแลจากหน้าเข้าสู่ระบบ",
      body: `${parsed.data.subject} — อีเมล: ${parsed.data.email} · ติดต่อกลับ: ${parsed.data.contactChannel}`,
      linkUrl: "/admin/contacts",
    });

    return { success: "ส่งคำขอติดต่อแล้ว ผู้ดูแลจะติดต่อกลับโดยเร็วที่สุด" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Next page of resolved contact requests (admin inbox "load more"). */
export async function loadMoreResolvedContactsAction(
  cursor: string,
): Promise<Page<ContactRow>> {
  await requireRole("platform_admin");
  const page = await container.contactRequestRepository.pageResolved({ cursor });
  const shops = await container.shopRepository.list();
  const shopName = new Map(shops.map((s) => [s.id, s.name]));
  return {
    items: page.items.map((request) => ({
      request,
      shopName: (request.shopId ? shopName.get(request.shopId) : null) ?? "-",
    })),
    nextCursor: page.nextCursor,
  };
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
  // Public (login-page) requests have no account to notify — skip.
  if (resolved && resolved.createdBy) {
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
