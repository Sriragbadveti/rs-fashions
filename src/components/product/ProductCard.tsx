import { useState } from "react";
import { motion } from "framer-motion";
import { FiHeart, FiStar, FiArrowUpRight } from "react-icons/fi";
import { Link } from "react-router-dom";

import type { Product } from "../../data/products";

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const discountPercentage = product.originalPrice
    ? Math.round(
      ((product.originalPrice - product.price) / product.originalPrice) * 100
    )
    : 0;

  const primaryImage = product.images?.[0] || "";
  const hoverImage = product.images?.[1] || primaryImage;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col font-sans select-none"
    >
      {/* Clickable Image Container */}
      <div className="relative aspect-[0.75] w-full overflow-hidden rounded-2xl bg-[#EFEAE2]">
        <Link
          to={`/product/${product.id}`}
          state={{ product }}
          className="block h-full w-full"
        >
          {/* Primary View */}
          <img
            src={primaryImage}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-105"
          />

          {/* Alternate View on Hover */}
          {hoverImage && (
            <img
              src={hoverImage}
              alt={`${product.name} alternate view`}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-100"
            />
          )}

          {/* Gentle Shading Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </Link>

        {/* Top Badges */}
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            {product.featured && (
              <span className="rounded-full bg-[#FAF7F2]/90 px-2.5 py-1 text-[8.5px] font-semibold uppercase tracking-widest text-[#2A2421] shadow-sm backdrop-blur-md">
                Featured
              </span>
            )}
            {discountPercentage > 0 && (
              <span className="rounded-full bg-[#8E3D51]/90 px-2.5 py-1 text-[8.5px] font-semibold uppercase tracking-widest text-white shadow-sm backdrop-blur-md">
                {discountPercentage}% Off
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsWishlisted(!isWishlisted);
            }}
            aria-label={`Add ${product.name} to wishlist`}
            className={`pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 active:scale-90 ${isWishlisted
                ? "bg-[#8E3D51] text-white shadow-md"
                : "bg-white/80 text-[#2A2421] hover:bg-white"
              }`}
          >
            <FiHeart size={14} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={1.7} />
          </button>
        </div>
      </div>

      {/* Information Area */}
      <div className="mt-3 flex flex-col">
        {/* Material & Rating */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[10px] font-medium uppercase tracking-widest text-[#8C7A6B]">
            {product.material}
          </span>

          <span className="flex items-center gap-1 font-serif text-[11px] text-[#2A2421]">
            <FiStar size={10} className="fill-[#D4AF37] text-[#D4AF37]" />
            {product.rating.toFixed(1)}
            <span className="text-[#8C7A6B]">({product.reviewCount})</span>
          </span>
        </div>

        {/* Title */}
        <Link
          to={`/product/${product.id}`}
          state={{ product }}
          className="group/link mt-1 flex items-center justify-between"
        >
          <h3 className="font-serif text-[1.1rem] font-light tracking-wide text-[#2A2421] transition-colors duration-200 group-hover/link:text-[#8E3D51] line-clamp-1">
            {product.name}
          </h3>
          <FiArrowUpRight
            size={14}
            className="text-[#8C7A6B] opacity-0 transition-opacity duration-200 group-hover/link:opacity-100"
          />
        </Link>

        {/* Short Editorial Line */}
        <p className="mt-0.5 text-xs text-[#6E6359] line-clamp-1 font-light">
          {product.description}
        </p>

        {/* Pricing & Colors Row */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-[#2A2421]">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.originalPrice && (
              <span className="font-sans text-xs text-[#8C7A6B] line-through">
                ₹{product.originalPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Color List preview */}
          {product.colors && product.colors.length > 0 && (
            <span className="text-[10px] uppercase tracking-wider text-[#8C7A6B]">
              {product.colors.length} shades
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default ProductCard;