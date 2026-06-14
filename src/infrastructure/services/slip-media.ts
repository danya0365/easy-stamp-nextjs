import type { SaveSlipInput } from "@/src/application/services/ISlipStorage";

/** Slip image content-type ↔ file-extension maps, shared by all slip stores. */
export const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/heic": "heic",
};

export const TYPE_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  heic: "image/heic",
};

/** Pick a file extension from the content-type, falling back to the filename. */
export function extFor(input: SaveSlipInput): string {
  const fromType = EXT_BY_TYPE[input.contentType];
  if (fromType) return fromType;
  const fromName = input.filename.split(".").pop()?.toLowerCase();
  return fromName && TYPE_BY_EXT[fromName] ? fromName : "bin";
}

/** Storage key for a slip (also the value stored in payments.slipUrl). */
export function slipKey(paymentId: string, ext: string): string {
  return `slips/${paymentId}.${ext}`;
}

/** content-type from a stored key/url like "slips/<id>.png". */
export function contentTypeForKey(url: string): string {
  const ext = url.split(".").pop()?.toLowerCase() ?? "";
  return TYPE_BY_EXT[ext] ?? "application/octet-stream";
}
