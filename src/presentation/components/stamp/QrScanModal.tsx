"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("stamp");

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
        if (!cancelled) setError(t("cameraError"));
      }
    })();

    return () => {
      cancelled = true;
      scanner?.stop();
      scanner?.destroy();
    };
  }, [open, onResult, t]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("scanModalTitle")}
      footer={
        <Button variant="ghost" onClick={onClose}>
          {t("close")}
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
          <p className="text-center text-xs text-muted">{t("scanAim")}</p>
        </div>
      )}
    </Modal>
  );
}
