import { BRAND } from "@/src/config/brand";

// Manifest for the "My Cards" app — install once, see every shop's card.
export function GET() {
  const manifest = {
    name: `${BRAND.name} · บัตรของฉัน`,
    short_name: "บัตรของฉัน",
    start_url: "/me",
    scope: "/",
    display: "standalone",
    background_color: BRAND.pwa.backgroundColor,
    theme_color: BRAND.pwa.themeColor,
    icons: [
      {
        src: BRAND.assets.icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: BRAND.assets.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
  return Response.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
