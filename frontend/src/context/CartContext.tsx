import { computeBundleOffer, isSpecialOfferProduct } from "../utils/specialOffer";
import { computeFestivalOffer, type FestivalOfferConfig, type FestivalOfferResult } from "../utils/festivalOffer";
import { API_BASE } from "../config/api";

async function fetchFestivalConfig(): Promise<FestivalOfferConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/billing/festival-offer`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data?.config || json.config || null) as FestivalOfferConfig | null;
  } catch {
    return null;
  }
}
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";

import type { Product } from "../data/products";

/* ============================================================
   CART ITEM & OPTIONS
============================================================ */

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface AddToCartOptions {
  quantity?: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface TierOfferInfo {
  tier: number;
  percent: number;
  discountAmount: number;
  label: string;
  nextTierNeeded: number;
  nextTierPercent: number;
  isMaxTier: boolean;
  /** Bundle price of the eligible sarees in the cart. */
  offerTotal: number;
  /** Bundle price after adding `nextTierNeeded` more eligible sarees. */
  nextTotal: number;
  eligibleCount: number;
}

/**
 * Most pieces of a saree a customer can hold: the stock of the chosen shade when the saree has
 * per-shade stock, otherwise its total stock (unknown stock = no cap; the server still enforces).
 */
export function maxQuantityFor(
  product: { stock?: number; variants?: Array<{ color?: string; stock?: number }> },
  color?: string
): number {
  let stock: number | undefined = product?.stock;
  const wanted = String(color || "").trim().toLowerCase();
  if (wanted && Array.isArray(product?.variants)) {
    const variant = product.variants.find((v) => String(v?.color || "").trim().toLowerCase() === wanted);
    if (variant && variant.stock !== undefined && variant.stock !== null) stock = Number(variant.stock);
  }
  const n = Number(stock);
  if (stock === undefined || stock === null || !Number.isFinite(n)) return Infinity;
  return Math.max(0, Math.floor(n));
}

/* ============================================================
   CART CONTEXT TYPE
============================================================ */

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  offerDiscount: number;
  tierOffer: TierOfferInfo;
  /** Festival offer (admin-controlled); config is null until loaded or when the server is unreachable. */
  festivalConfig: FestivalOfferConfig | null;
  festivalOffer: FestivalOfferResult;
  festivalDiscount: number;
  /** Re-reads the festival offer from the server (e.g. after checkout reports it changed). */
  refreshFestivalOffer: () => Promise<FestivalOfferConfig | null>;
  finalSubtotal: number;
  totalSavings: number;
  freeShippingThreshold: number;
  progressToFreeShipping: number;
  addToCart: (product: Product, options?: AddToCartOptions) => void;
  removeFromCart: (
    productId: string,
    selectedColor?: string,
    selectedSize?: string
  ) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    selectedColor?: string,
    selectedSize?: string
  ) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "rs_fashions_cart";
const FREE_SHIPPING_LIMIT = 1999;

/* ============================================================
   CART PROVIDER
============================================================ */

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const storedCart = localStorage.getItem(STORAGE_KEY);
      if (!storedCart) return [];
      const parsed = JSON.parse(storedCart);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  /* Sync to LocalStorage */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to sync cart storage:", error);
    }
  }, [items]);

  /* Add Item to Cart */
  const addToCart = useCallback(
    (product: Product, options: AddToCartOptions = {}) => {
      const requested = Math.max(1, options.quantity ?? 1);
      const selectedColor = options.selectedColor || product.colors?.[0];
      const selectedSize = options.selectedSize || product.sizes?.[0] || "Free Size";

      setItems((currentItems) => {
        const existingIndex = currentItems.findIndex(
          (item) =>
            item.product.id === product.id &&
            item.selectedColor === selectedColor &&
            item.selectedSize === selectedSize
        );

        const maxQty = maxQuantityFor(product, selectedColor);
        if (maxQty <= 0) return currentItems; // sold out (this shade): nothing to add
        if (existingIndex > -1) {
          return currentItems.map((item, index) =>
            index === existingIndex
              ? { ...item, quantity: Math.min(maxQty, item.quantity + requested) }
              : item
          );
        }

        return [...currentItems, { product, quantity: Math.min(maxQty, requested), selectedColor, selectedSize }];
      });
    },
    []
  );

  /* Remove Item from Cart */
  const removeFromCart = useCallback(
    (productId: string, selectedColor?: string, selectedSize?: string) => {
      setItems((currentItems) =>
        currentItems.filter(
          (item) =>
            !(
              item.product.id === productId &&
              item.selectedColor === selectedColor &&
              item.selectedSize === selectedSize
            )
        )
      );
    },
    []
  );

  /* Update Quantity */
  const updateQuantity = useCallback(
    (
      productId: string,
      quantity: number,
      selectedColor?: string,
      selectedSize?: string
    ) => {
      if (quantity <= 0) {
        removeFromCart(productId, selectedColor, selectedSize);
        return;
      }

      setItems((currentItems) =>
        currentItems.map((item) => {
          const isMatch =
            item.product.id === productId &&
            item.selectedColor === selectedColor &&
            item.selectedSize === selectedSize;

          return isMatch ? { ...item, quantity: Math.min(quantity, Math.max(1, maxQuantityFor(item.product, item.selectedColor))) } : item;
        })
      );
    },
    [removeFromCart]
  );

  /* Clear Entire Cart */
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  /* Item Count */
  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  /* Subtotal Calculation */
  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.product.price * item.quantity, 0),
    [items]
  );

  // Subtotal and count of eligible Special Edition items only
  const specialEditionItems = useMemo(
    () =>
      items.filter((item) => isSpecialOfferProduct(item.product as any)),
    [items]
  );

  const specialEditionCount = useMemo(
    () => specialEditionItems.reduce((total, item) => total + item.quantity, 0),
    [specialEditionItems]
  );

  const specialEditionSubtotal = useMemo(
    () =>
      specialEditionItems.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      ),
    [specialEditionItems]
  );

  /* Special Offer bundles: Buy 1 @ ₹2,500 · Buy 2 @ ₹4,900 · Buy 3 @ ₹4,800 (eligible sarees only) */
  const tierOffer: TierOfferInfo = useMemo(() => {
    const o = computeBundleOffer(specialEditionCount, specialEditionSubtotal);
    return {
      tier: Math.min(3, specialEditionCount),
      percent: 0,
      discountAmount: o.discount,
      label: o.message,
      nextTierNeeded: o.moreNeeded,
      nextTierPercent: 0,
      isMaxTier: specialEditionCount > 0 && o.moreNeeded === 0,
      offerTotal: o.offerTotal,
      nextTotal: o.nextTotal,
      eligibleCount: specialEditionCount,
    };
  }, [specialEditionCount, specialEditionSubtotal]);

  const offerDiscount = tierOffer.discountAmount;

  /* Festival offer: rules come from the server; re-read on load, every minute and on tab focus,
     so switching it on/off in the admin shows up without customers reloading. */
  const [festivalConfig, setFestivalConfig] = useState<FestivalOfferConfig | null>(null);
  const refreshFestivalOffer = useCallback(async (): Promise<FestivalOfferConfig | null> => {
    const cfg = await fetchFestivalConfig();
    if (cfg) setFestivalConfig(cfg); // keep the last known config if the server is briefly unreachable
    return cfg;
  }, []);
  useEffect(() => {
    const load = () => {
      fetchFestivalConfig().then((cfg) => {
        if (cfg) setFestivalConfig(cfg);
      });
    };
    load();
    const timer = window.setInterval(load, 60 * 1000);
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", load);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", load);
    };
  }, []);

  const festivalOffer = useMemo(() => computeFestivalOffer(items, festivalConfig), [items, festivalConfig]);
  const festivalDiscount = festivalOffer.discount;
  const finalSubtotal = Math.max(0, subtotal - offerDiscount - festivalDiscount);

  /* Total Original Savings Calculation */
  const totalSavings = useMemo(() => {
    const rawSavings = items.reduce((total, item) => {
      if (item.product.originalPrice && item.product.originalPrice > item.product.price) {
        return total + (item.product.originalPrice - item.product.price) * item.quantity;
      }
      return total;
    }, 0);
    return rawSavings + offerDiscount + festivalDiscount;
  }, [items, offerDiscount, festivalDiscount]);

  /* Free Shipping Progress (0 to 100) */
  const progressToFreeShipping = useMemo(() => {
    return Math.min(100, Math.round((finalSubtotal / FREE_SHIPPING_LIMIT) * 100));
  }, [finalSubtotal]);

  const contextValue: CartContextType = {
    items,
    itemCount,
    subtotal,
    offerDiscount,
    tierOffer,
    festivalConfig,
    festivalOffer,
    festivalDiscount,
    refreshFestivalOffer,
    finalSubtotal,
    totalSavings,
    freeShippingThreshold: FREE_SHIPPING_LIMIT,
    progressToFreeShipping,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

/* ============================================================
   USE CART HOOK
============================================================ */

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
