"use client";

/* eslint-disable @next/next/no-img-element */
import { ScanLine } from "lucide-react";

import type { TemplateCopy } from "@/src/domain/services/promo-poster";
import type { PromoSeedData } from "./types";

/**
 * The loyalty call-to-action panel that sits on EVERY exported poster (template
 * path A and upload path B alike): shop name, promo copy, the scan-to-join QR,
 * and the public URL. This is what turns a pretty image into customers in the
 * stamp loop. Sized in px scaled from a 1080-wide design so it stays crisp at
 * any poster size.
 */
export function PosterCtaLayer({
  copy,
  seed,
  scale,
}: {
  copy: TemplateCopy;
  seed: PromoSeedData;
  scale: number;
}) {
  const px = (n: number) => `${Math.round(n * scale)}px`;

  return (
    <div
      className="bg-card text-foreground"
      style={{
        borderRadius: px(40),
        padding: px(48),
        boxShadow: `0 ${px(12)} ${px(48)} rgba(0,0,0,0.25)`,
        display: "flex",
        flexDirection: "column",
        gap: px(20),
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <p
        className="font-semibold text-brand-600"
        style={{ fontSize: px(30), lineHeight: 1.2 }}
      >
        สะสมแสตมป์ · {seed.shopName}
      </p>
      <h2
        className="font-bold text-foreground"
        style={{ fontSize: px(48), lineHeight: 1.15 }}
      >
        {copy.headline}
      </h2>
      <p className="text-muted" style={{ fontSize: px(30), lineHeight: 1.3 }}>
        {copy.subcopy}
      </p>
      <img
        src={seed.qrDataUrl}
        alt="QR สมัครสมาชิก"
        style={{
          width: px(280),
          height: px(280),
          objectFit: "contain",
          borderRadius: px(16),
        }}
      />
      <p
        className="inline-flex items-center font-semibold text-brand-700"
        style={{ fontSize: px(30), gap: px(8), lineHeight: 1.2 }}
      >
        <ScanLine style={{ width: px(32), height: px(32) }} />
        {copy.ctaText}
      </p>
      <p
        className="break-all text-muted"
        style={{ fontSize: px(20), lineHeight: 1.2 }}
      >
        {seed.publicUrl}
      </p>
    </div>
  );
}
