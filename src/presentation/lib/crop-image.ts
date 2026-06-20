/**
 * Client-side image cropping + downscaling for uploads.
 *
 * The browser draws the user's chosen crop region onto a canvas, then
 * `browser-image-compression` re-encodes it to a ≤1MB JPEG capped at
 * 2000px. This keeps phone photos (10–50MB) well under the server-action
 * body limit so uploads don't silently fail on mobile.
 */

/** Crop rectangle in source-image pixels (the shape react-easy-crop returns). */
export type CropPixels = { x: number; y: number; width: number; height: number };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    // Fires for formats the canvas can't decode (e.g. raw HEIC on most browsers).
    img.onerror = () =>
      reject(new Error("เปิดรูปไม่ได้ — รองรับเฉพาะ JPG / PNG / WebP"));
    img.src = src;
  });
}

/**
 * Crop `imageSrc` (an object URL) to `crop`, then compress to a JPEG File.
 * Returns a fresh `<base>.jpg` File ready to drop into a form input.
 */
export async function getCroppedImageFile(
  imageSrc: string,
  crop: CropPixels,
  baseName: string,
): Promise<File> {
  const image = await loadImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(crop.width);
  canvas.height = Math.round(crop.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("ประมวลผลรูปไม่ได้ในเบราว์เซอร์นี้");

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) throw new Error("สร้างรูปไม่สำเร็จ");

  // Shrink to a sane upload size (mirrors the slip-upload settings).
  const { default: imageCompression } = await import("browser-image-compression");
  const compressed = await imageCompression(
    new File([blob], "crop.jpg", { type: "image/jpeg" }),
    { maxWidthOrHeight: 2000, maxSizeMB: 1, useWebWorker: true, fileType: "image/jpeg" },
  );

  const safeBase = baseName.replace(/\.[^.]+$/, "").trim() || "image";
  return new File([compressed], `${safeBase}.jpg`, { type: "image/jpeg" });
}
