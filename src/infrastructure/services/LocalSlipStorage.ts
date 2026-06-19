import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  ISlipStorage,
  SaveObjectInput,
  SaveSlipInput,
} from "@/src/application/services/ISlipStorage";
import {
  contentTypeForKey,
  extFor,
  slipKey,
} from "@/src/infrastructure/services/slip-media";

const BASE_DIR = path.join(process.cwd(), "uploads");

/**
 * Resolve a storage key like "slips/<id>.png" to a safe absolute path under
 * BASE_DIR. Each path segment is sanitized to block traversal; returns null for
 * keys that don't match the expected "<dir>/<file>" shape.
 */
function resolveKey(key: string): { dir: string; file: string } | null {
  const parts = key.split("/").map((p) => p.replace(/[^a-zA-Z0-9._-]/g, ""));
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { dir: path.join(BASE_DIR, parts[0]), file: parts[1] };
}

/** Stores uploads on local disk under ./uploads (dev only — Vercel uses R2). */
export class LocalSlipStorage implements ISlipStorage {
  async save(input: SaveSlipInput): Promise<{ url: string }> {
    // Storage key (relative); served via /api/slips/[paymentId].
    return this.saveObject({
      key: slipKey(input.paymentId, extFor(input)),
      contentType: input.contentType,
      bytes: input.bytes,
    });
  }

  async saveObject(input: SaveObjectInput): Promise<{ url: string }> {
    const resolved = resolveKey(input.key);
    if (!resolved) throw new Error("invalid storage key");
    await mkdir(resolved.dir, { recursive: true });
    await writeFile(path.join(resolved.dir, resolved.file), input.bytes);
    return { url: input.key };
  }

  async read(
    url: string,
  ): Promise<{ bytes: Uint8Array; contentType: string } | null> {
    const resolved = resolveKey(url);
    if (!resolved) return null;
    try {
      const buf = await readFile(path.join(resolved.dir, resolved.file));
      return { bytes: new Uint8Array(buf), contentType: contentTypeForKey(url) };
    } catch {
      return null;
    }
  }
}
