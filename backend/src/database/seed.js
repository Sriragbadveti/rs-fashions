import { supabase } from "../config/supabase.js";

const sampleCategories = [
  {
    id: "c1",
    name: "SiCo Gadwal Sarees",
    slug: "SGS",
    hsn: "5208",
    next_sequence: 3,
  },
];

const sampleProducts = [
  {
    id: "midnight-sico-gadwal",
    name: "Midnight SiCo Gadwal Saree",
    category: "SiCo Gadwal Sarees",
    material: "Silk Cotton (SiCo)",
    price: 7999,
    original_price: 9999,
    stock: 5,
    images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop"],
    colors: ["Midnight Blue", "Gold"],
    tags: ["sico", "gadwal", "festive", "heritage"],
    rating: 4.9,
    review_count: 18,
    featured: true,
    description: "Authentic temple-border SiCo Gadwal saree woven with fine silk cotton and pure gold zari.",
  },
  {
    id: "emerald-sico-gadwal",
    name: "Emerald SiCo Gadwal Saree",
    category: "SiCo Gadwal Sarees",
    material: "Silk Cotton (SiCo)",
    price: 8499,
    original_price: 11200,
    stock: 8,
    images: ["https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/w/o/woven-art-silk-saree-in-emerald-green-v1-ssf833_2.jpg"],
    colors: ["Emerald", "Gold Zari"],
    tags: ["sico", "gadwal", "emerald", "festive", "zari"],
    rating: 4.8,
    review_count: 14,
    featured: true,
    description: "Rich heritage gold zari motifs woven on opulent royal emerald green SiCo Gadwal silk cotton.",
  },
  {
    id: "rose-sico-gadwal",
    name: "Rose Pink SiCo Gadwal Saree",
    category: "SiCo Gadwal Sarees",
    material: "Silk Cotton (SiCo)",
    price: 4999,
    original_price: 6499,
    stock: 9,
    images: ["https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/e/m/embroidered-viscose-silk-saree-in-baby-pink-v1-sgsa847_1.jpg"],
    colors: ["Rose", "Silver"],
    tags: ["sico", "gadwal", "soft silk", "pastel"],
    rating: 4.7,
    review_count: 11,
    featured: true,
    description: "A softly luminous SiCo Gadwal saree designed around graceful drape, delicate colour and timeless elegance.",
  },
  {
    id: "ivory-sico-gadwal",
    name: "Ivory Gold SiCo Gadwal Saree",
    category: "SiCo Gadwal Sarees",
    material: "Silk Cotton (SiCo)",
    price: 5899,
    original_price: 7800,
    stock: 20,
    images: ["https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/b/a/bandhej-printed-cotton-saree-in-cream-v1-sfc217.jpg"],
    colors: ["Cream", "Beige"],
    tags: ["sico", "gadwal", "handloom", "daily luxury"],
    rating: 4.8,
    review_count: 22,
    featured: false,
    description: "Breathable, lightweight and effortlessly graceful SiCo Gadwal handloom weave for everyday celebration.",
  },
  {
    id: "crimson-sico-gadwal",
    name: "Crimson Temple SiCo Gadwal Saree",
    category: "SiCo Gadwal Sarees",
    material: "Silk Cotton (SiCo)",
    price: 6499,
    original_price: 8500,
    stock: 11,
    images: ["https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop"],
    colors: ["Crimson Red", "Gold Sheen"],
    tags: ["sico", "gadwal", "temple border", "festive"],
    rating: 4.8,
    review_count: 19,
    featured: false,
    description: "Weightless SiCo Gadwal drape with traditional interlocked temple border and rich zari pallu.",
  },
];

async function seedDatabase() {
  console.log("Seeding initial SiCo Gadwal saree vault into Supabase project...");
  if (!supabase) {
    console.error("Supabase not initialized");
    process.exit(1);
  }

  // Seed category
  for (const cat of sampleCategories) {
    const { error } = await supabase.from("categories").upsert(cat);
    if (error) {
      console.error(`Error inserting category ${cat.name}:`, error.message);
    } else {
      console.log(`[+] Seeded Weave Category: ${cat.name}`);
    }
  }

  // Seed products
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
