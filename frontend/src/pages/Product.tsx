import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiArrowRight,
  FiCheck,
  FiChevronDown,
  FiCopy,
  FiMinus,
  FiPlus,
  FiShare2,
  FiShoppingBag,
  FiStar,
  FiShield,
  FiTruck,
  FiPackage,
  FiMessageCircle,
  FiMail,
} from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router-dom";

import { products } from "../data/products";
import { useCart } from "../context/CartContext";
import { StoreService } from "../services/supabase";

const ease = [0.16, 1, 0.3, 1] as const;

function Product() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const product = products.find((item) => item.id === id);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>(
    product?.colors?.[0] || "Standard"
  );
  const [selectedSize, setSelectedSize] = useState(
    "Standard Drape (5.5m + 0.8m Blouse)"
  );
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [couponCopied, setCouponCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showAddedToast, setShowAddedToast] = useState(false);

  // Real-time Inventory Status & Temporary Lock Tracking
  const [inventoryStatus, setInventoryStatus] = useState<{
    stock: number;
    availableStock: number;
    isHeldByYou: boolean;
    isHeldByOther: boolean;
    remainingLockSeconds: number;
  } | null>(null);

  useEffect(() => {
    if (!product) return;
    let isMounted = true;

    const checkStatus = async () => {
      try {
        const res = await StoreService.getInventoryStatus(product.id);
        if (isMounted && res.success) {
          setInventoryStatus({
            stock: res.stock,
            availableStock: res.availableStock,
            isHeldByYou: res.isHeldByYou,
            isHeldByOther: res.isHeldByOther,
            remainingLockSeconds: res.remainingLockSeconds,
          });
        }
      } catch (err) {
        // ignore
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [product]);

  const isLockedByAnother = Boolean(
    inventoryStatus &&
    (inventoryStatus.isHeldByOther || inventoryStatus.availableStock === 0) &&
    !inventoryStatus.isHeldByYou
  );

  const formatLockTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  if (!product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#FAF7F2] px-6 text-center font-sans">
        <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8C7A6B]">
          BECHO ATELIER
        </span>
        <h1 className="mt-3 font-serif text-4xl font-light text-[#2A2421] sm:text-5xl">
          Weave not found.
        </h1>
        <p className="mt-2 text-xs font-light text-[#756A60]">
          The artisan piece you are looking for may have been archived.
        </p>
        <Link
          to="/shop"
          className="mt-8 rounded-full bg-[#2A2421] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#FAF7F2] transition-colors hover:bg-[#8E3D51]"
        >
          Explore Collection
        </Link>
      </main>
    );
  }

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  const relatedProducts = products
    .filter((item) => item.id !== product.id && item.category === product.category)
    .slice(0, 4);

  const handleAddToCart = () => {
    addToCart(product, {
      quantity,
      selectedColor,
      selectedSize,
    });
    setShowAddedToast(true);
    setTimeout(() => setShowAddedToast(false), 2400);
  };

  const handleBuyNow = () => {
    addToCart(product, {
      quantity,
      selectedColor,
      selectedSize,
    });
    navigate("/checkout");
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: `Explore the ${product.name} from BECHO Atelier.`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // User aborted share
    }
  };

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText("BECHO10");
    setCouponCopied(true);
    setTimeout(() => setCouponCopied(false), 2000);
  };

  const handleMobileScroll = () => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.offsetWidth;
    const scrollPos = scrollRef.current.scrollLeft;
    const index = Math.round(scrollPos / width);
    setSelectedImage(index);
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] font-sans text-[#2A2421] select-none pb-28 sm:pb-36">
      {/* =========================================================
          1. EDITORIAL BREADCRUMB
      ========================================================== */}
      <div className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-6 lg:px-12">
        <nav className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#8C7A6B]">
          <Link to="/" className="hover:text-[#2A2421] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-[#2A2421] transition-colors">
            Collection
          </Link>
          <span>/</span>
          <span className="text-[#2A2421] truncate">{product.name}</span>
        </nav>
      </div>

      {/* =========================================================
          2. PRODUCT HERO & PURCHASE CONSOLE
      ========================================================== */}
      <section className="mx-auto max-w-[1600px] px-0 sm:px-6 lg:px-12 pt-4 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-12 xl:gap-16 items-start">
          
          {/* -----------------------------------------------------
              GALLERY: Desktop Sticky Stack / Mobile Swipe Carousel
          ------------------------------------------------------ */}
          <div className="lg:col-span-7 lg:sticky lg:top-24">
            {/* Desktop Stage */}
            <div className="hidden sm:grid sm:grid-cols-[90px_1fr] gap-4">
              {/* Thumbnails */}
              <div className="flex flex-col gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setSelectedImage(idx)}
                    className={`relative aspect-[0.78] w-full overflow-hidden rounded-xl border transition-all ${
                      selectedImage === idx
                        ? "border-[#8E3D51] ring-2 ring-[#8E3D51]/20 opacity-100"
                        : "border-black/10 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Main Showcase */}
              <div className="relative aspect-[0.8] w-full overflow-hidden rounded-3xl bg-[#EFEAE2] shadow-sm">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={product.images[selectedImage]}
                    src={product.images[selectedImage]}
                    alt={product.name}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease }}
                    className="h-full w-full object-cover object-center"
                  />
                </AnimatePresence>

                <div className="absolute left-4 top-4">
                  <span className="rounded-full bg-[#FAF7F2]/90 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-widest text-[#2A2421] backdrop-blur-md shadow-sm">
                    Silk Mark Certified
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Carousel */}
            <div className="relative sm:hidden">
              <div
                ref={scrollRef}
                onScroll={handleMobileScroll}
                className="flex w-full snap-x snap-mandatory overflow-x-auto scrollbar-none"
              >
                {product.images.map((img, idx) => (
                  <div
                    key={img}
                    className="relative aspect-[0.84] w-full shrink-0 snap-center overflow-hidden bg-[#EFEAE2]"
                  >
                    <img
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                ))}
              </div>

              <div className="absolute left-3 top-3">
                <span className="rounded-full bg-[#FAF7F2]/95 px-2.5 py-1 text-[8.5px] font-semibold uppercase tracking-widest text-[#2A2421] shadow-sm backdrop-blur-md">
                  Silk Mark Certified
                </span>
              </div>

              <div className="absolute right-3 top-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-[#2A2421] shadow-sm backdrop-blur-md active:scale-90"
                >
                  {copied ? (
                    <FiCheck size={14} className="text-emerald-600" />
                  ) : (
                    <FiShare2 size={14} />
                  )}
                </button>
              </div>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 backdrop-blur-md">
                {product.images.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      selectedImage === idx ? "w-5 bg-white" : "w-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------
              PURCHASE & CUSTOMIZATION CONSOLE
          ------------------------------------------------------ */}
          <div className="lg:col-span-5 px-4 sm:px-0 pt-6 sm:pt-0">
            {/* Header / Title */}
            <div className="border-b border-black/6 pb-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8C7A6B]">
                  {product.category}
                </span>
                <span className="text-xs text-[#8C7A6B]">✦</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8E3D51]">
                  {product.material}
                </span>
              </div>

              <h1 className="mt-2 font-serif text-[clamp(2rem,6vw,3.2rem)] font-light leading-[1.04] tracking-tight text-[#2A2421]">
                {product.name}
              </h1>

              {/* Reviews & Dispatch Indicator */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 font-serif text-sm font-medium text-[#2A2421]">
                    <FiStar size={13} className="fill-[#D4AF37] text-[#D4AF37]" />
                    <span>{product.rating}</span>
                  </div>
                  <span className="text-xs font-light text-[#8C7A6B]">
                    ({product.reviewCount} customer reviews)
                  </span>
                </div>
              </div>

              {/* Price & Savings */}
              <div className="mt-5 flex items-baseline gap-3">
                <span className="font-sans text-2xl font-medium text-[#2A2421]">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>

                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="font-sans text-base text-[#8C7A6B] line-through">
                      ₹{product.originalPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="rounded-full bg-[#8E3D51]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8E3D51]">
                      {discount}% Privilege Savings
                    </span>
                  </>
                )}
              </div>

              {/* Hybrid Reservation & Stock Status Banner */}
              {isLockedByAnother ? (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-50/90 p-3.5 text-amber-950 shadow-xs">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-sm">
                    ⏳
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-snug">
                      Reserved in another patron's cart
                    </p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Releases in {formatLockTimer(inventoryStatus?.remainingLockSeconds || 600)} if checkout is not completed.
                    </p>
                  </div>
                </div>
              ) : inventoryStatus && inventoryStatus.availableStock > 0 && inventoryStatus.availableStock <= 3 ? (
                <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-50/80 px-3.5 py-2 text-emerald-900 shadow-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
                  </span>
                  <span className="text-[11px] font-medium tracking-wide">
                    Exclusive Archive: Only {inventoryStatus.availableStock} piece{inventoryStatus.availableStock > 1 ? "s" : ""} currently remaining
                  </span>
                </div>
              ) : null}

              <p className="mt-3 text-xs sm:text-sm font-light leading-relaxed text-[#6E6359]">
                {product.description}
              </p>
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="py-5 border-b border-black/6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2A2421]">
                    Curated Hue
                  </span>
                  <span className="text-xs text-[#8C7A6B]">{selectedColor}</span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((color) => {
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`rounded-full px-4 py-2 text-xs font-medium tracking-wide transition-all ${
                          isSelected
                            ? "bg-[#2A2421] text-[#FAF7F2] shadow-sm ring-2 ring-[#2A2421]/20"
                            : "border border-black/10 bg-white/70 text-[#544B44] hover:border-black/25 hover:bg-white"
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Drape Dimension */}
            <div className="py-5 border-b border-black/6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2A2421]">
                  Drape Length & Fit
                </span>
                <span className="text-[11px] font-medium text-[#8E3D51]">
                  Fall & Pico Included
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedSize("Standard Drape (5.5m + 0.8m Blouse)")
                }
                className="w-full text-left rounded-2xl border border-[#2A2421] bg-[#2A2421]/2 p-3.5 text-xs transition-all"
              >
                <div className="flex items-center justify-between font-medium text-[#2A2421]">
                  <span>Standard Saree (5.5m) + Unstitched Blouse Piece (0.8m)</span>
                  <FiCheck size={14} className="text-[#8E3D51]" />
                </div>
              </button>
            </div>

            {/* Privilege Coupon */}
            <div className="my-5 flex items-center justify-between rounded-2xl border border-dashed border-[#8E3D51]/30 bg-[#FAF4ED] p-3.5">
              <div>
                <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#8E3D51]">
                  Atelier Privilege Code
                </span>
                <p className="font-mono text-sm font-semibold tracking-wider text-[#2A2421] mt-0.5">
                  BECHO10
                </p>
                <p className="text-[10px] text-[#8C7A6B]">
                  Flat 10% savings on this festive edit
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyCoupon}
                className="flex items-center gap-1.5 rounded-full bg-[#2A2421] px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-white transition-all hover:bg-[#8E3D51] active:scale-95"
              >
                {couponCopied ? (
                  <>
                    <FiCheck size={12} className="text-emerald-400" />
                    <span>Applied</span>
                  </>
                ) : (
                  <>
                    <FiCopy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Desktop Action Controls */}
            <div className="hidden sm:flex flex-col gap-3 pt-2">
              <div className="flex gap-3">
                <div className="flex h-13 items-center rounded-full border border-black/10 bg-white/70 px-2">
                  <button
                    type="button"
                    disabled={isLockedByAnother}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-10 w-9 items-center justify-center text-[#6E6359] hover:text-[#2A2421] disabled:opacity-40"
                  >
                    <FiMinus size={13} />
                  </button>
                  <span className="w-8 text-center font-sans text-sm font-medium text-[#2A2421]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={isLockedByAnother}
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-10 w-9 items-center justify-center text-[#6E6359] hover:text-[#2A2421] disabled:opacity-40"
                  >
                    <FiPlus size={13} />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isLockedByAnother}
                  onClick={handleAddToCart}
                  className={`flex h-13 flex-1 items-center justify-center gap-2 rounded-full border text-xs font-semibold uppercase tracking-[0.2em] transition-all ${
                    isLockedByAnother
                      ? "border-black/10 bg-black/5 text-black/40 cursor-not-allowed"
                      : "border-[#2A2421] bg-transparent text-[#2A2421] hover:bg-[#2A2421] hover:text-[#FAF7F2] active:scale-95"
                  }`}
                >
                  <FiShoppingBag size={14} />
                  <span>{isLockedByAnother ? "Reserved" : showAddedToast ? "Added to Bag" : "Add to Bag"}</span>
                </button>
              </div>

              <button
                type="button"
                disabled={isLockedByAnother}
                onClick={handleBuyNow}
                className={`flex h-13 w-full items-center justify-center gap-2 rounded-full text-xs font-semibold uppercase tracking-[0.2em] shadow-lg transition-all ${
                  isLockedByAnother
                    ? "bg-black/10 text-black/40 cursor-not-allowed shadow-none"
                    : "bg-[#8E3D51] text-white hover:bg-[#783144] active:scale-95"
                }`}
              >
                <span>{isLockedByAnother ? "Temporarily Reserved in Another Cart" : "Instant Checkout"}</span>
                {!isLockedByAnother && <FiArrowRight size={14} />}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-black/6 pt-6">
              <div className="flex flex-col items-center text-center p-2">
                <FiTruck size={17} className="text-[#8E3D51]" />
                <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#2A2421]">
                  Free Shipping
                </span>
                <span className="text-[9px] text-[#8C7A6B]">Orders over ₹1,999</span>
              </div>

              <div className="flex flex-col items-center text-center p-2 border-x border-black/6">
                <FiShield size={17} className="text-[#8E3D51]" />
                <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#2A2421]">
                  Authentic Silk
                </span>
                <span className="text-[9px] text-[#8C7A6B]">Silk Mark verified</span>
              </div>

              <div className="flex flex-col items-center text-center p-2">
                <FiPackage size={17} className="text-[#8E3D51]" />
                <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#2A2421]">
                  Luxury Box
                </span>
                <span className="text-[9px] text-[#8C7A6B]">
                  Rigid heirloom packaging
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          3. MARQUEE BANNER
      ========================================================== */}
      <section className="mt-16 sm:mt-24 overflow-hidden border-y border-black/[0.07] py-5">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: "linear",
          }}
          className="flex w-max"
        >
          {[...Array(2)].map((_, groupIndex) => (
            <div key={groupIndex} className="flex items-center">
              {[
                "CRAFTED WITH INTENTION",
                "TIMELESS WEAVES",
                "BECHO ATELIER",
                "MADE TO BE REMEMBERED",
                "PURE SILK MARK HALLMARK",
              ].map((text) => (
                <div key={`${groupIndex}-${text}`} className="flex items-center">
                  <span className="mx-8 font-serif text-lg italic text-black/40">
                    {text}
                  </span>
                  <span className="text-[#8E3D51]">✦</span>
                </div>
              ))}
            </div>
          ))}
        </motion.div>
      </section>

      {/* =========================================================
          4. ABOUT THE ATELIER & WEAVE SPECIFICATIONS
      ========================================================== */}
      <section className="mx-auto max-w-350 px-4 sm:px-6 lg:px-12 mt-16 sm:mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start border-b border-black/8 pb-16">
          <div className="lg:col-span-5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8C7A6B]">
              Artisanal Lineage
            </span>
            <h2 className="mt-2 font-serif text-3xl sm:text-5xl font-light text-[#2A2421]">
              About the <span className="italic font-normal">weave.</span>
            </h2>
            <p className="mt-4 text-xs sm:text-sm font-light leading-relaxed text-[#756A60]">
              Every BECHO saree is an intimate dialogue between master weavers, heritage looms, and pure natural yarns. We craft in limited micro-batches to honor slow, mindful fashion.
            </p>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-black/6 bg-white/70 p-6 backdrop-blur-md">
              <h3 className="font-serif text-lg text-[#2A2421]">
                {product.name}
              </h3>
              <p className="mt-2 text-xs sm:text-sm font-light leading-relaxed text-[#6E6359]">
                {product.longDescription}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-black/6 bg-white/70 p-5 backdrop-blur-md">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8E3D51]">
                  Fabric Composition
                </span>
                <p className="mt-1 font-serif text-base text-[#2A2421]">
                  {product.material}
                </p>
                <p className="mt-1 text-[11px] font-light text-[#756A60]">
                  100% natural fibers with authentic certified hallmark.
                </p>
              </div>

              <div className="rounded-2xl border border-black/6 bg-white/70 p-5 backdrop-blur-md">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8E3D51]">
                  Care & Preservation
                </span>
                <p className="mt-1 font-serif text-base text-[#2A2421]">
                  Dry Clean Only
                </p>
                <p className="mt-1 text-[11px] font-light text-[#756A60]">
                  Store folded in a breathable cotton muslin bag.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          5. BEFORE YOU ORDER (FAQ ACCORDION & CONCIERGE)
      ========================================================== */}
      <section className="mx-auto max-w-350 px-4 sm:px-6 lg:px-12 mt-16 sm:mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Heading & Stylist Card */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8C7A6B]">
                Client Guide
              </span>
              <h2 className="mt-2 font-serif text-3xl sm:text-5xl font-light text-[#2A2421]">
                Before you <span className="italic font-normal">order.</span>
              </h2>
              <p className="mt-3 max-w-sm text-xs sm:text-sm font-light leading-relaxed text-[#756A60]">
                Everything you need to know regarding authentic certification, fall & pico roll finishing, insured deliveries, and doorstep care.
              </p>
            </div>

            {/* Stylist Concierge Widget */}
            <div className="mt-8 rounded-2xl border border-[#8E3D51]/20 bg-[#FAF4ED] p-6 shadow-sm">
              <p className="font-serif text-base text-[#2A2421]">
                Have a bespoke drape inquiry?
              </p>
              <p className="mt-1 text-xs font-light text-[#756A60]">
                Our in-house draping consultants and fabric curators are available daily.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <a
                  href="https://wa.me/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-full bg-[#8E3D51] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-white active:scale-95 transition-transform"
                >
                  <FiMessageCircle size={13} />
                  <span>WhatsApp</span>
                </a>
                <a
                  href="mailto:concierge@becho.com"
                  className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#2A2421] active:scale-95 transition-transform"
                >
                  <FiMail size={13} />
                  <span>Email</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive FAQ Drawers */}
          <div className="lg:col-span-7 divide-y divide-black/8 border-y border-black/8">
            {[
              {
                question: "Is this saree ready to wear, and does it include Fall & Pico?",
                answer:
                  "Yes, absolutely. All BECHO drapes arrive with complimentary pre-stitched Fall and hand-finished Pico roll edges. Each piece measures 5.5 meters with an attached unstitched 0.8-meter matching blouse piece.",
              },
              {
                question: "Are these pure handloom silks certified with Silk Mark?",
                answer: `Yes. Every pure Katan, Kanjivaram, and Tussar saree carries an official Silk Mark India QR certification tag and an artisan weaving authenticity card inside your package.`,
              },
              {
                question: "How long does insured delivery take?",
                answer:
                  "Orders are dispatched within 24–48 hours via premium express air shipping. Metro deliveries arrive in 2–4 business days in reinforced rigid gift boxes.",
              },
              {
                question: "What is your doorstep return & exchange policy?",
                answer:
                  "We provide a 7-day hassle-free return and exchange window for unused drapes with intact security tags and original gift packaging.",
              },
              {
                question: "How should I clean and preserve the zari embroidery?",
                answer:
                  "We strictly recommend professional dry cleaning for all zari and pure silk textiles. Store folded in a breathable unbleached muslin bag, away from dampness and direct sunlight.",
              },
            ].map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.question} className="py-5">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between text-left font-serif text-lg sm:text-xl font-light text-[#2A2421]"
                  >
                    <span className="pr-4">{faq.question}</span>
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ${
                        isOpen
                          ? "rotate-180 bg-[#2A2421] text-white"
                          : "bg-black/5 text-[#2A2421]"
                      }`}
                    >
                      <FiChevronDown size={14} />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease }}
                        className="overflow-hidden"
                      >
                        <p className="mt-3 pr-8 text-xs sm:text-sm font-light leading-relaxed text-[#6E6359]">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          6. REVIEWS & TESTIMONIALS
      ========================================================== */}
      <section className="mx-auto max-w-350 px-4 sm:px-6 lg:px-12 mt-20 sm:mt-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start border-t border-black/8 pt-16">
          <div className="lg:col-span-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8C7A6B]">
              Connoisseur Notes
            </span>
            <h2 className="mt-2 font-serif text-3xl sm:text-5xl font-light text-[#2A2421]">
              Loved by <span className="italic font-normal">them.</span>
            </h2>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-serif text-5xl font-light text-[#2A2421]">
                {product.rating}
              </span>
              <div>
                <div className="flex gap-1 text-[#D4AF37]">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} size={12} className="fill-current" />
                  ))}
                </div>
                <span className="text-[10px] uppercase tracking-widest text-[#8C7A6B]">
                  Based on {product.reviewCount} curated reviews
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                name: "Ananya R.",
                city: "Hyderabad",
                review:
                  "The drape weight is magnificent. The antique zari has a warm glow that looks stunning under evening lighting. The fall was already finished so I wore it right away.",
              },
              {
                name: "Meera K.",
                city: "Bengaluru",
                review:
                  "Exquisite craftsmanship. It feels truly luxurious without feeling heavy on the shoulder. Will definitely be a centerpiece in my heirloom collection.",
              },
              {
                name: "Kavya S.",
                city: "Chennai",
                review:
                  "The colour in person is even richer than the pictures. Breathable, authentic, and drapes with effortless grace.",
              },
              {
                name: "Pooja V.",
                city: "Mumbai",
                review:
                  "Packaging was royal in a double-walled rigid box. Silk Mark verification gave me complete peace of mind.",
              },
            ].map((rev) => (
              <div
                key={rev.name}
                className="rounded-2xl border border-black/6 bg-white/70 p-5 backdrop-blur-md shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-base text-[#2A2421]">
                    {rev.name}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-[#8C7A6B]">
                    {rev.city}
                  </span>
                </div>
                <div className="mt-1 flex gap-0.5 text-[#D4AF37]">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} size={10} className="fill-current" />
                  ))}
                </div>
                <p className="mt-3 text-xs font-light leading-relaxed text-[#6E6359]">
                  "{rev.review}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          7. COMPLETE THE LOOK / RELATED WEAVES
      ========================================================== */}
      {relatedProducts.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-12 mt-20 sm:mt-28">
          <div className="flex items-end justify-between border-b border-black/6 pb-6 mb-8">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8C7A6B]">
                Curated Suggestions
              </span>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-light text-[#2A2421]">
                Complete the look.
              </h2>
            </div>
            <Link
              to="/shop"
              className="text-xs font-medium uppercase tracking-[0.2em] text-[#2A2421] hover:text-[#8E3D51] transition-colors"
            >
              View All Sarees →
            </Link>
          </div>

          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:px-0">
            {relatedProducts.map((rel) => (
              <div key={rel.id} className="w-[74vw] shrink-0 sm:w-auto">
                <Link
                  to={`/product/${rel.id}`}
                  className="group block"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  <div className="aspect-[0.78] w-full overflow-hidden rounded-2xl bg-[#EFEAE2]">
                    <img
                      src={rel.images[0]}
                      alt={rel.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-3">
                    <span className="text-[9px] uppercase tracking-wider text-[#8C7A6B]">
                      {rel.material}
                    </span>
                    <h3 className="font-serif text-base text-[#2A2421] group-hover:text-[#8E3D51] transition-colors truncate">
                      {rel.name}
                    </h3>
                    <p className="font-serif text-sm font-medium text-[#2A2421]">
                      ₹{rel.price.toLocaleString("en-IN")}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================
          8. PERSISTENT MOBILE FLOATING PURCHASE BAR
      ========================================================== */}
      <motion.aside
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/8 bg-[#FAF7F2]/95 px-4 py-3 shadow-[0_-12px_36px_rgba(42,36,33,0.12)] backdrop-blur-xl sm:hidden"
      >
        <div className="mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[8px] font-semibold uppercase tracking-widest text-[#8C7A6B]">
              Total Price
            </span>
            <p className="font-sans text-lg font-medium text-[#2A2421] leading-tight">
              ₹{(product.price * quantity).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              disabled={isLockedByAnother}
              onClick={handleAddToCart}
              className={`flex h-11 items-center justify-center gap-1.5 rounded-full border px-4 text-[10px] font-semibold uppercase tracking-wider ${
                isLockedByAnother
                  ? "border-black/10 bg-black/5 text-black/40 cursor-not-allowed"
                  : "border-[#2A2421] bg-white text-[#2A2421] active:scale-95 shadow-sm"
              }`}
            >
              <FiShoppingBag size={13} />
              <span>{isLockedByAnother ? "Reserved" : showAddedToast ? "Added" : "Add"}</span>
            </button>

            <button
              type="button"
              disabled={isLockedByAnother}
              onClick={handleBuyNow}
              className={`flex h-11 items-center justify-center gap-1.5 rounded-full px-5 text-[10px] font-semibold uppercase tracking-wider ${
                isLockedByAnother
                  ? "bg-black/10 text-black/40 cursor-not-allowed"
                  : "bg-[#8E3D51] text-white shadow-md active:scale-95"
              }`}
            >
              <span>{isLockedByAnother ? "Piece Held" : "Buy Now"}</span>
              {!isLockedByAnother && <FiArrowRight size={13} />}
            </button>
          </div>
        </div>
      </motion.aside>
    </main>
  );
}

export default Product;