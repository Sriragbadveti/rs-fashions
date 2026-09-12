import { useState } from "react";
import {
  FiCheck,
  FiHeart,
  FiShare2,
  FiShield,
  FiTruck,
  FiStar,
  FiCopy,
  FiInfo,
} from "react-icons/fi";

import type { Product } from "../../types/product";

interface ProductInfoProps {
  product: Product;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

const DEFAULT_DRAPE_SIZES = [
  "Standard Saree (5.5m) + Unstitched Blouse Piece (0.8m)",
];

function ProductInfo({ product, onAddToCart, onBuyNow }: ProductInfoProps) {
  const availableSizes: string[] =
    ("sizes" in product && Array.isArray((product as { sizes?: string[] }).sizes)
      ? (product as { sizes?: string[] }).sizes
      : null) || DEFAULT_DRAPE_SIZES;

  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors?.[0] || "Standard"
  );
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0]);
  const [copied, setCopied] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  const promoCode = "RSFASHION10";

  const handleCopyCoupon = () => {
    navigator.clipboard?.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans select-none text-[#2A2421]">
      {/* 1. Header & Meta */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8C7A6B]">
                {product.category}
              </span>
              <span className="text-[#8C7A6B] text-[8px]">✦</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8E3D51]">
                {product.material}
              </span>
            </div>

            <h1 className="font-serif text-[clamp(2.2rem,5vw,3.4rem)] font-light leading-[1.02] tracking-tight text-[#2A2421]">
              {product.name}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: product.name,
                  text: product.description,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard?.writeText(window.location.href);
              }
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-[#FAF7F2] text-[#2A2421] transition-all hover:bg-[#8E3D51] hover:text-white active:scale-90 shadow-sm"
            aria-label="Share product"
          >
            <FiShare2 size={16} />
          </button>
        </div>

        {/* Rating & Stock Status */}
        <div className="mt-3 flex items-center justify-between border-b border-black/6 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 font-serif text-sm font-medium text-[#2A2421]">
              <FiStar size={13} className="fill-[#D4AF37] text-[#D4AF37]" />
              <span>{product.rating}</span>
            </div>
            <span className="text-xs text-[#8C7A6B]">
              ({product.reviewCount} curated reviews)
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Ready to Dispatch
          </span>
        </div>
      </div>

      {/* 2. Pricing */}
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="font-serif text-3xl font-medium text-[#2A2421]">
            ₹{product.price.toLocaleString("en-IN")}
          </span>

          {product.originalPrice && product.originalPrice > product.price && (
            <>
              <span className="font-serif text-base text-[#8C7A6B] line-through">
                ₹{product.originalPrice.toLocaleString("en-IN")}
              </span>

              <span className="rounded-full bg-[#8E3D51]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8E3D51]">
                Save {discount}%
              </span>
            </>
          )}
        </div>
        <span className="text-[11px] font-light text-[#8C7A6B]">
          Inclusive of all taxes · Free insured express shipping
        </span>
      </div>

      {/* 3. Color Swatches */}
      {product.colors && product.colors.length > 0 && (
        <div className="pt-2">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2A2421]">
              Shade: <span className="font-normal text-[#8C7A6B]">{selectedColor}</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {product.colors.map((color: string) => {
              const isSelected = selectedColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`group relative rounded-full px-4 py-2 text-xs font-medium tracking-wide transition-all ${
                    isSelected
                      ? "bg-[#2A2421] text-[#FAF7F2] shadow-sm"
                      : "border border-black/10 bg-white/70 text-[#4A4039] hover:border-[#8E3D51] hover:text-[#8E3D51]"
                  }`}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Drape Length & Dimensions */}
      <div className="pt-1">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2A2421]">
            Drape Length & Fit
          </span>

          <button
            type="button"
            onClick={() => setShowSizeModal(!showSizeModal)}
            className="flex items-center gap-1 text-[11px] font-medium tracking-wide text-[#8E3D51] transition-colors hover:underline"
          >
            <FiInfo size={12} />
            <span>Drape Details</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {availableSizes.map((size: string) => (
            <button
              key={size}
              type="button"
              onClick={() => setSelectedSize(size)}
              className={`w-full text-left rounded-xl border p-3.5 text-xs transition-all ${
                selectedSize === size
                  ? "border-[#2A2421] bg-[#2A2421]/3 text-[#2A2421] font-medium shadow-sm"
                  : "border-black/10 bg-white/50 text-[#6E6359]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{size}</span>
                <FiCheck
                  size={14}
                  className={selectedSize === size ? "text-[#8E3D51]" : "opacity-0"}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Privilege Coupon */}
      <div className="flex items-center justify-between rounded-2xl border border-dashed border-[#8E3D51]/35 bg-[#FAF4ED] p-3.5 shadow-sm">
        <div>
          <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#8E3D51]">
            Atelier Privilege
          </span>
          <p className="font-mono text-sm font-semibold tracking-wider text-[#2A2421] mt-0.5">
            {promoCode}
          </p>
          <p className="text-[10px] text-[#8C7A6B]">
            Flat 10% savings on your bridal/festive order
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyCoupon}
          className="flex items-center gap-1.5 rounded-full bg-[#2A2421] px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-white transition-all hover:bg-[#8E3D51] active:scale-95"
        >
          {copied ? (
            <>
              <FiCheck size={12} className="text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <FiCopy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* 6. Trust Anchors */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="rounded-2xl border border-black/5 bg-[#FAF7F2] p-3.5">
          <FiTruck size={17} className="text-[#8E3D51]" />
          <p className="mt-2 text-xs font-semibold text-[#2A2421]">
            Complimentary Shipping
          </p>
          <p className="mt-0.5 text-[10px] leading-4 text-[#8C7A6B]">
            Dispatches within 24–48 hours in luxury transit packaging.
          </p>
        </div>

        <div className="rounded-2xl border border-black/5 bg-[#FAF7F2] p-3.5">
          <FiShield size={17} className="text-[#8E3D51]" />
          <p className="mt-2 text-xs font-semibold text-[#2A2421]">
            Authenticity Guaranteed
          </p>
          <p className="mt-0.5 text-[10px] leading-4 text-[#8C7A6B]">
            Includes Silk Mark / Handloom Craft Certification.
          </p>
        </div>
      </div>

      {/* 7. Action CTA Buttons */}
      <div className="hidden gap-3 pt-3 sm:flex">
        <button
          type="button"
          onClick={onAddToCart}
          className="flex-1 rounded-full border border-[#2A2421] bg-transparent py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#2A2421] transition-all hover:bg-[#2A2421] hover:text-[#FAF7F2] active:scale-[0.98]"
        >
          Add to Bag
        </button>

        <button
          type="button"
          onClick={onBuyNow}
          className="flex-1 rounded-full bg-[#8E3D51] py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#FAF7F2] shadow-lg transition-all hover:bg-[#722A3B] active:scale-[0.98]"
        >
          Instant Checkout
        </button>
      </div>

      {/* Social Proof */}
      <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-[#8C7A6B]">
        <FiHeart size={13} className="text-[#8E3D51]" />
        <span>
          Selected by <strong>{product.reviewCount}+ connoisseurs</strong> this season
        </span>
      </div>
    </div>
  );
}

export default ProductInfo;
