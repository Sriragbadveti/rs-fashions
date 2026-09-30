/**
 * One-off repair: product photos that were stored as raw HEIC/HEIF (direct uploads before the
 * browser-side conversion existed) cannot be displayed by Chrome, Edge or Firefox.
 *
 * For every product image (and shade variant image) in the `sarees` bucket that is HEIC, this
 * converts it once at high quality (same pipeline as POST /api/upload), stores the JPEG as a new
 * object and rewrites the product's image URL. Original HEIC objects are left untouched.
 *
 * Usage (from backend/, with the Supabase env vars set):
 *   node scripts/convert_heic_product_images.js           # dry run: report only
 *   node scripts/convert_heic_product_images.js --apply   # convert and update products
 *
 * Run it on a workstation, not on the Render instance: HEIC decoding is memory-heavy.
 */
import { supabase } from "../src/config/supabase.js";
import { isHeicBuffer, uploadBufferToSupabaseStorage } from "../src/controllers/upload.controller.js";
import { getPersistentVariantsMap, savePersistentVariantsMap } from "../src/services/inventory.service.js";

const APPLY = process.argv.includes("--apply");
const BUCKET_MARKER = "/storage/v1/object/public/sarees/";

function looksHeicByName(url) {
  return /\.(heic|heif)(\?|$)/i.test(url);
}

const converted = new Map(); // old URL -> new URL (a photo may be shared by several products)

async function convertUrl(url) {
  if (converted.has(url)) return converted.get(url);
  if (typeof url !== "string" || !url.includes(BUCKET_MARKER)) return null;

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  ! could not download ${url} (HTTP ${res.status})`);
    return null;
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (!isHeicBuffer(buffer, res.headers.get("content-type") || "") && !looksHeicByName(url)) {
    return null;
  }

  const name = decodeURIComponent(url.split("/").pop().split("?")[0]).replace(/\.(heic|heif)$/i, ".jpg");
  if (!APPLY) {
    console.log(`  would convert ${url} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
    converted.set(url, null);
    return null;
  }

  const uploaded = await uploadBufferToSupabaseStorage(buffer, "image/heic", name);
  if (!uploaded?.publicUrl || !/^https?:\/\//.test(uploaded.publicUrl)) {
    console.warn(`  ! storage did not accept converted ${url}; product left unchanged`);
    return null;
  }
  console.log(`  converted ${url}\n         -> ${uploaded.publicUrl} (${(uploaded.size / 1024).toFixed(0)} KB)`);
  converted.set(url, uploaded.publicUrl);
  return uploaded.publicUrl;
}

async function main() {
  if (!supabase) {
    console.error("Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
    process.exit(1);
  }
  console.log(APPLY ? "APPLY mode: products will be updated." : "DRY RUN: nothing will be changed. Pass --apply to convert.");

  const { data: products, error } = await supabase.from("products").select("id, name, images");
  if (error) throw error;
  const variantsMap = await getPersistentVariantsMap();
  let variantsChanged = false;
  let productsChanged = 0;

  for (const product of products || []) {
    const images = Array.isArray(product.images) ? product.images : [];
    const nextImages = [];
    let changed = false;
    for (const url of images) {
      const next = await convertUrl(url);
      if (next) changed = true;
      nextImages.push(next || url);
    }

    const variants = Array.isArray(variantsMap[product.id]) ? variantsMap[product.id] : [];
    for (const v of variants) {
      if (!v?.imageUrl) continue;
      const next = await convertUrl(v.imageUrl);
      if (next) {
        v.imageUrl = next;
        variantsChanged = true;
      }
    }

    if (changed && APPLY) {
      const { error: updErr } = await supabase
        .from("products")
        .update({ images: nextImages, updated_at: new Date().toISOString() })
        .eq("id", product.id);
      if (updErr) {
        console.error(`  ! failed to update ${product.id}: ${updErr.message}`);
      } else {
        productsChanged++;
        console.log(`  updated product ${product.id} (${product.name})`);
      }
    }
  }

  if (variantsChanged && APPLY) {
    await savePersistentVariantsMap(variantsMap);
    console.log("  updated shade variant images");
  }

  console.log(`Done. HEIC photos found: ${converted.size}. Products updated: ${productsChanged}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
