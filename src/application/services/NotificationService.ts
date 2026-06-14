import type { NotificationType } from "@/src/domain/entities";
import type { INotificationRepository } from "@/src/application/repositories/INotificationRepository";
import type { IUserRepository } from "@/src/application/repositories/IUserRepository";
import type { IMessagePusher } from "@/src/application/services/IMessagePusher";

export interface NotifyInput {
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string | null;
}

/**
 * Creates in-app notifications and (best-effort) mirrors them to the recipient's
 * LINE via the message pusher. Every method is best-effort: it swallows its own
 * errors so a failed notification never breaks the triggering business flow.
 */
export class NotificationService {
  constructor(
    private readonly notifications: INotificationRepository,
    private readonly users: IUserRepository,
    private readonly pusher: IMessagePusher,
  ) {}

  /** Notify one user (in-app + LINE if linked). */
  async notify(userId: string, input: NotifyInput): Promise<void> {
    try {
      await this.notifications.create({ userId, ...input });
      const user = await this.users.findById(userId);
      if (user?.lineUserId) {
        await this.pusher.pushText(
          user.lineUserId,
          `${input.title}\n${input.body}`,
        );
      }
    } catch (e) {
      console.error("[notify] failed for user", userId, e);
    }
  }

  /** Notify every platform admin. */
  async notifyAdmins(input: NotifyInput): Promise<void> {
    try {
      const admins = await this.users.listByRole("platform_admin");
      await Promise.all(admins.map((a) => this.notify(a.id, input)));
    } catch (e) {
      console.error("[notify] notifyAdmins failed", e);
    }
  }

  /** Notify the owner(s) of a shop. */
  async notifyShopOwner(shopId: string, input: NotifyInput): Promise<void> {
    try {
      const owners = (await this.users.listByShop(shopId)).filter(
        (u) => u.role === "shop_owner",
      );
      await Promise.all(owners.map((o) => this.notify(o.id, input)));
    } catch (e) {
      console.error("[notify] notifyShopOwner failed", shopId, e);
    }
  }
}
