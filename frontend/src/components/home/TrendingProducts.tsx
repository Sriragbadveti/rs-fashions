import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowUpRight, FiCompass } from "react-icons/fi";
import { Sparkles, Package } from "lucide-react";
import { API_BASE } from "../../config/api";
import type { Product } from "../../types/inventory";

export default function TrendingProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchTrendingProducts() {
      try {
        const res = await fetch(`${API_BASE}/catalog/products?trending=true`);
        if (!res.ok) {
          if (isMounted) {
            setProducts([]);
            setLoading(false);
          }
          return;
        }
        const data = await res.json();
        const list: Product[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : [];

        // Strict verification: only sarees marked as Special Offer appear
        const specialOffers = list.filter((p) => {
          return (
            p.isSpecialOffer === true ||
            (Array.isArray(p.tags) &&
              p.tags.some(
                (tag) => String(tag).trim().toLowerCase() === "special_offer"
              ))
          );
        });

        if (isMounted) {
          setProducts(specialOffers);
          setLoading(false);
        }
      } catch (err) {
        console.warn("Failed to fetch trending special offer sarees:", err);
        if (isMounted) {
          setProducts([]);
          setLoading(false);
        }
      }
    }

    fetchTrendingProducts();

    const handleSync = () => {
      fetchTrendingProducts();
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("catalogUpdated", handleSync);

    return () => {
      isMounted = false;
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("catalogUpdated", handleSync);
    };
  }, []);

  // If loading or no sarees are marked as Special Offer, hide the section cleanly
  if (loading || products.length === 0) {
    return null;
  }

  // Double items for seamless infinite marquee loop if there are multiple items
  const displayItems =
    products.length >= 3 ? [...products, ...products] : products;

  return (
    <section className="relative overflow-hidden bg-[#FAF7F2] py-14 sm:py-24 font-sans select-none border-t border-stone-200/50">
      {/* Ambient Luxury Lighting Accents */}
      <div className="pointer-events-none absolute -top-20 left-1/4 h-80 w-80 rounded-full bg-linear-to-br from-[#E8D4C8]/35 to-[#8E3D51]/8 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-10 h-96 w-96 rounded-full bg-linear-to-tl from-[#F0E6DD]/60 to-transparent blur-3xl" />

      {/* Header Container */}
      <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <div className="mb-10 flex flex-col justify-between gap-4 border-b border-black/8 pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E3D51]">
              <Sparkles size={11} className="text-amber-600" />
              <span>Special Offer Showcase &bull; SiCo Gadwal</span>
            </div>
            <h2 className="mt-2 font-serif text-3xl sm:text-5xl font-normal tracking-tight text-[#2A2421]">
              Trending{" "}
              <span className="italic font-light text-[#8E3D51]">Pieces.</span>
            </h2>
            <p className="mt-1.5 text-xs text-[#7A6E64] font-light max-w-lg leading-relaxed">
              Exclusively curated SiCo Gadwal creations currently marked on Special Offer by our weavers and curators.
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
      </div>

      {/* Marquee Track Container with Fade Edges */}
      <div className="group/track relative w-full overflow-hidden">
        {/* Soft edge gradients */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-linear-to-r from-[#FAF7F2] to-transparent sm:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-linear-to-l from-[#FAF7F2] to-transparent sm:w-28" />

        {/* Moving Track */}
        <motion.div
          className="flex w-max gap-6 px-4"
          animate={{ x: products.length >= 3 ? ["0%", "-50%"] : "0%" }}
          transition={{
            ease: "linear",
            duration: Math.max(20, products.length * 6),
            repeat: Infinity,
          }}
          whileHover={{ animationPlayState: "paused" }}
        >
          {displayItems.map((item, idx) => {
            const primaryImage =
              item.imageUrl ||
              (Array.isArray(item.images) && item.images[0]) ||
              (item.variants?.[0]?.imageUrl ?? "");
            const hoverImage =
              (Array.isArray(item.images) && item.images[1]) || primaryImage;
            const price = Number(item.salePrice || 0);

            return (
              <div
                key={`${item.id}-${idx}`}
                className="group relative flex w-72 shrink-0 flex-col sm:w-[320px] lg:w-80"
              >
                {/* Saree Card Frame */}
                <div className="relative block aspect-[0.78] w-full overflow-hidden rounded-[26px] bg-[#EDE8E0] shadow-[0_8px_30px_rgba(42,36,33,0.04)] border border-stone-200/60 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(142,61,81,0.14)] hover:-translate-y-1">
                  <Link to={`/product/${item.id}`} className="absolute inset-0 z-0">
                    {/* Primary Image */}
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-stone-100">
                        <Package size={42} className="text-stone-300" />
                      </div>
                    )}

                    {/* Alternate Hover Image */}
                    {hoverImage && hoverImage !== primaryImage && (
                      <img
                        src={hoverImage}
                        alt={`${item.name} alternate view`}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100 group-hover:scale-105"
                      />
                    )}

                    {/* Ambient Dark Gradient Layer */}
                    <div className="absolute inset-0 bg-linear-to-t from-stone-950/75 via-stone-950/20 to-black/10 opacity-70 transition-opacity duration-300 group-hover:opacity-85" />
                  </Link>

                  {/* Special Offer Luxury Ribbon Badge */}
                  <div className="absolute left-3.5 top-3.5 z-10 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-3 py-1 shadow-md backdrop-blur-xs">
                    <Sparkles size={11} className="text-white animate-pulse" />
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-white">
                      Special Offer
                    </span>
                  </div>

                  {/* Floating Glassmorphic Details Plate */}
                  <div className="absolute inset-x-3 bottom-3 z-10 rounded-2xl bg-white/85 p-3.5 shadow-sm backdrop-blur-md border border-white/70 transition-all duration-300 group-hover:bg-white/95 group-hover:shadow-md">
                    <div className="flex items-center justify-between text-[10px] tracking-wider text-[#8C7A6B] mb-1">
                      <span className="font-semibold text-[#8E3D51] truncate">
                        SiCo Gadwal Handloom
                      </span>
                      {item.variants && item.variants.length > 0 && (
                        <span className="text-stone-500 font-mono text-[9.5px]">
                          {item.variants.length} {item.variants.length === 1 ? "shade" : "shades"}
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/product/${item.id}`}
                      className="block font-serif text-sm sm:text-[15px] font-semibold leading-snug tracking-tight text-[#2A2421] line-clamp-1 hover:text-[#8E3D51] transition-colors"
                    >
                      {item.name}
                    </Link>

                    <div className="mt-2 flex items-center justify-between pt-1 border-t border-stone-100">
                      <span className="text-sm font-bold text-stone-900">
                        ₹{price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] font-bold text-[#8E3D51] uppercase tracking-wider group-hover:underline">
                        View Drape &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Mobile View All Button */}
      <div className="mt-8 px-4 text-center sm:hidden">
        <Link
          to="/shop"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#2A2421] shadow-xs border border-black/8 active:scale-98"
        >
          <span>Explore All Drapes</span>
          <FiArrowUpRight size={14} className="text-[#8E3D51]" />
        </Link>
      </div>
    </section>
  );
}