"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, X } from "lucide-react";

import {
  loginAction,
  requestLoginOtpAction,
  verifyLoginOtpAction,
  verifyLoginTwoFactorAction,
  forgetAccountAction,
} from "@/src/presentation/actions/auth-actions";
import { ROLE_LABEL } from "@/src/domain/types/roles";
import type { KnownAccount } from "@/src/domain/entities";
import { PublicContactButton } from "./PublicContactButton";

const inputCls =
  "rounded-lg border border-border px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";
const btnCls =
  "mt-2 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-on-brand transition hover:bg-brand-700 disabled:opacity-60";
const linkCls = "text-sm text-brand-700 hover:underline";

type Step = "email" | "otp" | "password" | "unavailable" | "twofa";

export function LoginForm({
  knownAccounts = [],
}: {
  knownAccounts?: KnownAccount[];
}) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [resendIn, setResendIn] = useState(0);
  // OTP step: whether the password fallback is offered (admin yes; linked owner/staff no).
  const [passwordAllowed, setPasswordAllowed] = useState(false);
  // Device-remembered accounts (FB-style). Local copy so "forget" updates instantly.
  const [accounts, setAccounts] = useState<KnownAccount[]>(knownAccounts);
  // When there are remembered accounts, show the picker first; this flips to the
  // plain email input ("use another email").
  const [manual, setManual] = useState(false);

  // Resend cooldown countdown.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  // Email step: ask the server whether this email gets a LINE OTP or the
  // password fallback. Shared by typing an email and picking a known account.
  function submitEmail(targetEmail: string) {
    setEmail(targetEmail);
    setError(null);
    const fd = new FormData();
    fd.set("email", targetEmail);
    startTransition(async () => {
      const res = await requestLoginOtpAction({}, fd);
      if (res.next === "otp") {
        setPasswordAllowed(res.passwordAllowed ?? false);
        setStep("otp");
        setResendIn(60);
        if (res.error) setError(res.error);
      } else if (res.next === "password") {
        setStep("password");
      } else if (res.next === "unavailable") {
        setStep("unavailable");
      } else if (res.error) {
        setError(res.error);
      }
    });
  }

  function forget(targetEmail: string) {
    startTransition(async () => {
      await forgetAccountAction(targetEmail);
    });
    setAccounts((prev) => {
      const next = prev.filter((a) => a.email !== targetEmail);
      if (next.length === 0) setManual(true);
      return next;
    });
  }

  function onSubmitEmail(e: React.FormEvent) {
    e.preventDefault();
    submitEmail(email);
  }

  function onSubmitOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      // On success the action redirects (throws); we only get here on error
      // or when the account needs a 2FA code.
      const res = await verifyLoginOtpAction({}, fd);
      if (res?.twoFactorRequired) setStep("twofa");
      else if (res?.error) setError(res.error);
    });
  }

  function onSubmitPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await loginAction({}, fd);
      if (res?.twoFactorRequired) setStep("twofa");
      else if (res?.error) setError(res.error);
    });
  }

  function onSubmitTwoFactor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await verifyLoginTwoFactorAction({}, fd);
      if (res?.error) setError(res.error);
    });
  }

  function backToEmail() {
    setError(null);
    setStep("email");
  }

  const errorBox = error && (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
  );

  // --- Step 1: email ---
  if (step === "email") {
    // 1a. Account picker — accounts used before on this device.
    if (accounts.length > 0 && !manual) {
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">เลือกบัญชีเพื่อเข้าสู่ระบบ</p>
          <ul className="flex flex-col gap-2">
            {accounts.map((acc) => (
              <li key={acc.email} className="relative">
                <button
                  type="button"
                  onClick={() => submitEmail(acc.email)}
                  disabled={pending}
                  className="flex w-full items-center gap-3 rounded-xl bg-card py-2.5 pl-3 pr-10 text-left ring-1 ring-border transition hover:ring-brand-300 disabled:opacity-60"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                    {acc.email.charAt(0).toUpperCase()}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">
                      {acc.email}
                    </span>
                    <span className="text-xs text-muted">
                      {ROLE_LABEL[acc.role]}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => forget(acc.email)}
                  disabled={pending}
                  aria-label={`ลบ ${acc.email} ออกจากเครื่องนี้`}
                  title="ลบบัญชีนี้ออกจากเครื่อง"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted transition hover:bg-muted-surface hover:text-foreground disabled:opacity-60"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setEmail("");
              setManual(true);
            }}
            className={`${linkCls} text-left`}
          >
            เข้าด้วยอีเมลอื่น
          </button>
        </div>
      );
    }

    // 1b. Manual email entry.
    return (
      <form onSubmit={onSubmitEmail} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            อีเมล
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </div>
        {errorBox}
        <button type="submit" disabled={pending} className={btnCls}>
          {pending ? "กำลังดำเนินการ…" : "ดำเนินการต่อ"}
        </button>
        {knownAccounts.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setManual(false);
            }}
            className={`${linkCls} inline-flex items-center gap-1 text-left`}
          >
            <ArrowLeft className="size-4" />
            เลือกจากบัญชีที่เคยใช้
          </button>
        )}
      </form>
    );
  }

  // --- Step 2: OTP ---
  if (step === "otp") {
    return (
      <form onSubmit={onSubmitOtp} className="flex flex-col gap-4">
        <input type="hidden" name="email" value={email} />
        <p className="text-sm text-muted">
          ส่งรหัส 6 หลักไปที่ LINE ของ <strong>{email}</strong> แล้ว
          กรอกรหัสเพื่อเข้าสู่ระบบ
        </p>
        <div className="flex flex-col gap-1">
          <label htmlFor="otp" className="text-sm font-medium text-foreground">
            รหัส OTP
          </label>
          <input
            id="otp"
            name="otp"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={6}
            required
            autoFocus
            className={`${inputCls} text-center text-lg tracking-[0.5em]`}
          />
        </div>
        {errorBox}
        <button type="submit" disabled={pending} className={btnCls}>
          {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
        </button>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => submitEmail(email)}
            disabled={pending || resendIn > 0}
            className={`${linkCls} disabled:text-muted disabled:no-underline`}
          >
            {resendIn > 0 ? `ขอรหัสใหม่ได้ใน ${resendIn} วินาที` : "ขอรหัสใหม่"}
          </button>
          {passwordAllowed ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep("password");
              }}
              className={linkCls}
            >
              ใช้รหัสผ่านแทน
            </button>
          ) : (
            <PublicContactButton
              label="รับรหัสไม่ได้? ติดต่อผู้ดูแล"
              className={linkCls}
            />
          )}
        </div>
        <button
          type="button"
          onClick={backToEmail}
          className={`${linkCls} inline-flex items-center gap-1 text-left`}
        >
          <ArrowLeft className="size-4" />
          เปลี่ยนอีเมล
        </button>
      </form>
    );
  }

  // --- OTP unavailable: linked owner/staff but the server can't send OTP ---
  if (step === "unavailable") {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-warning-surface px-3 py-2 text-sm text-warning">
          บัญชีนี้ต้องเข้าสู่ระบบผ่านรหัส OTP ทาง LINE แต่ตอนนี้ส่งรหัสไม่ได้
          กรุณาติดต่อผู้ดูแลเพื่อขอความช่วยเหลือ
        </div>
        <PublicContactButton
          label="ติดต่อผู้ดูแล"
          className={btnCls + " inline-flex items-center justify-center"}
        />
        <button
          type="button"
          onClick={backToEmail}
          className={`${linkCls} inline-flex items-center gap-1 text-left`}
        >
          <ArrowLeft className="size-4" />
          เปลี่ยนอีเมล
        </button>
      </div>
    );
  }

  // --- 2FA step: TOTP / recovery code (after step-1 success) ---
  if (step === "twofa") {
    return (
      <form onSubmit={onSubmitTwoFactor} className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          กรอกรหัส 6 หลักจากแอป Authenticator (หรือรหัสสำรอง 1 ครั้ง)
        </p>
        <div className="flex flex-col gap-1">
          <label htmlFor="code" className="text-sm font-medium text-foreground">
            รหัสยืนยัน 2 ชั้น
          </label>
          <input
            id="code"
            name="code"
            inputMode="text"
            autoComplete="one-time-code"
            required
            autoFocus
            className={`${inputCls} text-center text-lg tracking-[0.3em]`}
          />
        </div>
        {errorBox}
        <button type="submit" disabled={pending} className={btnCls}>
          {pending ? "กำลังยืนยัน…" : "ยืนยัน"}
        </button>
        <button
          type="button"
          onClick={backToEmail}
          className={`${linkCls} inline-flex items-center gap-1 text-left`}
        >
          <ArrowLeft className="size-4" />
          ยกเลิก
        </button>
      </form>
    );
  }

  // --- Step 3: password (fallback / non-linked accounts) ---
  return (
    <form onSubmit={onSubmitPassword} className="flex flex-col gap-4">
      <input type="hidden" name="email" value={email} />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">อีเมล</label>
        <p className="rounded-lg bg-muted-surface px-3 py-2 text-sm text-foreground">
          {email}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          รหัสผ่าน
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className={inputCls}
        />
      </div>
      {errorBox}
      <button type="submit" disabled={pending} className={btnCls}>
        {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
      </button>
      <button
        type="button"
        onClick={backToEmail}
        className={`${linkCls} inline-flex items-center gap-1 text-left`}
      >
        <ArrowLeft className="size-4" />
        กลับ
      </button>
    </form>
  );
}
