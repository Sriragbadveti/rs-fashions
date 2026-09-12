import { supabase } from "../config/supabase.js";

const sampleProducts = [
  {
    id: "kanjivaram-bridal-heritage-saree",
    name: "Kanjivaram Bridal Heritage Saree",
    category: "Pure Silk Kanjivaram",
    material: "Pure Kanjivaram Silk",
    price: 12999,
    original_price: 16999,
    stock: 5,
    images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop"],
    colors: ["Rani Pink", "Gold"],
    tags: ["bridal", "kanjivaram", "pure silk", "heritage"],
    rating: 4.9,
    review_count: 18,
    featured: true,
    description: "Authentic temple-border Kanjivaram woven with 3-ply mulberry silk and pure gold zari.",
  },
  {
    id: "emerald-banarasi-saree",
    name: "Emerald Banarasi Saree",
    category: "Banarasi Silk Heritage",
    material: "Banarasi Silk",
    price: 8499,
    original_price: 11200,
    stock: 8,
    images: ["https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/w/o/woven-art-silk-saree-in-emerald-green-v1-ssf833_2.jpg"],
    colors: ["Emerald", "Gold Zari"],
    tags: ["banarasi", "emerald", "festive", "zari"],
    rating: 4.8,
    review_count: 14,
    featured: true,
    description: "Rich heritage gold zari motifs woven on opulent royal emerald green silk.",
  },
  {
    id: "rose-silk-saree",
    name: "Rose Silk Saree",
    category: "Pure Silk Kanjivaram",
    material: "Pure Silk",
    price: 4999,
    original_price: 6499,
    stock: 9,
    images: ["https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/e/m/embroidered-viscose-silk-saree-in-baby-pink-v1-sgsa847_1.jpg"],
    colors: ["Rose", "Silver"],
    tags: ["silk", "soft silk", "pastel"],
    rating: 4.7,
    review_count: 11,
    featured: true,
    description: "A softly luminous silk saree designed around graceful drape, delicate colour and timeless elegance.",
  },
  {
    id: "ivory-cotton-saree",
    name: "Ivory Cotton Saree",
    category: "Handloom Mulberry Cotton",
    material: "Organic Cotton",
    price: 2899,
    original_price: 3800,
    stock: 20,
    images: ["https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/b/a/bandhej-printed-cotton-saree-in-cream-v1-sfc217.jpg"],
    colors: ["Cream", "Beige"],
    tags: ["cotton", "handloom", "daily luxury", "summer"],
    rating: 4.8,
    review_count: 22,
    featured: false,
    description: "Breathable, lightweight and effortlessly graceful cotton weave for everyday celebration.",
  },
  {
    id: "shimmer-organza-saree",
    name: "Shimmer Organza Saree",
    category: "Banarasi Silk Heritage",
    material: "Organza",
    price: 3499,
    original_price: 4500,
    stock: 11,
    images: ["https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop"],
    colors: ["Dusty Rose", "Silver Sheen"],
    tags: ["organza", "tissue", "modern", "party"],
    rating: 4.6,
    review_count: 9,
    featured: false,
    description: "Weightless organza drape with a gentle metallic sheen and delicate hand-embroidery.",
  },
];

async function seedDatabase() {
  console.log("Seeding initial saree vault into new Supabase project...");
  if (!supabase) {
    console.error("Supabase not initialized");
    process.exit(1);
  }

  for (const prod of sampleProducts) {
    const { error } = await supabase.from("products").upsert(prod);
    if (error) {
      console.error(`Error inserting ${prod.name}:`, error.message);
    } else {
      console.log(`[+] Seeded Saree: ${prod.name} (₹${prod.price})`);
    }
  }

  console.log("Seeding completed successfully!");
}

seedDatabase();
