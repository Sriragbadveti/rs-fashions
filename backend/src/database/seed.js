import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const products = [
  {
    id: "rose-silk-saree",
    name: "Rose Silk Saree",
    category: "Silk Sarees",
    material: "Pure Silk",
    price: 4999,
    original_price: 6499,
    rating: 4.8,
    review_count: 124,
    description: "A softly luminous silk saree designed around graceful drape, delicate colour and timeless elegance.",
    images: [
      "https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/e/m/embroidered-viscose-silk-saree-in-baby-pink-v1-sgsa847_1.jpg",
      "https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/e/m/embroidered-viscose-silk-saree-in-baby-pink-v1-sgsa847.jpg",
    ],
    colors: ["Rose", "Ivory", "Wine"],
    stock: 15,
    featured: true,
  },
  {
    id: "ivory-cotton-saree",
    name: "Ivory Cotton Saree",
    category: "Cotton Sarees",
    material: "Organic Cotton",
    price: 2899,
    original_price: 3699,
    rating: 4.6,
    review_count: 89,
    description: "Breathable, lightweight and effortlessly graceful cotton weave for everyday celebration.",
    images: [
      "https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/b/a/bandhej-printed-cotton-saree-in-cream-v1-sfc217.jpg",
      "https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/b/a/bandhej-printed-cotton-saree-in-cream-v1-sfc217_1.jpg",
    ],
    colors: ["Cream", "Sand", "Sage"],
    stock: 20,
    featured: true,
  },
  {
    id: "emerald-banarasi-saree",
    name: "Emerald Banarasi Saree",
    category: "Silk Sarees",
    material: "Banarasi Silk",
    price: 8499,
    original_price: 10999,
    rating: 4.9,
    review_count: 210,
    description: "Rich heritage gold zari motifs woven on opulent royal emerald green silk.",
    images: [
      "https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/w/o/woven-art-silk-saree-in-emerald-green-v1-ssf833_2.jpg",
      "https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/w/o/woven-art-silk-saree-in-emerald-green-v1-ssf833_1.jpg",
    ],
    colors: ["Emerald", "Forest Green", "Peacock Blue"],
    stock: 8,
    featured: true,
  },
  {
    id: "kanjivaram-bridal-heritage-saree",
    name: "Kanjivaram Bridal Heritage Saree",
    category: "Silk Sarees",
    material: "Pure Kanjivaram Silk",
    price: 12999,
    original_price: 16999,
    rating: 5.0,
    review_count: 145,
    description: "Authentic temple-border Kanjivaram woven with 3-ply mulberry silk and pure gold zari.",
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
    ],
    colors: ["Rani Pink", "Temple Crimson", "Golden Ochre"],
    stock: 5,
    featured: true,
  },
  {
    id: "shimmer-organza-saree",
    name: "Shimmer Organza Saree",
    category: "Designer Sarees",
    material: "Organza",
    price: 3499,
    original_price: 4999,
    rating: 4.7,
    review_count: 98,
    description: "Weightless organza drape with a gentle metallic sheen and delicate hand-embroidery.",
    images: [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop",
    ],
    colors: ["Dusty Rose", "Champagne Gold", "Soft Lilac"],
    stock: 12,
    featured: false,
  },
];

async function seed() {
  console.log("🌱 Connecting and seeding Supabase database...");
  
  // 1. Insert Products
  const { data: prodData, error: prodErr } = await supabase
    .from("products")
    .upsert(products, { onConflict: "id" })
    .select();

  if (prodErr) {
    console.error("❌ Error seeding products:", prodErr.message);
  } else {
    console.log(`✅ Successfully seeded/updated ${prodData?.length} products in Supabase.`);
  }

  // 2. Check CMS Content
  const { data: cmsData, error: cmsErr } = await supabase.from("cms_content").select("*");
  if (cmsErr) {
    console.error("❌ Error querying cms_content:", cmsErr.message);
  } else {
    console.log(`✅ Found ${cmsData?.length} CMS sections in Supabase.`);
  }

  // 3. Check Coupons
  const { data: couponData, error: coupErr } = await supabase.from("coupons").select("*");
  if (coupErr) {
    console.error("❌ Error querying coupons:", coupErr.message);
  } else {
    console.log(`✅ Found ${couponData?.length} active promo codes in Supabase.`);
  }

  console.log("🎉 Supabase database validation completed successfully!");
}

seed();
