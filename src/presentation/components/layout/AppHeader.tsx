import { logoutAction } from "@/src/presentation/actions/auth-actions";
import { ThemeSwitcher } from "@/src/presentation/components/theme-switcher";

interface AppHeaderProps {
  brand: string;
  userEmail: string;
}

/**
 * Slim top bar: brand + theme switcher + account controls. Navigation itself
 * lives in the bottom tab bar (see AppTabBar) on every screen size.
 */
export function AppHeader({ brand, userEmail }: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-card print:hidden">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <span className="font-bold text-brand-700">{brand}</span>
        <div className="ml-auto flex items-center gap-3 text-sm">
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
