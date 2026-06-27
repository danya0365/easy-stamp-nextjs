---
name: r2-slip-storage
description: Slip uploads use Cloudflare R2 on prod; Vercel needs R2_* env or uploads silently fall back to local FS and break
metadata: 
  node_type: memory
  type: project
  originSessionId: 6f74b9ab-8cdb-48c2-8561-0406c5a89dd2
---

Payment slip uploads use **Cloudflare R2** (S3-compatible) via `R2SlipStorage` ([src/infrastructure/services/R2SlipStorage.ts](src/infrastructure/services/R2SlipStorage.ts)). The DI container ([container.ts](src/infrastructure/di/container.ts)) picks R2 when `r2ConfigFromEnv()` finds all four env vars, else falls back to `LocalSlipStorage` (disk — dev only).

**Deploy gotcha:** On Vercel, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` **must** be set (Production scope). If missing, the app silently uses local disk, which is ephemeral on Vercel → uploads vanish + `/api/slips/[paymentId]` 404s. This was the original "upload broken on prod" bug. Bucket is **private**; slips served only through the auth-gated `/api/slips` route. See [.env.example](.env.example).

Related: passwords have no email/SMS recovery — admin resets owner pw, owner resets staff pw, everyone can self-change (see `ResetPasswordControl` / `ChangePasswordForm`). Login is email-only; Google/LINE are placeholder buttons for the future. See [[project-easy-stamp]].
