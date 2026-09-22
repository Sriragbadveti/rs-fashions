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

  /* Tiered Offer Calculation (Buy 1 get 5%, Buy 2 get 10%, Buy 3+ get 15%) */
  const tierOffer: TierOfferInfo = useMemo(() => {
    if (itemCount === 0) {
      return {
        tier: 0,
        percent: 0,
        discountAmount: 0,
        label: "Buy 1 Get 5% Off • Buy 2 Get 10% Off • Buy 3+ Get 15% Off",
        nextTierNeeded: 1,
        nextTierPercent: 5,
        isMaxTier: false,
      };
    }

    if (itemCount === 1) {
      const discount = Math.round(subtotal * 0.05);
      return {
        tier: 1,
        percent: 5,
        discountAmount: discount,
        label: "Tier 1 Unlocked: 5% Special Offer Discount",
        nextTierNeeded: 1,
        nextTierPercent: 10,
        isMaxTier: false,
      };
    }

    if (itemCount === 2) {
      const discount = Math.round(subtotal * 0.10);
      return {
        tier: 2,
        percent: 10,
        discountAmount: discount,
        label: "Tier 2 Unlocked: 10% Bundle Offer Discount",
        nextTierNeeded: 1,
        nextTierPercent: 15,
        isMaxTier: false,
      };
    }

    // 3 or more sarees
    const discount = Math.round(subtotal * 0.15);
    return {
      tier: 3,
      percent: 15,
      discountAmount: discount,
      label: "VIP Tier 3 Unlocked: 15% Mega Special Offer Discount",
      nextTierNeeded: 0,
      nextTierPercent: 15,
      isMaxTier: true,
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
