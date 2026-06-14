import { createHmac, timingSafeEqual } from "crypto";

import { container } from "@/src/infrastructure/di/container";
import { lineConfigFromEnv } from "@/src/infrastructure/services/LineMessagingPusher";
import { LinkLineAccountUseCase } from "@/src/application/use-cases/line/LinkLineAccountUseCase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPLY_ENDPOINT = "https://api.line.me/v2/bot/message/reply";

function verifySignature(secret: string, raw: string, signature: string | null) {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function reply(token: string, replyToken: string, text: string) {
  try {
    await fetch(REPLY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: "text", text }],
      }),
    });
  } catch (e) {
    console.error("[LINE] reply error:", e);
  }
}

interface LineEvent {
  type: string;
  replyToken?: string;
  source?: { userId?: string };
  message?: { type: string; text?: string };
}

export async function POST(req: Request) {
  const config = lineConfigFromEnv();
  // Always 200 so LINE doesn't retry; do nothing if not configured.
  if (!config) return new Response("ok", { status: 200 });

  const raw = await req.text();
  if (!verifySignature(config.channelSecret, raw, req.headers.get("x-line-signature"))) {
    return new Response("bad signature", { status: 403 });
  }

  let events: LineEvent[] = [];
  try {
    events = (JSON.parse(raw).events ?? []) as LineEvent[];
  } catch {
    return new Response("ok", { status: 200 });
  }

  const linkUseCase = new LinkLineAccountUseCase(container.userRepository);

  for (const event of events) {
    const lineUserId = event.source?.userId;
    if (event.type === "message" && event.message?.type === "text" && lineUserId) {
      const code = (event.message.text ?? "").trim().toUpperCase();
      const linkedEmail = await linkUseCase.execute(code, lineUserId);
      if (event.replyToken) {
        await reply(
          config.channelAccessToken,
          event.replyToken,
          linkedEmail
            ? `เชื่อมต่อสำเร็จ ✅ (${linkedEmail})\nคุณจะได้รับการแจ้งเตือนผ่าน LINE นี้`
            : "ไม่พบโค้ดนี้ กรุณาสร้างโค้ดใหม่ในแอปแล้วลองอีกครั้ง",
        );
      }
    } else if (event.type === "follow" && event.replyToken) {
      await reply(
        config.channelAccessToken,
        event.replyToken,
        "ขอบคุณที่เพิ่มเพื่อน 🎉\nพิมพ์โค้ดเชื่อมต่อจากแอป Easy Stamp เพื่อรับการแจ้งเตือน",
      );
    }
  }

  return new Response("ok", { status: 200 });
}
