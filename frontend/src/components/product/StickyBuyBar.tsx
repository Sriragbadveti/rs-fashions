// import { motion } from "framer-motion";
// import { FiShoppingBag, FiZap } from "react-icons/fi";
// import type { Product } from "../../data/products";

// interface StickyBuyBarProps {
//   product: Product;
//   onAddToCart: () => void;
//   onBuyNow: () => void;
// }

// const ease = [0.16, 1, 0.3, 1] as const;

// function StickyBuyBar({ product, onAddToCart, onBuyNow }: StickyBuyBarProps) {
//   const primaryImage = product.images?.[0] || "";

//   return (
//     <motion.aside
//       initial={{ y: 100, opacity: 0 }}
//       animate={{ y: 0, opacity: 1 }}
//       exit={{ y: 100, opacity: 0 }}
//       transition={{ duration: 0.45, ease }}
//       className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/[0.08] bg-[#FAF7F2]/90 px-4 py-3 shadow-[0_-12px_36px_rgba(42,36,33,0.1)] backdrop-blur-2xl sm:hidden [transform:translateZ(0)]"
//     >
//       <div className="mx-auto flex max-w-lg items-center gap-3 pb-[env(safe-area-inset-bottom)]">
//         {/* Product Thumbnail & Quick Info */}
//         <div className="flex min-w-0 flex-1 items-center gap-2.5">
//           {primaryImage && (
//             <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-[#EFEAE2]">
//               <img
//                 src={primaryImage}
//                 alt={product.name}
//                 className="h-full w-full object-cover object-center"
//               />
//             </div>
//           )}

//           <div className="min-w-0 flex-1">
//             <p className="truncate font-serif text-[15px] font-light leading-tight text-[#2A2421]">
//               {product.name}
//             </p>

//             <div className="mt-0.5 flex items-baseline gap-1.5">
//               <span className="font-serif text-sm font-medium text-[#2A2421]">
//                 ₹{product.price.toLocaleString("en-IN")}
//               </span>

//               {product.originalPrice && product.originalPrice > product.price && (
//                 <span className="font-serif text-[11px] text-[#8C7A6B] line-through">
//                   ₹{product.originalPrice.toLocaleString("en-IN")}
//                 </span>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Action Triggers */}
//         <div className="flex shrink-0 items-center gap-2">
//           {/* Add to Bag (Icon + Label) */}
//           <button
//             type="button"
//             onClick={onAddToCart}
//             aria-label="Add to cart"
//             className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-black/15 bg-white px-3.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2A2421] shadow-sm transition-transform active:scale-95"
//           >
//             <FiShoppingBag size={13} />
//             <span className="hidden xs:inline">Add</span>
//           </button>

//           {/* Instant Checkout */}
//           <button
//             type="button"
//             onClick={onBuyNow}
//             className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-[#8E3D51] px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#FAF7F2] shadow-md transition-transform hover:bg-[#722A3B] active:scale-95"
//           >
//             <FiZap size={12} className="fill-current" />
//             <span>Buy Now</span>
//           </button>
//         </div>
//       </div>
//     </motion.aside>
//   );
// }

// export default StickyBuyBar;
