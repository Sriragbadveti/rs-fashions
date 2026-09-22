import { AnimatePresence, motion } from "framer-motion";
import {
  FiArrowRight,
  FiMinus,
  FiPlus,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { useCart } from "../../context/CartContext";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

const ease = [0.16, 1, 0.3, 1] as const;

function CartDrawer({ open, onClose }: CartDrawerProps) {
  const navigate = useNavigate();

  const {
    items,
    subtotal,
    offerDiscount,
    tierOffer,
    finalSubtotal,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const handleCheckout = () => {
    onClose();
    const userStr = localStorage.getItem("rs_fashions_current_user");
    if (!userStr) {
      navigate("/login?redirect=/checkout");
      return;
    }
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] font-sans select-none" style={{ touchAction: "none" }}>
          <style>{`
            .cart-scroll {
              -webkit-overflow-scrolling: touch;
              overscroll-behavior: contain;
              scrollbar-width: thin;
              scrollbar-color: rgba(142, 61, 81, 0.28) transparent;
            }
            .cart-scroll::-webkit-scrollbar {
              width: 3px;
            }
            .cart-scroll::-webkit-scrollbar-thumb {
              background: rgba(142, 61, 81, 0.28);
              border-radius: 999px;
            }
            .cart-drawer-gpu {
              transform: translate3d(0, 0, 0);
              backface-visibility: hidden;
              -webkit-backface-visibility: hidden;
              will-change: transform;
              contain: layout paint;
            }
          `}</style>

          {/* Backdrop: No blur on phone, soft blur on tablet/desktop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={onClose}
            className="absolute inset-0 bg-black/45 md:bg-black/35 md:backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.38, ease }}
            className="cart-drawer-gpu absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-[#FAF7F2] shadow-[-20px_0_60px_rgba(30,20,15,0.12)]"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-black/[0.05] px-5 py-4 sm:px-6 pt-[max(1.2rem,env(safe-area-inset-top))]">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#8E3D51]">
                  Curated Selection
                </p>
                <h2 className="mt-0.5 font-serif text-xl sm:text-2xl text-[#2A2421]">
                  Your Bag
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close cart"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.04] text-[#2A2421] transition-transform hover:bg-black/[0.08] active:scale-90"
              >
                <FiX size={18} strokeWidth={1.6} />
              </button>
            </div>

            {/* Scrollable Item Body */}
            <div className="cart-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white border border-black/10 shadow-sm">
                    <span className="font-serif text-xl text-[#8E3D51]">✦</span>
                  </div>

                  <h3 className="mt-4 font-serif text-2xl font-light text-[#2A2421]">
                    Your bag is empty.
                  </h3>

                  <p className="mt-1.5 max-w-[240px] text-xs font-light text-[#756A60] leading-relaxed">
                    Select an artisan weave from our curated saree edits.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate("/shop");
                    }}
                    className="mt-6 rounded-full bg-[#2A2421] px-6 py-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#FAF7F2] transition-transform active:scale-95"
                  >
                    Explore Collection
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <motion.div
                      layout
                      key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                      className="flex gap-3.5 border-b border-black/[0.04] pb-4 last:border-b-0"
                    >
                      {/* Product Thumbnail */}
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          navigate(`/product/${item.product.id}`);
                        }}
                        className="h-24 w-[74px] shrink-0 overflow-hidden rounded-xl bg-[#EFEAE2] border border-black/5"
                      >
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </button>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate font-serif text-sm text-[#2A2421]">
                              {item.product.name}
                            </h3>
                            <p className="mt-0.5 text-[9px] uppercase tracking-wider text-[#8C7A6B]">
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
                            aria-label="Remove item"
                            className="text-black/30 transition-colors hover:text-[#8E3D51] active:scale-90"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>

                        {/* Attribute Badges */}
                        <div className="mt-1.5 flex flex-wrap gap-1 text-[9.5px] text-[#756A60]">
                          {item.selectedColor && (
                            <span className="rounded bg-black/[0.04] px-1.5 py-0.5">
                              {item.selectedColor}
                            </span>
                          )}
                        </div>

                        {/* Price & Quantity Controls */}
                        <div className="mt-3 flex items-center justify-between">
                          <span className="font-sans text-xs font-semibold text-[#2A2421]">
                            ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                          </span>

                          <div className="flex h-7 items-center rounded-full border border-black/10 bg-white">
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
                              className="flex h-7 w-7 items-center justify-center text-[#6E6359] hover:text-[#2A2421]"
                            >
                              <FiMinus size={10} />
                            </button>

                            <span className="w-5 text-center font-sans text-[11px] font-medium text-[#2A2421]">
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
                              className="flex h-7 w-7 items-center justify-center text-[#6E6359] hover:text-[#2A2421]"
                            >
                              <FiPlus size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {items.length > 0 && (
              <div className="shrink-0 border-t border-black/6 bg-white p-5 sm:p-6 pb-[max(1.2rem,env(safe-area-inset-bottom))]">
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between text-stone-600 text-xs">
                    <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#8C7A6B]">
                      Subtotal
                    </span>
                    <span className="font-sans font-medium text-stone-700">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {offerDiscount > 0 && (
                    <div className="flex items-center justify-between text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded-lg">
                      <span className="text-[10.5px]">Special Offer ({tierOffer.percent}% Off)</span>
                      <span className="font-mono font-bold">-₹{offerDiscount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-900">
                      Final Payable
                    </span>
                    <span className="font-sans text-base sm:text-lg font-bold text-[#8E3D51]">
                      ₹{finalSubtotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <p className="mb-3 text-[9.5px] leading-4 text-[#8C7A6B]">
                  Complimentary express insured delivery on this order.
                </p>

                <button
                  type="button"
                  onClick={handleCheckout}
                  className="group flex w-full items-center justify-center gap-2.5 rounded-full bg-[#8E3D51] py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-md transition-all hover:bg-[#783144] active:scale-95"
                >
                  <span>Proceed to Checkout</span>
                  <FiArrowRight
                    size={13}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </button>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export default CartDrawer;
