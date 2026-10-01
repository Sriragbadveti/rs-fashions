import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiCheck, FiShoppingBag } from "react-icons/fi";
import type { Product } from "../../data/products";
import { useCart } from "../../context/CartContext";
import { handleSareeImageError } from "../../utils/imageConverter";
import { getImageVariantUrl, fallbackToOriginalImage } from "../../utils/imageVariants";

export interface ProductCardProps {
  product: Product;
  className?: string;
  showBorderBadge?: boolean;
}

export default function ProductCard({
  product,
  className = "",
  showBorderBadge = true,
}: ProductCardProps) {
  const { items = [], addToCart } = useCart() as any;
  const [justAdded, setJustAdded] = useState(false);

  const price = Number(product.price) || 0;
  const originalPrice = product.originalPrice ? Number(product.originalPrice) : undefined;
  const discountPercentage =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  const inCart = (items || []).some((item: any) => {
    const cId = item?.product?.id ?? item?.id;
    return String(cId) === String(product.id);
  });

  const isSoldOut = product.stock !== undefined && product.stock <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSoldOut || justAdded) return;

    addToCart(product, {
      quantity: 1,
      selectedColor: (product.colors && product.colors[0]) || "Standard",
      selectedSize: "Free Size (5.5m + 0.8m Blouse)",
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  const primaryImage = product.images?.[0] || "";
  const hoverImage = product.images?.[1] || primaryImage;
  const hasSecondaryImage = Boolean(hoverImage && hoverImage !== primaryImage);

  const cleanMaterial = (product.material || "SiCo").replace(/silk[\s-]*cotton/gi, "SiCo");

  const effectiveBorder = (
    product.borderColor ||
    (product as any).border_color ||
    (Array.isArray((product as any).variants)
      ? (product as any).variants.find((v: any) => v?.borderColor)?.borderColor
      : "") ||
    ""
  ).trim();

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-2.5 sm:p-3 shadow-xs font-sans select-none transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${className}`}
    >
      {/* Clickable Image Container */}
      <div className="relative aspect-3/4 w-full overflow-hidden rounded-xl bg-[#E9C9C3]/55">
        <Link
          to={`/product/${product.id}`}
          state={{ product }}
          className="block h-full w-full"
        >
          {/* Primary Saree Image */}
          <img
            src={getImageVariantUrl(primaryImage, "sm")}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              if (!fallbackToOriginalImage(e, primaryImage)) {
                handleSareeImageError(e, primaryImage);
              }
            }}
            className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
          />

          {/* Alternate View on Hover */}
          {hasSecondaryImage && (
            <img
              src={getImageVariantUrl(hoverImage, "sm")}
              alt={`${product.name} alternate view`}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                if (!fallbackToOriginalImage(e, hoverImage)) {
                  handleSareeImageError(e, hoverImage);
                }
              }}
              className="absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-105"
            />
          )}

          {/* Subtle Bottom Vignette on Hover */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </Link>

        {/* Sold Out Overlay */}
        {isSoldOut && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
            <span className="rounded-full bg-[#2A2421] px-3.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.2em] text-white shadow-md">
              Sold Out
            </span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col gap-1">
          {discountPercentage > 0 ? (
            <span className="rounded-full bg-[#8E3D51] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white shadow-xs">
              {discountPercentage}% Off
            </span>
          ) : (product.isSpecialOffer || (product as any).isOfferEligible) ? (
            <span className="rounded-full bg-[#8E3D51] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white shadow-xs">
              Special Offer
            </span>
          ) : null}

          {showBorderBadge && effectiveBorder && (
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#8E3D51] shadow-xs backdrop-blur-xs">
              {effectiveBorder} Border
            </span>
          )}
        </div>

        {/* Desktop Quick Add Button (Reveals on Hover) */}
        {!isSoldOut && (
          <div className="absolute bottom-2 inset-x-2 z-10 hidden sm:block opacity-0 translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
            <button
              type="button"
              onClick={handleQuickAdd}
              className={`flex h-8.5 w-full items-center justify-center gap-1.5 rounded-xl text-[11px] font-semibold uppercase tracking-wider shadow-md transition-all active:scale-95 ${
                inCart || justAdded
                  ? "bg-emerald-600 text-white cursor-default"
                  : "bg-[#2A2421]/95 text-[#F7EBEC] hover:bg-[#8E3D51] cursor-pointer"
              }`}
            >
              {inCart || justAdded ? (
                <>
                  <FiCheck size={13} className="stroke-[2.5]" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <FiShoppingBag size={12} />
                  <span>Quick Add</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Card Details */}
      <div className="mt-2.5 flex flex-1 flex-col justify-between">
        <div>
          <span className="text-[9px] sm:text-[9.5px] font-bold uppercase tracking-widest text-[#8E3D51]">
            {cleanMaterial}
          </span>
          <Link
            to={`/product/${product.id}`}
            state={{ product }}
            className="group/link mt-0.5 block"
          >
            <h3 className="font-serif text-[0.95rem] sm:text-[1.05rem] font-normal leading-snug text-[#2A2421] transition-colors duration-200 group-hover/link:text-[#8E3D51] line-clamp-1">
              {product.name}
            </h3>
          </Link>
          {product.description && (
            <p className="mt-0.5 text-[10.5px] sm:text-[11px] text-stone-500 line-clamp-1 font-light">
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-black/5 pt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-bold text-[#2A2421]">
              ₹{price.toLocaleString("en-IN")}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-[11px] text-stone-400 line-through">
                ₹{originalPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Mobile Quick Add Button / Shade Pill on Desktop */}
          <div className="flex items-center">
            <button
              type="button"
              disabled={isSoldOut}
              onClick={handleQuickAdd}
              aria-label={inCart || justAdded ? "Item added to bag" : "Add to bag"}
              className={`sm:hidden flex h-7 items-center gap-1 rounded-lg px-2 text-[10px] font-semibold uppercase tracking-wider transition-all active:scale-95 ${
                inCart || justAdded
                  ? "bg-emerald-600 text-white"
                  : "bg-[#2A2421] text-white hover:bg-[#8E3D51]"
              }`}
            >
              {inCart || justAdded ? (
                <FiCheck size={11} className="stroke-[2.5]" />
              ) : (
                <FiShoppingBag size={11} />
              )}
              <span>{inCart || justAdded ? "Added" : "Add"}</span>
            </button>

            {product.colors && product.colors.length > 0 && (
              <span className="hidden sm:inline-block text-[9.5px] uppercase tracking-wider text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                {product.colors.length} shades
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}