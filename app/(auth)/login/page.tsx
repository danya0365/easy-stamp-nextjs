import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession, getKnownAccounts } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { isDevLoginEnabled } from "@/src/infrastructure/config/env";
import { ROLE_HOME } from "@/src/domain/types/roles";
import { LoginForm } from "@/src/presentation/components/auth/LoginForm";
import { DevLoginPanel } from "@/src/presentation/components/auth/DevLoginPanel";
import { PublicContactButton } from "@/src/presentation/components/auth/PublicContactButton";
import { AppVersion } from "@/src/presentation/components/layout/AppVersion";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ | Easy Stamp",
  // Auth page — keep it out of search indexes.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSession();
  if (user) redirect(ROLE_HOME[user.role]);

  // Accounts previously used on this device — offered as one-tap picks.
  const knownAccounts = await getKnownAccounts();

  // DEV ONLY — fetch the user list for the quick-login switcher (local only).
  const devUsers = isDevLoginEnabled
    ? (await container.userRepository.list()).map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
      }))
    : [];

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-sm ring-1 ring-border">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Easy Stamp</h1>
          <p className="mt-1 text-sm text-muted">เข้าสู่ระบบผู้ดูแล</p>
        </div>
        <LoginForm knownAccounts={knownAccounts} />

        {isDevLoginEnabled && <DevLoginPanel users={devUsers} />}

        {/* Placeholder for future social login (Google / LINE) — not wired yet. */}
        <div className="mt-6">
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" />
            หรือ
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {(["Google", "LINE"] as const).map((provider) => (
              <button
                key={provider}
                type="button"
                disabled
                title="เร็วๆ นี้"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted opacity-60"
              >
                เข้าสู่ระบบด้วย {provider}
                <span className="rounded-full bg-muted-surface px-1.5 py-0.5 text-[10px]">
                  เร็วๆ นี้
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-4 text-center">
          <PublicContactButton label="มีปัญหาในการเข้าสู่ระบบ? ติดต่อผู้ดูแล" />
        </div>
      </div>
      <AppVersion />
    </main>
  );
}
