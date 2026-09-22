import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, animate } from "framer-motion";
import { FiTag, FiGift, FiArrowUpRight, FiEye, FiCheck, FiShoppingBag } from "react-icons/fi";
import { API_BASE } from "../../config/api";
import { type Product, products as fallbackProducts } from "../../data/products";
import type { SaleConfig, SaleProductItem, SaleTierOffer } from "../../types/inventory";
import { useCart } from "../../context/CartContext";

const DEFAULT_TIER_OFFERS: SaleTierOffer[] = [
  { id: "tier-1", qty: 1, price: 2500, label: "Buy 1 @ ₹2,500", savingsText: "Single Piece Special" },
  { id: "tier-2", qty: 2, price: 4900, label: "Buy 2 @ ₹4,900", savingsText: "Twin Celebration Savings" },
  { id: "tier-3", qty: 3, price: 4800, label: "Buy 3 @ ₹4,800", savingsText: "Trio Festive Mega Offer" },
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

// Desktop screens can show up to 4 cards simultaneously
const CARD_BUFFER = 4;
const TIER_BUFFER = 3;

export default function ForSaleProducts() {
  const cartContext = useCart();
  const cartList = (cartContext as any).items || (cartContext as any).cartItems || (cartContext as any).cart || [];
  const { addToCart } = cartContext;

  // Products Carousel State (Starts at CARD_BUFFER offset)
  const [internalCardIndex, setInternalCardIndex] = useState(CARD_BUFFER);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const firstCardRef = useRef<HTMLDivElement>(null);
  const isCardAnimating = useRef(false);
  const x = useMotionValue(0);

  // Bundle Tiers Carousel State (Starts at TIER_BUFFER offset)
  const [internalTierIndex, setInternalTierIndex] = useState(TIER_BUFFER);
  const [isTierHovered, setIsTierHovered] = useState(false);
  const [isTierDragging, setIsTierDragging] = useState(false);
  const firstTierRef = useRef<HTMLDivElement>(null);
  const isTierAnimating = useRef(false);
  const tierX = useMotionValue(0);

  const [saleConfig, setSaleConfig] = useState<SaleConfig>(() => {
    try {
      const saved = localStorage.getItem("rs_fashions_sale_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return {
            ...DEFAULT_SALE_CONFIG,
            ...parsed,
            tierOffers: parsed.tierOffers?.length ? parsed.tierOffers : DEFAULT_TIER_OFFERS,
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 8);
      }
    } catch {}
    return fallbackProducts.slice(0, 8);
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
            tierOffers: conf.tierOffers?.length ? conf.tierOffers : DEFAULT_TIER_OFFERS,
            saleItems: Array.isArray(conf.saleItems) ? conf.saleItems : [],
          };
          setSaleConfig(merged);
          localStorage.setItem("rs_fashions_sale_config", JSON.stringify(merged));
        }
      } catch {}
    }
    loadSaleConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayItems: SaleProductItem[] = useMemo(() => {
    const configuredItems = (
      saleConfig.saleItems?.filter((item) => item.isActive !== false) || []
    ).slice(0, 8);
    if (configuredItems.length > 0) return configuredItems;

    return fallbackProds.slice(0, 8).map((p: any) => {
      const price = Number(p.salePrice || p.price) || 2500;
      return {
        id: String(p.id),
        name: p.name || "SiCo Gadwal Drape",
        category: p.category || "SiCo Gadwal",
        salePrice: price,
        originalPrice: Number(p.originalPrice) || Math.round(price * 1.3),
        imageUrl:
          (Array.isArray(p.images) && p.images[0]) ||
          p.imageUrl ||
          p.image ||
          "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
        customOfferText: "Bundle Savings",
        isActive: true,
      };
    });
  }, [saleConfig.saleItems, fallbackProds]);

  const activeTiers = useMemo(() => {
    return saleConfig.tierOffers?.length ? saleConfig.tierOffers : DEFAULT_TIER_OFFERS;
  }, [saleConfig.tierOffers]);

  // Generate multi-item clone buffers on both sides
  const clonedDisplayItems = useMemo(() => {
    const n = displayItems.length;
    if (n === 0) return [];
    const prefix: SaleProductItem[] = [];
    const suffix: SaleProductItem[] = [];
    for (let i = 0; i < CARD_BUFFER; i++) {
      prefix.unshift(displayItems[(n - 1 - (i % n))]);
      suffix.push(displayItems[i % n]);
    }
    return [...prefix, ...displayItems, ...suffix];
  }, [displayItems]);

  const clonedTiers = useMemo(() => {
    const n = activeTiers.length;
    if (n === 0) return [];
    const prefix: SaleTierOffer[] = [];
    const suffix: SaleTierOffer[] = [];
    for (let i = 0; i < TIER_BUFFER; i++) {
      prefix.unshift(activeTiers[(n - 1 - (i % n))]);
      suffix.push(activeTiers[i % n]);
    }
    return [...prefix, ...activeTiers, ...suffix];
  }, [activeTiers]);

  // Clean mathematical modulo mapping for 0-indexed pagination dots
  const activeProductDotIndex = useMemo(() => {
    const n = displayItems.length;
    if (n === 0) return 0;
    return (((internalCardIndex - CARD_BUFFER) % n) + n) % n;
  }, [internalCardIndex, displayItems.length]);

  const activeTierDotIndex = useMemo(() => {
    const n = activeTiers.length;
    if (n === 0) return 0;
    return (((internalTierIndex - TIER_BUFFER) % n) + n) % n;
  }, [internalTierIndex, activeTiers.length]);

  const isItemInCart = (itemId: string | number) => {
    return cartList.some((cartItem: any) => {
      const cId = cartItem?.product?.id ?? cartItem?.id;
      return String(cId) === String(itemId);
    });
  };

  // --- Card Step & Measurement ---
  const getCardStep = useCallback(() => {
    if (!firstCardRef.current) return window.innerWidth >= 640 ? 294 : 256;
    const cardWidth = firstCardRef.current.offsetWidth;
    const gap = window.innerWidth >= 640 ? 24 : 16;
    return cardWidth + gap;
  }, []);

  // Update position on resize and init
  useEffect(() => {
    const syncPosition = () => {
      const step = getCardStep();
      x.set(-internalCardIndex * step);
    };
    syncPosition();
    window.addEventListener("resize", syncPosition);
    return () => window.removeEventListener("resize", syncPosition);
  }, [getCardStep, internalCardIndex, x]);

  const slideToCardIndex = (targetIdx: number) => {
    const n = displayItems.length;
    if (n <= 1) return;

    isCardAnimating.current = true;
    const step = getCardStep();
    const targetX = -targetIdx * step;

    animate(x, targetX, {
      type: "spring",
      stiffness: 260,
      damping: 30,
      onComplete: () => {
        isCardAnimating.current = false;
        let finalIdx = targetIdx;

        // Teleport seamlessly if inside suffix buffer
        if (targetIdx >= CARD_BUFFER + n) {
          finalIdx = targetIdx - n;
          x.set(-finalIdx * step);
          setInternalCardIndex(finalIdx);
        }
        // Teleport seamlessly if inside prefix buffer
        else if (targetIdx < CARD_BUFFER) {
          finalIdx = targetIdx + n;
          x.set(-finalIdx * step);
          setInternalCardIndex(finalIdx);
        }
      },
    });
    setInternalCardIndex(targetIdx);
  };

  // Auto-scroll products every 3.2s
  useEffect(() => {
    if (isHovered || isDragging || displayItems.length <= 1) return;
    const interval = setInterval(() => {
      if (isCardAnimating.current) return;
      slideToCardIndex(internalCardIndex + 1);
    }, 3200);
    return () => clearInterval(interval);
  }, [isHovered, isDragging, displayItems.length, internalCardIndex]);

  const handleCardDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    setIsDragging(false);
    const step = getCardStep();
    const currentX = x.get();
    const dragOffset = info.offset.x;
    const velocity = info.velocity.x;

    let target = internalCardIndex;
    if (dragOffset < -40 || velocity < -300) {
      target = internalCardIndex + 1;
    } else if (dragOffset > 40 || velocity > 300) {
      target = internalCardIndex - 1;
    } else {
      target = Math.round(Math.abs(currentX) / step);
    }
    slideToCardIndex(target);
  };

  // --- Tier Carousel Loop Mechanics ---
  const getTierStep = useCallback(() => {
    if (!firstTierRef.current) return 218;
    const width = firstTierRef.current.offsetWidth;
    const gap = 8;
    return width + gap;
  }, []);

  useEffect(() => {
    const syncTierPos = () => {
      const step = getTierStep();
      tierX.set(-internalTierIndex * step);
    };
    syncTierPos();
    window.addEventListener("resize", syncTierPos);
    return () => window.removeEventListener("resize", syncTierPos);
  }, [getTierStep, internalTierIndex, tierX]);

  const slideToTierIndex = (targetIdx: number) => {
    const n = activeTiers.length;
    if (n <= 1) return;

    isTierAnimating.current = true;
    const step = getTierStep();
    const targetX = -targetIdx * step;

    animate(tierX, targetX, {
      type: "spring",
      stiffness: 260,
      damping: 30,
      onComplete: () => {
        isTierAnimating.current = false;
        let finalIdx = targetIdx;
        if (targetIdx >= TIER_BUFFER + n) {
          finalIdx = targetIdx - n;
          tierX.set(-finalIdx * step);
          setInternalTierIndex(finalIdx);
        } else if (targetIdx < TIER_BUFFER) {
          finalIdx = targetIdx + n;
          tierX.set(-finalIdx * step);
          setInternalTierIndex(finalIdx);
        }
      },
    });
    setInternalTierIndex(targetIdx);
  };

  useEffect(() => {
    if (isTierHovered || isTierDragging || activeTiers.length <= 1) return;
    const interval = setInterval(() => {
      if (isTierAnimating.current) return;
      slideToTierIndex(internalTierIndex + 1);
    }, 3600);
    return () => clearInterval(interval);
  }, [isTierHovered, isTierDragging, activeTiers.length, internalTierIndex]);

  const handleTierDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    setIsTierDragging(false);
    const step = getTierStep();
    const currentX = tierX.get();
    const dragOffset = info.offset.x;
    const velocity = info.velocity.x;

    let target = internalTierIndex;
    if (dragOffset < -25 || velocity < -250) {
      target = internalTierIndex + 1;
    } else if (dragOffset > 25 || velocity > 250) {
      target = internalTierIndex - 1;
    } else {
      target = Math.round(Math.abs(currentX) / step);
    }
    slideToTierIndex(target);
  };

  const handleAddSaleItemToCart = (item: SaleProductItem, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isItemInCart(item.id)) return;

    const salePrice = item.salePrice || 2500;
    const asProduct: Product = {
      id: item.id,
      name: item.name,
      category: "SiCo Gadwal Sarees",
      material: "SiCo",
      price: salePrice,
      originalPrice: item.originalPrice || Math.round(salePrice * 1.3),
      stock: 5,
      rating: 4.9,
      reviewCount: 38,
      description: item.customOfferText || "Festive celebration special drape.",
      longDescription: `Handcrafted festive drape featuring authentic weave, temple zari border, and fine silk craftsmanship.`,
      images: [item.imageUrl, item.imageUrl],
      colors: ["Royal Maroon", "Festive Gold"],
      sizes: ["Free Size (6.3m with Blouse)"],
      featured: true,
    };

    addToCart(asProduct, { quantity: 1 });
  };

  if (!saleConfig || !saleConfig.isEnabled || displayItems.length === 0) return null;

  return (
    <section className="border-b border-[#8E3D51]/10 bg-linear-to-b from-[#FAF7F2] via-[#F4EDE4] to-[#FAF7F2] py-10 font-sans select-none sm:py-14">
      <div className="mx-auto max-w-[1600px] px-3.5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-2 border-b border-black/8 pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8E3D51] px-3 py-1 text-[9.5px] font-bold uppercase tracking-[0.24em] text-white shadow-xs">
              <FiTag size={11} className="animate-pulse" />
              <span>Special Curation</span>
            </span>
            <h2 className="mt-2 font-serif text-2xl font-light tracking-tight text-[#2B1B17] sm:text-4xl lg:text-5xl">
              {saleConfig.saleTitle || "Curated Offers"}{" "}
              <span className="font-normal italic text-[#8E3D51]">drapes.</span>
            </h2>
          </div>
          <p className="max-w-xs text-xs text-stone-600">{saleConfig.subtitle}</p>
        </div>

        {/* Tier Bundle Banner with Seamless Looping Carousel & Dots */}
        <div className="mb-8 rounded-2xl border border-amber-400/20 bg-linear-to-r from-[#2A0E20] via-[#3B152E] to-[#2A0E20] p-4 text-white shadow-md sm:rounded-3xl sm:p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <Link to="/offers" className="group flex items-center gap-3.5 transition-opacity hover:opacity-95 shrink-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 to-amber-600 text-stone-950 shadow-sm transition-transform group-hover:scale-105">
                <FiGift size={20} />
              </div>
              <div>
                <h3 className="flex items-center gap-2 font-serif text-lg font-medium text-amber-100 sm:text-xl">
                  <span>Exclusive Bundle Vault</span>
                  <FiArrowUpRight
                    size={15}
                    className="text-amber-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </h3>
                <p className="text-xs text-stone-300">
                  Save instantly when buying 2 or more heirloom sarees &middot; Tier savings apply at checkout
                </p>
              </div>
            </Link>

            {/* Seamless Looping Container for Tiers */}
            <div
              className="flex flex-col items-center lg:items-end w-full lg:w-auto"
              onMouseEnter={() => setIsTierHovered(true)}
              onMouseLeave={() => setIsTierHovered(false)}
            >
              <div className="w-full max-w-full overflow-hidden cursor-grab active:cursor-grabbing lg:max-w-[480px]">
                <motion.div
                  style={{ x: tierX }}
                  drag="x"
                  dragElastic={0.15}
                  onDragStart={() => setIsTierDragging(true)}
                  onDragEnd={handleTierDragEnd}
                  className="flex w-max gap-2"
                >
                  {clonedTiers.map((tier, idx) => (
                    <div
                      key={`tier-clone-${tier.id || idx}-${idx}`}
                      ref={idx === 0 ? firstTierRef : null}
                      className="flex w-[210px] sm:w-[230px] shrink-0 flex-col justify-center rounded-xl border border-amber-300/30 bg-white/10 px-4 py-2.5 text-center backdrop-blur-sm transition-all hover:bg-white/15 select-none"
                    >
                      <span className="text-xs font-bold tracking-wide text-amber-300">{tier.label}</span>
                      {tier.savingsText && (
                        <span className="text-[10px] text-stone-300 mt-0.5">{tier.savingsText}</span>
                      )}
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Tier Indicator Dots */}
              <div className="mt-3 flex items-center justify-center gap-1.5 self-center lg:self-end">
                {activeTiers.map((tier, idx) => {
                  const isActive = activeTierDotIndex === idx;
                  return (
                    <button
                      key={`tier-dot-${tier.id || idx}`}
                      type="button"
                      aria-label={`Go to offer tier ${idx + 1}: ${tier.label}`}
                      onClick={() => slideToTierIndex(TIER_BUFFER + idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ease-out focus:outline-none ${
                        isActive
                          ? "w-5 bg-amber-300 shadow-xs"
                          : "w-1.5 bg-amber-300/30 hover:bg-amber-300/60"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seamless Looping Product Cards Carousel */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing px-3.5 sm:px-6 lg:px-8"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          style={{ x }}
          drag="x"
          dragElastic={0.15}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleCardDragEnd}
          className="flex w-max gap-4 sm:gap-6"
        >
          {clonedDisplayItems.map((item, idx) => {
            const inCart = isItemInCart(item.id);
            const salePrice = item.salePrice || 2500;
            const productUrl = `/product/${item.id}`;

            return (
              <div
                key={`card-clone-${item.id}-${idx}`}
                ref={idx === 0 ? firstCardRef : null}
                className="group relative flex w-60 shrink-0 flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-2.5 shadow-xs transition-all duration-300 hover:shadow-md sm:w-[270px] sm:p-3"
              >
                <div className="relative aspect-3/4 w-full overflow-hidden rounded-xl bg-stone-100">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    draggable={false}
                    className="h-full w-full object-cover object-center saturate-[1.08] transition-transform duration-500 ease-out group-hover:scale-105 pointer-events-none"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-black/35 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:pointer-events-auto group-hover:opacity-100">
                    <Link
                      to={productUrl}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-stone-900 shadow-md transition-all hover:bg-[#8E3D51] hover:text-white active:scale-95"
                    >
                      <FiEye size={13} />
                      <span>View Drape</span>
                    </Link>
                  </div>
                </div>

                <div className="mt-2.5 flex flex-1 flex-col justify-between">
                  <div>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#8E3D51]">
                      {item.category || "SiCo Gadwal"}
                    </span>
                    <Link to={productUrl}>
                      <h4 className="line-clamp-1 font-serif text-sm font-medium text-stone-900 transition-colors hover:text-[#8E3D51]">
                        {item.name}
                      </h4>
                    </Link>
                  </div>

                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-stone-900">
                      ₹{salePrice.toLocaleString("en-IN")}
                    </span>
                    {item.originalPrice && item.originalPrice > salePrice && (
                      <span className="text-[11px] text-stone-400 line-through">
                        ₹{item.originalPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 gap-1.5 border-t border-stone-100 pt-2.5">
                    <Link
                      to={productUrl}
                      className="flex items-center justify-center rounded-xl border border-stone-200 bg-stone-50 px-2 py-1.5 text-[11px] font-semibold text-stone-700 transition-colors hover:bg-stone-100"
                    >
                      Details
                    </Link>
                    <button
                      type="button"
                      disabled={inCart}
                      onClick={(e) => handleAddSaleItemToCart(item, e)}
                      className={`flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-bold transition-all ${
                        inCart
                          ? "bg-emerald-600 text-white cursor-default opacity-95"
                          : "bg-[#2A0E20] text-amber-100 hover:bg-[#8E3D51] hover:text-white active:scale-95 cursor-pointer"
                      }`}
                    >
                      {inCart ? (
                        <>
                          <FiCheck size={12} className="stroke-[2.5]" />
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
            );
          })}
        </motion.div>
      </div>

      {/* Pagination Indicator Dots */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {displayItems.map((item, idx) => {
          const isActive = activeProductDotIndex === idx;
          return (
            <button
              key={`dot-${item.id}-${idx}`}
              type="button"
              aria-label={`Go to slide ${idx + 1}: ${item.name}`}
              onClick={() => slideToCardIndex(CARD_BUFFER + idx)}
              className={`h-2 rounded-full transition-all duration-300 ease-out focus:outline-none ${
                isActive
                  ? "w-6 bg-[#8E3D51] shadow-xs"
                  : "w-2 bg-[#8E3D51]/25 hover:bg-[#8E3D51]/50"
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}