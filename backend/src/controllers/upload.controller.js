import sharp from "sharp";
import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";

/**
 * Uploads a base64 or binary image into the public Supabase Storage bucket 'sarees'
 * Automatically compresses, reorients, and resizes to web-optimal format (< 200 KB)
 */
export async function uploadImageToSupabaseStorage(base64OrDataUrl, customFilename) {
  if (!supabase) {
    throw new Error("Supabase client is not initialized");
  }

  // Parse Data URL or plain Base64
  let mimeType = "image/jpeg";
  let base64Data = base64OrDataUrl;

  const matches = base64OrDataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (matches) {
    mimeType = matches[1];
    base64Data = matches[2];
  }

  const rawBuffer = Buffer.from(base64Data, "base64");
  let uploadBuffer = rawBuffer;
  let uploadMimeType = mimeType;
  let extension = "jpg";

  // Compress and optimize with sharp unless it's a vector SVG
  if (!mimeType.includes("svg")) {
    try {
      uploadBuffer = await sharp(rawBuffer)
        .rotate()
        .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 82, progressive: true, mozjpeg: true })
        .toBuffer();
      uploadMimeType = "image/jpeg";
      extension = "jpg";
    } catch (sharpErr) {
      console.warn("Sharp optimization skipped, using raw buffer:", sharpErr.message);
      if (mimeType.includes("png")) extension = "png";
      else if (mimeType.includes("webp")) extension = "webp";
    }
  } else {
    extension = "svg";
  }

  const fileName = customFilename || `saree-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${extension}`;
  const filePath = `uploads/${fileName}`;

  const { data, error } = await supabase.storage
    .from("sarees")
    .upload(filePath, uploadBuffer, {
      contentType: uploadMimeType,
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from("sarees")
    .getPublicUrl(filePath);

  return {
    path: filePath,
    publicUrl: publicUrlData.publicUrl,
    size: uploadBuffer.length,
    mimeType,
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
      data: {
        url: result.publicUrl,
        publicUrl: result.publicUrl,
        path: result.path,
        size: result.size,
      },
      message: "Image uploaded successfully to Supabase Storage 'sarees' bucket",
    });
  } catch (err) {
    console.error("Image upload to Supabase Storage error:", err);
    return errorResponse(res, err.message || "Failed to upload image to Supabase Storage", 500);
  }
}

/**
 * Controller endpoint: POST /api/upload/multiple
 */
export async function uploadMultipleImages(req, res) {
  return uploadImage(req, res);
}
