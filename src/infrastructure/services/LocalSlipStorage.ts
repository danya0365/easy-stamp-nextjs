import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  ISlipStorage,
  SaveSlipInput,
} from "@/src/application/services/ISlipStorage";

const BASE_DIR = path.join(process.cwd(), "uploads", "slips");

const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/heic": "heic",
};
const TYPE_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  heic: "image/heic",
};

function extFor(input: SaveSlipInput): string {
  const fromType = EXT_BY_TYPE[input.contentType];
  if (fromType) return fromType;
  const fromName = input.filename.split(".").pop()?.toLowerCase();
  return fromName && TYPE_BY_EXT[fromName] ? fromName : "bin";
}

/** Stores slips on local disk under ./uploads/slips (outside public/). */
export class LocalSlipStorage implements ISlipStorage {
  async save(input: SaveSlipInput): Promise<{ url: string }> {
    await mkdir(BASE_DIR, { recursive: true });
    const ext = extFor(input);
    const filename = `${input.paymentId}.${ext}`;
    await writeFile(path.join(BASE_DIR, filename), input.bytes);
    // Storage key (relative); served via /api/slips/[paymentId].
    return { url: `slips/${filename}` };
  }

  async read(
    url: string,
  ): Promise<{ bytes: Uint8Array; contentType: string } | null> {
    // url is "slips/<file>"; guard against path traversal.
    const safe = url.replace(/^slips\//, "").replace(/[^a-zA-Z0-9._-]/g, "");
    try {
      const buf = await readFile(path.join(BASE_DIR, safe));
      const ext = safe.split(".").pop()?.toLowerCase() ?? "";
      return {
        bytes: new Uint8Array(buf),
        contentType: TYPE_BY_EXT[ext] ?? "application/octet-stream",
      };
    } catch {
      return null;
    }
  }
}
