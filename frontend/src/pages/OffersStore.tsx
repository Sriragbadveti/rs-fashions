import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiTag,
  FiGift,
  FiShoppingBag,
  FiCheck,
  FiArrowRight,
  FiSearch,
  FiSliders,
  FiRotateCcw,
  FiStar,
  FiShield,
  FiArrowUpRight,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { API_BASE } from "../config/api";
import type { SaleConfig, SaleProductItem, SaleTierOffer } from "../types/inventory";
import { type Product } from "../data/products";

const DEFAULT_TIERS: SaleTierOffer[] = [
  { id: "tier-1", qty: 1, price: 2500, label: "Buy 1 @2500/-", savingsText: "Special Single Drape Offer" },
  { id: "tier-2", qty: 2, price: 4900, label: "Buy 2 @4900/-", savingsText: "Popular Double Drape Combo" },
  { id: "tier-3", qty: 3, price: 4800, label: "Buy 3 @4800/-", savingsText: "Grand Celebration Value" },
];

export default function OffersStore() {
  const { items: cartItems, addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc">("featured");
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const [saleConfig, setSaleConfig] = useState<SaleConfig>(() => {
    try {
      const saved = localStorage.getItem("rs_fashions_sale_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch {}
    return {
      isEnabled: true,
      saleTitle: "Exclusive Festive Offer Drapes",
      subtitle: "Curated handloom SiCo Gadwal sarees with multi-piece bundle pricing",
      discountBadge: "Bundle Deal Live",
      saleProductIds: [],
      tierOffers: DEFAULT_TIERS,
      saleItems: [],
    };
  });

  // Load sale config from backend
  useEffect(() => {
    let isMounted = true;
    async function loadSale() {
      try {
        const res = await fetch(`${API_BASE}/settings/sale`);
        if (res.ok) {
          const json = await res.json();
          const conf = json?.data?.saleConfig || json?.saleConfig;
          if (isMounted && conf) {
            setSaleConfig(conf);
            localStorage.setItem("rs_fashions_sale_config", JSON.stringify(conf));
          }
        }
      } catch (err) {
        console.warn("Offers store sale load notice:", err);
      }
    }
    loadSale();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter offer-eligible products strictly from configured database items
  const offerProducts: SaleProductItem[] = useMemo(() => {
    return (saleConfig.saleItems || []).filter((item) => item.isActive !== false);
  }, [saleConfig.saleItems]);

  // Count offer items in cart for bundle progress bar
  const offerCountInCart = useMemo(() => {
    const offerIdSet = new Set(offerProducts.map((p) => String(p.id)));
    return cartItems.reduce((acc, item) => {
      const pid = String(item.product?.id || (item as any).id || "");
      if (offerIdSet.has(pid)) {
        return acc + item.quantity;
      }
      return acc;
    }, 0);
  }, [cartItems, offerProducts]);

  // Current active tier
  const activeTier = useMemo(() => {
    if (offerCountInCart >= 3) return saleConfig.tierOffers?.[2] || DEFAULT_TIERS[2];
    if (offerCountInCart === 2) return saleConfig.tierOffers?.[1] || DEFAULT_TIERS[1];
    if (offerCountInCart === 1) return saleConfig.tierOffers?.[0] || DEFAULT_TIERS[0];
    return null;
  }, [offerCountInCart, saleConfig.tierOffers]);

  // Handle Add to Cart
  const handleAddToCart = (item: SaleProductItem) => {
    const salePrice = item.salePrice || 2500;
    const prod: Product = {
      id: item.id,
      name: item.name,
      category: "SiCo Gadwal Sarees",
      material: "SiCo",
      price: salePrice,
      originalPrice: item.originalPrice || Math.round(salePrice * 1.3),
      stock: 10,
      rating: 4.9,
      reviewCount: 42,
      description: item.customOfferText || "Exclusive festive bundle offer drape.",
      longDescription: `Pure handloom SiCo Gadwal weave featuring signature zari borders and lightweight festive drape. Eligible for multi-piece bundle pricing.`,
      images: [item.imageUrl, item.imageUrl],
      colors: ["Festive Zari", "Royal Crimson"],
      sizes: ["Standard Drape (5.5m + 0.8m Blouse)"],
      featured: true,
    };

    addToCart(prod, { quantity: 1 });
    setAddedIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.id]: false }));
    }, 2000);
  };

  // Filter & Sort products
  const displayProducts = useMemo(() => {
    let list = offerProducts.filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
    });

    if (sortBy === "price_asc") {
      list.sort((a, b) => (a.salePrice || 0) - (b.salePrice || 0));
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => (b.salePrice || 0) - (a.salePrice || 0));
    }

    return list;
  }, [offerProducts, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2A2421] pb-24 font-sans">
      {/* =========================================================
          HERO BANNER & BUNDLE TIERS SHOWCASE
      ========================================================== */}
      <div className="relative overflow-hidden bg-linear-to-b from-[#1C1412] via-[#2A181C] to-[#1C1412] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300 backdrop-blur-md mb-4">
              <FiGift size={14} className="animate-pulse" />
              <span>Dedicated Offers Vault</span>
            </span>

            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-[#FAF8F5]">
              Exclusive <span className="italic font-normal text-amber-200">Offers Store.</span>
            </h1>

            <p className="mt-4 text-xs sm:text-sm text-stone-300 font-light leading-relaxed max-w-xl">
              All sarees in this exclusive store are hand-selected for our festive multi-piece bundle pricing. Add 1, 2, or 3 drapes to your bag — tiered savings apply automatically at checkout without coupons!
            </p>

            {/* BUNDLE TIERS TILES */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              {(saleConfig.tierOffers || DEFAULT_TIERS).map((tier, idx) => {
                const isSelected = offerCountInCart === tier.qty || (tier.qty === 3 && offerCountInCart >= 3);
                return (
                  <div
                    key={tier.id || idx}
                    className={`relative rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between ${
                      isSelected
                        ? "bg-amber-400/20 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.25)] scale-[1.03]"
                        : "bg-white/5 border-white/10 hover:border-amber-300/40 hover:bg-white/10"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute -top-2.5 right-4 rounded-full bg-amber-400 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-stone-950 shadow-sm">
                        Active in Cart
                      </span>
                    )}
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-300/80">
                        Bundle Tier {idx + 1}
                      </span>
                      <h3 className="font-serif text-xl sm:text-2xl font-normal text-white mt-1">
                        {tier.label}
                      </h3>
                      {tier.savingsText && (
                        <p className="text-xs text-stone-300 mt-1 font-light">
                          {tier.savingsText}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-amber-200">
                      <span>Add {tier.qty} {tier.qty === 1 ? "Saree" : "Sarees"}</span>
                      <span>₹{(tier.price / tier.qty).toFixed(0)} / drape</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* LIVE CART PROGRESS */}
            {offerCountInCart > 0 && (
              <div className="mt-8 w-full max-w-xl rounded-2xl bg-amber-500/15 border border-amber-400/40 p-4 text-left flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-stone-950 font-bold">
                    {offerCountInCart}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-amber-200">
                      {activeTier ? `Tier Unlocked: ${activeTier.label}` : "Offer Sarees in Cart"}
                    </p>
                    <p className="text-[11px] text-stone-300">
                      {offerCountInCart < 3
                        ? `Add ${3 - offerCountInCart} more offer drape to unlock Tier 3 mega savings!`
                        : "Maximum festive bundle discount applied!"}
                    </p>
                  </div>
                </div>

                <Link
                  to="/cart"
                  className="rounded-xl bg-amber-400 px-4 py-2 text-[11px] font-bold text-stone-950 hover:bg-amber-300 transition-colors shrink-0 flex items-center gap-1"
                >
                  <span>View Bag</span>
                  <FiArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-[#8E3D51]/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl" />
      </div>

      {/* =========================================================
          CONTROLS & SAREE GRID
      ========================================================== */}
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-12 mt-10">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs mb-8">
          <div className="relative flex-1">
            <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search offer-eligible sarees by weave or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-stone-200 pl-10 pr-4 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:border-[#8E3D51] focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-500 font-medium">
              Showing <strong>{displayProducts.length}</strong> Offer Drapes
            </span>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700 focus:border-[#8E3D51] focus:outline-hidden"
            >
              <option value="featured">Featured First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {displayProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 p-16 text-center bg-white shadow-xs">
            <FiTag size={40} className="mx-auto text-stone-400 mb-3" />
            <h3 className="font-serif text-xl text-stone-800">No Offer Sarees Found</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              We couldn't find any offer drapes matching your query. Explore our full handloom catalog instead.
            </p>
            <Link
              to="/shop"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#8E3D51] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#722F40] transition-colors"
            >
              <span>Explore All Sarees</span>
              <FiArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayProducts.map((item) => {
              const isAdded = addedIds[item.id];
              const salePrice = item.salePrice || 2500;
              const originalPrice = item.originalPrice || Math.round(salePrice * 1.3);
              const discount = Math.round(((originalPrice - salePrice) / originalPrice) * 100);

              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col rounded-3xl border border-stone-200 bg-white p-3 shadow-xs hover:shadow-xl transition-all duration-500"
                >
                  {/* Image Container with Badge */}
                  <div className="relative aspect-[0.78] w-full overflow-hidden rounded-2xl bg-stone-100">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Top Ribbons */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                      <span className="rounded-full bg-linear-to-r from-[#8E3D51] to-[#A2425B] px-3 py-1 text-[8.5px] font-bold uppercase tracking-widest text-white shadow-md border border-white/20">
                        Bundle Deal
                      </span>

                      {discount > 0 && (
                        <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-stone-950 shadow-sm">
                          {discount}% Off
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/product/${item.id}`}
                      className="absolute inset-0"
                      aria-label={item.name}
                    />
                  </div>

                  {/* Info Details */}
                  <div className="mt-3.5 flex flex-col justify-between flex-1 px-1 pb-1">
                    <div>
                      <span className="text-[9.5px] font-semibold uppercase tracking-wider text-[#8C7A6B]">
                        {item.category || "SiCo Gadwal Weave"}
                      </span>
                      <Link to={`/product/${item.id}`}>
                        <h3 className="font-serif text-base font-medium text-stone-900 group-hover:text-[#8E3D51] transition-colors line-clamp-1 mt-0.5">
                          {item.name}
                        </h3>
                      </Link>

                      {/* Pricing Row */}
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-base font-bold text-stone-900">
                          ₹{salePrice.toLocaleString("en-IN")}
                        </span>
                        {originalPrice > salePrice && (
                          <span className="text-xs text-stone-400 line-through">
                            ₹{originalPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      {/* Bundle Tier Tagline */}
                      <p className="mt-1.5 text-[10px] font-medium text-[#8E3D51] bg-[#FAF4ED] px-2 py-1 rounded-md border border-[#8E3D51]/15">
                        Buy 1 @ ₹2500 · Buy 2 @ ₹4900 · Buy 3 @ ₹4800
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2">
                      <Link
                        to={`/product/${item.id}`}
                        className="flex items-center justify-center py-2 px-3 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 transition-colors"
                      >
                        Details
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs ${
                          isAdded
                            ? "bg-emerald-600 text-white"
                            : "bg-[#8E3D51] hover:bg-[#722F40] text-white"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <FiCheck size={13} />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <FiShoppingBag size={13} />
                            <span>Add to Bag</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
