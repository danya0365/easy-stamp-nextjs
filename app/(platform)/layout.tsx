import { requireRole } from "@/src/infrastructure/auth/session";
import { AppHeader } from "@/src/presentation/components/layout/AppHeader";
import { AppTabBar } from "@/src/presentation/components/layout/AppTabBar";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("platform_admin");
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader brand="Easy Stamp · Admin" userEmail={user.email} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+5rem)]">
        {children}
      </main>
      <AppTabBar nav="admin" />
    </div>
  );
}
