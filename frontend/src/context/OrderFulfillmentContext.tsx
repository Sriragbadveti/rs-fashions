import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { API_BASE } from "../config/api";

// The three stages an order can be in.
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

export const LOCAL_STORAGE_FULFILLMENTS = "rs_order_fulfillments";
export const ORDER_FULFILLED_EVENT = "rs_order_fulfilled";

// What we track per order, keyed by invoiceNumber.
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

export function getCourierTrackingUrl(carrier?: string, awb?: string): string | null {
  if (!awb || !awb.trim()) return null;
  const cleanAwb = encodeURIComponent(String(awb).trim());
  const c = String(carrier || "").toLowerCase();
  if (c.includes("bluedart") || c.includes("blue dart")) {
    return `https://www.bluedart.com/tracking?trackNumber=${cleanAwb}`;
  }
  if (c.includes("delhivery")) {
    return `https://www.delhivery.com/track/package/${cleanAwb}`;
  }
  if (c.includes("dtdc")) {
    return `https://www.dtdc.in/tracking/shipment-tracking.asp?awbNo=${cleanAwb}`;
  }
  if (c.includes("post") || c.includes("india post") || c.includes("speed post")) {
    return `https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx`;
  }
  if (c.includes("shadowfax")) {
    return `https://tracker.shadowfax.in/#/track?orderId=${cleanAwb}`;
  }
  if (c.includes("ekart")) {
    return `https://ekartlogistics.com/shipmenttrack/${cleanAwb}`;
  }
  if (c.includes("xpressbees") || c.includes("xpress")) {
    return `https://www.xpressbees.com/track?awb=${cleanAwb}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`${carrier || "courier"} tracking ${cleanAwb}`)}`;
}

interface OrderFulfillmentContextValue {
  getFulfillment: (invoiceNumber: string) => OrderFulfillment;
  updateStatus: (invoiceNumber: string, status: OrderStatus) => void;
  updateTrackingNumber: (invoiceNumber: string, trackingNumber: string) => void;
  updateCarrierPartner: (invoiceNumber: string, carrierPartner: string) => void;
  saveFulfillment: (invoiceNumber: string, details?: Partial<OrderFulfillment>) => Promise<boolean>;
}

const OrderFulfillmentContext = createContext<OrderFulfillmentContextValue | null>(null);

function loadSavedFulfillments(): Record<string, OrderFulfillment> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FULFILLMENTS);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function OrderFulfillmentProvider({
  children,
  initialFulfillments,
}: {
  children: ReactNode;
  initialFulfillments?: Record<string, OrderFulfillment>;
}) {
  const [fulfillments, setFulfillments] = useState<Record<string, OrderFulfillment>>(() => {
    const saved = loadSavedFulfillments();
    return { ...saved, ...(initialFulfillments || {}) };
  });

  useEffect(() => {
    if (initialFulfillments && Object.keys(initialFulfillments).length > 0) {
      setFulfillments((prev) => ({ ...initialFulfillments, ...prev }));
    }
  }, [initialFulfillments]);

  // Sync state if another tab modified fulfillments
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_FULFILLMENTS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setFulfillments((prev) => ({ ...prev, ...parsed }));
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const getFulfillment = useCallback(
    (invoiceNumber: string): OrderFulfillment => {
      return fulfillments[invoiceNumber] ?? DEFAULT_FULFILLMENT;
    },
    [fulfillments]
  );

  const persistFulfillmentLocally = (
    invoiceNumber: string,
    fulfillment: OrderFulfillment
  ) => {
    try {
      // 1. Save to rs_order_fulfillments
      const current = loadSavedFulfillments();
      current[invoiceNumber] = fulfillment;
      localStorage.setItem(LOCAL_STORAGE_FULFILLMENTS, JSON.stringify(current));

      // 2. Update rs_fashions_orders (storefront customer orders)
      const rawStoreOrders = localStorage.getItem("rs_fashions_orders");
      if (rawStoreOrders) {
        try {
          const storeOrders = JSON.parse(rawStoreOrders);
          if (Array.isArray(storeOrders)) {
            let modified = false;
            const updated = storeOrders.map((o: any) => {
              const inv = o.orderNumber || o.invoiceNumber || o.id;
              if (inv === invoiceNumber || o.id === invoiceNumber) {
                modified = true;
                const statusMapped =
                  fulfillment.status === "delivered"
                    ? "delivered"
                    : fulfillment.status === "shipped"
                    ? "shipped"
                    : "processing";
                return {
                  ...o,
                  orderStatus: statusMapped,
                  currentStage: fulfillment.status,
                  awbNumber: fulfillment.trackingNumber,
                  carrierPartner: fulfillment.carrierPartner,
                  trackingUrl: getCourierTrackingUrl(
                    fulfillment.carrierPartner,
                    fulfillment.trackingNumber
                  ),
                  notes: `Fulfillment: [${fulfillment.carrierPartner || "Standard"}] AWB: ${
                    fulfillment.trackingNumber || "Pending"
                  }`,
                };
              }
              return o;
            });
            if (modified) {
              localStorage.setItem("rs_fashions_orders", JSON.stringify(updated));
            }
          }
        } catch {}
      }

      // 3. Update rs_admin_sales_history and rs_admin_sales
      const rawSalesHistory = localStorage.getItem("rs_admin_sales_history");
      if (rawSalesHistory) {
        try {
          const sales = JSON.parse(rawSalesHistory);
          if (Array.isArray(sales)) {
            let modified = false;
            const updated = sales.map((s: any) => {
              if (s.invoiceNumber === invoiceNumber || s.id === invoiceNumber) {
                modified = true;
                return {
                  ...s,
                  orderStatus: fulfillment.status,
                  awbNumber: fulfillment.trackingNumber,
                  carrierPartner: fulfillment.carrierPartner,
                  notes: `Fulfillment: [${fulfillment.carrierPartner || "Standard"}] AWB: ${
                    fulfillment.trackingNumber || "Pending"
                  }`,
                };
              }
              return s;
            });
            if (modified) {
              localStorage.setItem("rs_admin_sales_history", JSON.stringify(updated));
            }
          }
        } catch {}
      }

      // 4. Dispatch custom event for real-time customer view reactivity
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(ORDER_FULFILLED_EVENT, {
            detail: { invoiceNumber, fulfillment },
          })
        );
        window.dispatchEvent(new Event("storage"));
      }
    } catch (e) {
      console.warn("Fulfillment local persist warning:", e);
    }
  };

  const saveFulfillment = async (
    invoiceNumber: string,
    details?: Partial<OrderFulfillment>
  ): Promise<boolean> => {
    const current = fulfillments[invoiceNumber] ?? DEFAULT_FULFILLMENT;
    const merged: OrderFulfillment = {
      status: details?.status ?? current.status,
      trackingNumber: details?.trackingNumber !== undefined ? details.trackingNumber : current.trackingNumber,
      carrierPartner: details?.carrierPartner !== undefined ? details.carrierPartner : current.carrierPartner,
    };

    // Update in-memory state
    setFulfillments((prev) => ({
      ...prev,
      [invoiceNumber]: merged,
    }));

    // Persist locally and trigger window events immediately
    persistFulfillmentLocally(invoiceNumber, merged);

    // Sync to Express Backend API
    try {
      const res = await fetch(`${API_BASE}/sales/${encodeURIComponent(invoiceNumber)}/fulfillment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(merged),
      });
      return res.ok;
    } catch (err) {
      console.warn("Backend fulfillment sync error:", err);
      return true; // Still true because local storage & events succeeded
    }
  };

  const updateStatus = (invoiceNumber: string, status: OrderStatus) => {
    setFulfillments((prev) => {
      const updated = { ...(prev[invoiceNumber] ?? DEFAULT_FULFILLMENT), status };
      persistFulfillmentLocally(invoiceNumber, updated);
      return { ...prev, [invoiceNumber]: updated };
    });

    fetch(`${API_BASE}/sales/${encodeURIComponent(invoiceNumber)}/fulfillment`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch((err) => console.warn("Fulfillment status sync error:", err));
  };

  const updateTrackingNumber = (invoiceNumber: string, trackingNumber: string) => {
    setFulfillments((prev) => {
      const updated = { ...(prev[invoiceNumber] ?? DEFAULT_FULFILLMENT), trackingNumber };
      persistFulfillmentLocally(invoiceNumber, updated);
      return { ...prev, [invoiceNumber]: updated };
    });

    fetch(`${API_BASE}/sales/${encodeURIComponent(invoiceNumber)}/fulfillment`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber }),
    }).catch((err) => console.warn("Tracking number sync error:", err));
  };

  const updateCarrierPartner = (invoiceNumber: string, carrierPartner: string) => {
    setFulfillments((prev) => {
      const updated = { ...(prev[invoiceNumber] ?? DEFAULT_FULFILLMENT), carrierPartner };
      persistFulfillmentLocally(invoiceNumber, updated);
      return { ...prev, [invoiceNumber]: updated };
    });

    fetch(`${API_BASE}/sales/${encodeURIComponent(invoiceNumber)}/fulfillment`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ carrierPartner }),
    }).catch((err) => console.warn("Carrier partner sync error:", err));
  };

  return (
    <OrderFulfillmentContext.Provider
      value={{
        getFulfillment,
        updateStatus,
        updateTrackingNumber,
        updateCarrierPartner,
        saveFulfillment,
      }}
    >
      {children}
    </OrderFulfillmentContext.Provider>
  );
}

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
