import { Router } from "express";
import crypto from "crypto";

const router = Router();

// GET Cloudinary status & config info
router.get("/config", (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const hasSecret = Boolean(process.env.CLOUDINARY_API_SECRET);
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  return res.json({
    success: true,
    isConfigured: Boolean(cloudName && (uploadPreset || (apiKey && hasSecret))),
    cloudName: cloudName || null,
    hasApiKey: Boolean(apiKey),
    hasPreset: Boolean(uploadPreset),
  });
});

// POST Upload image to Cloudinary
router.post("/cloudinary", async (req, res) => {
  try {
    const { image, folder = "rs_fashions" } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: "No image payload provided" });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    // Check if Cloudinary is configured
    if (cloudName && (uploadPreset || (apiKey && apiSecret))) {
      const timestamp = Math.round(Date.now() / 1000);
      const postData = new URLSearchParams();
      postData.append("file", image);
      postData.append("folder", folder);

      if (uploadPreset) {
        postData.append("upload_preset", uploadPreset);
      } else if (apiKey && apiSecret) {
        // Sign payload with Cloudinary API secret
        const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash("sha1").update(signatureString).digest("hex");
        postData.append("api_key", apiKey);
        postData.append("timestamp", String(timestamp));
        postData.append("signature", signature);
      }

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: postData,
      });

      const data = await response.json();

      if (data.secure_url) {
        return res.json({
          success: true,
          url: data.secure_url,
          publicId: data.public_id,
          format: data.format,
          bytes: data.bytes,
          width: data.width,
          height: data.height,
        });
      } else {
        console.warn("Cloudinary upload error response:", data);
        // Fallback to direct data URI so user is not blocked
        return res.json({
          success: true,
          url: image,
          isFallback: true,
          message: data.error?.message || "Cloudinary upload failed, saved as inline visual.",
        });
      }
    }

    // Cloudinary credentials not configured yet: return image data URL as local fallback
    return res.json({
      success: true,
      url: image,
      isLocal: true,
      message: "Cloudinary credentials not set in backend/.env yet. Using inline visual asset.",
    });
  } catch (error) {
    console.error("Cloudinary upload exception:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
