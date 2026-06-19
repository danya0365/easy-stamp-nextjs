import { container } from "@/src/infrastructure/di/container";

export const runtime = "nodejs";

// Serves a shop's profile/gallery image. PUBLIC (shop imagery is meant to be
// seen by anyone browsing the shop page). The URL's imageId changes whenever the
// image is replaced, so it's safe to cache aggressively.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ imageId: string }> },
) {
  const { imageId } = await params;
  const image = await container.shopImageRepository.findById(imageId);
  if (!image) return new Response("Not found", { status: 404 });

  const file = await container.slipStorage.read(image.storageKey);
  if (!file) return new Response("Not found", { status: 404 });

  return new Response(Buffer.from(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
