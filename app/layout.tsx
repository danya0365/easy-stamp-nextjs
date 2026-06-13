import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "@/public/styles/index.css";

import {
  ThemeProvider,
  ThemeScript,
} from "@/src/presentation/providers/theme-provider";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Easy Stamp — ระบบบัตรสะสมแสตมป์",
  description: "ระบบสะสมแสตมป์สำหรับร้านค้าหลายสาขา",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Easy Stamp",
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
      className={`${notoSansThai.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
