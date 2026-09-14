import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowUpRight,
  FiShoppingBag,
  FiCheck,
  FiStar,
  FiCompass,
  FiEye,
} from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import type { Product } from "../../data/products";

export interface TrendingItem {
  id: string;
  name: string;
  category: string;
  material: string;
  price: number;
  originalPrice: number;
  badge: string;
  rating: number;
  reviewCount: number;
  images: string[];
  description: string;
}

export interface TrendingConfig {
  isEnabled: boolean;
  sectionTitle: string;
  highlightWord: string;
  subtitle: string;
  items: TrendingItem[];
}

const DEFAULT_TRENDING_ITEMS: TrendingItem[] = [
  {
    id: "midnight-sico-gadwal",
    name: "Midnight Royal SiCo Gadwal",
    category: "SiCo Gadwal Sarees",
    material: "Silk Cotton (SiCo)",
    price: 7999,
    originalPrice: 9999,
    badge: "Trending Now",
    rating: 4.9,
    reviewCount: 64,
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&auto=format&fit=crop&q=80",
    ],
    description: "Deep midnight blue body with contrast scarlet red temple zari border.",
  },
  {
    id: "emerald-sico-gadwal",
    name: "Emerald Gatti Border SiCo Gadwal",
    category: "SiCo Gadwal Sarees",
    material: "Silk Cotton (SiCo)",
    price: 8499,
    originalPrice: 11200,
    badge: "Signature Border",
    rating: 4.8,
    reviewCount: 42,
    images: [
      "https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/w/o/woven-art-silk-saree-in-emerald-green-v1-ssf833_2.jpg",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80",
    ],
    description: "Opulent emerald green silk cotton with authentic gatti border and gold buttas.",
  },
  {
    id: "crimson-sico-gadwal",
    name: "Crimson Temple SiCo Gadwal",
    category: "SiCo Gadwal Sarees",
    material: "Silk Cotton (SiCo)",
    price: 6499,
    originalPrice: 8500,
    badge: "Festive Favorite",
    rating: 4.9,
    reviewCount: 57,
    images: [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80",
    ],
    description: "Traditional vermilion crimson red drape featuring authentic kumbha temple edging.",
  },
  {
    id: "ivory-sico-gadwal",
    name: "Ivory Gold SiCo Gadwal",
    category: "SiCo Gadwal Sarees",
    material: "Silk Cotton (SiCo)",
    price: 5899,
    originalPrice: 7800,
    badge: "Most Loved",
    rating: 4.8,
    reviewCount: 38,
    images: [
      "https://images.pexels.com/photos/33328181/pexels-photo-33328181.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://cdn.corenexis.com/f/Gr2AsoVtVeK.png",
    ],
    description: "Sublime ivory silk cotton drape with pure woven gold zari border.",
  },
];

function loadTrendingConfig(): TrendingConfig {
  try {
    const saved = localStorage.getItem("rs_fashions_trending_config");
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        isEnabled: parsed.isEnabled ?? true,
        sectionTitle: parsed.sectionTitle || "Trending",
        highlightWord: parsed.highlightWord || "Pieces.",
        subtitle:
          parsed.subtitle ||
          "Hand-picked heritage Gadwal drapes celebrated for their timeless interlocked zari weave.",
        items:
          Array.isArray(parsed.items) && parsed.items.length > 0
            ? parsed.items
            : DEFAULT_TRENDING_ITEMS,
      };
    }
  } catch {}
  return {
    isEnabled: true,
    sectionTitle: "Trending",
    highlightWord: "Pieces.",
    subtitle:
      "Hand-picked heritage Gadwal drapes celebrated for their timeless interlocked zari weave.",
    items: DEFAULT_TRENDING_ITEMS,
  };
}

export default function TrendingProducts() {
  const { addToCart } = useCart();
  const [config, setConfig] = useState<TrendingConfig>(loadTrendingConfig);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleConfigChange = () => {
      setConfig(loadTrendingConfig());
    };
    window.addEventListener("trendingConfigChanged", handleConfigChange);
    window.addEventListener("storage", handleConfigChange);
    return () => {
      window.removeEventListener("trendingConfigChanged", handleConfigChange);
      window.removeEventListener("storage", handleConfigChange);
    };
  }, []);

  // Master Disappearance: If disabled by admin, render nothing
  if (!config.isEnabled || config.items.length === 0) {
    return null;
  }

  const handleQuickAddToCart = (item: TrendingItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const productPayload: Product = {
      id: item.id,
      name: item.name,
      category: "SiCo Gadwal Sarees",
      material: item.material || "Silk Cotton (SiCo)",
      price: item.price,
      originalPrice: item.originalPrice,
      images: item.images,
      colors: ["Standard"],
      sizes: ["Free Size (5.5m + 0.8m Blouse)"],
      description: item.description,
      longDescription: `Signature ${item.name}. Woven with authentic SiCo Gadwal interlocked borders and pure certified zari.`,
      stock: 6,
      rating: item.rating || 4.9,
      reviewCount: item.reviewCount || 40,
      featured: true,
    };

    addToCart(productPayload, { quantity: 1 });
    setAddedItemIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [item.id]: false }));
    }, 2000);
  };

  return (
    <section className="relative overflow-hidden bg-[#FAF7F2] px-4 py-14 sm:px-6 sm:py-24 lg:px-10 font-sans select-none">
      {/* Ambient Lighting Accents */}
      <div className="pointer-events-none absolute -top-20 left-1/4 h-80 w-80 rounded-full bg-linear-to-br from-[#E8D4C8]/35 to-[#8E3D51]/8 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-10 h-96 w-96 rounded-full bg-linear-to-tl from-[#F0E6DD]/60 to-transparent blur-3xl" />

      <div className="relative mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-10 flex flex-col justify-between gap-4 border-b border-black/8 pb-6 sm:flex-row sm:items-end">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8E3D51]">
              Curated Highlights &bull; SiCo Gadwal Sarees
            </span>
            <h2 className="mt-2 font-serif text-3xl sm:text-5xl font-normal tracking-tight text-[#2A2421]">
              {config.sectionTitle}{" "}
              <span className="italic font-light text-[#8E3D51]">
                {config.highlightWord}
              </span>
            </h2>
            <p className="mt-1.5 text-xs text-[#7A6E64] font-light max-w-lg leading-relaxed">
              {config.subtitle}
            </p>
          </div>

          <Link
            to="/shop"
            className="group hidden sm:inline-flex items-center gap-2.5 rounded-full border border-black/10 bg-white/80 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#2A2421] shadow-xs backdrop-blur-md transition-all duration-300 hover:border-[#8E3D51]/40 hover:bg-white hover:text-[#8E3D51] hover:shadow-sm active:scale-98"
          >
            <FiCompass size={14} className="text-[#8E3D51]" />
            <span>Explore All Drapes</span>
            <FiArrowUpRight
              size={13}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>

        {/* Self-Contained Products Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {config.items.map((item, idx) => {
            const primaryImage = item.images?.[0] || DEFAULT_TRENDING_ITEMS[0].images[0];
            const hoverImage = item.images?.[1] || primaryImage;
            const discountPercent =
              item.originalPrice && item.originalPrice > item.price
                ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                : null;
            const isAdded = addedItemIds[item.id];

            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="group relative flex flex-col"
              >
                {/* Saree Card Frame */}
                <div className="relative block aspect-[0.74] w-full overflow-hidden rounded-[26px] bg-[#EDE8E0] shadow-[0_8px_30px_rgba(42,36,33,0.04)] border border-stone-200/60 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(142,61,81,0.14)] hover:-translate-y-1">
                  <Link
                    to={`/product/${item.id}`}
                    state={{
                      product: {
                        id: item.id,
                        name: item.name,
                        category: "SiCo Gadwal Sarees",
                        material: item.material || "Silk Cotton (SiCo)",
                        price: item.price,
                        originalPrice: item.originalPrice,
                        images: item.images,
                        colors: ["Standard"],
                        sizes: ["Free Size"],
                        description: item.description,
                        longDescription: item.description || "Authentic handcrafted SiCo Gadwal drape with heritage zari border.",
                        stock: 6,
                        rating: item.rating,
                        reviewCount: item.reviewCount,
                      },
                    }}
                    className="absolute inset-0 z-0"
                  >
                    {/* Primary Image */}
                    <img
                      src={primaryImage}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    />

                    {/* Alternate Hover Image */}
                    {hoverImage && (
                      <img
                        src={hoverImage}
                        alt={`${item.name} alternate angle`}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100 group-hover:scale-105"
                      />
                    )}

                    {/* Ambient Dark Gradient Layer */}
                    <div className="absolute inset-0 bg-linear-to-t from-stone-950/70 via-stone-950/15 to-black/10 opacity-70 transition-opacity duration-300 group-hover:opacity-85" />
                  </Link>

                  {/* Top Badges (Pointer Events None) */}
                  <div className="absolute inset-x-3.5 top-3.5 flex items-center justify-between pointer-events-none z-10">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 font-sans text-[9px] font-bold uppercase tracking-[0.16em] text-[#8E3D51] shadow-xs backdrop-blur-md border border-white/60">
                      <FiStar size={10} className="fill-[#8E3D51] text-[#8E3D51]" />
                      <span>{item.badge || "Trending"}</span>
                    </span>

                    <span className="inline-flex items-center rounded-full bg-black/35 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/95 backdrop-blur-md border border-white/10">
                      SiCo Gadwal
                    </span>
                  </div>

                  {/* Floating Glassmorphic Details Plate */}
                  <div className="absolute inset-x-3 bottom-3 z-10 rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-md border border-white/70 transition-all duration-300 group-hover:bg-white/95 group-hover:shadow-md">
                    {/* Material Tag */}
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#8C7A6B] mb-1">
                      <span className="font-semibold text-[#8E3D51] truncate">
                        {item.material || "Silk Cotton (SiCo)"}
                      </span>
                      {discountPercent && (
                        <span className="rounded-md bg-[#8E3D51]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#8E3D51]">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    {/* Saree Name */}
                    <Link
                      to={`/product/${item.id}`}
                      className="block font-serif text-sm sm:text-[15px] font-normal leading-snug tracking-tight text-[#2A2421] line-clamp-1 hover:text-[#8E3D51] transition-colors"
                    >
                      {item.name}
                    </Link>

                    {/* Description preview */}
                    <p className="mt-1 line-clamp-1 text-[11px] text-[#786C63] font-light italic">
                      {item.description}
                    </p>

                    {/* Pricing & Add to Cart Button */}
                    <div className="mt-3 flex items-center justify-between border-t border-black/6 pt-2.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-[#8E3D51]">
                          ₹{item.price.toLocaleString("en-IN")}
                        </span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="text-[10px] text-stone-400 line-through">
                            ₹{item.originalPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      {/* Add to Bag Button */}
                      <button
                        type="button"
                        onClick={(e) => handleQuickAddToCart(item, e)}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all shadow-xs active:scale-95 ${
                          isAdded
                            ? "bg-emerald-600 text-white"
                            : "bg-[#2A0E20] hover:bg-[#3D142E] text-amber-100"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <FiCheck size={12} className="stroke-[3]" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <FiShoppingBag size={12} />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* Mobile View All Footer */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/shop"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#2A2421] shadow-xs border border-black/8 active:scale-98"
          >
            <span>Explore All Drapes</span>
            <FiArrowUpRight size={14} className="text-[#8E3D51]" />
          </Link>
        </div>
      </div>
    </section>
  );
}
