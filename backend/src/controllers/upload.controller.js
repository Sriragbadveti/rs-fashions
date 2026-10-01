import sharp from "sharp";
import heicConvert from "heic-convert";
import { supabase } from "../config/supabase.js";
import { errorResponse } from "../utils/response.js";
import { IMAGE_VARIANTS, IMMUTABLE_CACHE_CONTROL, variantPathFor, uploadImageVariants } from "../utils/imageVariants.js";

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
]);

/**
 * Checks whether a buffer or MIME string represents a HEIC / HEIF image
 */
export function isHeicBuffer(buffer, mimeType = "") {
  const lowerMime = String(mimeType || "").toLowerCase();
  if (lowerMime.includes("heic") || lowerMime.includes("heif")) {
    return true;
  }
  if (Buffer.isBuffer(buffer) && buffer.length >= 12) {
    const boxType = buffer.subarray(4, 8).toString("ascii");
    const majorBrand = buffer.subarray(8, 12).toString("ascii").toLowerCase();
    if (boxType === "ftyp" && HEIC_FTYP_BRANDS.has(majorBrand)) {
      return true;
    }
  }
  return false;
}

/**
 * Parses any Data URL (including empty MIME `data:;base64,...` from Windows HEIC files) or raw base64 string
 */
function parseDataUrlOrBase64(base64OrDataUrl) {
  let mimeType = "image/jpeg";
  let base64Data = String(base64OrDataUrl || "").trim();

  const matches = base64Data.match(/^data:([^;]*);base64,(.+)$/s);
  if (matches) {
    mimeType = (matches[1] || "application/octet-stream").trim();
    base64Data = matches[2].trim();
  }

  return {
    mimeType,
    rawBuffer: Buffer.from(base64Data, "base64"),
  };
}

// Longest edge kept for product photos. 2560px keeps zari/border/weave detail sharp on
// retina product pages and zoom, while avoiding 12MP (4032px) originals on the storefront.
// Keep in sync with MAX_PRODUCT_IMAGE_EDGE in frontend/src/utils/imageConverter.ts.
export const MAX_PRODUCT_IMAGE_EDGE = 2560;
const PRODUCT_JPEG_QUALITY = 90;
// JPEGs at or below this size and edge length are stored byte-for-byte (no re-encode).
const PASSTHROUGH_JPEG_MAX_BYTES = 6 * 1024 * 1024;

/**
 * Processes an image Buffer into a web-ready JPEG buffer.
 * - JPEGs that are already upright and within MAX_PRODUCT_IMAGE_EDGE are passed through
 *   untouched, so an already-compressed photo is never compressed a second time.
 * - Everything else is decoded once, EXIF-rotated, downscaled only if larger than
 *   MAX_PRODUCT_IMAGE_EDGE (never upscaled) and encoded at q90 with 4:4:4 chroma so
 *   saree borders, zari work and embroidery keep crisp colour edges.
 */
export async function processBufferToWebFormat(buffer, originalMime = "image/jpeg", filename = "") {
  let workingBuffer = buffer;
  let mimeType = originalMime || "image/jpeg";
  let extension = "jpg";

  // 1. If HEIC / HEIF (by MIME, extension, or ftyp magic bytes), convert to JPEG first using heic-convert
  const isHeic = isHeicBuffer(workingBuffer, mimeType) || /\.(heic|heif)$/i.test(filename || "");
  if (isHeic) {
    try {
      const converted = await heicConvert({
        buffer: workingBuffer,
        format: "JPEG",
        quality: 0.90, // High quality to retain fine zari threads
      });
      workingBuffer = Buffer.from(converted);
      mimeType = "image/jpeg";
      extension = "jpg";
    } catch (heicErr) {
      console.warn("[UploadController] heic-convert warning:", heicErr.message);
    }
  }

  let uploadBuffer = workingBuffer;
  let uploadMimeType = mimeType || "image/jpeg";

  // 2. High-Fidelity Saree Optimization with Sharp
  if (!uploadMimeType.includes("svg")) {
    try {
      const meta = await sharp(workingBuffer).metadata();
      const longEdge = Math.max(meta.width || 0, meta.height || 0);
      const isPassthroughJpeg =
        meta.format === "jpeg" &&
        (!meta.orientation || meta.orientation === 1) &&
        longEdge > 0 &&
        longEdge <= MAX_PRODUCT_IMAGE_EDGE &&
        workingBuffer.length <= PASSTHROUGH_JPEG_MAX_BYTES;

      if (!isPassthroughJpeg) {
        uploadBuffer = await sharp(workingBuffer)
          .rotate() // auto-orient based on EXIF
          .resize({
            width: MAX_PRODUCT_IMAGE_EDGE,
            height: MAX_PRODUCT_IMAGE_EDGE,
            fit: "inside",
            withoutEnlargement: true,
            kernel: "lanczos3",
          })
          .jpeg({
            quality: PRODUCT_JPEG_QUALITY,
            progressive: true,
            mozjpeg: true,
            chromaSubsampling: "4:4:4", // Critical for metallic zari clarity
          })
          .toBuffer();
      }
      uploadMimeType = "image/jpeg";
      extension = "jpg";
    } catch (sharpErr) {
      console.warn("[UploadController] Sharp optimization skipped, using raw buffer:", sharpErr.message);
      if (uploadMimeType.includes("png")) extension = "png";
      else if (uploadMimeType.includes("webp")) extension = "webp";
      else uploadMimeType = "image/jpeg";
    }
  } else {
    extension = "svg";
  }

  const dataUrl = `data:${uploadMimeType};base64,${uploadBuffer.toString("base64")}`;

  return {
    buffer: uploadBuffer,
    mimeType: uploadMimeType,
    extension,
    dataUrl,
  };
}

/**
 * Converts a base64 / Data URL image into web-visible JPEG buffer and Data URL
 * Backward-compatible wrapper for existing controllers.
 */
export async function processImageToWebFormat(base64OrDataUrl) {
  const { mimeType: initialMime, rawBuffer } = parseDataUrlOrBase64(base64OrDataUrl);
  return processBufferToWebFormat(rawBuffer, initialMime);
}

/**
 * Uploads a buffer directly into the public Supabase Storage bucket 'sarees'
 */
export async function uploadBufferToSupabaseStorage(buffer, originalMime = "image/jpeg", customFilename = "") {
  const processed = await processBufferToWebFormat(buffer, originalMime, customFilename);
  const { buffer: uploadBuffer, mimeType: uploadMimeType, extension, dataUrl } = processed;

  const cleanCustomName = customFilename
    ? customFilename.replace(/\.(heic|heif)$/i, ".jpg").replace(/[^a-zA-Z0-9._-]/g, "_")
    : null;
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fileName = cleanCustomName
    ? `${uniqueSuffix}-${cleanCustomName.replace(/\.[^.]*$/, "")}.${extension}`
    : `saree-${uniqueSuffix}.${extension}`;
  const filePath = `uploads/${fileName}`;

  if (supabase) {
    try {
      const { error } = await supabase.storage
        .from("sarees")
        .upload(filePath, uploadBuffer, {
          contentType: uploadMimeType,
          cacheControl: IMMUTABLE_CACHE_CONTROL,
          upsert: false,
        });

      if (!error) {
        // Small copies for cards/lists so shoppers don't download the full-size original.
        if (!uploadMimeType.includes("svg")) {
          await uploadImageVariants(supabase, "sarees", filePath, uploadBuffer);
        }

        const { data: publicUrlData } = supabase.storage
          .from("sarees")
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return {
            path: filePath,
            publicUrl: publicUrlData.publicUrl,
            url: publicUrlData.publicUrl,
            size: uploadBuffer.length,
            mimeType: uploadMimeType,
          };
        }
      } else {
        console.warn("[UploadController] Supabase storage upload warning:", error.message);
      }
    } catch (storageErr) {
      console.warn("[UploadController] Supabase storage unreachable:", storageErr.message);
    }
  }

  // Fallback: return dataUrl if storage client unreachable
  return {
    path: filePath,
    publicUrl: dataUrl,
    url: dataUrl,
    dataUrl,
    size: uploadBuffer.length,
    mimeType: uploadMimeType,
  };
}

/**
 * Uploads a base64 or binary image into Supabase Storage bucket 'sarees'
 * Backward-compatible wrapper for existing calls.
 */
export async function uploadImageToSupabaseStorage(base64OrDataUrl, customFilename) {
  if (Buffer.isBuffer(base64OrDataUrl)) {
    return uploadBufferToSupabaseStorage(base64OrDataUrl, "image/jpeg", customFilename);
  }

  if (typeof base64OrDataUrl === "string" && (base64OrDataUrl.startsWith("http://") || base64OrDataUrl.startsWith("https://"))) {
    return {
      path: "",
      publicUrl: base64OrDataUrl,
      url: base64OrDataUrl,
      size: 0,
      mimeType: "image/jpeg",
    };
  }

  const { mimeType, rawBuffer } = parseDataUrlOrBase64(base64OrDataUrl);
  return uploadBufferToSupabaseStorage(rawBuffer, mimeType, customFilename);
}

/**
 * Concurrency-limited helper: processes items with maximum `limit` in-flight tasks
 */
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      results[idx] = await fn(items[idx], idx);
    }
  }

  const workerCount = Math.min(limit, items.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Controller endpoint: POST /api/upload
 * Supports:
 * 1. Multipart binary uploads (`req.file` or `req.files`) via Multer (FASTEST, NO BASE64 OVERHEAD)
 * 2. JSON base64 payloads (`req.body.image`, `req.body.images`) for full backward compatibility
 */
export async function uploadImage(req, res) {
  try {
    // A. Check for Multipart file uploads (Multer)
    const uploadedFiles = req.files || (req.file ? [req.file] : null);

    if (Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
      // Process binary files with controlled concurrency of 2 to protect server CPU/memory
      const results = await mapWithConcurrency(uploadedFiles, 2, async (f, idx) => {
        const uploadRes = await uploadBufferToSupabaseStorage(
          f.buffer,
          f.mimetype,
          f.originalname || `saree-${Date.now()}-${idx + 1}.jpg`
        );
        return {
          originalName: f.originalname,
          url: uploadRes.publicUrl,
          publicUrl: uploadRes.publicUrl,
          path: uploadRes.path,
          size: uploadRes.size,
          mimeType: uploadRes.mimeType,
        };
      });

      const validUrls = results.map((r) => r.publicUrl);
      if (uploadedFiles.length === 1) {
        return res.status(201).json({
          success: true,
          url: validUrls[0],
          publicUrl: validUrls[0],
          data: results[0],
          message: "Image processed and uploaded successfully (binary)",
        });
      }

      return res.status(201).json({
        success: true,
        urls: validUrls,
        images: validUrls,
        data: results,
        message: `${validUrls.length} images processed and uploaded successfully (binary)`,
      });
    }

    // B. Check for JSON / Base64 uploads (Backward Compatibility)
    const { image, file, filename, images, files } = req.body || {};
    const targetImages = images || files;

    if (Array.isArray(targetImages) && targetImages.length > 0) {
      const results = await mapWithConcurrency(targetImages, 2, async (img, idx) => {
        if (!img) return null;
        if (typeof img === "string" && (img.startsWith("http://") || img.startsWith("https://"))) {
          return { url: img, publicUrl: img };
        }
        const uploadRes = await uploadImageToSupabaseStorage(img, `${Date.now()}-${idx + 1}.jpg`);
        return { url: uploadRes.publicUrl, publicUrl: uploadRes.publicUrl, path: uploadRes.path };
      });

      const validUrls = results.filter(Boolean).map((r) => r.publicUrl);
      return res.status(201).json({
        success: true,
        urls: validUrls,
        images: validUrls,
        data: results.filter(Boolean),
        message: `${validUrls.length} images uploaded successfully`,
      });
    }

    const targetImage = image || file;
    if (!targetImage) {
      return errorResponse(res, "No image payload provided (must send binary file or 'image' base64)", 400);
    }

    if (typeof targetImage === "string" && (targetImage.startsWith("http://") || targetImage.startsWith("https://"))) {
      return res.status(200).json({
        success: true,
        url: targetImage,
        publicUrl: targetImage,
        data: { url: targetImage, publicUrl: targetImage },
        message: "Image URL validated",
      });
    }

    const result = await uploadImageToSupabaseStorage(targetImage, filename);
    return res.status(201).json({
      success: true,
      url: result.publicUrl,
      publicUrl: result.publicUrl,
      dataUrl: result.dataUrl,
      data: {
        url: result.publicUrl,
        publicUrl: result.publicUrl,
        path: result.path,
        size: result.size,
      },
      message: "Image processed and uploaded successfully",
    });
  } catch (err) {
    console.error("[UploadController] Image upload error:", err);
    return errorResponse(res, err.message || "Failed to process and upload image", 500);
  }
}

/**
 * Controller endpoint: POST /api/upload/multiple
 */
export async function uploadMultipleImages(req, res) {
  return uploadImage(req, res);
}

/**
 * Controller endpoint: POST /api/upload/convert-heic
 */
export async function convertHeicImage(req, res) {
  try {
    const uploadedFile = req.file || (req.files && req.files[0]);
    if (uploadedFile) {
      const processed = await processBufferToWebFormat(uploadedFile.buffer, uploadedFile.mimetype, uploadedFile.originalname);
      return res.status(200).json({
        success: true,
        url: processed.dataUrl,
        dataUrl: processed.dataUrl,
        mimeType: processed.mimeType,
        size: processed.buffer.length,
      });
    }

    const { image, file } = req.body || {};
    const target = image || file;
    if (!target) {
      return errorResponse(res, "No image payload provided for HEIC conversion", 400);
    }
    const processed = await processImageToWebFormat(target);
    return res.status(200).json({
      success: true,
      url: processed.dataUrl,
      dataUrl: processed.dataUrl,
      mimeType: processed.mimeType,
      size: processed.buffer.length,
    });
  } catch (err) {
    console.error("[UploadController] HEIC conversion error:", err);
    return errorResponse(res, err.message || "Failed to convert HEIC image", 500);
  }
}

/**
 * GET /api/upload/sign-url?filename=foo.jpg&contentType=image/jpeg&expiresIn=300
 *
 * Creates a time-limited signed upload URL so the browser can PUT files
 * DIRECTLY to Supabase Storage — zero file bytes ever touch the Render server.
 * This eliminates the OOM crash risk from multer + Sharp + heic-convert in RAM.
 *
 * Flow:
 *   Browser → GET /api/upload/sign-url (tiny, no RAM) → Render returns signed URL
 *   Browser → PUT directly to Supabase Storage using signed URL (real bytes bypass Render)
 *   Browser → uses returned publicUrl for the product record
 */
export async function createSignedUploadUrl(req, res) {
  try {
    if (!supabase) {
      return res.status(503).json({ success: false, message: "Storage service unavailable" });
    }

    // Variant mode: signed URL for a smaller copy of an already-uploaded original.
    if (req.query.variantOf) {
      const variantPath = variantPathFor(String(req.query.variantOf), String(req.query.size || ""));
      if (!variantPath) {
        return res.status(400).json({ success: false, message: "Invalid variantOf or size" });
      }
      const { data: vData, error: vError } = await supabase.storage
        .from("sarees")
        .createSignedUploadUrl(variantPath, { upsert: true });
      if (vError || !vData?.signedUrl) {
        return res.status(500).json({ success: false, message: vError?.message || "Could not generate upload URL" });
      }
      return res.status(200).json({ success: true, signedUrl: vData.signedUrl, token: vData.token, path: variantPath, sizes: Object.keys(IMAGE_VARIANTS) });
    }

    const rawName = String(req.query.filename || `saree-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext = rawName.split(".").pop()?.toLowerCase() || "jpg";

    // Browsers other than Safari cannot render HEIC, so raw HEIC must never be stored directly.
    // The admin client converts HEIC before requesting a signed URL; if it could not, it falls
    // back to POST /api/upload where the server converts it.
    if (ext === "heic" || ext === "heif") {
      return res.status(415).json({
        success: false,
        message: "HEIC/HEIF must be converted before direct upload. Use POST /api/upload instead.",
      });
    }

    const safeExt = ["jpg", "jpeg", "png", "webp", "gif", "avif", "bmp"].includes(ext) ? ext : "jpg";
    const filename = rawName.endsWith(`.${safeExt}`) ? rawName : `${rawName.replace(/\.[^.]*$/, "")}.${safeExt}`;
    const expiresIn = Math.min(600, Math.max(60, Number(req.query.expiresIn) || 300));

    // Random suffix: two photos with the same name (IMG_0001.jpg from two phones, or the same
    // millisecond) must never resolve to the same storage object.
    const filePath = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${filename}`;

    const { data, error } = await supabase.storage
      .from("sarees")
      .createSignedUploadUrl(filePath, expiresIn);

    if (error || !data?.signedUrl) {
      console.error("[UploadController] Failed to create signed URL:", error?.message);
      return res.status(500).json({ success: false, message: error?.message || "Could not generate upload URL" });
    }

    const { data: publicUrlData } = supabase.storage.from("sarees").getPublicUrl(filePath);
    const publicUrl = publicUrlData?.publicUrl || "";

    return res.status(200).json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path: filePath,
      publicUrl,
      expiresIn,
    });
  } catch (err) {
    console.error("[UploadController] createSignedUploadUrl error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to create signed upload URL" });
  }
}

