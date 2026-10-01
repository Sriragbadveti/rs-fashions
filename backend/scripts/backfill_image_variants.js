/**
 * One-off backfill: creates the small (sm) and medium (md) copies for product photos that were
 * uploaded before image variants existed, so cards and lists stop downloading full-size originals.
 *
 *   node scripts/backfill_image_variants.js --dry-run     # list what would be created
 *   node scripts/backfill_image_variants.js               # create everything that is missing
 *   node scripts/backfill_image_variants.js --limit=50    # only process the first 50 missing photos
 *
 * Safe to re-run: photos that already have both copies are skipped, and originals are never touched.
 * Downloads each missing original once (that is one-off egress), so run it once, not repeatedly.
 */
import { supabase } from "../src/config/supabase.js";
import { IMAGE_VARIANTS, buildVariantBuffer, uploadImageVariants, variantPathFor } from "../src/utils/imageVariants.js";

const BUCKET = "sarees";
const PAGE = 1000;
const dryRun = process.argv.includes("--dry-run");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity;
const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif|avif|bmp)$/i;

async function listFolder(prefix) {
  const names = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: PAGE, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`list ${prefix}: ${error.message}`);
    if (!data || data.length === 0) break;
    // Folders come back without an id; only files are real objects.
    for (const item of data) if (item.id) names.push(item.name);
    if (data.length < PAGE) break;
  }
  return names;
}

async function main() {
  if (!supabase) throw new Error("Supabase is not configured (check backend/.env)");

  const originals = (await listFolder("uploads")).filter((n) => IMAGE_EXT_RE.test(n));
  const existing = {};
  for (const size of Object.keys(IMAGE_VARIANTS)) existing[size] = new Set(await listFolder(`uploads/${size}`));

  const missing = originals.filter((name) =>
    Object.keys(IMAGE_VARIANTS).some((size) => {
      const variantName = variantPathFor(`uploads/${name}`, size)?.split("/").pop();
      return variantName && !existing[size].has(variantName);
    })
  );

  console.log(`${originals.length} originals, ${missing.length} missing at least one variant${dryRun ? " (dry run)" : ""}`);
  if (dryRun) {
    missing.slice(0, 20).forEach((n) => console.log("  would create variants for", n));
    if (missing.length > 20) console.log(`  ...and ${missing.length - 20} more`);
    return;
  }

  let done = 0;
  let failed = 0;
  for (const name of missing.slice(0, limit)) {
    const path = `uploads/${name}`;
    try {
      const { data, error } = await supabase.storage.from(BUCKET).download(path);
      if (error || !data) throw new Error(error?.message || "download failed");
      const source = Buffer.from(await data.arrayBuffer());
      await buildVariantBuffer(source, "sm"); // fail fast on undecodable files (e.g. raw HEIC)
      const stored = await uploadImageVariants(supabase, BUCKET, path, source);
      console.log(`  ${path}: stored ${stored.join(", ") || "nothing"}`);
      if (stored.length === 0) failed++;
      else done++;
    } catch (err) {
      failed++;
      console.warn(`  ${path}: skipped (${err.message})`);
    }
  }
  console.log(`Done. ${done} photos got variants, ${failed} skipped.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
