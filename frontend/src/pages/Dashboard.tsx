import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  ReceiptIndianRupee,
  Settings,
  LogOut,
  Layers,
  Bell,
  History,
  ScrollText,
  BarChart2,
  Users,
  Truck,
  RotateCw,
  AlertTriangle,
  PackagePlus,
} from "lucide-react";
import Overview from "./Overview";
import Catalog from "./SareeStock";
import SettingsView from "./Settings";
import Billing from "./Billing";
import StockHistory from "./StockHistory";
import TransactionHistory from "./TransactionHistory";
import Analysis from "./Analysis";
import CRM from "./CRM";
import TrackOrder from "./TrackOrder";
import AutomatedLowstock from "./AutomatedLowstock";
import Notifications from "./Notifications";
import { sound } from "../types/soundEngine";
import BulkStock from "./BulkStock";
import { OrderFulfillmentProvider } from "../context/OrderFulfillmentContext"; // NEW: shared order status/AWB store
import type {
  Product,
  Category,
  DashboardTab,
  Device,
  CompletedSale,
  StockMovement,
  CustomerProfile,
} from "../types/inventory";
import {
  MOCK_CATEGORIES,
  MOCK_INVENTORY,
  MOCK_STOCK_HISTORY,
} from "../types/inventory";

interface DashboardProps {
  user: { name: string; email: string; role: string };
  onLogout: () => void;
}

const ACTIVE_TAB_STORAGE_KEY = "rs_active_tab";

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTabState] = useState<DashboardTab>(() => {
    const saved = sessionStorage.getItem(ACTIVE_TAB_STORAGE_KEY) as DashboardTab | null;
    return saved || "overview";
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const setActiveTab = (tab: DashboardTab) => {
    sound.playClick();
    sessionStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
    setActiveTabState(tab);
  };

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem("rs_admin_categories");
      if (saved) return JSON.parse(saved);
    } catch {}
    return MOCK_CATEGORIES;
  });

  const [inventory, setInventory] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem("rs_admin_inventory");
      if (saved) return JSON.parse(saved);
    } catch {}
    return MOCK_INVENTORY;
  });

  const [stockHistory, setStockHistory] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem("rs_admin_stock_history");
      if (saved) return JSON.parse(saved);
    } catch {}
    return MOCK_STOCK_HISTORY;
  });

  const [salesHistory, setSalesHistory] = useState<CompletedSale[]>(() => {
    try {
      const saved = localStorage.getItem("rs_admin_sales_history");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [initialFulfillments, setInitialFulfillments] = useState<Record<string, any>>({});

  const [devices, setDevices] = useState<Device[]>([
    {
      id: "d1",
      uuid: "8f3a-9c21-win-0001",
      name: "Front Counter Point-of-Sale (This PC)",
      platform: "windows",
      lastActive: "Active now",
      isCurrentDevice: true,
      ipAddress: "192.168.1.101",
    },
    {
      id: "d2",
      uuid: "2b7e-4410-win-0002",
      name: "Sindhu's Inventory Surface Pro",
      platform: "windows",
      lastActive: "15 mins ago",
      isCurrentDevice: false,
      ipAddress: "192.168.1.108",
    },
  ]);

  const API_BASE = "http://localhost:5001/api";

  const safeStorageSet = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      try {
        localStorage.removeItem("rs_admin_inventory");
        if (key !== "rs_admin_inventory") {
          localStorage.setItem(key, JSON.stringify(data));
        }
      } catch {
        // Storage unavailable or quota exceeded, ignore gracefully
      }
    }
  };

  const loadLiveBootstrap = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/bootstrap`);
      if (!res.ok) return;
      const json = await res.json();
      const d = json?.data || json;
      if (d) {
        // ALWAYS update UI state first so components render reliably!
        if (Array.isArray(d.categories) && d.categories.length > 0) setCategories(d.categories);
        if (Array.isArray(d.products) && d.products.length > 0) setInventory(d.products);
        if (Array.isArray(d.stockMovements)) setStockHistory(d.stockMovements);
        if (Array.isArray(d.sales)) setSalesHistory(d.sales);
        if (Array.isArray(d.customers) && d.customers.length > 0) setCustomers(d.customers);

        // Safe background caching (non-blocking)
        if (Array.isArray(d.categories) && d.categories.length > 0) safeStorageSet("rs_admin_categories", d.categories);
        if (Array.isArray(d.products) && d.products.length > 0) safeStorageSet("rs_admin_inventory", d.products);
        if (Array.isArray(d.stockMovements)) safeStorageSet("rs_admin_stock_history", d.stockMovements);
        if (Array.isArray(d.sales)) safeStorageSet("rs_admin_sales_history", d.sales);

        const fulfillMap: Record<string, any> = {};
        if (Array.isArray(d.sales)) {
          d.sales.forEach((s: any) => {
            if (s.invoiceNumber) {
              fulfillMap[s.invoiceNumber] = {
                status: s.orderStatus === "delivered" ? "delivered" : s.orderStatus === "shipped" ? "shipped" : "packaging",
                trackingNumber: "",
                carrierPartner: "",
              };
            }
          });
        }
        if (Array.isArray(d.trackedOrders)) {
          d.trackedOrders.forEach((t: any) => {
            const inv = t.id?.replace(/^trk-/, "") || t.trackingNumber;
            if (inv && fulfillMap[inv]) {
              fulfillMap[inv].trackingNumber = t.trackingNumber || fulfillMap[inv].trackingNumber;
              fulfillMap[inv].carrierPartner = t.courierOrLoomPartner || fulfillMap[inv].carrierPartner;
              if (t.currentStage) fulfillMap[inv].status = t.currentStage;
            }
          });
        }
        if (Object.keys(fulfillMap).length > 0) {
          setInitialFulfillments((prev) => ({ ...prev, ...fulfillMap }));
        }
      }
    } catch (err) {
      console.warn("Bootstrap fetch warning:", err);
    }
  }, []);

  useEffect(() => {
    loadLiveBootstrap();
  }, [loadLiveBootstrap]);

  const triggerRefresh = useCallback(() => {
    sound.playGunReload();
    setIsRefreshing(true);
    loadLiveBootstrap().finally(() => {
      window.setTimeout(() => {
        setIsRefreshing(false);
      }, 650);
    });
  }, [loadLiveBootstrap]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      if (isModifier && e.key.toLowerCase() === "r") {
        e.preventDefault();
        triggerRefresh();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [triggerRefresh]);

  function handleAddProduct(newProduct: Product, categoryId: string) {
    sound.playClick();
    setInventory((prev) => [newProduct, ...prev]);
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId ? { ...c, nextSequence: c.nextSequence + 1 } : c
      )
    );

    newProduct.variants.forEach((v) => {
      setStockHistory((prev) => [
        {
          id: `mov-${Date.now()}-${v.colorSlug}`,
          date: new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          sku: v.sku,
          productName: newProduct.name,
          color: v.color,
          colorSlug: v.colorSlug,
          type: "RESTOCK",
          quantity: v.stock,
          previousStock: 0,
          newStock: v.stock,
          referenceNumber: `INIT-${newProduct.id}`,
          performedBy: user.name,
          note: "Initial catalogue registration",
        },
        ...prev,
      ]);
    });
    fetch(`${API_BASE}/catalog`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProduct),
    }).catch((err) => console.warn("Sync catalog error:", err));
  }

  function handleBulkRestock(newProducts: Product[]) {
    sound.playClick();

    const receivedAt = new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const bulkMovements: StockMovement[] = newProducts.flatMap(
      (newProduct) =>
        newProduct.variants.map((variant) => ({
          id: `mov-bulk-${Date.now()}-${variant.sku}`,
          date: receivedAt,
          sku: variant.sku,
          productName: newProduct.name,
          color: variant.color,
          colorSlug: variant.colorSlug,
          type: "RESTOCK" as const,
          quantity: variant.stock,
          previousStock: 0,
          newStock: variant.stock,
          referenceNumber: `BULK-${newProduct.id}`,
          performedBy: user.name,
          note: "Bulk Stock Entry / Loom Intake",
        }))
    );

    setInventory((prev) => [...newProducts, ...prev]);
    setStockHistory((prev) => [...bulkMovements, ...prev]);

    fetch(`${API_BASE}/inventory/bulk-intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: newProducts, performer: user.name }),
    }).catch((err) => console.warn("Sync bulk intake error:", err));
  }

  function handleUpdateProduct(updatedProduct: Product) {
    sound.playClick();

    // Detect stock delta on each variant and create stock movements
    const oldProduct = inventory.find((p) => p.id === updatedProduct.id);
    const newMovements: StockMovement[] = [];

    if (updatedProduct.variants && updatedProduct.variants.length > 0) {
      updatedProduct.variants.forEach((vNew) => {
        const oldV = oldProduct?.variants.find(
          (ov) => ov.sku === vNew.sku || ov.colorSlug === vNew.colorSlug
        );
        const oldQty = oldV ? Number(oldV.stock) || 0 : 0;
        const newQty = Number(vNew.stock) || 0;
        const diff = newQty - oldQty;

        if (diff !== 0) {
          const isRestock = diff > 0;
          const mov: StockMovement = {
            id: `mov-${Date.now()}-${vNew.colorSlug || Math.random().toString(36).slice(2, 6)}`,
            date: new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            sku: vNew.sku || updatedProduct.id,
            productName: updatedProduct.name,
            color: vNew.color || "Standard",
            colorSlug: vNew.colorSlug || "STD",
            type: isRestock ? "RESTOCK" : "ADJUSTMENT",
            quantity: Math.abs(diff),
            previousStock: oldQty,
            newStock: newQty,
            referenceNumber: `${isRestock ? "RESTOCK" : "ADJ"}-${Date.now().toString().slice(-6)}`,
            performedBy: user.name || "Store Manager",
            note: isRestock
              ? `Stock increased by +${diff} drapes (${vNew.color || "Standard"})`
              : `Stock adjusted by -${Math.abs(diff)} drapes (${vNew.color || "Standard"})`,
          };
          newMovements.push(mov);

          fetch(`${API_BASE}/inventory/movements`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(mov),
          }).catch((err) => console.warn("Sync movement error:", err));
        }
      });
    }

    if (newMovements.length > 0) {
      setStockHistory((prev) => [...newMovements, ...prev]);
    }

    setInventory((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );

    fetch(`${API_BASE}/catalog/${updatedProduct.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedProduct),
    }).catch((err) => console.warn("Sync update error:", err));
  }

  function handleDeleteProduct(productId: string) {
    sound.playClick();
    setInventory((prev) => prev.filter((p) => p.id !== productId));

    fetch(`${API_BASE}/catalog/${productId}`, {
      method: "DELETE",
    }).catch((err) => console.warn("Sync delete error:", err));
  }

  function revokeDevice(id: string) {
    sound.playClick();
    setDevices((prev) => prev.filter((d) => d.id !== id));
  }

  function handleCompleteSale(sale: CompletedSale) {
    sound.playNotification();
    setSalesHistory((prev) => {
      const updated = [sale, ...prev];
      safeStorageSet("rs_admin_sales_history", updated);
      return updated;
    });

    setInventory((prevInventory) => {
      const updatedInventory = prevInventory.map((prod) => {
        const matches = sale.items.filter((it) => it.productId === prod.id);
        if (matches.length === 0) return prod;

        const updatedVariants = prod.variants.map((v) => {
          const matchVariant = matches.find((it) => it.colorSlug === v.colorSlug);
          if (matchVariant) {
            return {
              ...v,
              stock: Math.max(0, v.stock - matchVariant.qty),
            };
          }
          return v;
        });

        return { ...prod, variants: updatedVariants };
      });
      safeStorageSet("rs_admin_inventory", updatedInventory);
      return updatedInventory;
    });

    const newMovements: StockMovement[] = sale.items.map((item) => ({
      id: `mov-${Date.now()}-${item.cartId}`,
      date: sale.date,
      sku: item.sku,
      productName: item.name,
      color: item.color,
      colorSlug: item.colorSlug,
      type: "SALE",
      quantity: -item.qty,
      previousStock: item.maxStock,
      newStock: Math.max(0, item.maxStock - item.qty),
      referenceNumber: sale.invoiceNumber,
      performedBy: user.name,
      note: `Customer sale for ${sale.customerName}`,
    }));

    setStockHistory((prev) => {
      const updated = [...newMovements, ...prev];
      safeStorageSet("rs_admin_stock_history", updated);
      return updated;
    });

    fetch(`${API_BASE}/billing/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...sale,
        customerPhone: sale.customerPhone || "9999999999",
      }),
    })
      .then(() => loadLiveBootstrap())
      .catch((err) => console.warn("Sync sale error:", err));
  }

  function handleAddStockMovement(movement: StockMovement) {
    sound.playClick();
    setStockHistory((prev) => {
      const updated = [movement, ...prev];
      safeStorageSet("rs_admin_stock_history", updated);
      return updated;
    });

    setInventory((prev) => {
      const updated = prev.map((prod) => {
        const hasVariant = prod.variants.some((v) => v.sku === movement.sku);
        if (!hasVariant) return prod;

        return {
          ...prod,
          variants: prod.variants.map((v) =>
            v.sku === movement.sku ? { ...v, stock: movement.newStock } : v
          ),
        };
      });
      safeStorageSet("rs_admin_inventory", updated);
      return updated;
    });

    fetch(`${API_BASE}/inventory/movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movement),
    })
      .then(() => loadLiveBootstrap())
      .catch((err) => console.warn("Sync movement error:", err));
  }

  function handleAddCustomer(newCustomer: CustomerProfile) {
    sound.playClick();
    setCustomers((prev) => [newCustomer, ...prev]);
    fetch(`${API_BASE}/crm/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCustomer),
    }).catch((err) => console.warn("Sync customer error:", err));
  }

  return (
    // Provider wraps the dashboard with preloaded fulfillment state from backend
    <OrderFulfillmentProvider initialFulfillments={initialFulfillments}>
      <div className="relative h-screen w-screen overflow-hidden bg-[#F6F4EE] flex select-none font-sans text-stone-800">
        {/* Background Ambience */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#F5E6DC] via-[#EBD5C6] to-transparent blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full bg-gradient-to-tl from-[#E5D7E3] via-[#F3EBE6] to-transparent blur-3xl opacity-60 pointer-events-none" />

        {/* SIDEBAR NAVIGATION */}
        <aside
          className="w-64 h-full glass-panel border-r border-stone-200/60 flex flex-col p-4 z-20 overflow-y-auto
            [scrollbar-width:thin] [scrollbar-color:rgba(168,162,158,0.55)_transparent]
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-stone-300/60
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:border-2
            [&::-webkit-scrollbar-thumb]:border-transparent
            [&::-webkit-scrollbar-thumb]:bg-clip-padding
            hover:[&::-webkit-scrollbar-thumb]:bg-stone-400/70">
          <div>
            {/* Brand Header */}
            <div className="flex items-center gap-3 px-1 py-2 mb-3 border-b border-stone-200/50">
                <img
                  src="src/assets/logo/logo1.png"
                  alt="RS Fashions Logo"
                  className="w-10 h-full object-cover"
                />
              <div>
                <h2 className="font-display font-semibold text-stone-900 leading-none">
                  RS Fashions
                </h2>
                <span className="text-[11px] text-stone-500 font-light tracking-wide">
                  SiCo Gadwal Sarees
                </span>
              </div>
            </div>

            <nav className="space-y-1">
              {/* 1. OVERVIEW */}
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === "overview"
                    ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                    : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                  }`}
              >
                <LayoutDashboard
                  size={16}
                  className={activeTab === "overview" ? "text-[#D4A373]" : "text-stone-400"}
                />
                <span>Overview</span>
              </button>

              {/* SECTION: INVENTORY */}
              <div className="pt-3 pb-1 px-3.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                  Inventory
                </span>
              </div>

              {/* 2. SAREE CATALOG */}
              <button
                onClick={() => setActiveTab("catalog")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === "catalog"
                    ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                    : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                  }`}
              >
                <ShoppingBag
                  size={16}
                  className={activeTab === "catalog" ? "text-[#D4A373]" : "text-stone-400"}
                />
                <span>Saree Stock</span>
              </button>

              {/* BULK STOCK ENTRY */}
              <button
                onClick={() => setActiveTab("bulk-stock")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === "bulk-stock"
                    ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                    : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                  }`}
              >
                <PackagePlus
                  size={16}
                  className={activeTab === "bulk-stock" ? "text-[#D4A373]" : "text-stone-400"}
                />
                <span>Bulk Stock Entry</span>
              </button>

              {/* 3. STOCK MOVEMENTS */}
              <button
                onClick={() => setActiveTab("history")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === "history"
                    ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                    : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                  }`}
              >
                <History
                  size={16}
                  className={activeTab === "history" ? "text-[#D4A373]" : "text-stone-400"}
                />
                <span>Stock History</span>
              </button>

              {/* 4. WEAVES & HSN */}
              <button
                onClick={() => setActiveTab("categories")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === "categories"
                    ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                    : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                  }`}
              >
                <Layers
                  size={16}
                  className={activeTab === "categories" ? "text-[#D4A373]" : "text-stone-400"}
                />
                <span>Categories</span>
              </button>

              {/* NEW MODULE: AUTOMATED LOW STOCK & WEAVER POs */}
              <button
                onClick={() => setActiveTab("low-stock" as DashboardTab)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === ("low-stock" as DashboardTab)
                    ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                    : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                  }`}
              >
                <AlertTriangle
                  size={16}
                  className={activeTab === ("low-stock" as DashboardTab) ? "text-[#D4A373]" : "text-stone-400"}
                />
                <span>Low-Stock &amp; POs</span>
              </button>

              {/* SECTION: POINT OF SALE */}
              <div className="pt-3 pb-1 px-3.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                  Point of Sale
                </span>
              </div>

              {/* 5. COUNTER BILLING */}
              <button
                onClick={() => setActiveTab("billing")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === "billing"
                    ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                    : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                  }`}
              >
                <ReceiptIndianRupee
                  size={16}
                  className={activeTab === "billing" ? "text-[#D4A373]" : "text-stone-400"}
                />
                <span>Counter Billing</span>
              </button>

              {/* 6. TRANSACTION HISTORY */}
              <button
                onClick={() => setActiveTab("sales-ledger")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === "sales-ledger"
                    ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                    : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                  }`}
              >
                <ScrollText
                  size={16}
                  className={activeTab === "sales-ledger" ? "text-[#D4A373]" : "text-stone-400"}
                />
                <span>Transaction History</span>
              </button>

              {/* SECTION: INTELLIGENCE */}
              <div className="pt-3 pb-1 px-3.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                  Intelligence
                </span>
              </div>

              {/* 7. STORE ANALYTICS */}
              <button
                onClick={() => setActiveTab("analytics")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === "analytics"
                    ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                    : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                  }`}
              >
                <BarChart2
                  size={16}
                  className={activeTab === "analytics" ? "text-[#D4A373]" : "text-stone-400"}
                />
                <span>Store Analytics</span>
              </button>

              {/* 8. CLIENT CRM */}
              <button
                onClick={() => setActiveTab("crm")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === "crm"
                    ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                    : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                  }`}
              >
                <Users
                  size={16}
                  className={activeTab === "crm" ? "text-[#D4A373]" : "text-stone-400"}
                />
                <span>CRM</span>
              </button>

              {/* 9. ORDER & LOOM TRACKING */}
              <button
                onClick={() => setActiveTab("tracking")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === "tracking"
                    ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                    : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                  }`}
              >
                <Truck
                  size={16}
                  className={activeTab === "tracking" ? "text-[#D4A373]" : "text-stone-400"}
                />
                <span>Order Tracking</span>
              </button>

              {/* SECTION: CONFIGURATION */}
              <div className="pt-3 pb-1 px-3.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                  Configuration
                </span>
              </div>

              {/* 10. STORE SETTINGS */}
              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === "settings"
                    ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                    : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Settings
                    size={16}
                    className={activeTab === "settings" ? "text-[#D4A373]" : "text-stone-400"}
                  />
                  <span>Settings</span>
                </div>
              </button>
            </nav>
          </div>
        </aside>

        {/* MAIN VIEW AREA */}
        <main className="flex-1 h-full flex flex-col overflow-hidden z-10 bg-transparent">
          <header className="h-16 px-8 flex items-center justify-between gap-4 border-b border-stone-200/40 bg-white/40 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span>RS Fashions</span>
              <span>&bull;</span>
              <span className="font-semibold text-stone-800 capitalize">
                {activeTab === "history"
                  ? "Stock History"
                  : activeTab === "sales-ledger"
                    ? "Transaction History"
                    : activeTab === "analytics"
                      ? "Store Analytics"
                      : activeTab === "crm"
                        ? "CRM"
                        : activeTab === "bulk-stock"
                          ? "Bulk Stock Entry"
                          : activeTab === ("low-stock" as DashboardTab)
                            ? "Low-Stock & POs"
                            : activeTab === ("loyalty" as DashboardTab)
                              ? "Store Credit & Khata"
                              : activeTab}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Cloud Sync Status */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-stone-600 font-medium bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-full whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_0_3px_rgba(16,185,129,0.10)]" />
                <span>Cloud Sync Active</span>
              </div>

              {/* Refresh / Sync Action Button (Ctrl + R / Cmd + R) */}
              <button
                type="button"
                onClick={triggerRefresh}
                title="Refresh / Sync Store Data (Ctrl + R)"
                className="flex items-center justify-center gap-1.5 h-9 px-3 text-xs font-semibold rounded-xl bg-white/80 border border-stone-200/90 text-stone-700 hover:border-[#D4A373] hover:text-stone-900 hover:bg-white shadow-sm transition-all active:scale-[0.97]"
              >
                <RotateCw
                  size={13}
                  className={`text-[#D4A373] ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span className="hidden lg:inline">Refresh</span>
              </button>

              {/* Notifications Bell Button */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  sound.playNotification();
                  setIsNotificationsOpen(true);
                }}
                title="Notifications & Milestones"
                className="relative flex items-center justify-center w-9 h-9 text-stone-600 hover:text-stone-900 bg-white/60 hover:bg-white border border-stone-200/70 rounded-xl shadow-sm transition-all"
              >
                <Bell size={16} />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>

              {/* User / Session */}
              <div className="h-7 w-px bg-stone-200/80 mx-0.5" />

              <div className="flex items-center gap-2.5 pl-1.5 pr-1 py-1 rounded-xl border border-stone-200/80 bg-white/65 hover:bg-white/85 shadow-sm transition-all">
                <div className="w-8 h-8 rounded-lg bg-[#2A0E20] text-amber-200 flex items-center justify-center font-display font-semibold text-xs shrink-0 shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <div className="hidden md:block min-w-0 max-w-[150px] leading-tight">
                  <p className="text-xs font-semibold text-stone-800 truncate">{user.name}</p>
                  <p className="text-[10px] text-stone-500 truncate">{user.role}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sound.playLogout();
                    setTimeout(() => {
                      onLogout();
                    }, 350);
                  }}
                  title={`Logout ${user.name}`}
                  aria-label={`Logout ${user.name}`}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </header>

          {/* Dynamic Route Content with Custom Styled Scrollbar */}
          <div
            className="flex-1 min-h-0 overflow-y-auto p-8
              [scrollbar-width:thin] [scrollbar-color:rgba(168,162,158,0.55)_transparent]
              [&::-webkit-scrollbar]:w-1.5
              [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:bg-stone-300/60
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-thumb]:border-2
              [&::-webkit-scrollbar-thumb]:border-transparent
              [&::-webkit-scrollbar-thumb]:bg-clip-padding
              hover:[&::-webkit-scrollbar-thumb]:bg-stone-400/70">
            {/* TAB 0: OVERVIEW (Default Landing Page) */}
            {activeTab === "overview" && (
              <Overview
                salesHistory={salesHistory}
                inventory={inventory}
                devices={devices}
                stockHistory={stockHistory}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {/* TAB 1: SAREE CATALOG */}
            {activeTab === "catalog" && (
              <Catalog
                inventory={inventory}
                categories={categories}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onOpenHistory={() => setActiveTab("history")}
              />
            )}

            {/* BULK STOCK ENTRY */}
            {activeTab === "bulk-stock" && (
              <BulkStock
                inventory={inventory}
                categories={categories}
                onBulkRestock={handleBulkRestock}
              />
            )}

            {/* TAB 2: STOCK MOVEMENTS */}
            {activeTab === "history" && (
              <StockHistory
                history={stockHistory}
                inventory={inventory}
                onAddStockMovement={handleAddStockMovement}
              />
            )}

            {/* TAB 3: COUNTER BILLING */}
            {activeTab === "billing" && (
              <Billing
                inventory={inventory}
                categories={categories}
                onCompleteSale={handleCompleteSale}
              />
            )}

            {/* TAB 4: TRANSACTION HISTORY */}
            {activeTab === "sales-ledger" && (
              <TransactionHistory salesHistory={salesHistory} />
            )}

            {/* TAB 5: WEAVES & HSN CATEGORIES */}
            {activeTab === "categories" && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#D4A373]">
                    Tax &amp; Classification
                  </span>
                  <h1 className="text-3xl font-display font-medium text-stone-900 mt-0.5">
                    Weave Categories &amp; HSN Codes
                  </h1>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="glass-panel p-5 rounded-2xl flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-stone-900">{cat.name}</h4>
                        <p className="text-xs text-stone-500 mt-1">
                          Prefix: <span className="font-mono font-semibold text-stone-800">{cat.slug}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 text-xs font-mono font-medium">
                          HSN: {cat.hsn}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: STORE SETTINGS */}
            {activeTab === "settings" && (
              <SettingsView
                devices={devices}
                onRevokeDevice={revokeDevice}
                currentUser={user}
                inventory={inventory}
                salesHistory={salesHistory}
                stockHistory={stockHistory}
                onRestoreInventory={(importedProducts) => setInventory(importedProducts)}
              />
            )}

            {/* TAB 7: STORE ANALYTICS */}
            {activeTab === "analytics" && (
              <Analysis
                inventory={inventory}
                salesHistory={salesHistory}
                stockHistory={stockHistory}
                categories={categories}
              />
            )}

            {/* TAB 8: CLIENT CRM */}
            {activeTab === "crm" && (
              <CRM customers={customers} onAddCustomer={handleAddCustomer} />
            )}

            {/* NEW MODULE: LOW STOCK & WEAVER POs */}
            {activeTab === ("low-stock" as DashboardTab) && (
              <AutomatedLowstock
                inventory={inventory}
                onUpdateProduct={handleUpdateProduct}
              />
            )}

            {/* TAB 9: ORDER TRACKING */}
            {activeTab === "tracking" && <TrackOrder salesHistory={salesHistory} />}
          </div>
        </main>

        {/* NOTIFICATION SLIDING OVERLAY DRAWER WITH SOUND INTEGRATION */}
        {isNotificationsOpen && (
          <Notifications
            salesHistory={salesHistory}
            onNavigateTab={(tab) => {
              sound.playClick();
              setActiveTab(tab);
              setIsNotificationsOpen(false);
            }}
            onClose={() => {
              sound.playClick();
              setIsNotificationsOpen(false);
            }}
          />
        )}
      </div>
    </OrderFulfillmentProvider>
  );
}