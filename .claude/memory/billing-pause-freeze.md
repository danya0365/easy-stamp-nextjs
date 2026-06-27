---
name: billing-pause-freeze
description: "How \"ปิดร้านชั่วคราว\" (pause) freezes billing days, the loophole, and the whole-day-floor + guard-rail fix"
metadata: 
  node_type: memory
  type: project
  originSessionId: 9dc508e5-e8d1-49b7-af7c-501d21630369
---

Billing is day-topup: shop life = single timestamp `subscriptions.currentPeriodDueAt`; "days left" = `(due − now)` computed live (NO cron decrements). Pause sets `pausedAt=now` (freezes; `assertShopActive` then blocks ALL ops + hides shop from map). Resume pushes `due` forward by the paused duration — see `resumeDueDate` in [subscription-status.ts].

**Loophole (fixed 2026-06):** original resume credited the *exact* ms paused, so a shop could open only during business hours and pause off-hours → 1 paid day stretched across ~3 calendar days (~3× free usage). Rapid toggling itself is harmless (paused = fully blocked).

**Fix shipped (whole-day-floor + guard-rails), policy chosen by owner:**
- `resumeDueDate` credits `Math.floor(pausedMs / DAY_MS)` whole days only → pausing <1 day (overnight/toggle) refunds 0; pausing only pays off for genuine multi-day closures (intended use). Do NOT change floor→round/ceil (reopens the 12h boundary).
- `ResumeShopUseCase.execute` now returns `boolean` (changed) so the action audit-logs only real transitions.
- Guard-rails live in `pauseMyShopAction`/`resumeMyShopAction` ([shop-actions.ts], now return `{error?}`): cooldown `shop_pause_cd:<shopId>` (1 / 24h via `rateLimitRepository.hit`), monthly cap `shop_pause_cap:<shopId>` (8 / rolling-30d fixed-window via `sensitiveActionGuard.check`, alerts admins+owner; when capped, admin's own `pauseShopAction` bypasses it — no unlock button), and `auditLogger.record` shopPaused/shopResumed (owner pause/resume was previously NOT logged — only admin path was).
- UI [PauseShopControl.tsx] explains the rules (whole-day credit, 4×/month, 24h cooldown) to prevent disputes; surfaces cooldown/cap errors via toast.

Related: [[billing-daytopup-phases]]. Pausing while overdue is still allowed (not a free-usage vector since paused=blocked).
