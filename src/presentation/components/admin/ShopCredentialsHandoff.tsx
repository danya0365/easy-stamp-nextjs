"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { Copy, Check, Download, Printer, KeyRound } from "lucide-react";

import { Button } from "@/src/presentation/components/ui/Button";
import { useToast } from "@/src/presentation/components/ui/Toast";
import { exportPosterPng } from "@/src/presentation/lib/poster-export";
import type { ShopHandoff } from "@/src/presentation/lib/shop-handoff";

type CopyKey = "email" | "password" | "all";

/**
 * Owner login URL + QR, email, and password — formatted so the admin can copy,
 * download as an image, or print and hand it over.
 *
 * Two modes:
 *  - default: right after a shop is created, with the plaintext password (shown
 *    once, not stored).
 *  - `passwordPlaceholder`: for an EXISTING shop, where the password can't be
 *    shown (only a hash is stored). The password becomes a blank line to write
 *    by hand, and the copy-password / copy-all buttons are hidden.
 */
export function ShopCredentialsHandoff({
  handoff,
  passwordPlaceholder = false,
}: {
  handoff: ShopHandoff;
  passwordPlaceholder?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<CopyKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const allText = [
    `ร้าน: ${handoff.shopName}`,
    `เข้าสู่ระบบ: ${handoff.loginUrl}`,
    `อีเมล: ${handoff.ownerEmail}`,
    `รหัสผ่าน: ${handoff.ownerPassword}`,
  ].join("\n");

  async function copy(key: CopyKey, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success("คัดลอกแล้ว");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("คัดลอกไม่สำเร็จ — กรุณาคัดลอกด้วยตนเอง");
      toast.error("คัดลอกไม่สำเร็จ");
    }
  }

  async function download() {
    if (!cardRef.current) return;
    setBusy(true);
    setError(null);
    try {
      await exportPosterPng(cardRef.current, `${handoff.slug}-login`, {
        pixelRatio: 2,
      });
    } catch {
      setError("สร้างรูปไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Printable / exportable card. The captured node has a FIXED width and no
          auto-margins — html-to-image mis-handles mx-auto and would offset the
          snapshot — so centering lives on this outer wrapper instead. */}
      <div className="mx-auto w-85">
      <div
        ref={cardRef}
        className="flex w-85 flex-col items-center gap-4 rounded-2xl bg-card p-6 text-center ring-1 ring-border"
      >
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600">
          <KeyRound className="size-4" />
          ข้อมูลเข้าใช้งานร้าน
        </p>
        <h2 className="text-xl font-bold text-foreground">{handoff.shopName}</h2>

        <img
          src={handoff.loginQrDataUrl}
          alt="QR เข้าสู่ระบบ"
          width={200}
          height={200}
          className="h-44 w-44 object-contain"
        />
        <p className="text-xs text-muted">
          สแกนเพื่อเปิดหน้าเข้าสู่ระบบ
          <br />
          <span className="break-all">{handoff.loginUrl}</span>
        </p>

        <dl className="w-full overflow-hidden rounded-xl bg-muted-surface text-left">
          <div className="flex flex-col gap-0.5 border-b border-border px-4 py-3">
            <dt className="text-xs font-medium text-muted">อีเมล</dt>
            <dd className="break-all font-mono text-sm text-foreground">
              {handoff.ownerEmail}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 px-4 py-3">
            <dt className="text-xs font-medium text-muted">รหัสผ่าน</dt>
            {passwordPlaceholder ? (
              <dd className="mt-1 h-6 border-b border-dashed border-muted" />
            ) : (
              <dd className="break-all font-mono text-sm text-foreground">
                {handoff.ownerPassword}
              </dd>
            )}
          </div>
        </dl>

        <p className="text-xs text-muted">
          {passwordPlaceholder ? (
            "รหัสผ่านไม่ได้ถูกเก็บไว้ — เขียนรหัสที่ตั้งให้ลูกค้าในช่องด้านบน หรือกด “รีเซ็ตรหัส” เพื่อตั้งรหัสใหม่"
          ) : (
            <>
              <strong className="text-foreground">บันทึกข้อมูลนี้ไว้</strong> —
              แสดงครั้งเดียว เปลี่ยนรหัสภายหลังได้ในแอป (ถ้าหาย แอดมินรีเซ็ตรหัสที่หน้าร้านค้า)
            </>
          )}
        </p>
      </div>
      </div>

      {/* Actions (excluded from print + the exported image) */}
      <div className="flex flex-wrap justify-center gap-2 print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => copy("email", handoff.ownerEmail)}
        >
          {copied === "email" ? <Check className="size-4" /> : <Copy className="size-4" />}
          อีเมล
        </Button>
        {!passwordPlaceholder && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copy("password", handoff.ownerPassword)}
            >
              {copied === "password" ? <Check className="size-4" /> : <Copy className="size-4" />}
              รหัสผ่าน
            </Button>
            <Button variant="outline" size="sm" onClick={() => copy("all", allText)}>
              {copied === "all" ? <Check className="size-4" /> : <Copy className="size-4" />}
              คัดลอกทั้งหมด
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" disabled={busy} onClick={download}>
          <Download className="size-4" />
          {busy ? "กำลังสร้าง…" : "ดาวน์โหลด PNG"}
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-4" />
          พิมพ์
        </Button>
      </div>

      {error && <p className="text-center text-sm text-error">{error}</p>}
    </div>
  );
}
