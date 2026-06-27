---
name: line-otp-login
description: Passwordless login via LINE OTP for accounts with linked LINE; email-first multi-step login; migration 0007
metadata: 
  node_type: memory
  type: project
  originSessionId: add8da62-4407-485f-ab53-38217a9b99d4
---

Passwordless login (2026-06-15): operators who linked their LINE (`users.lineUserId` set) log in with **email → 6-digit OTP pushed to LINE → verify**, no password. Non-linked accounts (or when LINE isn't configured on the server) fall back to email+password.

- **Flow:** [LoginForm.tsx](src/presentation/components/auth/LoginForm.tsx) is a 3-step client state machine (`email` → `otp` | `password`). Email step calls `requestLoginOtpAction`; if `next:"otp"` show OTP input, if `next:"password"` show password. OTP screen has "ขอรหัสใหม่" (60s cooldown), **"ใช้รหัสผ่านแทน"** (fallback, password still valid — anti-lockout), "← เปลี่ยนอีเมล".
- **Actions** in [auth-actions.ts](src/presentation/actions/auth-actions.ts): `requestLoginOtpAction` (guards `lineConfigFromEnv()===null` → password for all), `verifyLoginOtpAction` (→ createSession + redirect). Original `loginAction` (email+password) kept for the password step.
- **Use cases** [RequestLoginOtpUseCase](src/application/use-cases/auth/RequestLoginOtpUseCase.ts) + [VerifyLoginOtpUseCase](src/application/use-cases/auth/VerifyLoginOtpUseCase.ts); config in [login-otp.ts](src/application/use-cases/auth/login-otp.ts): OTP_LENGTH 6, TTL 5min, resend 60s, MAX_ATTEMPTS 5. OTP is **bcrypt-hashed** (reuses `container.passwordHasher`), pushed via `container.messagePusher` (LINE). Both use cases take an optional `now` param for deterministic tests.
- **Data:** migration `0007_unusual_lifeguard.sql` added `users.login_otp_hash / login_otp_expires_at / login_otp_attempts` (additive ADD COLUMN; prod auto-applies on deploy). OTP fields are secret/transient — NOT on the `User` entity. Repo methods: `setLoginOtp/getLoginOtp/bumpLoginOtpAttempts/clearLoginOtp` on [IUserRepository](src/application/repositories/IUserRepository.ts). Relates to [[notifications-line]] (same pusher/lineUserId) and the existing `lineLinkCode` pattern.
- **Tested:** 10 unit tests ([login-otp.test.ts](src/application/use-cases/auth/login-otp.test.ts)) cover otp_sent/use_password/cooldown/verify-success/wrong/expired/locked; tsc+eslint+build clean. The server-action-over-HTTP path isn't automation-tested (Next action protocol); real OTP-over-LINE delivery needs prod LINE creds — manual prod test.
- **Known tradeoff:** email-first leaks whether an email uses OTP (linked) vs password — acceptable for this B2B app.
