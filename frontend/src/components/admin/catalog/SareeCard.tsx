import React from "react";
import {
  Tag,
  Edit3,
  Trash2,
  Sparkles,
  Plus,
  Minus,
} from "lucide-react";
import type { DashboardProduct } from "../../../types/dashboard";

interface SareeCardProps {
  product: DashboardProduct;
  categoryName?: string;
  onEdit: (product: DashboardProduct) => void;
  onDelete: (productId: string) => void;
  onQuickRestock: (product: DashboardProduct, variantSku: string, amount: number) => void;
  onOpenAuditHistory?: () => void;
}

export const SareeCard: React.FC<SareeCardProps> = ({
  product,
  categoryName = "SiCo Gadwal Sarees",
  onEdit,
  onDelete,
  onQuickRestock,
}) => {
  const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
  const isLowStock = totalStock <= 3;
  const isOutOfStock = totalStock === 0;

  const currency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="group relative rounded-3xl bg-white/80 backdrop-blur-md border border-stone-200/80 p-5 shadow-sm hover:shadow-xl hover:border-stone-300 transition-all duration-300 flex flex-col justify-between">
      {/* Top Media & Tags */}
      <div className="space-y-3.5">
        {/* Visual & SKU header */}
        <div className="flex items-start gap-3.5">
          <div className="relative w-20 h-24 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 group-hover:scale-[1.02] transition-transform duration-300">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#2A0E20]/10 via-stone-100 to-amber-100/30 text-stone-400 p-2 text-center">
                <Sparkles size={20} className="text-[#D4A373] mb-1 opacity-75" />
                <span className="text-[9px] font-mono font-medium leading-tight">
                  RS Fashions
                </span>
              </div>
            )}

            {/* Out of Stock Overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-2xs flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-wider">
                Sold Out
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono font-bold text-[#D4A373] uppercase tracking-wider truncate">
                {product.id}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  isOutOfStock
                    ? "bg-rose-100 text-rose-700"
                    : isLowStock
                    ? "bg-amber-100 text-amber-800 animate-pulse"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {isOutOfStock
                  ? "0 in stock"
                  : isLowStock
                  ? `${totalStock} Low Stock`
                  : `${totalStock} Available`}
              </span>
            </div>

            <h3 className="font-display font-semibold text-base text-stone-900 leading-snug group-hover:text-[#2A0E20] transition-colors line-clamp-1">
              {product.name}
            </h3>

            <p className="text-[11px] text-stone-500 font-light truncate">
              {categoryName}
            </p>

            {/* Price section */}
            <div className="pt-1 flex items-baseline gap-2">
              <span className="font-display font-bold text-base text-stone-900">
                {currency(product.salePrice)}
              </span>
              {product.purchasePrice > 0 && (
                <span className="text-[11px] text-stone-400 font-normal">
                  Cost: {currency(product.purchasePrice)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-lg bg-stone-100/90 text-stone-600 text-[10px] font-medium tracking-wide flex items-center gap-1"
              >
                <Tag size={10} className="text-stone-400" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        )}

        {/* Color Shades & Inventory Controls */}
        <div className="pt-2 border-t border-stone-100 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-stone-500">
            <span className="font-medium">Shades &amp; Stock Count:</span>
            <span className="font-mono text-[10px]">
              {product.variants.length} {product.variants.length === 1 ? "Variant" : "Variants"}
            </span>
          </div>

          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {product.variants.map((variant) => (
              <div
                key={variant.sku}
                className="flex items-center justify-between p-2 rounded-xl bg-stone-50/80 border border-stone-200/60 hover:bg-stone-50 transition-colors text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4A373] shrink-0" />
                  <span className="font-medium text-stone-800 truncate">
                    {variant.color}
                  </span>
                  <span className="font-mono text-[10px] text-stone-400 shrink-0">
                    ({variant.colorSlug})
                  </span>
                </div>

                {/* Stock +/- Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title="Deduct 1 piece"
                    disabled={variant.stock <= 0}
                    onClick={() => onQuickRestock(product, variant.sku, -1)}
                    className="w-6 h-6 rounded-lg bg-white border border-stone-200 text-stone-600 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
                  >
                    <Minus size={12} />
                  </button>

                  <span
                    className={`w-8 text-center font-mono font-bold text-xs ${
                      variant.stock === 0
                        ? "text-rose-600"
                        : variant.stock <= 2
                        ? "text-amber-700"
                        : "text-stone-800"
                    }`}
                  >
                    {variant.stock}
                  </span>

                  <button
                    type="button"
                    title="Add 1 piece"
                    onClick={() => onQuickRestock(product, variant.sku, 1)}
                    className="w-6 h-6 rounded-lg bg-white border border-stone-200 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 flex items-center justify-center transition-colors shadow-2xs"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="flex-1 h-9 rounded-xl bg-stone-100 hover:bg-[#2A0E20] hover:text-amber-100 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200"
        >
          <Edit3 size={13} />
          <span>Edit Saree</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(product.id)}
          title="Delete from catalogue"
          className="w-9 h-9 rounded-xl border border-stone-200 text-stone-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center transition-colors shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
