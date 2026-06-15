"use client";

import { useEffect, useState, useTransition } from "react";

import {
  loginAction,
  requestLoginOtpAction,
  verifyLoginOtpAction,
} from "@/src/presentation/actions/auth-actions";

const inputCls =
  "rounded-lg border border-border px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";
const btnCls =
  "mt-2 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60";
const linkCls = "text-sm text-brand-700 hover:underline";

type Step = "email" | "otp" | "password";

export function LoginForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [resendIn, setResendIn] = useState(0);

  // Resend cooldown countdown.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  function requestOtp(isResend: boolean) {
    setError(null);
    const fd = new FormData();
    fd.set("email", email);
    startTransition(async () => {
      const res = await requestLoginOtpAction({}, fd);
      if (res.next === "otp") {
        setStep("otp");
        setResendIn(60);
        if (res.error) setError(res.error);
      } else if (res.next === "password") {
        setStep("password");
      } else if (res.error) {
        setError(res.error);
      }
      void isResend;
    });
  }

  function onSubmitEmail(e: React.FormEvent) {
    e.preventDefault();
    requestOtp(false);
  }

  function onSubmitOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      // On success the action redirects (throws); we only get here on error.
      const res = await verifyLoginOtpAction({}, fd);
      if (res?.error) setError(res.error);
    });
  }

  function onSubmitPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await loginAction({}, fd);
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </div>
        {errorBox}
        <button type="submit" disabled={pending} className={btnCls}>
          {pending ? "กำลังดำเนินการ…" : "ดำเนินการต่อ"}
        </button>
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
            onClick={() => requestOtp(true)}
            disabled={pending || resendIn > 0}
            className={`${linkCls} disabled:text-muted disabled:no-underline`}
          >
            {resendIn > 0 ? `ขอรหัสใหม่ได้ใน ${resendIn} วินาที` : "ขอรหัสใหม่"}
          </button>
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
        </div>
        <button type="button" onClick={backToEmail} className={`${linkCls} text-left`}>
          ← เปลี่ยนอีเมล
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
      <button type="button" onClick={backToEmail} className={`${linkCls} text-left`}>
        ← กลับ
      </button>
    </form>
  );
}
