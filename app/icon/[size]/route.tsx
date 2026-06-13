import { renderAppIcon } from "@/src/presentation/lib/app-icon";

// PNG app icons for the web manifest, e.g. /icon/192 and /icon/512.
const ALLOWED = new Set([192, 512]);

export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;
  const n = Number(size);
  if (!ALLOWED.has(n)) return new Response("Not found", { status: 404 });
  return renderAppIcon(n);
}
