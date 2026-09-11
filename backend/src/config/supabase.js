import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_SERVICE_ROLE_KEY &&
  !SUPABASE_URL.includes("your-supabase-url") &&
  !SUPABASE_SERVICE_ROLE_KEY.includes("your-supabase-service-role-key")
);

export let supabase = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log(" Connected to Supabase backend successfully.");
  } catch (error) {
    console.warn(" Failed to initialize Supabase client, falling back to in-memory store:", error.message);
  }
} else {
  console.log("ℹ Supabase credentials not yet detected in .env. Running with local fallback data store.");
}

// In-memory fallback database store
export const inMemoryStore = {
  products: [
    {
      id: "shimmer-organza-saree",
      name: "Shimmer Organza Saree",
      price: 2499,
      original_price: 3499,
      category: "Designer Sarees",
      material: "Organza",
      stock: 15,
      rating: 4.8,
      review_count: 24,
      featured: true,
      description: "A weightless organza drape with a soft metallic sheen and embroidered borders.",
      colors: ["Dusty Rose", "Champagne Gold", "Soft Lilac"],
      images: [
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop"
      ]
    },
    {
      id: "banarasi-katan-silk-saree",
      name: "Banarasi Katan Silk Saree",
      price: 4999,
      original_price: 6999,
      category: "Silk Sarees",
      material: "Silk",
      stock: 8,
      rating: 4.9,
      review_count: 38,
      featured: true,
      description: "Handwoven pure Katan silk saree adorned with intricate floral zari motifs and kadwa pallu.",
      colors: ["Royal Crimson", "Deep Emerald", "Imperial Violet"],
      images: [
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop"
      ]
    },
    {
      id: "handloom-chanderi-cotton-silk",
      name: "Handloom Chanderi Saree",
      price: 1899,
      original_price: 2799,
      category: "Cotton Sarees",
      material: "Cotton",
      stock: 20,
      rating: 4.7,
      review_count: 19,
      featured: false,
      description: "Featherlight Chanderi weave with gold zari borders and breathable texture for daytime occasions.",
      colors: ["Ivory Mist", "Sage Green", "Peach Gold"],
      images: [
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop"
      ]
    },
    {
      id: "kanjivaram-bridal-heritage-saree",
      name: "Kanjivaram Bridal Heritage Saree",
      price: 8999,
      original_price: 11999,
      category: "Silk Sarees",
      material: "Silk",
      stock: 5,
      rating: 5.0,
      review_count: 42,
      featured: true,
      description: "Authentic temple-border Kanjivaram woven with 3-ply mulberry silk and dipped in pure gold zari.",
      colors: ["Rani Pink", "Temple Red", "Golden Ochre"],
      images: [
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop"
      ]
    }
  ],
  orders: [
    {
      id: "ord-1001",
      order_number: "RSF-2026-9812",
      customer_name: "Ananya Sharma",
      email: "ananya.sharma@example.com",
      phone: "+91 9876543210",
      shipping_address: {
        address: "42, Vasant Vihar, Sector 4",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110057"
      },
      items: [
        {
          id: "banarasi-katan-silk-saree",
          name: "Banarasi Katan Silk Saree",
          quantity: 1,
          price: 4999,
          color: "Royal Crimson",
          image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop"
        }
      ],
      subtotal: 4999,
      shipping_fee: 0,
      discount_amount: 500,
      coupon_code: "FIRST500",
      total: 4499,
      payment_method: "razorpay",
      payment_status: "paid",
      order_status: "processing",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
    },
    {
      id: "ord-1002",
      order_number: "RSF-2026-9813",
      customer_name: "Priyanka Nair",
      email: "priyanka.nair@example.com",
      phone: "+91 9123456780",
      shipping_address: {
        address: "702, Skyline Residency, Indiranagar",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560038"
      },
      items: [
        {
          id: "shimmer-organza-saree",
          name: "Shimmer Organza Saree",
          quantity: 2,
          price: 2499,
          color: "Dusty Rose",
          image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop"
        }
      ],
      subtotal: 4998,
      shipping_fee: 0,
      discount_amount: 0,
      coupon_code: null,
      total: 4998,
      payment_method: "upi",
      payment_status: "paid",
      order_status: "new",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    }
  ],
  coupons: [
    {
      id: "coup-1",
      code: "ROYAL10",
      description: "10% off on all royal sarees",
      discount_type: "percentage",
      discount_value: 10,
      min_order_value: 1999,
      max_uses: 500,
      times_used: 42,
      is_active: true,
      expires_at: "2026-12-31T23:59:59.000Z"
    },
    {
      id: "coup-2",
      code: "FESTIVE20",
      description: "20% off for orders above ₹4,000",
      discount_type: "percentage",
      discount_value: 20,
      min_order_value: 4000,
      max_uses: 200,
      times_used: 19,
      is_active: true,
      expires_at: "2026-11-30T23:59:59.000Z"
    },
    {
      id: "coup-3",
      code: "FIRST500",
      description: "Flat ₹500 off on first order above ₹2,999",
      discount_type: "fixed",
      discount_value: 500,
      min_order_value: 2999,
      max_uses: 1000,
      times_used: 135,
      is_active: true,
      expires_at: "2026-12-31T23:59:59.000Z"
    }
  ],
  cms_content: {
    hero_banner: {
      section_key: "hero_banner",
      title: "Heirloom Silks & Pure Handloom Drapes",
      subtitle: "Timeless handwoven elegance curated from master weavers across India.",
      badge: "The Royal Heritage Collection",
      image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1600&auto=format&fit=crop",
      link: "/shop"
    },
    festive_banner: {
      section_key: "festive_banner",
      title: "Festive Weaves 2026",
      subtitle: "Limited festive edition Kanjivarams and Banarasis with real gold zari.",
      badge: "Exclusive Atelier",
      image_url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
      link: "/shop?category=Festive+Wear"
    },
    story_banner: {
      section_key: "story_banner",
      title: "Crafted for Every Legacy",
      subtitle: "Preserving authentic Indian weaving traditions for three decades.",
      badge: "Artisanal Heritage",
      image_url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop",
      link: "/our-story"
    }
  }
};
