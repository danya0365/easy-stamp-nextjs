import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai, Noto_Serif_Thai } from "next/font/google";
import "@/public/styles/index.css";

import {
  ThemeProvider,
  ThemeScript,
} from "@/src/presentation/providers/theme-provider";
import { ToastProvider } from "@/src/presentation/components/ui/Toast";
import { ConfirmProvider } from "@/src/presentation/components/ui/ConfirmDialog";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  display: "swap",
});

// Serif Thai display face — used for headings in the "retro" theme (magazine
// vibe). Loaded once globally; other themes keep Noto Sans Thai for headings.
const notoSerifThai = Noto_Serif_Thai({
  variable: "--font-noto-serif-thai",
  subsets: ["thai", "latin"],
  display: "swap",
});

// Base URL used to turn the file-based opengraph-image/twitter-image into
// absolute URLs (crawlers like Facebook/LINE require absolute image URLs).
// Set APP_URL to the deployed domain in production.
const siteUrl = process.env.APP_URL ?? "http://localhost:3000";

const title = "Easy Stamp — ระบบบัตรสะสมแสตมป์";
const description =
  "บัตรสะสมแสตมป์ดิจิทัลสำหรับร้านค้าหลายสาขา ลูกค้าสะสมแต้มผ่านการสแกน QR ไม่ต้องพกบัตร ร้านจัดการง่ายในที่เดียว";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Easy Stamp",
  },
  // og:image / twitter:image are added automatically from app/opengraph-image.png
  // and app/twitter-image.png (file-based metadata).
  openGraph: {
    type: "website",
    siteName: "Easy Stamp",
    locale: "th_TH",
    url: siteUrl,
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      data-theme="cafe"
      className={`${notoSansThai.variable} ${notoSerifThai.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider>
          <ToastProvider>
            <ConfirmProvider>{children}</ConfirmProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
