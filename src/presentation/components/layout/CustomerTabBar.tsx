"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Wallet, Info, type LucideIcon } from "lucide-react";

import { cn } from "@/src/presentation/components/ui/cn";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Returns true when this tab should appear active for the given pathname. */
  active: (pathname: string) => boolean;
}

const TABS: Tab[] = [
  { href: "/", label: "แผนที่", icon: Map, active: (p) => p === "/" },
  {
    href: "/me",
    label: "บัตรของฉัน",
    icon: Wallet,
    active: (p) => p === "/me" || p.startsWith("/me/"),
  },
  {
    href: "/info",
    label: "เกี่ยวกับ",
    icon: Info,
    active: (p) => p.startsWith("/info"),
  },
];

/** Bottom navigation for customer-facing public pages. */
export function CustomerTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur print:hidden">
      <ul className="mx-auto flex max-w-md items-stretch pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.active(pathname);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition",
                  isActive
                    ? "text-brand-600"
                    : "text-muted hover:text-foreground",
                )}
              >
                <Icon className="size-5" />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
