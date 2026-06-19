import { timingSafeEqual } from "crypto";

import { container } from "@/src/infrastructure/di/container";
import { ListDueFollowUpsUseCase } from "@/src/application/use-cases/lead/ListDueFollowUpsUseCase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Constant-time compare of the incoming bearer token against CRON_SECRET. */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Daily reminder: notify platform admins (in-app + LINE) about leads whose
 * follow-up date has passed. Triggered by Vercel Cron (see vercel.json) with an
 * Authorization: Bearer <CRON_SECRET> header.
 */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const due = await new ListDueFollowUpsUseCase(
    container.leadRepository,
  ).execute();

  if (due.length > 0) {
    await container.notificationService.notifyAdmins({
      type: "lead_follow_up_due",
      title: "ลีดถึงกำหนดติดตาม",
      body: `มี ${due.length} ลีดถึงกำหนดติดตามแล้ว — เปิดดูเพื่อวางแผนลงพื้นที่`,
      linkUrl: "/admin/leads",
    });
  }

  return Response.json({ processed: due.length });
}
