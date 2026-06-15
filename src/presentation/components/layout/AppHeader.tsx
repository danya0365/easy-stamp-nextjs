import Link from "next/link";
import { Bell } from "lucide-react";

import { logoutAction } from "@/src/presentation/actions/auth-actions";
import { ThemeSwitcher } from "@/src/presentation/components/theme-switcher";

interface AppHeaderProps {
  brand: string;
  userEmail: string;
  /** Bell link + unread badge; omit to hide the bell (e.g. staff). */
  notifications?: { href: string; unread: number };
}

/**
 * Slim top bar: brand + notifications bell + theme switcher + account controls.
 * Navigation itself lives in the bottom tab bar (see AppTabBar) on every size.
 */
export function AppHeader({ brand, userEmail, notifications }: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-card print:hidden">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <span className="font-bold text-brand-700">{brand}</span>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {notifications && (
            <Link
              href={notifications.href}
              aria-label={`การแจ้งเตือน${notifications.unread > 0 ? ` (${notifications.unread} ใหม่)` : ""}`}
              className="relative inline-flex size-9 items-center justify-center rounded-lg text-foreground transition hover:bg-muted-surface"
            >
              <Bell className="size-5" />
              {notifications.unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold leading-4 text-white">
                  {notifications.unread > 9 ? "9+" : notifications.unread}
                </span>
              )}
            </Link>
          )}
          <ThemeSwitcher />
          <span className="hidden text-muted sm:inline">{userEmail}</span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-border px-3 py-1.5 text-foreground transition hover:bg-muted-surface"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
