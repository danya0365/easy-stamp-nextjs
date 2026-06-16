"use client";

import { useState, type ReactNode } from "react";
import { ShieldCheck, Stamp } from "lucide-react";

// Icons are referenced by string key because functions (component refs) can't
// be passed from a server component into this client component as props.
const ICONS = { stamp: Stamp, shield: ShieldCheck };
export type SettingsTabIcon = keyof typeof ICONS;

type Tab = {
  id: string;
  label: string;
  icon?: SettingsTabIcon;
  content: ReactNode;
};

/**
 * Tabbed settings layout. On desktop (lg+) the tab nav sits in a left sidebar
 * next to the content so the page fills the width; on mobile it's a horizontal
 * scrollable strip above the content. `footer` (if given) always renders below,
 * regardless of the active tab.
 */
export function SettingsTabs({
  tabs,
  footer,
}: {
  tabs: Tab[];
  footer?: ReactNode;
}) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-6">
        <nav
          className="mb-4 flex gap-1 overflow-x-auto pb-1 lg:mb-0 lg:flex-col lg:overflow-visible lg:pb-0"
          aria-label="หมวดการตั้งค่า"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon ? ICONS[tab.icon] : null;
            const isActive = tab.id === current?.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                aria-current={isActive}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition lg:w-full ${
                  isActive
                    ? "bg-brand-600 text-on-brand"
                    : "text-muted hover:bg-muted-surface hover:text-foreground"
                }`}
              >
                {Icon && <Icon className="size-4 shrink-0" />}
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="flex min-w-0 flex-col gap-4">{current?.content}</div>
      </div>

      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}
