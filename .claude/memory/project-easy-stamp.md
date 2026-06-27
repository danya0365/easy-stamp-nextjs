---
name: project-easy-stamp
description: "What Easy Stamp is, its stack, and the deliberate deviations from the project SKILLs"
metadata: 
  node_type: memory
  type: project
  originSessionId: 7ee88a95-4a34-4ef5-b737-e20768ff36b8
---

Easy Stamp = multi-tenant stamp-card loyalty SaaS for a merchant with multiple shops/branches. Customers earn stamps (staff enter quantity), reach a per-shop threshold (default 10) → redeem a free-text reward. Each shop pays a monthly subscription via PromptPay QR + slip upload; platform_admin verifies manually; unpaid shops get an escalating in-app banner (days 1–7) then auto-suspend (derived from due date, no cron).

**Phase 1 is built + verified** (as of 2026-06-13): public stamp-check `/s/[slug]`, 3-role auth (platform_admin / shop_owner / branch_staff), stamp add/redeem with ledger, shop management, billing + suspension gate, admin shop onboarding + payment verification.

**Stack:** Next.js **16** (App Router; async params/cookies; `proxy.ts` not middleware; Turbopack) · React 19 · **Turso/libSQL + Drizzle ORM** · custom session auth (bcryptjs + httpOnly cookie, sessions table) · Tailwind v4.

**Deliberate deviations from `.agents/skills/nextjs-init-project`** (user-approved): uses **Turso, NOT Supabase**; `Drizzle*Repository` impls; **Server Actions** instead of an `Api*Repository` HTTP layer; import alias `@/src/...`. Still follows Clean Architecture layering (domain/application/infrastructure/presentation) and the IPaymentVerifier abstraction so an auto-verify provider can replace ManualSlipPaymentVerifier later.

**Theming** follows `nextjs-theme-css` + `nextjs-multi-theme`: CSS in `public/styles/` (index/theme/themes/*), semantic tokens swapped per `[data-theme]`, runtime switch via Zustand persist + ThemeProvider + ThemeSwitcher. Templates: **cafe (default, warm orange/pink), minimal, retro** + dark mode.

**Dev:** `npm run db:push && npm run db:seed && npm run dev`. Local DB = `file:./local.db`. Seed logins (password `password123`): admin@easystamp.test, owner@coffee-a.test (active), owner@bakery-b.test (overdue/suspended demo), staff1@coffee-a.test. `/preview` = design-system showcase (delete before prod).
