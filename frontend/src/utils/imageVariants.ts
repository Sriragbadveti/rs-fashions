/**
 * Smaller copies of every product photo, stored next to the full-size original:
 *   uploads/<name>.jpg        original (zoom / detail view)
 *   uploads/sm/<name>.jpg     cards, lists, cart thumbnails
 *   uploads/md/<name>.jpg     main product image, hero-sized tiles
 *
 * Shoppers should only download the original when they zoom. Photos uploaded before variants
 * existed have no smaller copy, so every helper here falls back to the original URL.
 * Keep in sync with backend/src/utils/imageVariants.js (same folders, same sizes).
 */
export type ImageVariantSize = "sm" | "md";

export const IMAGE_VARIANTS: Record<ImageVariantSize, { edge: number; quality: number }> = {
  sm: { edge: 640, quality: 0.78 },
  md: { edge: 1200, quality: 0.82 },
};

// Matches .../storage/v1/object/public/sarees/uploads/<file> (top-level uploads only).
const PUBLIC_UPLOAD_RE = /^(https?:\/\/[^?#]+\/storage\/v1\/object\/public\/sarees\/uploads\/)([A-Za-z0-9._%-]+)$/;

/** URL of the smaller copy of a stored product photo; any other URL is returned unchanged. */
export function getImageVariantUrl<T extends string | null | undefined>(url: T, size: ImageVariantSize): T | string {
  if (!url) return url;
  const match = PUBLIC_UPLOAD_RE.exec(url);
  if (!match) return url;
  const stem = match[2].replace(/\.[^.]*$/, "") || match[2];
  return `${match[1]}${size}/${stem}.jpg`;
}

/**
 * onError handler: if a smaller copy does not exist (older photo), swap in the original once.
 * Returns true when it swapped the source, so callers can skip their own error handling.
 */
export function fallbackToOriginalImage(
  event: { currentTarget: HTMLImageElement },
  originalUrl: string | null | undefined
): boolean {
  const img = event.currentTarget;
  if (!img || !originalUrl || img.dataset.variantFallback === "true") return false;
  img.dataset.variantFallback = "true";
  if (img.getAttribute("src") === originalUrl) return false;
  img.src = originalUrl;
  return true;
}

/**
 * Spread onto an <img> showing a product photo: `<img {...variantImgProps(url, "sm")} alt=... />`.
 * Uses the small copy and falls back to the original if it is missing.
 */
export function variantImgProps(url: string | null | undefined, size: ImageVariantSize) {
  return {
    src: (getImageVariantUrl(url, size) || undefined) as string | undefined,
    onError: (e: { currentTarget: HTMLImageElement }) => {
      fallbackToOriginalImage(e, url);
    },
  };
}

async function loadBitmap(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob, { imageOrientation: "from-image" });
}

async function encodeVariant(bitmap: ImageBitmap, size: ImageVariantSize): Promise<Blob | null> {
  const { edge, quality } = IMAGE_VARIANTS[size];
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  // Halve repeatedly so fine weave/zari patterns are averaged instead of aliased.
  let current: CanvasImageSource = bitmap;
  let curW = bitmap.width;
  let curH = bitmap.height;
  while (curW / 2 >= w && curH / 2 >= h) {
    const step = document.createElement("canvas");
    step.width = Math.round(curW / 2);
    step.height = Math.round(curH / 2);
    const sctx = step.getContext("2d");
    if (!sctx) break;
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(current, 0, 0, step.width, step.height);
    current = step;
    curW = step.width;
    curH = step.height;
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(current, 0, 0, w, h);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

/**
 * Creates the sm/md copies of an uploaded photo and stores them next to the original.
 * Never throws: a missing copy only means the storefront falls back to the original.
 *
 * @param originalBlob  the exact bytes that were stored as the original
 * @param originalPath  storage path of the original, e.g. "uploads/1790851088850-abc-IMG_7899.jpg"
 * @param apiBase       backend API base URL
 * @param headers       admin auth headers for the sign-url request
 */
export async function uploadImageVariants(
  originalBlob: Blob,
  originalPath: string,
  apiBase: string,
  headers: Record<string, string>
): Promise<void> {
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await loadBitmap(originalBlob);
    const source = bitmap;
    await Promise.all(
      (Object.keys(IMAGE_VARIANTS) as ImageVariantSize[]).map(async (size) => {
        try {
          const blob = await encodeVariant(source, size);
          if (!blob || blob.size === 0) return;
          const res = await fetch(
            `${apiBase}/upload/sign-url?variantOf=${encodeURIComponent(originalPath)}&size=${size}`,
            { headers }
          );
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.success || !data.signedUrl) return;
          await fetch(data.signedUrl, {
            method: "PUT",
            headers: {
              "Content-Type": "image/jpeg",
              "cache-control": "max-age=31536000",
              "x-upsert": "true",
            },
            body: blob,
          });
        } catch (err) {
          console.warn(`[imageVariants] ${size} copy skipped:`, err);
        }
      })
    );
  } catch (err) {
    console.warn("[imageVariants] could not create smaller copies:", err);
  } finally {
    bitmap?.close();
  }
}
