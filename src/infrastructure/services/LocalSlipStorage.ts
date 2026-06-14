import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  ISlipStorage,
  SaveSlipInput,
} from "@/src/application/services/ISlipStorage";
import {
  contentTypeForKey,
  extFor,
  slipKey,
} from "@/src/infrastructure/services/slip-media";

const BASE_DIR = path.join(process.cwd(), "uploads", "slips");

/** Stores slips on local disk under ./uploads/slips (dev only — Vercel uses R2). */
export class LocalSlipStorage implements ISlipStorage {
  async save(input: SaveSlipInput): Promise<{ url: string }> {
    await mkdir(BASE_DIR, { recursive: true });
    const url = slipKey(input.paymentId, extFor(input));
    const filename = url.replace(/^slips\//, "");
    await writeFile(path.join(BASE_DIR, filename), input.bytes);
    // Storage key (relative); served via /api/slips/[paymentId].
    return { url };
  }

  async read(
    url: string,
  ): Promise<{ bytes: Uint8Array; contentType: string } | null> {
    // url is "slips/<file>"; guard against path traversal.
    const safe = url.replace(/^slips\//, "").replace(/[^a-zA-Z0-9._-]/g, "");
    try {
      const buf = await readFile(path.join(BASE_DIR, safe));
      return { bytes: new Uint8Array(buf), contentType: contentTypeForKey(url) };
    } catch {
      return null;
    }
  }
}
