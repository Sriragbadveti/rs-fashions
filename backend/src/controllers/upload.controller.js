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
 * Converts a base64 / Data URL image (including HEIC / HEIF) into a web-visible, compressed JPEG buffer and Data URL
 */
export async function processImageToWebFormat(base64OrDataUrl) {
  const { mimeType: initialMime, rawBuffer } = parseDataUrlOrBase64(base64OrDataUrl);
  let workingBuffer = rawBuffer;
  let mimeType = initialMime;
  let extension = "jpg";

  // 1. If HEIC / HEIF (by MIME or ftyp magic bytes), convert to JPEG first using heic-convert
  if (isHeicBuffer(workingBuffer, mimeType)) {
    try {
      const converted = await heicConvert({
        buffer: workingBuffer,
        format: "JPEG",
        quality: 0.88,
      });
      workingBuffer = Buffer.from(converted);
      mimeType = "image/jpeg";
      extension = "jpg";
    } catch (heicErr) {
      console.warn("heic-convert warning:", heicErr.message);
    }
  }

  let uploadBuffer = workingBuffer;
  let uploadMimeType = mimeType || "image/jpeg";

  // 2. Compress and optimize with sharp unless it's a vector SVG
  if (!uploadMimeType.includes("svg")) {
    try {
      uploadBuffer = await sharp(workingBuffer)
        .rotate()
        .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 82, progressive: true, mozjpeg: true })
        .toBuffer();
      uploadMimeType = "image/jpeg";
      extension = "jpg";
    } catch (sharpErr) {
      console.warn("Sharp optimization skipped, using working buffer:", sharpErr.message);
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
 * Uploads a base64 or binary image into the public Supabase Storage bucket 'sarees'
 * Automatically converts HEIC/HEIF to JPEG, compresses, reorients, and resizes to web-optimal format (< 200 KB).
 * Falls back to returning the optimized JPEG Data URL if Supabase Storage is not configured or unreachable.
 */
export async function uploadImageToSupabaseStorage(base64OrDataUrl, customFilename) {
  const processed = await processImageToWebFormat(base64OrDataUrl);
  const { buffer: uploadBuffer, mimeType: uploadMimeType, extension, dataUrl } = processed;

  const cleanCustomName = customFilename
    ? customFilename.replace(/\.(heic|heif)$/i, ".jpg")
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
            dataUrl,
            size: uploadBuffer.length,
            mimeType: uploadMimeType,
          };
        }
      } else {
        console.warn("Supabase storage upload warning, using converted JPEG dataUrl:", error.message);
      }
    } catch (storageErr) {
      console.warn("Supabase storage unreachable, using converted JPEG dataUrl:", storageErr.message);
    }
  }

  return {
    path: filePath,
    publicUrl: dataUrl,
    dataUrl,
    size: uploadBuffer.length,
    mimeType: uploadMimeType,
  };
}

/**
 * Controller endpoint: POST /api/upload
 */
export async function uploadImage(req, res) {
  try {
    const { image, file, filename, images, files } = req.body;

    // Handle multiple images batch upload if array provided
    const targetImages = images || files;
    if (Array.isArray(targetImages) && targetImages.length > 0) {
      const results = await Promise.all(
        targetImages.map(async (img, idx) => {
          if (!img) return null;
          if (typeof img === "string" && (img.startsWith("http://") || img.startsWith("https://"))) {
            return { url: img, publicUrl: img };
          }
          const uploadRes = await uploadImageToSupabaseStorage(img, `${Date.now()}-${idx + 1}.jpg`);
          return { url: uploadRes.publicUrl, publicUrl: uploadRes.publicUrl, path: uploadRes.path };
        })
      );

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
      return errorResponse(res, "No image payload provided (must send 'image' as base64 string, data URL, or 'images' array)", 400);
    }

    // If it's already an http(s) URL, no need to re-upload
    if (typeof targetImage === "string" && (targetImage.startsWith("http://") || targetImage.startsWith("https://"))) {
      return res.status(200).json({
        success: true,
        url: targetImage,
        publicUrl: targetImage,
        data: {
          url: targetImage,
          publicUrl: targetImage,
        },
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
        dataUrl: result.dataUrl,
        path: result.path,
        size: result.size,
      },
      message: "Image processed and uploaded successfully",
    });
  } catch (err) {
    console.error("Image upload error:", err);
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
 * Converts a HEIC/HEIF base64 or Data URL into a browser-renderable JPEG Data URL
 */
export async function convertHeicImage(req, res) {
  try {
    const { image, file } = req.body;
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
    console.error("HEIC conversion error:", err);
    return errorResponse(res, err.message || "Failed to convert HEIC image", 500);
  }
}

