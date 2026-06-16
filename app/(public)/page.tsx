import { Store } from "lucide-react";

import { container } from "@/src/infrastructure/di/container";
import { getSession } from "@/src/infrastructure/auth/session";
import { ROLE_HOME } from "@/src/domain/types/roles";
import { StoreMap } from "@/src/presentation/components/map/StoreMap";
import { AdminEntryButton } from "@/src/presentation/components/auth/AdminEntryButton";
import { Logo } from "@/src/presentation/components/layout/Logo";

// Reads the live set of mapped shops on each request; revalidated when an owner
// updates a branch location (see updateBranchLocationAction).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [locations, user] = await Promise.all([
    container.branchRepository.listMapLocations(),
    getSession(),
  ]);

  // Logged-in operators skip the /login round-trip and go straight to their
  // dashboard; everyone else goes to the login form.
  const entry = user
    ? { href: ROLE_HOME[user.role], label: "ไปที่แดชบอร์ด" }
    : { href: "/login", label: "เข้าสู่ระบบผู้ดูแล" };

  return (
    // Fill the viewport minus the bottom tab bar (h-16) so the map sits above it.
    <main className="flex min-h-[calc(100dvh-4rem)] flex-col">
      <header className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Logo className="size-10 shrink-0 rounded-xl sm:size-12" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              Easy Stamp
            </h1>
            <p className="truncate text-xs text-muted sm:text-sm">
              ระบบบัตรสะสมแสตมป์สำหรับร้านค้าหลายสาขา
            </p>
          </div>
        </div>
        <AdminEntryButton href={entry.href} label={entry.label} />
      </header>

      <section className="relative flex-1">
        <div className="absolute inset-0">
          <StoreMap locations={locations} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
          <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-card/90 px-4 py-1.5 text-sm font-medium text-foreground shadow-sm backdrop-blur">
            <Store size={16} className="text-brand-600" />
            ร้านค้าที่ร่วมรายการ {locations.length} แห่ง
          </span>
        </div>
      </section>
    </main>
  );
}
