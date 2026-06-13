"use client";

import { useEffect, useRef, useState } from "react";

import { Modal } from "@/src/presentation/components/ui/Modal";
import { Button } from "@/src/presentation/components/ui/Button";

interface QrScanModalProps {
  open: boolean;
  onClose: () => void;
  onResult: (text: string) => void;
}

export function QrScanModal({ open, onClose, onResult }: QrScanModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let handled = false;
    // qr-scanner type (loaded dynamically to keep it client-only).
    let scanner: { stop: () => void; destroy: () => void } | null = null;

    (async () => {
      try {
        const QrScanner = (await import("qr-scanner")).default;
        if (cancelled || !videoRef.current) return;
        setError(null);
        scanner = new QrScanner(
          videoRef.current,
          (result: { data: string }) => {
            if (handled || !result.data) return;
            handled = true;
            onResult(result.data);
          },
          { preferredCamera: "environment", maxScansPerSecond: 5, highlightScanRegion: true },
        );
        await (scanner as unknown as { start: () => Promise<void> }).start();
      } catch {
        if (!cancelled) setError("ไม่สามารถเปิดกล้องได้ — ตรวจสอบสิทธิ์กล้องและใช้งานผ่าน HTTPS");
      }
    })();

    return () => {
      cancelled = true;
      scanner?.stop();
      scanner?.destroy();
    };
  }, [open, onResult]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="สแกน QR ลูกค้า"
      footer={
        <Button variant="ghost" onClick={onClose}>
          ปิด
        </Button>
      }
    >
      {error ? (
        <p className="text-sm text-error">{error}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <video
            ref={videoRef}
            className="aspect-square w-full rounded-xl bg-black object-cover"
            muted
            playsInline
          />
          <p className="text-center text-xs text-muted">
            เล็ง QR บนมือถือลูกค้าให้อยู่ในกรอบ
          </p>
        </div>
      )}
    </Modal>
  );
}
