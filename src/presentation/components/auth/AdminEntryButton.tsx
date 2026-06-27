"use client";

import Link, { useLinkStatus } from "next/link";
import { LayoutDashboard, LogIn, Loader2 } from "lucide-react";

import { cn } from "@/src/presentation/components/ui/cn";

const ICONS = {
  dashboard: LayoutDashboard,
  login: LogIn,
} as const;

/**
 * Inner label that reacts to navigation status. `useLinkStatus` must be rendered
 * inside the <Link>, so it lives in this child: the moment the link is clicked it
 * flips to pending (spinner + dim) giving instant feedback while the destination
 * (which does a server session check / redirect) loads.
 *
 * The icon always shows; the text label is icon-only on mobile (`hidden sm:inline`)
 * so the long Thai label never overflows the cramped header on small screens.
 */
function Label({
  label,
  icon,
}: {
  label: string;
  icon: keyof typeof ICONS;
}) {
  const { pending } = useLinkStatus();
  const Icon = pending ? Loader2 : ICONS[icon];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 transition-opacity",
        pending && "opacity-80",
      )}
    >
      <Icon aria-hidden className={cn("size-4", pending && "animate-spin")} />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

/** Pill entry button for the home page that shows pending feedback on click. */
export function AdminEntryButton({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="shrink-0 rounded-full bg-brand-500 px-3 py-2 text-sm font-medium text-on-brand shadow-sm transition hover:bg-brand-600 sm:px-4"
    >
      <Label label={label} icon={icon} />
    </Link>
  );
}
