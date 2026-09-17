import { useMemo } from "react";
import { motion } from "framer-motion";
import { FiArrowUpRight, FiGift } from "react-icons/fi";
import { Link } from "react-router-dom";

import type { Product } from "../../data/products";

interface ProductCardProps {
  product: Product & { isOfferEligible?: boolean; offerTag?: string };
}

function ProductCard({ product }: ProductCardProps) {
  const discountPercentage = product.originalPrice
    ? Math.round(
      ((product.originalPrice - product.price) / product.originalPrice) * 100
    )
    : 0;

  const { isOffer, offerBadge } = useMemo(() => {
    if (product.isOfferEligible) {
      return { isOffer: true, offerBadge: product.offerTag || "Exclusive Offer" };
    }
    try {
      const raw = localStorage.getItem("rs_fashions_sale_config");
      if (raw) {
        const conf = JSON.parse(raw);
        const matchItem = conf.saleItems?.find(
          (it: any) => String(it.id) === String(product.id) && it.isActive !== false
        );
        if (matchItem) {
          return { isOffer: true, offerBadge: matchItem.customOfferText || "Exclusive Offer" };
        }
        if (conf.saleProductIds?.some((id: any) => String(id) === String(product.id))) {
          return { isOffer: true, offerBadge: "Exclusive Offer" };
        }
      }
    } catch {}
    return { isOffer: false, offerBadge: "" };
  }, [product.id, product.isOfferEligible, product.offerTag]);

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
            {isOffer && (
              <span className="rounded-full bg-[#8E3D51] px-2.5 py-1 text-[8.5px] font-bold uppercase tracking-wider text-amber-100 shadow-md backdrop-blur-md flex items-center gap-1">
                <FiGift size={11} className="text-amber-300" />
                <span>{offerBadge}</span>
              </span>
            )}
            {product.featured && (
              <span className="rounded-full bg-[#FAF7F2]/90 px-2.5 py-1 text-[8.5px] font-semibold uppercase tracking-widest text-[#2A2421] shadow-sm backdrop-blur-md">
                Featured
              </span>
            )}
          </div>
          {discountPercentage > 0 && !isOffer && (
            <span className="rounded-full bg-[#2A2421]/90 px-2 py-0.5 text-[8.5px] font-semibold tracking-wider text-white shadow-sm backdrop-blur-md">
              -{discountPercentage}%
            </span>
          )}
        </div>
      </div>

      {/* Information Area */}
      <div className="mt-3 flex flex-col">
        {/* Material & Rating */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[10px] font-medium uppercase tracking-widest text-[#8C7A6B]">
            {product.material}
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

        {/* Bundle Deal Pill for offer sarees */}
        {isOffer && (
          <div className="mt-2.5 flex items-center justify-between rounded-xl bg-[#FAF4ED] px-2.5 py-1.5 border border-[#8E3D51]/20">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#8E3D51]">
              <FiGift size={11} className="shrink-0 text-[#8E3D51]" />
              <span>Bundle: 1 @ ₹2500 · 2 @ ₹4900 · 3 @ ₹4800</span>
            </span>
            <Link
              to="/offers"
              className="text-[9px] font-bold uppercase tracking-wider text-[#8E3D51] hover:underline shrink-0 ml-1"
            >
              Offers Store →
            </Link>
          </div>
        )}
      </div>
    </motion.article>
  );
}

export default ProductCard;