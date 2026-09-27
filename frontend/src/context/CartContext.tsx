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
  nextTierLabel?: string;
  isMaxTier: boolean;
  bundleTargetPrice?: number;
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
      const quantity = Math.max(1, options.quantity ?? 1);
      const selectedColor = options.selectedColor || product.colors?.[0];
      const selectedSize = options.selectedSize || product.sizes?.[0] || "Free Size";

      setItems((currentItems) => {
        const existingIndex = currentItems.findIndex(
          (item) =>
            item.product.id === product.id &&
            item.selectedColor === selectedColor &&
            item.selectedSize === selectedSize
        );

        if (existingIndex > -1) {
          return currentItems.map((item, index) =>
            index === existingIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }

        return [...currentItems, { product, quantity, selectedColor, selectedSize }];
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

          return isMatch ? { ...item, quantity } : item;
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

  /* Offer Zone Bundle Pricing:
     - Buy 1 @2500/-
     - Buy 2@4900/-
     - Buy 3@4800/-
     (Replaces the previous generic 5%/10%/15% / ₹150 discount)
  */
  const tierOffer: TierOfferInfo = useMemo(() => {
    if (itemCount === 0) {
      return {
        tier: 0,
        percent: 0,
        discountAmount: 0,
        label: "Buy 1 @2500/- • Buy 2@4900/- • Buy 3@4800/-",
        nextTierNeeded: 1,
        nextTierPercent: 0,
        nextTierLabel: "Buy 1 @2500/-",
        isMaxTier: false,
      };
    }

    if (itemCount === 1) {
      const targetPrice = 2500;
      const discount = Math.max(0, subtotal - targetPrice);
      const effectivePercent = subtotal > 0 ? Math.round((discount / subtotal) * 100) : 0;
      return {
        tier: 1,
        percent: effectivePercent,
        discountAmount: discount,
        label: "Buy 1 @2500/- Applied",
        nextTierNeeded: 1,
        nextTierPercent: effectivePercent,
        nextTierLabel: "Buy 2@4900/-",
        isMaxTier: false,
        bundleTargetPrice: targetPrice,
      };
    }

    if (itemCount === 2) {
      const targetPrice = 4900;
      const discount = Math.max(0, subtotal - targetPrice);
      const effectivePercent = subtotal > 0 ? Math.round((discount / subtotal) * 100) : 0;
      return {
        tier: 2,
        percent: effectivePercent,
        discountAmount: discount,
        label: "Buy 2@4900/- Applied",
        nextTierNeeded: 1,
        nextTierPercent: effectivePercent,
        nextTierLabel: "Buy 3@4800/-",
        isMaxTier: false,
        bundleTargetPrice: targetPrice,
      };
    }

    // 3 or more sarees
    const bundlesOf3 = Math.floor(itemCount / 3);
    const remainder = itemCount % 3;
    let targetPrice = bundlesOf3 * 4800;
    if (remainder === 1) targetPrice += 2500;
    if (remainder === 2) targetPrice += 4900;

    const discount = Math.max(0, subtotal - targetPrice);
    const effectivePercent = subtotal > 0 ? Math.round((discount / subtotal) * 100) : 0;

    return {
      tier: 3,
      percent: effectivePercent,
      discountAmount: discount,
      label:
        itemCount === 3
          ? "Buy 3@4800/- Mega Offer Applied"
          : `Buy 3@4800/- Combo (${itemCount} Sarees) Applied`,
      nextTierNeeded: remainder === 0 ? 0 : 3 - remainder,
      nextTierPercent: effectivePercent,
      nextTierLabel: remainder === 0 ? undefined : "Buy 3@4800/- Multi-Pack",
      isMaxTier: remainder === 0,
      bundleTargetPrice: targetPrice,
    };
  }, [itemCount, subtotal]);

  const offerDiscount = tierOffer.discountAmount;
  const finalSubtotal = Math.max(0, subtotal - offerDiscount);

  /* Total Original Savings Calculation */
  const totalSavings = useMemo(() => {
    const rawSavings = items.reduce((total, item) => {
      if (item.product.originalPrice && item.product.originalPrice > item.product.price) {
        return total + (item.product.originalPrice - item.product.price) * item.quantity;
      }
      return total;
    }, 0);
    return rawSavings + offerDiscount;
  }, [items, offerDiscount]);

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
