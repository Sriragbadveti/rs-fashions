import sharp from "sharp";

/**
 * Smaller copies of every product photo, stored next to the full-size original:
 *   uploads/<name>.jpg        original (zoom / detail view)
 *   uploads/sm/<name>.jpg     cards, lists, cart thumbnails
 *   uploads/md/<name>.jpg     main product image, hero-sized tiles
 *
 * Keep in sync with frontend/src/utils/imageVariants.ts (same folders, same sizes).
 */
export const IMAGE_VARIANTS = {
  sm: { edge: 640, quality: 78 },
  md: { edge: 1200, quality: 82 },
};

// Filenames are unique and never overwritten, so browsers and CDNs may cache them for a year.
export const IMMUTABLE_CACHE_CONTROL = "31536000";

const ORIGINAL_PATH_RE = /^uploads\/([A-Za-z0-9._-]+)$/;

/** `uploads/foo.png` + "sm" -> `uploads/sm/foo.jpg`; null if the path is not a top-level upload. */
export function variantPathFor(originalPath, size) {
  const match = ORIGINAL_PATH_RE.exec(String(originalPath || ""));
  if (!match || !IMAGE_VARIANTS[size]) return null;
  const stem = match[1].replace(/\.[^.]*$/, "") || match[1];
  return `uploads/${size}/${stem}.jpg`;
}

/** Resizes an image buffer into one variant (never upscales, EXIF-rotated). */
export async function buildVariantBuffer(buffer, size) {
  const { edge, quality } = IMAGE_VARIANTS[size];
  return sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality, progressive: true, mozjpeg: true })
    .toBuffer();
}

/**
 * Builds and uploads every variant of `originalPath` into `bucket`.
 * Never throws: a missing variant only means the storefront falls back to the original.
 * Returns the sizes that were stored.
 */
export async function uploadImageVariants(supabase, bucket, originalPath, sourceBuffer) {
  const stored = [];
  await Promise.all(
    Object.keys(IMAGE_VARIANTS).map(async (size) => {
      try {
        const path = variantPathFor(originalPath, size);
        if (!path) return;
        const buf = await buildVariantBuffer(sourceBuffer, size);
        const { error } = await supabase.storage.from(bucket).upload(path, buf, {
          contentType: "image/jpeg",
          cacheControl: IMMUTABLE_CACHE_CONTROL,
          upsert: true,
        });
        if (error) {
          console.warn(`[ImageVariants] ${path} upload warning:`, error.message);
        } else {
          stored.push(size);
        }
      } catch (err) {
        console.warn(`[ImageVariants] ${size} variant of ${originalPath} skipped:`, err.message);
      }
    })
  );
  return stored;
}
