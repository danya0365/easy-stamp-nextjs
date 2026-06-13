import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/src/infrastructure/auth/session";
import { ROLE_HOME } from "@/src/domain/types/roles";
import { LoginForm } from "@/src/presentation/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ | Easy Stamp",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSession();
  if (user) redirect(ROLE_HOME[user.role]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-sm ring-1 ring-border">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Easy Stamp</h1>
          <p className="mt-1 text-sm text-muted">เข้าสู่ระบบผู้ดูแล</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
