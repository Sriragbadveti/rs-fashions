import { supabase } from "../src/config/supabase.js";
import sharp from "sharp";
import { execSync } from "child_process";
import fs from "fs";

async function optimizeAllProductImages() {
  console.log("Fetching all products...");
  const { data: products, error } = await supabase.from("products").select("id, name, images");
  if (error) {
    console.error("Error fetching products:", error);
    return;
  }

  console.log(`Found ${products.length} products to check...`);

  for (const product of products) {
    const originalImages = product.images || [];
    if (originalImages.length === 0) continue;

    let updated = false;
    const newImages = [];

    for (let i = 0; i < originalImages.length; i++) {
      const imgUrl = originalImages[i];
      if (!imgUrl.includes("supabase.co/storage/v1/object/public/sarees/")) {
        newImages.push(imgUrl);
        continue;
      }

      console.log(`\nChecking [${product.id}] ${product.name} (img #${i+1})...`);
      try {
        const res = await fetch(imgUrl);
        const originalBuf = Buffer.from(await res.arrayBuffer());
        console.log(`  Current size: ${(originalBuf.length / 1024).toFixed(1)} KB`);

        let meta;
        try {
          meta = await sharp(originalBuf).metadata();
        } catch (e) {
          meta = null;
        }

        if (originalBuf.length < 250 * 1024 && meta && meta.format !== "heif") {
          console.log(`  Already optimized (${(originalBuf.length / 1024).toFixed(1)} KB). Skipping.`);
          newImages.push(imgUrl);
          continue;
        }

        let inputBuf = originalBuf;
        if (!meta || meta.format === "heif") {
          try {
            // Sharp handles HEIC if compiled with libheif; fallback to originalBuf
            inputBuf = originalBuf;
          } catch (heicErr) {
            console.warn("  HEIF conversion notice:", heicErr.message);
          }
        }

        const optimizedBuf = await sharp(inputBuf)
          .rotate()
          .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 82, progressive: true, mozjpeg: true })
          .toBuffer();

        const optFileName = `uploads/${product.id}-opt-${Date.now()}-${i + 1}.jpg`;
        console.log(`  Compressed from ${(originalBuf.length / 1024).toFixed(1)} KB -> ${(optimizedBuf.length / 1024).toFixed(1)} KB (${((1 - optimizedBuf.length / originalBuf.length) * 100).toFixed(1)}% reduction)`);

        const { error: uploadError } = await supabase.storage
          .from("sarees")
          .upload(optFileName, optimizedBuf, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          console.error("  Upload error:", uploadError);
          newImages.push(imgUrl);
          continue;
        }

        const { data: pubData } = supabase.storage.from("sarees").getPublicUrl(optFileName);
        newImages.push(pubData.publicUrl);
        updated = true;
      } catch (err) {
        console.error(`  Error optimizing image ${imgUrl}:`, err.message);
        newImages.push(imgUrl);
      }
    }

    if (updated) {
      console.log(`Updating database for product ${product.id}...`);
      const { error: dbError } = await supabase
        .from("products")
        .update({ images: newImages })
        .eq("id", product.id);

      if (dbError) {
        console.error("  Database update error:", dbError);
      } else {
        console.log(`  Successfully updated ${product.id} with optimized URLs!`);
      }
    }
  }

  console.log("\nAll product images optimized successfully!");
}

optimizeAllProductImages();
