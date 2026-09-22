import { AnimatePresence, motion } from "framer-motion";
import {
  FiArrowLeft,
  FiArrowRight,
  FiMinus,
  FiPlus,
  FiTrash2,
  FiShoppingBag,
  FiShield,
  FiTruck,
  FiCheckCircle,
  FiTag,
  FiGift,
} from "react-icons/fi";
import { Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Cart() {
  const navigate = useNavigate();

  const {
    items,
    itemCount,
    subtotal,
    offerDiscount,
    tierOffer,
    finalSubtotal,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const FREE_SHIPPING_THRESHOLD = 1999;
  const shipping = finalSubtotal >= FREE_SHIPPING_THRESHOLD || finalSubtotal === 0 ? 0 : 99;
  const total = finalSubtotal + shipping;
  const shippingProgress = Math.min((finalSubtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <main className="relative min-h-screen bg-[#FAF8F5] px-4 pb-32 pt-8 sm:px-6 sm:pt-12 md:px-10 lg:px-16 selection:bg-[#8E3D51] selection:text-white font-sans">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-full max-w-7xl rounded-full bg-linear-to-b from-[#8E3D51]/[0.03] to-transparent blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl">
        {/* =====================================================
            EDITORIAL HEADER
        ====================================================== */}
        <header className="mb-8 flex flex-col gap-4 border-b border-stone-300/60 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-stone-900 leading-[1.05]">
              Your Shopping Bag
            </h1>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-4 self-start sm:self-auto">
              <span className="text-[11px] text-stone-400 font-mono tracking-wide">
                {itemCount} {itemCount === 1 ? "Drape" : "Drapes"} Chosen
              </span>
              <button
                type="button"
                onClick={clearCart}
                className="rounded-full border border-stone-300 bg-white/70 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500 backdrop-blur-md transition-all duration-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 active:scale-95"
              >
                Clear All
              </button>
            </div>
          )}
        </header>

        {/* =====================================================
            SPECIAL TIERED OFFER PROGRESS BANNER
        ====================================================== */}
        {items.length > 0 && (
          <div className="mb-8 overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-200/90 bg-linear-to-r from-amber-50/90 via-[#FDF9F2] to-amber-50/90 p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-[#8E3D51] to-[#692637] text-white shadow-xs">
                  <Sparkles size={18} className="text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#8E3D51] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
                      Special Offer
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-stone-900">
                      {tierOffer.tier > 0 ? tierOffer.label : "Tiered Bundle Savings Active"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-stone-600">
                    {!tierOffer.isMaxTier ? (
                      <>
                        Add{" "}
                        <strong className="text-[#8E3D51] font-bold">
                          {tierOffer.nextTierNeeded} more saree
                        </strong>{" "}
                        to unlock{" "}
                        <strong className="text-stone-900 font-bold">
                          {tierOffer.nextTierPercent}% Instant Order Discount!
                        </strong>
                      </>
                    ) : (
                      <span className="text-emerald-700 font-medium">
                        🎉 Maximum Tier Unlocked: Extra 15% discount automatically subtracted!
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="flex gap-1.5 text-[10px] font-bold">
                  <span className={`px-2.5 py-1 rounded-full border transition-all ${itemCount >= 1 ? "bg-amber-100 border-amber-300 text-amber-900" : "bg-white/60 border-stone-200 text-stone-400"}`}>
                    Buy 1: 5% Off
                  </span>
                  <span className={`px-2.5 py-1 rounded-full border transition-all ${itemCount >= 2 ? "bg-amber-200 border-amber-400 text-amber-950 font-extrabold shadow-2xs" : "bg-white/60 border-stone-200 text-stone-400"}`}>
                    Buy 2: 10% Off
                  </span>
                  <span className={`px-2.5 py-1 rounded-full border transition-all ${itemCount >= 3 ? "bg-[#8E3D51] border-[#8E3D51] text-white shadow-xs" : "bg-white/60 border-stone-200 text-stone-400"}`}>
                    Buy 3+: 15% Off
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            EMPTY BAG STATE
        ====================================================== */}
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-stone-200/80 bg-white/50 p-8 text-center backdrop-blur-xl shadow-xs"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-stone-100 to-[#F0EAE3] text-[#8E3D51] shadow-xs">
              <FiShoppingBag size={30} strokeWidth={1.2} />
            </div>

            <h2 className="mt-6 font-serif text-2xl sm:text-3xl text-stone-900 font-normal">
              Your bag is currently empty
            </h2>

            <p className="mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-stone-500 font-light">
              Explore our handcrafted SiCo Gadwal sarees and exclusive bundle offers.
            </p>

            <Link
              to="/shop"
              className="group mt-8 inline-flex items-center gap-3 rounded-full bg-[#2A0E20] px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100 shadow-md transition-all duration-300 hover:bg-[#8E3D51] hover:text-white active:scale-95"
            >
              <span>Explore The Store</span>
              <FiArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        ) : (
          /* ===================================================
             FILLED BAG CONTENT GRID
          ==================================================== */
          <div className="grid gap-10 lg:grid-cols-[1fr_390px] lg:items-start">
            {/* ITEM CARDS COLUMN */}
            <section className="min-w-0 space-y-4">
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const itemKey = `${item.product.id}-${item.selectedColor}-${item.selectedSize}`;
                  const drapePrice = Number(item.product.price) || 0;

                  return (
                    <motion.article
                      key={itemKey}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="group relative overflow-hidden rounded-3xl border border-stone-200/80 bg-white/90 p-4 sm:p-5 shadow-xs backdrop-blur-md transition-all duration-300 hover:border-stone-300 hover:shadow-md"
                    >
                      <div className="flex gap-4 sm:gap-6">
                        {/* SAREE VISUAL CONTAINER */}
                        <div className="relative aspect-[3/4] w-24 sm:w-32 shrink-0 overflow-hidden rounded-2xl bg-[#F4EFEA]">
                          <img
                            src={item.product.images?.[0]}
                            alt={item.product.name}
                            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                          />
                          <span className="absolute left-1.5 top-1.5 rounded-full bg-[#8E3D51] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white shadow-xs">
                            Special Offer
                          </span>
                        </div>

                        {/* EDITORIAL SPECIFICATION */}
                        <div className="flex flex-1 flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8E3D51]">
                                  {item.product.material || "SiCo Gadwal"}
                                </span>
                                <h3 className="font-serif text-base sm:text-lg font-normal text-stone-900 leading-snug truncate">
                                  {item.product.name}
                                </h3>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeFromCart(
                                    item.product.id,
                                    item.selectedColor,
                                    item.selectedSize
                                  )
                                }
                                aria-label="Remove item"
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors duration-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                              >
                                <FiTrash2 size={15} />
                              </button>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-stone-500">
                              {item.selectedColor && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100/90 px-2.5 py-1 text-stone-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#8E3D51]" />
                                  {item.selectedColor}
                                </span>
                              )}
                              <span className="rounded-full bg-stone-100/90 px-2.5 py-1 text-stone-700">
                                {item.selectedSize || "Standard 6.3m"}
                              </span>
                            </div>
                          </div>

                          {/* PRICE & QUANTITY STEPPER */}
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3">
                            <div className="flex items-baseline gap-2">
                              <span className="font-serif text-lg sm:text-xl font-bold text-stone-900">
                                {formatCurrency(drapePrice * item.quantity)}
                              </span>
                              {item.quantity > 1 && (
                                <span className="text-[11px] text-stone-400 font-mono">
                                  ({formatCurrency(drapePrice)} / drape)
                                </span>
                              )}
                            </div>

                            {/* QUANTITY CONTROLLER */}
                            <div className="flex items-center rounded-full border border-stone-200 bg-stone-50/80 p-1">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity - 1,
                                    item.selectedColor,
                                    item.selectedSize
                                  )
                                }
                                aria-label="Decrease quantity"
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-stone-700 shadow-2xs transition-transform active:scale-90"
                              >
                                <FiMinus size={11} />
                              </button>
                              <span className="w-8 text-center text-xs font-bold font-mono text-stone-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity + 1,
                                    item.selectedColor,
                                    item.selectedSize
                                  )
                                }
                                aria-label="Increase quantity"
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-stone-700 shadow-2xs transition-transform active:scale-90"
                              >
                                <FiPlus size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>

              {/* BACK TO SHOP ACTION */}
              <div className="pt-2">
                <Link
                  to="/shop"
                  className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600 hover:text-[#8E3D51] transition-colors"
                >
                  <FiArrowLeft
                    size={14}
                    className="transition-transform duration-300 group-hover:-translate-x-1"
                  />
                  <span>Continue Browsing Sarees</span>
                </Link>
              </div>
            </section>

            {/* =================================================
                ORDER SUMMARY BILLING COLUMN
            ================================================== */}
            <aside className="lg:sticky lg:top-28">
              <div className="rounded-3xl border border-stone-200/80 bg-white/90 p-6 sm:p-7 shadow-xs backdrop-blur-xl space-y-6">
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-stone-900">
                      Summary & Taxes
                    </h2>
                    <p className="text-[11px] text-stone-400 font-light">
                      Automatic special offer discount applied
                    </p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7EFE9] text-[#8E3D51]">
                    <FiShoppingBag size={16} />
                  </div>
                </div>

                {/* COMPLIMENTARY SHIPPING MILESTONE */}
                <div className="rounded-2xl border border-stone-200/70 bg-[#FAF8F5] p-4 text-xs">
                  {finalSubtotal >= FREE_SHIPPING_THRESHOLD ? (
                    <div className="flex items-center gap-2 text-emerald-700 font-medium">
                      <FiCheckCircle size={15} className="shrink-0" />
                      <span>Complimentary insured shipping unlocked</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-stone-600 leading-relaxed text-[11.5px]">
                        Add{" "}
                        <strong className="text-stone-900 font-bold">
                          {formatCurrency(FREE_SHIPPING_THRESHOLD - finalSubtotal)}
                        </strong>{" "}
                        more to qualify for complimentary shipping.
                      </p>
                      <div className="mt-2.5 h-1.5 w-full rounded-full bg-stone-200/80 overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-[#8E3D51] to-[#D4AF37] transition-all duration-500 rounded-full"
                          style={{ width: `${shippingProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* LINE ITEMS BREAKDOWN */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-stone-600">
                    <span>Bag Subtotal</span>
                    <span className="font-mono text-stone-900 font-semibold text-sm">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>

                  {offerDiscount > 0 && (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-50/80 px-3 py-2 text-emerald-800 border border-emerald-200/60">
                      <span className="flex items-center gap-1.5 font-semibold text-xs">
                        <FiTag size={13} className="text-emerald-600" />
                        <span>{tierOffer.percent}% Special Offer Discount</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-700">
                        -{formatCurrency(offerDiscount)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-stone-600">
                    <span className="flex items-center gap-1.5">
                      <FiTruck size={13} className="text-stone-400" />
                      Insured Delivery
                    </span>
                    <span
                      className={`font-semibold ${
                        shipping === 0 ? "text-emerald-700" : "font-mono text-stone-900"
                      }`}
                    >
                      {shipping === 0 ? "Free" : formatCurrency(shipping)}
                    </span>
                  </div>
                </div>

                {/* NET PAYABLE */}
                <div className="border-t border-stone-200/70 pt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                      Net Payable
                    </span>
                    <span className="text-[10px] text-stone-400">Prices inclusive of GST</span>
                  </div>
                  <span className="font-serif text-3xl font-bold text-stone-950">
                    {formatCurrency(total)}
                  </span>
                </div>

                {/* CHECKOUT ACTION */}
                <button
                  type="button"
                  onClick={() => {
                    const userStr = localStorage.getItem("rs_fashions_current_user");
                    if (!userStr) {
                      navigate("/login?redirect=/checkout");
                      return;
                    }
                    navigate("/checkout");
                  }}
                  className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#2A0E20] py-4 text-xs font-bold uppercase tracking-[0.2em] text-amber-100 shadow-md transition-all duration-300 hover:bg-[#3D142E] active:scale-[0.98]"
                >
                  <span>Proceed to Checkout</span>
                  <FiArrowRight
                    size={15}
                    className="text-[#D4AF37] transition-transform duration-300 group-hover:translate-x-1"
                  />
                </button>

                {/* LUXURY TRUST HALLMARKS */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-around text-[10px] uppercase font-bold tracking-wider text-stone-400">
                  <span className="flex items-center gap-1">
                    <FiShield size={11} className="text-[#8E3D51]" />
                    SiCo Certified
                  </span>
                  <span>•</span>
                  <span>On Time Delivery</span>
                  <span>•</span>
                  <span>Fast Dispatch</span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

export default Cart;