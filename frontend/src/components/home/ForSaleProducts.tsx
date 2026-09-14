import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiTag, FiCopy, FiCheck, FiShoppingBag, FiStar, FiGift } from "react-icons/fi";
import { type Product, products as fallbackProducts } from "../../data/products";
import ProductCard from "../product/ProductCard";
import { StoreService } from "../../services/supabase";
import { API_BASE } from "../../config/api";
import type { SaleConfig, SaleProductItem, SaleTierOffer } from "../../types/inventory";
import { useCart } from "../../context/CartContext";

const DEFAULT_TIER_OFFERS: SaleTierOffer[] = [
  { id: "tier-1", qty: 1, price: 2500, label: "Buy 1 @2500/-", savingsText: "Special Single Drape Offer" },
  { id: "tier-2", qty: 2, price: 4900, label: "Buy 2 @4900/-", savingsText: "Twin Celebration Bundle (Save ₹100)" },
  { id: "tier-3", qty: 3, price: 4800, label: "Buy 3 @4800/-", savingsText: "Festive Trio Special (Mega Value)" },
];

const DEFAULT_SALE_CONFIG: SaleConfig = {
  isEnabled: true,
  saleTitle: "Festive Loom Heritage Sale",
  subtitle: "Handcrafted authentic SiCo Gadwal treasures at special celebration bundle offers",
  discountBadge: "Bundle Offers Live",
  couponCode: "HERITAGE",
  saleProductIds: [],
  tierOffers: DEFAULT_TIER_OFFERS,
  saleItems: [],
};

export default function ForSaleProducts() {
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});
  const { addToCart } = useCart();

  const [saleConfig, setSaleConfig] = useState<SaleConfig>(() => {
    try {
      const saved = localStorage.getItem("rs_fashions_sale_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return {
            ...DEFAULT_SALE_CONFIG,
            ...parsed,
            tierOffers: parsed.tierOffers && parsed.tierOffers.length > 0 ? parsed.tierOffers : DEFAULT_TIER_OFFERS,
          };
        }
      }
    } catch {}
    return DEFAULT_SALE_CONFIG;
  });

  const [fallbackProds, setFallbackProds] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem("rs_fashions_products");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 4);
      }
    } catch {}
    return fallbackProducts.slice(0, 4);
  });

  useEffect(() => {
    let isMounted = true;

    async function loadSaleConfig() {
      try {
        const res = await fetch(`${API_BASE}/settings/sale`);
        if (!res.ok) return;
        const json = await res.json();
        const conf = json?.data?.saleConfig || json?.saleConfig;
        if (isMounted && conf) {
          const merged: SaleConfig = {
            ...DEFAULT_SALE_CONFIG,
            ...conf,
            tierOffers: conf.tierOffers && conf.tierOffers.length > 0 ? conf.tierOffers : DEFAULT_TIER_OFFERS,
            saleItems: Array.isArray(conf.saleItems) ? conf.saleItems : [],
          };
          setSaleConfig(merged);
          localStorage.setItem("rs_fashions_sale_config", JSON.stringify(merged));
        }
      } catch (err) {
        // Fallback to localStorage or default
      }
    }

    loadSaleConfig();

    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem("rs_fashions_sale_config");
        if (saved) {
          const parsed = JSON.parse(saved);
          setSaleConfig({
            ...DEFAULT_SALE_CONFIG,
            ...parsed,
            tierOffers: parsed.tierOffers && parsed.tierOffers.length > 0 ? parsed.tierOffers : DEFAULT_TIER_OFFERS,
          });
        }
      } catch {}
    };

    window.addEventListener("rs_fashions_sale_config_updated", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener("rs_fashions_sale_config_updated", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        const prods = await StoreService.getProducts();
        if (isMounted && Array.isArray(prods) && prods.length > 0) {
          setFallbackProds(prods.slice(0, 4));
        }
      } catch (err) {
        console.warn("Could not load fallback sale products:", err);
      }
    }
    loadProducts();
  }, []);

  const handleCopyCoupon = () => {
    if (!saleConfig.couponCode) return;
    navigator.clipboard.writeText(saleConfig.couponCode);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  const handleAddSaleItemToCart = (item: SaleProductItem) => {
    const salePrice = item.salePrice || 2500;
    const asProduct: Product = {
      id: item.id,
      name: item.name,
      category: "SiCo Gadwal Sarees",
      material: "Silk Cotton (SiCo)",
      price: salePrice,
      originalPrice: item.originalPrice || Math.round(salePrice * 1.3),
      stock: 5,
      rating: 4.9,
      reviewCount: 38,
      description: item.customOfferText || "Festive celebration special drape.",
      longDescription: `Handcrafted festive drape featuring authentic weave, temple zari border, and fine silk craftsmanship. Offered as part of our exclusive ${saleConfig.saleTitle}.`,
      images: [item.imageUrl, item.imageUrl],
      colors: ["Royal Maroon", "Festive Gold"],
      sizes: ["Free Size (6.3m with Blouse)"],
      featured: true,
    };

    addToCart(asProduct, { quantity: 1 });
    setAddedItemIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [item.id]: false }));
    }, 1800);
  };

  if (!saleConfig || !saleConfig.isEnabled) {
    return null;
  }

  // Constrain to strictly 4 items max
  const activeSaleItems = (saleConfig.saleItems?.filter((item) => item.isActive !== false) || []).slice(0, 4);
  const tierOffers = saleConfig.tierOffers && saleConfig.tierOffers.length > 0 ? saleConfig.tierOffers : DEFAULT_TIER_OFFERS;

  return (
    <section className="bg-linear-to-b from-[#FAF7F2] via-[#F6EFE6] to-[#FAF7F2] px-4 py-10 sm:px-6 sm:py-20 lg:px-10 font-sans select-none border-b border-stone-200/70">
      <div className="mx-auto max-w-[1600px]">
        {/* Promotional Sale Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between border-b border-black/8 pb-6 sm:mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8E3D51] text-white text-[10px] font-bold uppercase tracking-[0.25em] shadow-sm">
                <FiTag size={12} className="animate-pulse" />
                <span>Special Offers</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300/80 text-amber-950 text-[10px] font-bold uppercase tracking-wider">
                <FiStar size={11} className="text-amber-700" />
                <span>{saleConfig.discountBadge || "Bundle Offers Live"}</span>
              </span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#2A2421]">
              {saleConfig.saleTitle || "For Sale"}{" "}
              <span className="italic font-normal text-[#8E3D51]">items.</span>
            </h2>

            <p className="mt-2 text-xs sm:text-sm font-light text-[#6E6359] max-w-2xl leading-relaxed">
              {saleConfig.subtitle || "Artisan handwoven drapes available at special celebration bundle offers."}
            </p>
          </div>

          {/* Coupon Code & Shop Link */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            {saleConfig.couponCode && (
              <button
                type="button"
                onClick={handleCopyCoupon}
                title="Click to copy coupon code"
                className="group flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-[#D4A373]/60 shadow-sm hover:border-[#8E3D51] transition-all text-xs active:scale-95"
              >
                <span className="text-[10.5px] uppercase tracking-wider text-stone-500 font-medium">Coupon:</span>
                <span className="font-mono font-bold text-[#8E3D51] tracking-wider">{saleConfig.couponCode}</span>
                {copiedCoupon ? (
                  <FiCheck size={13} className="text-emerald-600" />
                ) : (
                  <FiCopy size={13} className="text-stone-400 group-hover:text-[#8E3D51] transition-colors" />
                )}
              </button>
            )}

            <Link
              to="/shop"
              className="group inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[#2A2421] transition-colors hover:text-[#8E3D51]"
            >
              <span>Explore Sale</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFEAE2] transition-transform duration-300 group-hover:rotate-45 group-hover:bg-[#8E3D51] group-hover:text-white">
                <FiArrowUpRight size={14} />
              </span>
            </Link>
          </div>
        </div>

        {/* Bundle Offers Banner */}
        <div className="mb-8 rounded-2xl bg-linear-to-r from-[#2A0E20] via-[#3B152E] to-[#2A0E20] p-4 sm:p-6 text-white shadow-lg border border-amber-500/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center shadow-md shrink-0">
                <FiGift size={20} />
              </div>
              <div>
                <h3 className="font-serif text-lg sm:text-xl text-amber-100 font-medium tracking-wide">
                  Exclusive Festive Draping Bundles
                </h3>
                <p className="text-xs text-stone-300">
                  Select your favourite handwoven sarees and enjoy instant tiered bundle pricing
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {tierOffers.map((tier, idx) => (
                <div
                  key={tier.id || idx}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-amber-300/30 backdrop-blur-sm transition-all text-center flex flex-col justify-center"
                >
                  <div className="text-xs sm:text-sm font-bold tracking-wide text-amber-300">
                    {tier.label}
                  </div>
                  {tier.savingsText && (
                    <div className="text-[10.5px] text-stone-300 mt-0.5">
                      {tier.savingsText}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sale Sarees Grid — Exactly 4 Cards Max */}
        {activeSaleItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {activeSaleItems.map((item) => {
              const isAdded = addedItemIds[item.id];
              const salePrice = item.salePrice || 2500;
              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col rounded-2xl bg-white p-3 shadow-sm hover:shadow-xl transition-all duration-500 border border-stone-200/80 overflow-hidden"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-stone-100">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20 opacity-40 group-hover:opacity-60 transition-opacity" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <span className="px-2.5 py-1 rounded-full bg-[#8E3D51] text-white text-[10px] font-bold tracking-wider uppercase shadow-md backdrop-blur-md">
                        {item.customOfferText || "Special Offer"}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[9px] font-bold tracking-wider uppercase shadow-sm">
                        In Stock
                      </span>
                    </div>

                    <Link
                      to={`/product/${item.id}`}
                      className="absolute inset-0 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="w-full text-center py-2 px-3 rounded-xl bg-white/90 text-stone-900 text-xs font-semibold backdrop-blur-md shadow-md hover:bg-white transition-all">
                        View Drape Details
                      </span>
                    </Link>
                  </div>

                  <div className="mt-3.5 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="text-[10px] font-semibold tracking-wider uppercase text-[#8E3D51]">
                        {item.category || "Gadwal Silk"}
                      </div>
                      <h4 className="font-serif text-base font-medium text-stone-900 line-clamp-1 group-hover:text-[#8E3D51] transition-colors mt-0.5">
                        {item.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                      <div>
                        {item.originalPrice && item.originalPrice > salePrice && (
                          <div className="text-[11px] text-stone-400 line-through">
                            ₹{item.originalPrice.toLocaleString("en-IN")}
                          </div>
                        )}
                        <div className="text-base font-bold text-stone-900 flex items-center">
                          <span className="text-xs mr-0.5 text-[#8E3D51]">₹</span>
                          <span>{salePrice.toLocaleString("en-IN")}</span>
                          <span className="text-[10px] font-normal text-stone-500 ml-1">/-</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddSaleItemToCart(item)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm ${
                          isAdded
                            ? "bg-emerald-600 text-white"
                            : "bg-[#2A0E20] hover:bg-[#8E3D51] text-amber-100 hover:text-white"
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
                            <span>Bag</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
            {fallbackProds.slice(0, 4).map((product) => (
              <div key={product.id} className="w-[74vw] shrink-0 sm:w-auto">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}

        {/* Mobile View All Link */}
        <Link
          to="/shop"
          className="mt-8 flex items-center justify-between border-b border-black/10 pb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#2A2421] sm:hidden"
        >
          <span>Explore All Sale Sarees</span>
          <FiArrowUpRight size={15} />
        </Link>
      </div>
    </section>
  );
}