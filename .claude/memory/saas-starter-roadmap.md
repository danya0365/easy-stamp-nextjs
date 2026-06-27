---
name: saas-starter-roadmap
description: "easy-stamp is being hardened into a reusable Thai-vertical SaaS starter; the approved roadmap, scope decisions, and what's done"
metadata: 
  node_type: memory
  type: project
  originSessionId: 283a20fe-3754-423f-b973-53043e4451d9
---

easy-stamp is being positioned as a **reusable Thai-vertical SaaS starter** (next clone: "Easy Queue") — clone it to launch product #2 by reusing the generic ~40% (auth/billing/multi-tenant/notifications/audit/ops) and only rewriting the domain.

**Strategy:** in-place hardening (NOT a separate extracted starter repo). Cloning is done via [`docs/FORKING.md`](docs/FORKING.md) (step-by-step runbook + delete-manifest) + the generic/domain DI split: `src/infrastructure/di/container.generic.ts` (`GenericContainer` core, keep) and `container.ts` (domain subclass, replace per clone).

**Approved roadmap** (2026-06-27, ordered by impact; scope = "Thai vertical template": admin/sales-onboarded, LINE notifications, PromptPay manual-slip billing). Plan file: `/Users/marosdeeuma/.claude/plans/audit-sunny-manatee.md`.
- Tier 1 — clone-ability/DX: 1a FORKING.md ✅ · 1b container split ✅ · 1c entity scaffolder (`npm run scaffold`, `scripts/scaffold-entity.mjs`) ✅ · 1d brand centralization (logo/icon/PWA in `BRAND`) ✅
- Tier 2 — **email** ✅ — `IEmailSender` no-op+env-gated (Resend HTTP via `ResendEmailSender`, `createEmailSender()`); wired as 3rd channel in `NotificationService.notify()`. Mirrors `IErrorTracker` pattern.
- Tier 3 — legal ✅ (ToS page + security.txt)
- Tier 4 — ops ✅ (Dependabot, CodeQL, CI build+audit jobs); leftover (deferred, judged net-negative): husky pre-commit (CI covers gate) + env-gated Sentry adapter (conflicts with vendor-neutral design).

**ALL roadmap tiers shipped.** Released **v1.19.0** (2026-06-27). Full i18n string migration into next-intl `th` catalog also complete this session (KEY-map pattern for enum labels; client allowlist in `src/i18n/client-messages.ts`).

**Security scans handled:** GitGuardian "7 secrets" + CodeQL "5 alerts (2 high)" on PR #31 = all FALSE POSITIVES except 3 real CodeQL fixes shipped in `1ac23b1` (gen-password `Math.random`→`crypto.getRandomValues`; scaffold path-containment guard; ResendEmailSender drop PII from error log). `.gitguardian.yaml` added for the false-positive secret matches (test fixtures / seed default / alphabet constants). NO real secret ever committed (.env* gitignored, full history clean). GitGuardian GitHub-App check is **dashboard-driven** — config file may not auto-clear it; resolve in dashboard if it persists.

**Explicitly OUT of scope** (per the Thai-vertical decision): self-serve public signup, Stripe/auto card gateway + recurring billing + invoices, multi-locale routing (stays single-locale `th`), public REST API / API keys / outbound webhooks, Docker/IaC.

**Why / key insight:** starter value materializes at product #2, not now. Email was worth doing regardless (real product gap, now closed).

**PAUSED here (2026-06-27):** owner is parking easy-stamp at v1.19.0 to start a NEW system. When cloning for product #2 (e.g. "Easy Queue"): follow `docs/FORKING.md` → keep `container.generic.ts` + all 🟢 generic repos/services, replace `container.ts` domain subclass + 🔴 domain repos/use-cases/components/actions/i18n namespaces, run `npm run scaffold <Entity>` for new boilerplate.

Related: [[project-easy-stamp]] · [[testing-setup]]
