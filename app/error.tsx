"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Frown } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error to logs/monitoring; the UI stays friendly.
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <Frown className="size-14 text-brand-400" />
      <div>
        <h1 className="text-2xl font-bold text-brand-700">เกิดข้อผิดพลาด</h1>
        <p className="mt-2 text-sm text-muted">
          ระบบมีปัญหาชั่วคราว ลองใหม่อีกครั้ง หรือกลับไปหน้าแรก
        </p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-brand-500 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-brand-600"
        >
          ลองอีกครั้ง
        </button>
        <Link
          href="/"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          กลับหน้าแรก
        </Link>
      </div>
    </main>
  );
}
