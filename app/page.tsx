import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Easy Stamp</h1>
        <p className="mt-2 text-muted">
          ระบบบัตรสะสมแสตมป์สำหรับร้านค้าหลายสาขา
        </p>
      </div>
      <Link
        href="/login"
        className="rounded-full bg-brand-500 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-brand-600"
      >
        เข้าสู่ระบบผู้ดูแล
      </Link>
      <Link
        href="/info"
        className="text-sm font-medium text-brand-700 hover:underline"
      >
        เกี่ยวกับระบบ · ดูว่าทำอะไรได้บ้าง →
      </Link>
    </main>
  );
}
