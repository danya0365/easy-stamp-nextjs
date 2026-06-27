---
name: notifications-line
description: Notification system + LINE OA push + contact-admin feature (shipped); prod deploy needs migration 0003 + LINE env
metadata: 
  node_type: memory
  type: project
  originSessionId: add8da62-4407-485f-ab53-38217a9b99d4
---

In-app notifications + LINE OA push + shop→admin contact, shipped 2026-06-14.

- **Tables (migrations `drizzle/0003_*.sql` + `0004_*.sql`):** `notifications` (per-user, recipient=operator), `contact_requests` (shop→admin, open/resolved), + `users.lineUserId`/`lineLinkCode`/`lineLinkCodeExpiresAt`. **Prod build auto-runs `db:migrate`** via [scripts/vercel-migrate.mjs](scripts/vercel-migrate.mjs) on VERCEL_ENV=production deploy (no manual migrate). Local applied via push (see [[drizzle-kit-targets-prod]]).
- **LINE link-code hardening:** code is 6-char (32-alphabet), **expires 10 min** (`lineLinkCodeExpiresAt`, filtered in `findByLineLinkCode`), regenerate-on-conflict for uniqueness. **Contact anti-spam:** 1 open request per shop + 5-min cooldown (from resolvedAt). `contactAdminAction` has no assertShopActive (suspended shops must be able to ask for help via the /shop/billing contact button).
- **Triggers (in server actions, best-effort try/catch):** submitSlipAction→notifyAdmins; verifyPaymentAction→notifyShopOwner; contactAdminAction→notifyAdmins. Orchestrated by `NotificationService` (application/services).
- **LINE:** LINE Notify is dead → uses **Messaging API push** (`IMessagePusher`→`LineMessagingPusher`, env-gated like R2 via `lineConfigFromEnv()`; `NullMessagePusher` when unset). Only operators (admin/owner) get LINE — customers are anonymous. Linking: operator generates code in `LineLinkCard` → adds OA → sends code → webhook `app/api/line/webhook/route.ts` binds `lineUserId`.
- **Prod env to enable LINE:** `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`, `NEXT_PUBLIC_LINE_OA_ADD_URL` + set channel Webhook URL → `https://<domain>/api/line/webhook`. App works fully without these (in-app noti + contact still work).
- **UI:** bell+badge in [[AppHeader]] (unread count from layout), inbox pages `/shop/notifications` & `/admin/notifications` (mark-all-read on view), `/admin/contacts`. Nav entries in AppTabBar (admin now 5 tabs).
- **Deferred:** cron expiry reminders; customer-facing noti.
