import Link from "next/link";
import { Store } from "lucide-react";

import { container } from "@/src/infrastructure/di/container";
import { StoreMap } from "@/src/presentation/components/map/StoreMap";

// Reads the live set of mapped shops on each request; revalidated when an owner
// updates a branch location (see updateBranchLocationAction).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locations = await container.branchRepository.listMapLocations();

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Easy Stamp
          </h1>
          <p className="text-xs text-muted sm:text-sm">
            ระบบบัตรสะสมแสตมป์สำหรับร้านค้าหลายสาขา
          </p>
        </div>
        <Link
          href="/login"
          className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600"
        >
          เข้าสู่ระบบผู้ดูแล
        </Link>
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

      <footer className="flex items-center justify-center px-4 py-3 text-center">
        <Link
          href="/info"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          เกี่ยวกับระบบ · ดูว่าทำอะไรได้บ้าง →
        </Link>
      </footer>
    </main>
  );
}
