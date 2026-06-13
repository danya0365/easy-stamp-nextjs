import { renderAppIcon } from "@/src/presentation/lib/app-icon";

// iOS home-screen icon (auto-linked by Next as apple-touch-icon).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderAppIcon(180);
}
