import sharp from "sharp";
import heicConvert from "heic-convert";
import { supabase } from "../config/supabase.js";
import { errorResponse } from "../utils/response.js";

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

/**
 * Processes an image Buffer into a web-optimized JPEG buffer.
 * Preserves high resolution (up to 2000px) and disables harsh chroma subsampling
 * (uses 4:4:4) to preserve intricate saree borders, zari work, embroidery, and texture details.
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
      // 2000px maximum dimension preserves saree pallu, border zari, and weave details
      // 88 quality with mozjpeg and 4:4:4 chroma subsampling ensures zero color bleeding on gold/red border edges
      uploadBuffer = await sharp(workingBuffer)
        .rotate() // auto-orient based on EXIF
        .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
        .jpeg({
          quality: 88,
          progressive: true,
          mozjpeg: true,
          chromaSubsampling: "4:4:4", // Critical for metallic zari clarity
        })
        .toBuffer();
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
  const fileName =
    cleanCustomName ||
    `saree-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${extension}`;
  const filePath = `uploads/${fileName}`;

  if (supabase) {
    try {
      const { error } = await supabase.storage
        .from("sarees")
        .upload(filePath, uploadBuffer, {
          contentType: uploadMimeType,
          upsert: true,
        });

      if (!error) {
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
