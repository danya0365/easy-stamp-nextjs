"use client";

/* eslint-disable @next/next/no-img-element */
import { ScanLine, Stamp, Download, Printer } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/src/presentation/components/ui/Button";

/** Printable / downloadable shop poster: customers scan to reach /s/<slug>. */
export function ShopQrPoster({
  shopName,
  url,
  qrImageUrl,
}: {
  shopName: string;
  url: string;
  qrImageUrl: string;
}) {
  const t = useTranslations("shop");
  function download() {
    const a = document.createElement("a");
    a.href = qrImageUrl;
    a.download = `qr-${shopName}.png`;
    a.click();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Poster (the printed area) */}
      <div
        id="shop-qr-poster"
        className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-white p-8 text-center ring-1 ring-brand-100"
      >
        <p className="text-sm font-medium text-brand-600">{t("qrTagline")}</p>
        <h2 className="text-2xl font-bold text-foreground">{shopName}</h2>
        <p className="inline-flex items-center gap-1.5 text-lg font-semibold text-brand-700">
          <Stamp className="size-5" />
          {t("qrSubtext")}
        </p>
        <img
          src={qrImageUrl}
          alt={t("qrAlt", { name: shopName })}
          width={256}
          height={256}
          className="h-64 w-64 object-contain"
        />
        <p className="inline-flex items-center gap-1.5 text-sm text-muted">
          <ScanLine className="size-4" />
          {t("qrScanHint")}
        </p>
        <p className="text-xs break-all text-muted">{url}</p>
      </div>

      <div className="flex justify-center gap-2 print:hidden">
        <Button variant="outline" onClick={download}>
          <Download className="size-4" />
          {t("qrDownloadPng")}
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="size-4" />
          {t("qrPrint")}
        </Button>
      </div>
    </div>
  );
}
