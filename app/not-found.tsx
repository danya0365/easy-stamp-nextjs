import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <span className="text-5xl">🔍</span>
      <div>
        <h1 className="text-2xl font-bold text-brand-700">ไม่พบหน้านี้</h1>
        <p className="mt-2 text-sm text-muted">
          หน้าที่คุณกำลังหาอาจถูกย้าย ลบไปแล้ว หรือไม่เคยมีอยู่
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-brand-500 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-brand-600"
      >
        กลับหน้าแรก
      </Link>
    </main>
  );
}
