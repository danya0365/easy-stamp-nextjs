import Link from "next/link";

import { logoutAction } from "@/src/presentation/actions/auth-actions";
import { ThemeSwitcher } from "@/src/presentation/components/theme-switcher";

export interface NavLink {
  href: string;
  label: string;
}

interface AppHeaderProps {
  brand: string;
  links: NavLink[];
  userEmail: string;
}

export function AppHeader({ brand, links, userEmail }: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-card print:hidden">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <span className="font-bold text-brand-700">{brand}</span>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted transition hover:text-brand-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>
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
