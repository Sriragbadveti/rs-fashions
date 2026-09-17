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
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Cart() {
  const navigate = useNavigate();

  const {
    items,
    subtotal,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const FREE_SHIPPING_THRESHOLD = 1999;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 99;
  const total = subtotal + shipping;
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <main className="relative min-h-screen bg-[#FAF8F5] px-4 pb-32 pt-8 sm:px-6 sm:pt-12 md:px-10 lg:px-16 selection:bg-[#8E3D51] selection:text-white font-sans">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-full max-w-7xl rounded-full bg-gradient-to-b from-[#8E3D51]/[0.03] to-transparent blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl">
        {/* =====================================================
            EDITORIAL HEADER
        ====================================================== */}
        <header className="mb-10 flex flex-col gap-4 border-b border-stone-300/60 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-stone-900 leading-[1.05]">
              Your Shopping Bag
            </h1>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-4 self-start sm:self-auto">
              <span className="text-[11px] text-stone-400 font-mono tracking-wide">
                {items.length} {items.length === 1 ? "Drape" : "Drapes"} Chosen
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
            EMPTY BAG STATE
        ====================================================== */}
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-stone-200/80 bg-white/50 p-8 text-center backdrop-blur-xl shadow-xs"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-stone-100 to-[#F0EAE3] text-[#8E3D51] shadow-xs">
              <FiShoppingBag size={30} strokeWidth={1.2} />
            </div>

            <h2 className="mt-6 font-serif text-2xl sm:text-3xl text-stone-900 font-normal">
              Your bag is currently empty
            </h2>

            <p className="mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-stone-500 font-light">
              Explore our SiCo Gadwal sarees.
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
                      exit={{ opacity: 0, scale: 0.98, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="group relative overflow-hidden rounded-3xl border border-stone-200/80 bg-white/80 p-4 sm:p-5 backdrop-blur-xl shadow-xs transition-all duration-300 hover:border-stone-300 hover:shadow-md"
                    >
                      <div className="flex gap-4 sm:gap-6">
                        {/* DRAPE THUMBNAIL */}
                        <Link
                          to={`/product/${item.product.id}`}
                          className="relative h-36 w-28 sm:h-44 sm:w-34 shrink-0 overflow-hidden rounded-2xl bg-stone-100 border border-stone-200/60"
                        >
                          <img
                            src={item.product.images?.[0]}
                            alt={item.product.name}
                            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                        </Link>

                        {/* DRAPE SPECIFICATIONS */}
                        <div className="flex min-w-0 flex-1 flex-col justify-between pr-8">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#8E3D51]">
                                {item.product.category || "SiCo Gadwal"}
                              </span>
                            </div>

                            <Link to={`/product/${item.product.id}`}>
                              <h3 className="font-serif text-lg sm:text-xl text-stone-900 line-clamp-2 hover:text-[#8E3D51] transition-colors leading-snug">
                                {item.product.name}
                              </h3>
                            </Link>

                            {/* ATTRIBUTES */}
                            <div className="mt-2.5 flex flex-wrap gap-2 text-[11px]">
                              {item.selectedColor && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-[#FAF8F5] px-2.5 py-1 text-stone-700 font-medium">
                                  <span className="text-[9px] uppercase tracking-wider text-stone-400">
                                    Shade
                                  </span>
                                  <span>{item.selectedColor}</span>
                                </span>
                              )}

                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-[#FAF8F5] px-2.5 py-1 text-stone-700 font-medium">
                                <span className="text-[9px] uppercase tracking-wider text-stone-400">
                                  Cut
                                </span>
                                <span>{item.selectedSize || "Free Size (6.3m)"}</span>
                              </span>
                            </div>
                          </div>

                          {/* QUANTITY DIAL & PRICING */}
                          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 pt-3 border-t border-stone-100">
                            <div className="inline-flex h-9 items-center rounded-xl border border-stone-200 bg-[#FAF8F5] shadow-2xs">
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity - 1,
                                    item.selectedColor,
                                    item.selectedSize
                                  )
                                }
                                className="flex h-9 w-8 items-center justify-center text-stone-400 hover:text-stone-900 transition-colors"
                              >
                                <FiMinus size={12} />
                              </button>

                              <span className="w-8 text-center font-mono text-xs font-bold text-stone-800">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                aria-label="Increase quantity"
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity + 1,
                                    item.selectedColor,
                                    item.selectedSize
                                  )
                                }
                                className="flex h-9 w-8 items-center justify-center text-stone-400 hover:text-stone-900 transition-colors"
                              >
                                <FiPlus size={12} />
                              </button>
                            </div>

                            <div className="text-right">
                              <p className="font-serif text-xl sm:text-2xl font-bold text-stone-950 leading-none">
                                {formatCurrency(drapePrice * item.quantity)}
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-[10px] text-stone-400 mt-1 font-mono">
                                  {formatCurrency(drapePrice)} each
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* REMOVE TRIGGER */}
                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(
                            item.product.id,
                            item.selectedColor,
                            item.selectedSize
                          )
                        }
                        aria-label={`Remove ${item.product.name}`}
                        className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200/80 bg-white/90 text-stone-400 shadow-2xs transition-all duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-90"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </motion.article>
                  );
                })}
              </AnimatePresence>

              {/* CONTINUE BROWSING */}
              <div className="pt-3">
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
                      Official showroom price calculation
                    </p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7EFE9] text-[#8E3D51]">
                    <FiShoppingBag size={16} />
                  </div>
                </div>

                {/* COMPLIMENTARY SHIPPING MILESTONE */}
                <div className="rounded-2xl border border-stone-200/70 bg-[#FAF8F5] p-4 text-xs">
                  {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                    <div className="flex items-center gap-2 text-emerald-700 font-medium">
                      <FiCheckCircle size={15} className="shrink-0" />
                      <span>Complimentary insured shipping unlocked</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-stone-600 leading-relaxed text-[11.5px]">
                        Add{" "}
                        <strong className="text-stone-900 font-bold">
                          {formatCurrency(FREE_SHIPPING_THRESHOLD - subtotal)}
                        </strong>{" "}
                        more to qualify for complimentary shipping.
                      </p>
                      <div className="mt-2.5 h-1.5 w-full rounded-full bg-stone-200/80 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#8E3D51] to-[#D4AF37] transition-all duration-500 rounded-full"
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
                    <span className="text-[10px] text-stone-400">Prices inclusive of tax</span>
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
                  <span className="flex items-center gap-4">
                    {/* <FiShield size={12} className="text-[#8E3D51]" /> */}
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