import React from "react";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ReceiptIndianRupee,
} from "lucide-react";
import type { CartItem } from "../../../types/dashboard";

interface BillingCartProps {
  cart: CartItem[];
  subtotal: number;
  discount: number;
  cgst: number;
  sgst: number;
  total: number;
  discountPercent: number;
  promoCode?: string;
  onUpdateQty: (cartId: string, newQty: number) => void;
  onRemoveItem: (cartId: string) => void;
  onClearCart: () => void;
  onDiscountPercentChange: (percent: number) => void;
  onPromoCodeChange?: (code: string) => void;
  onCheckout: () => void;
}

export const BillingCart: React.FC<BillingCartProps> = ({
  cart,
  subtotal,
  discount,
  cgst,
  sgst,
  total,
  discountPercent,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onDiscountPercentChange,
  onCheckout,
}) => {
  const currency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  const totalItemCount = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <div className="glass-panel p-5 rounded-3xl flex flex-col justify-between h-full space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#D4A373] flex items-center justify-center border border-amber-200/60">
              <ShoppingBag size={16} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm text-stone-900">
                Billing Cart
              </h3>
              <span className="text-[11px] text-stone-500 font-mono">
                {totalItemCount} {totalItemCount === 1 ? "Drape" : "Drapes"} selected
              </span>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="text-[11px] text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 transition-colors"
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Cart items list */}
        <div className="mt-3 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div
                key={item.cartId}
                className="p-3 rounded-2xl bg-white/90 border border-stone-200/80 shadow-2xs space-y-2 hover:border-stone-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-xs text-stone-900 truncate">
                      {item.name}
                    </h4>
                    <p className="font-mono text-[10px] text-stone-500 truncate">
                      {item.sku} &bull; <span className="font-sans font-medium text-stone-700">{item.color}</span>
                    </p>
                  </div>
                  <span className="font-mono font-bold text-xs text-stone-900">
                    {currency(item.unitPrice * item.qty)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                  <span className="text-[10px] text-stone-400 font-mono">
                    ₹{item.unitPrice.toLocaleString("en-IN")} each
                  </span>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.cartId, item.qty - 1)}
                        className="px-2 py-0.5 text-xs text-stone-500 hover:bg-stone-200 transition-colors font-bold"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="w-8 text-center text-xs font-mono font-bold bg-white">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.cartId, item.qty + 1)}
                        disabled={item.qty >= item.maxStock}
                        className="px-2 py-0.5 text-xs text-stone-500 hover:bg-stone-200 transition-colors font-bold disabled:opacity-30"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.cartId)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-stone-400 text-xs space-y-2">
              <ShoppingBag size={24} className="mx-auto text-stone-300" />
              <p>Cart is empty. Select sarees to begin billing.</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Calculations Footer */}
      {cart.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-stone-200/80">
          {/* Quick Discount Buttons */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-stone-600">
              <span className="font-medium">Privilege Discount (%):</span>
              <span className="font-mono font-bold text-stone-800">
                {discountPercent}%
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 5, 10, 15].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => onDiscountPercentChange(pct)}
                  className={`h-7 rounded-lg text-[11px] font-semibold transition-all ${
                    discountPercent === pct
                      ? "bg-[#2A0E20] text-amber-100 shadow-2xs"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                  }`}
                >
                  {pct === 0 ? "None" : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Breakdown summary */}
          <div className="space-y-1 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">{currency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount ({discountPercent}%):</span>
                <span className="font-mono font-semibold">-{currency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-500 text-[11px]">
              <span>CGST &amp; SGST:</span>
              <span className="font-mono font-medium">{currency(cgst + sgst)}</span>
            </div>
            <div className="pt-2 border-t border-stone-200 flex justify-between text-stone-900 font-bold text-base">
              <span>Total Payable:</span>
              <span className="font-display text-[#2A0E20] font-bold">
                {currency(total)}
              </span>
            </div>
          </div>

          {/* Checkout button */}
          <button
            type="button"
            onClick={onCheckout}
            className="w-full h-12 rounded-2xl bg-[#2A0E20] hover:bg-[#3d162f] text-amber-100 font-semibold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <ReceiptIndianRupee size={16} className="text-[#D4A373]" />
            <span>Proceed to Payment &amp; Invoice</span>
          </button>
        </div>
      )}
    </div>
  );
};
