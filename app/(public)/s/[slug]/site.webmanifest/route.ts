import { container } from "@/src/infrastructure/di/container";

// Per-shop web app manifest so an installed icon opens THIS shop's card.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const shop = await container.shopRepository.findBySlug(slug);
  if (!shop) return new Response("Not found", { status: 404 });

  const manifest = {
    name: `${shop.name} · บัตรสะสมแสตมป์`,
    short_name: shop.name.slice(0, 20),
    start_url: `/s/${slug}`,
    scope: `/s/${slug}`,
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
