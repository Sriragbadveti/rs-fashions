import { AnimatePresence, motion } from "framer-motion";
import {
  FiArrowLeft,
  FiArrowRight,
  FiMinus,
  FiPlus,
  FiTrash2,
  FiShoppingBag,
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

  const shipping =
    subtotal >= 1999 || subtotal === 0
      ? 0
      : 99;

  const total = subtotal + shipping;

  return (
    <main className="min-h-screen bg-[#FAF8F5] px-4 pb-28 pt-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1400px]">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-10 flex items-end justify-between gap-6 border-b border-black/[0.08] pb-6">
          <div>
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.24em] text-[#8E3D51]">
              BECHO / YOUR SELECTION
            </p>

            <h1 className="font-serif text-4xl leading-none sm:text-5xl lg:text-6xl">
              Shopping bag
            </h1>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="hidden text-[9px] font-semibold uppercase tracking-[0.15em] text-black/35 transition-colors hover:text-[#8E3D51] sm:block"
            >
              Clear bag
            </button>
          )}
        </div>

        {/* =====================================================
            EMPTY CART
        ====================================================== */}

        {items.length === 0 ? (
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="flex min-h-[55vh] flex-col items-center justify-center text-center"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#EDE5DC]">
              <FiShoppingBag
                size={28}
                strokeWidth={1}
              />
            </div>

            <h2 className="mt-7 font-serif text-3xl sm:text-4xl">
              Your bag is waiting.
            </h2>

            <p className="mt-3 max-w-sm text-xs leading-6 text-black/40">
              Discover carefully selected sarees,
              beautiful fabrics and timeless pieces
              made to be worn and remembered.
            </p>

            <Link
              to="/shop"
              className="mt-7 inline-flex items-center gap-3 rounded-full bg-[#2A2421] px-7 py-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-white transition-all hover:bg-[#8E3D51] active:scale-95"
            >
              Explore collection
              <FiArrowRight size={14} />
            </Link>
          </motion.div>
        ) : (
          /* ===================================================
             CART CONTENT
          ==================================================== */

          <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
            {/* =================================================
                ITEMS
            ================================================== */}

            <section>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/35">
                  {items.length}{" "}
                  {items.length === 1
                    ? "item"
                    : "items"}
                </p>

                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[9px] font-semibold uppercase tracking-[0.15em] text-black/35 transition-colors hover:text-[#8E3D51] sm:hidden"
                >
                  Clear
                </button>
              </div>

              <div className="divide-y divide-black/[0.08] border-y border-black/[0.08]">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      layout
                      initial={{
                        opacity: 0,
                        y: 15,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                      }}
                      transition={{
                        duration: 0.3,
                      }}
                      key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                      className="flex gap-4 py-5 sm:gap-6 sm:py-7"
                    >
                      {/* PRODUCT IMAGE */}

                      <Link
                        to={`/product/${item.product.id}`}
                        className="group h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-[#E8DFD7] sm:h-44 sm:w-32"
                      >
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </Link>

                      {/* PRODUCT DETAILS */}

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <Link
                              to={`/product/${item.product.id}`}
                              className="font-serif text-xl leading-tight transition-opacity hover:opacity-60 sm:text-2xl"
                            >
                              {item.product.name}
                            </Link>

                            <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-black/35">
                              {item.product.material}
                            </p>
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
                            aria-label={`Remove ${item.product.name}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/25 transition-all hover:bg-[#F0E5E5] hover:text-[#8E3D51]"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>

                        <div className="mt-3 space-y-1 text-[10px] text-black/45">
                          {item.selectedColor && (
                            <p>
                              Colour:{" "}
                              <span className="text-black/65">
                                {item.selectedColor}
                              </span>
                            </p>
                          )}

                          {item.selectedSize && (
                            <p>
                              Size:{" "}
                              <span className="text-black/65">
                                {item.selectedSize}
                              </span>
                            </p>
                          )}
                        </div>

                        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
                          {/* QUANTITY */}

                          <div className="flex items-center rounded-full border border-black/10 bg-white/60">
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
                              className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-white"
                            >
                              <FiMinus size={11} />
                            </button>

                            <span className="w-7 text-center text-[11px]">
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
                              className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-white"
                            >
                              <FiPlus size={11} />
                            </button>
                          </div>

                          {/* PRICE */}

                          <p className="text-sm font-semibold">
                            ₹
                            {(
                              item.product.price *
                              item.quantity
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* CONTINUE SHOPPING */}

              <Link
                to="/shop"
                className="group mt-6 inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-black/45 transition-colors hover:text-[#8E3D51]"
              >
                <FiArrowLeft
                  size={13}
                  className="transition-transform duration-300 group-hover:-translate-x-1"
                />
                Continue shopping
              </Link>
            </section>

            {/* =================================================
                ORDER SUMMARY
            ================================================== */}

            <aside className="lg:sticky lg:top-[115px]">
              <div className="rounded-2xl border border-black/[0.07] bg-white/45 p-5 shadow-[0_20px_60px_rgba(42,36,33,0.04)] backdrop-blur-xl sm:p-7">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-black/35">
                  Order summary
                </p>

                <div className="mt-6 space-y-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-black/45">
                      Subtotal
                    </span>

                    <span>
                      ₹
                      {subtotal.toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-black/45">
                      Shipping
                    </span>

                    <span>
                      {shipping === 0
                        ? "Complimentary"
                        : `₹${shipping}`}
                    </span>
                  </div>
                </div>

                {subtotal > 0 &&
                  subtotal < 1999 && (
                    <div className="mt-5 rounded-xl bg-[#F0EAE3] p-3.5">
                      <p className="text-[9px] leading-4 text-black/50">
                        Add ₹
                        {(
                          1999 - subtotal
                        ).toLocaleString(
                          "en-IN"
                        )}{" "}
                        more to unlock complimentary
                        shipping.
                      </p>
                    </div>
                  )}

                <div className="my-6 border-t border-black/[0.08]" />

                <div className="flex items-end justify-between">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/40">
                    Total
                  </span>

                  <span className="font-serif text-3xl">
                    ₹
                    {total.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/checkout")
                  }
                  className="group mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-[#8E3D51] py-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-white transition-all duration-300 hover:bg-[#773246] active:scale-[0.98]"
                >
                  Continue to checkout

                  <FiArrowRight
                    size={14}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </button>

                <div className="mt-5 flex items-center justify-center gap-2 text-[8px] uppercase tracking-[0.12em] text-black/30">
                  <span>Secure checkout</span>
                  <span>•</span>
                  <span>Easy returns</span>
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