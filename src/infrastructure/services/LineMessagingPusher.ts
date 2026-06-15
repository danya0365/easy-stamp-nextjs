import "server-only";

import type { IMessagePusher } from "@/src/application/services/IMessagePusher";

export interface LineConfig {
  channelAccessToken: string;
  channelSecret: string;
}

/** Reads LINE Messaging API credentials from env; null if not fully configured. */
export function lineConfigFromEnv(): LineConfig | null {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelAccessToken || !channelSecret) return null;
  return { channelAccessToken, channelSecret };
}

const PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";

/** Push via the LINE Messaging API. Swallows errors (logs) so it never breaks a flow. */
export class LineMessagingPusher implements IMessagePusher {
  constructor(private readonly config: LineConfig) {}

  async pushText(channelUserId: string, text: string): Promise<void> {
    try {
      const res = await fetch(PUSH_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.channelAccessToken}`,
        },
        body: JSON.stringify({
          to: channelUserId,
          messages: [{ type: "text", text }],
        }),
      });
      if (!res.ok) {
        console.error(
          `[LINE] push failed (${res.status}): ${await res.text().catch(() => "")}`,
        );
      }
    } catch (e) {
      console.error("[LINE] push error:", e);
    }
  }
}

/** No-op pusher used when LINE is not configured. */
export class NullMessagePusher implements IMessagePusher {
  async pushText(): Promise<void> {
    // Intentionally does nothing — in-app notifications still work.
  }
}
