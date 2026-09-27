import { heicTo } from "heic-to";
import heic2any from "heic2any";
import { API_BASE } from "../config/api";

/**
 * Standard file input accept attribute that explicitly enables .heic and .heif selection
 * across Windows, macOS, iOS, and Android file pickers.
 */
export const IMAGE_ACCEPT_ATTR =
  "image/*,.heic,.heif,image/heic,image/heif,image/heic-sequence,image/heif-sequence";

const HEIC_FTYP_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "hevm",
  "hevs",
  "mif1",
  "msf1",
  "avif",
  "avis",
]);

/**
 * Checks if a File is a supported image (including .heic / .heif where Windows browsers often report file.type === "")
 */
export function isSupportedImageFile(file: File | null | undefined): boolean {
  if (!file) return false;
  const mime = (file.type || "").toLowerCase();
  if (mime.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|avif|svg|bmp|ico|tiff?|heic|heif)$/i.test(file.name || "");
}

/**
 * Checks if a File has a HEIC/HEIF MIME type or file extension
 */
export function isHeicFile(file: File | null | undefined): boolean {
  if (!file) return false;
  const mime = (file.type || "").toLowerCase();
  if (mime.includes("heic") || mime.includes("heif")) return true;
  return /\.(heic|heif)$/i.test(file.name || "");
}

/**
 * Inspects the first 12 bytes of a Blob/File for ISO Base Media File Format (ftyp) HEIC/HEIF brands
 */
export async function hasHeicMagicBytes(blob: Blob): Promise<boolean> {
  try {
    if (!blob || blob.size < 12) return false;
    const buffer = await blob.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const boxType = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    const majorBrand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
    return boxType === "ftyp" && HEIC_FTYP_BRANDS.has(majorBrand);
  } catch {
    return false;
  }
}

/**
 * Detects if a stored Data URL is an un-converted HEIC/HEIF payload that browsers cannot render in <img> tags
 * (including HEIC bytes that were mistakenly given a data:image/jpeg;base64, prefix).
 */
export function isUnrenderedHeicDataUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string" || !url.startsWith("data:")) return false;
  if (/^data:image\/hei[cf]/i.test(url)) return true;

  const commaIdx = url.indexOf(",");
  if (commaIdx === -1) return false;
  const b64Head = url.slice(commaIdx + 1, commaIdx + 33).trim();
  if (b64Head.length < 16) return false;

  // Fast check: standard JPEG (/9j/), PNG (iVBOR), GIF (R0lG), WebP (UklGR) are already web-renderable
  if (
    b64Head.startsWith("/9j/") ||
    b64Head.startsWith("iVBOR") ||
    b64Head.startsWith("R0lG") ||
    b64Head.startsWith("UklGR") ||
    b64Head.startsWith("PHN2Zy")
  ) {
    return false;
  }

  try {
    const cleanSlice = b64Head.slice(0, 24);
    const binary = atob(cleanSlice);
    if (binary.length >= 12) {
      const boxType = binary.slice(4, 8);
      const majorBrand = binary.slice(8, 12).toLowerCase();
      if (boxType === "ftyp" && HEIC_FTYP_BRANDS.has(majorBrand)) {
        return true;
      }
    }
  } catch {
    // Fallback regex check
  }

  return /^data:[^,]*;base64,AAAA[A-Za-z0-9+/][GWm2]Z0eXB/.test(url);
}

/**
 * Reads any Blob or File into a Data URL string
 */
function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image data"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts a base64 Data URL into a Blob
 */
function dataUrlToBlob(dataUrl: string, fallbackMime = "image/heic"): Blob {
  const matches = dataUrl.match(/^data:([^;]*);base64,(.+)$/s);
  const mime = (matches?.[1] || fallbackMime).trim() || fallbackMime;
  const base64 = (matches ? matches[2] : dataUrl).replace(/\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Optimizes and compresses a browser-renderable image Blob or Data URL using an HTML5 Canvas
 * so large 12MP+ iPhone photos become crisp, fast-loading JPEGs (~100-180 KB) that fit in localStorage and upload quickly.
 */
async function compressImageBlobToJpegDataUrl(
  blobOrDataUrl: Blob | string,
  maxDimension = 1200,
  quality = 0.84
): Promise<string> {
  const srcUrl =
    typeof blobOrDataUrl === "string"
      ? blobOrDataUrl
      : URL.createObjectURL(blobOrDataUrl);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Browser could not decode image"));
      el.src = srcUrl;
    });

    let width = img.naturalWidth || img.width || 800;
    let height = img.naturalHeight || img.height || 800;

    if (width > maxDimension || height > maxDimension) {
      if (width >= height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return typeof blobOrDataUrl === "string"
        ? blobOrDataUrl
        : await readBlobAsDataUrl(blobOrDataUrl);
    }

    // Fill white background for any transparent channels before JPEG export
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
    if (compressedDataUrl && compressedDataUrl.startsWith("data:image/jpeg;base64,/9j/")) {
      return compressedDataUrl;
    }
    return typeof blobOrDataUrl === "string"
      ? blobOrDataUrl
      : await readBlobAsDataUrl(blobOrDataUrl);
  } finally {
    if (typeof blobOrDataUrl !== "string") {
      URL.revokeObjectURL(srcUrl);
    }
  }
}

/**
 * Attempts to convert a HEIC/HEIF Data URL via the backend `/api/upload/convert-heic` endpoint
 */
async function convertViaBackend(rawDataUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/upload/convert-heic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: rawDataUrl }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const converted = json?.dataUrl || json?.url || json?.data?.dataUrl;
    if (typeof converted === "string" && converted.startsWith("data:image/") && !isUnrenderedHeicDataUrl(converted)) {
      return converted;
    }
  } catch {
    // Backend unreachable; caller will handle fallback
  }
  return null;
}

/**
 * Decodes a HEIC/HEIF Blob into a compressed JPEG Data URL (`data:image/jpeg;base64,/9j/...`)
 * using modern libheif WASM (`heic-to`), falling back to `heic2any` and backend `heic-convert`.
 */
export async function convertHeicBlobToJpegDataUrl(inputBlob: Blob): Promise<string | null> {
  const heicBlob =
    inputBlob.type && inputBlob.type.includes("hei")
      ? inputBlob
      : new Blob([await inputBlob.arrayBuffer()], { type: "image/heic" });

  // 1. Primary modern libheif 1.18+ decoder via `heic-to` (supports iOS 16/17/18 iPhone HEICs)
  try {
    const jpegBlob = await heicTo({
      blob: heicBlob,
      type: "image/jpeg",
      quality: 0.86,
    });
    if (jpegBlob && jpegBlob.size > 0) {
      return await compressImageBlobToJpegDataUrl(jpegBlob, 1200, 0.84);
    }
  } catch (heicToErr) {
    console.warn("heic-to conversion note, trying heic2any:", heicToErr);
  }

  // 2. Secondary client-side conversion via `heic2any`
  try {
    const converted = await heic2any({
      blob: heicBlob,
      toType: "image/jpeg",
      quality: 0.86,
    });
    const targetBlob = Array.isArray(converted) ? converted[0] : converted;
    if (targetBlob && targetBlob.size > 0) {
      return await compressImageBlobToJpegDataUrl(targetBlob, 1200, 0.84);
    }
  } catch (heic2AnyErr) {
    console.warn("heic2any conversion note, trying backend:", heic2AnyErr);
  }

  // 3. Fallback to backend `/api/upload/convert-heic`
  try {
    const rawDataUrl = await readBlobAsDataUrl(heicBlob);
    const backendConverted = await convertViaBackend(rawDataUrl);
    if (backendConverted) {
      return await compressImageBlobToJpegDataUrl(backendConverted, 1200, 0.84);
    }
  } catch {
    // Ignore
  }

  return null;
}

/**
 * Converts an existing un-rendered HEIC Data URL (`data:image/heic;base64,...`, `data:;base64,AAAA...`,
 * or disguised `data:image/jpeg;base64,AAAA...`) into a browser-renderable `data:image/jpeg;base64,/9j/...` Data URL.
 */
const conversionCache = new Map<string, Promise<string>>();

export async function convertHeicDataUrlToJpeg(dataUrl: string): Promise<string> {
  if (!isUnrenderedHeicDataUrl(dataUrl)) return dataUrl;

  const cacheKey = dataUrl.slice(0, 120) + ":" + dataUrl.length;
  const existing = conversionCache.get(cacheKey);
  if (existing) return existing;

  const task = (async () => {
    try {
      const blob = dataUrlToBlob(dataUrl, "image/heic");
      const converted = await convertHeicBlobToJpegDataUrl(blob);
      if (converted) return converted;
    } catch {
      // Fallback below
    }

    const backendConverted = await convertViaBackend(dataUrl);
    if (backendConverted) return backendConverted;

    return dataUrl;
  })();

  conversionCache.set(cacheKey, task);
  return task;
}

/**
 * Inspects an HTTP(S) or Data URL that failed to render in an <img> tag.
 * If the remote file (e.g. a `.jpg` uploaded to Supabase Storage before HEIC conversion was active)
 * actually contains raw HEIC bytes, downloads and transcodes it to a visible JPEG Data URL!
 */
export async function recoverHeicUrlIfNeeded(url: string): Promise<string | null> {
  if (!url || typeof url !== "string") return null;

  if (isUnrenderedHeicDataUrl(url)) {
    const converted = await convertHeicDataUrlToJpeg(url);
    return converted !== url ? converted : null;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    const cacheKey = `http:${url}`;
    const existing = conversionCache.get(cacheKey);
    if (existing) return existing;

    const task = (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) return url;
        const blob = await res.blob();
        if (await hasHeicMagicBytes(blob)) {
          const converted = await convertHeicBlobToJpegDataUrl(blob);
          if (converted) return converted;
        }
      } catch {
        // Ignore fetch errors
      }
      return url;
    })();

    conversionCache.set(cacheKey, task);
    const result = await task;
    return result !== url ? result : null;
  }

  return null;
}

/**
 * Global onError helper for <img> tags displaying saree photos.
 * Automatically recovers and renders HEIC images if the URL contains raw HEIC bytes.
 */
export async function handleSareeImageError(
  event: { currentTarget: HTMLImageElement },
  originalUrl?: string,
  onRecovered?: (newJpegUrl: string) => void
): Promise<void> {
  const imgEl = event.currentTarget;
  if (!imgEl || imgEl.dataset.heicRecovering === "true") return;
  imgEl.dataset.heicRecovering = "true";

  const targetUrl = originalUrl || imgEl.src;
  const recovered = await recoverHeicUrlIfNeeded(targetUrl);
  if (recovered && recovered !== targetUrl) {
    imgEl.src = recovered;
    if (onRecovered) {
      onRecovered(recovered);
    }
  }
}

/**
 * Converts any image File (including .heic / .heif) into a browser-visible, compressed JPEG Data URL.
 * Automatically transcodes HEIC/HEIF files to `image/jpeg` so they render in all browsers (Chrome, Edge, Firefox, Safari).
 */
export async function fileToVisibleDataUrl(file: File): Promise<string> {
  const isHeic = isHeicFile(file) || (await hasHeicMagicBytes(file));

  if (isHeic) {
    const converted = await convertHeicBlobToJpegDataUrl(file);
    if (converted) {
      return converted;
    }

    // Maybe the file has a .heic extension on disk, but is actually a standard JPEG/PNG inside
    try {
      const fallbackBlob = new Blob([await file.arrayBuffer()], { type: "image/jpeg" });
      return await compressImageBlobToJpegDataUrl(fallbackBlob, 1200, 0.84);
    } catch {
      throw new Error(`Could not decode HEIC image "${file.name}". Please try another photo.`);
    }
  }

  const dataUrl = await readBlobAsDataUrl(file);
  if (isUnrenderedHeicDataUrl(dataUrl)) {
    return await convertHeicDataUrlToJpeg(dataUrl);
  }

  // Also compress large standard images (> 350 KB) so they never overflow localStorage or slow down gallery rendering
  if (file.size > 350 * 1024 && !file.type.includes("svg") && !file.type.includes("gif")) {
    try {
      return await compressImageBlobToJpegDataUrl(file, 1200, 0.85);
    } catch {
      return dataUrl;
    }
  }

  return dataUrl;
}
