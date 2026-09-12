import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// The three stages an order can be in. Add more here later if you need
// finer-grained stages (e.g. "out_for_delivery") — every place that reads
// this type will get a TypeScript error pointing at what needs updating.
export type OrderStatus = "packaging" | "shipped" | "delivered";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  packaging: "Packaging",
  shipped: "Shipped",
  delivered: "Delivered",
};

// Badge/dropdown colors per status — shared so TrackOrder and TransactionHistory render identically.
export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  packaging: "bg-amber-50 text-amber-700 border-amber-200",
  shipped: "bg-blue-50 text-blue-700 border-blue-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// What we track per order, keyed by invoiceNumber. Everything here is
// admin-entered (not part of the original sale record).
export interface OrderFulfillment {
  status: OrderStatus;
  trackingNumber: string;
  carrierPartner: string;
}

const DEFAULT_FULFILLMENT: OrderFulfillment = {
  status: "packaging",
  trackingNumber: "",
  carrierPartner: "",
};

interface OrderFulfillmentContextValue {
  getFulfillment: (invoiceNumber: string) => OrderFulfillment;
  updateStatus: (invoiceNumber: string, status: OrderStatus) => void;
  updateTrackingNumber: (invoiceNumber: string, trackingNumber: string) => void;
  updateCarrierPartner: (invoiceNumber: string, carrierPartner: string) => void;
}

const OrderFulfillmentContext = createContext<OrderFulfillmentContextValue | null>(null);

// Wrap your app (or at least whatever renders TransactionHistory + TrackOrder)
// with this Provider once, near the root. See usage note at the bottom.
export function OrderFulfillmentProvider({
  children,
  initialFulfillments,
}: {
  children: ReactNode;
  initialFulfillments?: Record<string, OrderFulfillment>;
}) {
  const [fulfillments, setFulfillments] = useState<Record<string, OrderFulfillment>>(
    initialFulfillments || {}
  );

  useEffect(() => {
    if (initialFulfillments && Object.keys(initialFulfillments).length > 0) {
      setFulfillments((prev) => ({ ...initialFulfillments, ...prev }));
    }
  }, [initialFulfillments]);

  const getFulfillment = (invoiceNumber: string): OrderFulfillment =>
    fulfillments[invoiceNumber] ?? DEFAULT_FULFILLMENT;

  const updateStatus = (invoiceNumber: string, status: OrderStatus) => {
    setFulfillments((prev) => ({
      ...prev,
      [invoiceNumber]: { ...(prev[invoiceNumber] ?? DEFAULT_FULFILLMENT), status },
    }));

    fetch(`http://localhost:5001/api/sales/${encodeURIComponent(invoiceNumber)}/fulfillment`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch((err) => console.warn("Fulfillment status sync error:", err));
  };

  const updateTrackingNumber = (invoiceNumber: string, trackingNumber: string) => {
    setFulfillments((prev) => ({
      ...prev,
      [invoiceNumber]: { ...(prev[invoiceNumber] ?? DEFAULT_FULFILLMENT), trackingNumber },
    }));

    fetch(`http://localhost:5001/api/sales/${encodeURIComponent(invoiceNumber)}/fulfillment`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber }),
    }).catch((err) => console.warn("Tracking number sync error:", err));
  };

  const updateCarrierPartner = (invoiceNumber: string, carrierPartner: string) => {
    setFulfillments((prev) => ({
      ...prev,
      [invoiceNumber]: { ...(prev[invoiceNumber] ?? DEFAULT_FULFILLMENT), carrierPartner },
    }));

    fetch(`http://localhost:5001/api/sales/${encodeURIComponent(invoiceNumber)}/fulfillment`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ carrierPartner }),
    }).catch((err) => console.warn("Carrier partner sync error:", err));
  };

  return (
    <OrderFulfillmentContext.Provider
      value={{ getFulfillment, updateStatus, updateTrackingNumber, updateCarrierPartner }}
    >
      {children}
    </OrderFulfillmentContext.Provider>
  );
}

// The hook every component calls to read/update order status + AWB info.
// Throws if used outside the Provider, so a missing wrap fails loudly instead of silently.
export function useOrderFulfillment() {
  const ctx = useContext(OrderFulfillmentContext);
  if (!ctx) {
    throw new Error("useOrderFulfillment must be used inside <OrderFulfillmentProvider>");
  }
  return ctx;
}

// Runtime fallback exports for browser ESM compatibility
export const OrderStatus: any = undefined;
export const OrderFulfillment: any = undefined;