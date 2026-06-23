import { BRAND } from "@/src/config/brand";

// Manifest for the "My Cards" app — install once, see every shop's card.
export function GET() {
  const manifest = {
    name: `${BRAND.name} · บัตรของฉัน`,
    short_name: "บัตรของฉัน",
    start_url: "/me",
    scope: "/",
    display: "standalone",
    background_color: "#fff7ed",
    theme_color: "#f97316",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
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
