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

/* ============================================================
   CART CONTEXT TYPE
============================================================ */

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
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

const STORAGE_KEY = "becho_atelier_cart";
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

  /* Total Original Savings Calculation */
  const totalSavings = useMemo(() => {
    return items.reduce((total, item) => {
      if (item.product.originalPrice && item.product.originalPrice > item.product.price) {
        return total + (item.product.originalPrice - item.product.price) * item.quantity;
      }
      return total;
    }, 0);
  }, [items]);

  /* Free Shipping Progress (0 to 100) */
  const progressToFreeShipping = useMemo(() => {
    return Math.min(100, Math.round((subtotal / FREE_SHIPPING_LIMIT) * 100));
  }, [subtotal]);

  const contextValue: CartContextType = {
    items,
    itemCount,
    subtotal,
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
