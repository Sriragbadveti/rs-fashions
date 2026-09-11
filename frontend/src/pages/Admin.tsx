import { useState, useEffect } from "react";
import {
  TrendingUp,
  Package,
  Laptop,
  History,
  ReceiptIndianRupee,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";
import type {
  DashboardProduct,
  Category,
  DashboardTab,
  Device,
  CompletedSale,
  StockMovement,
  UserSession,
  CustomerProfile,
  TrackedOrder,
} from "../types/dashboard";
import { StoreService } from "../services/storeService";

// Modular Admin Components
import { AdminSidebar } from "../components/admin/layout/AdminSidebar";
import { AdminHeader } from "../components/admin/layout/AdminHeader";
import { ToastContainer } from "../components/admin/common/ToastContainer";
import type { ToastNotice } from "../components/admin/common/ToastContainer";
import { AdminLogin } from "../components/admin/login/AdminLogin";
import { CatalogView } from "../components/admin/catalog/CatalogView";
import { StockHistoryView } from "../components/admin/history/StockHistoryView";
import { BillingView } from "../components/admin/billing/BillingView";
import { TransactionHistoryView } from "../components/admin/ledger/TransactionHistoryView";
import { AnalyticsView } from "../components/admin/analytics/AnalyticsView";
import { CRMView } from "../components/admin/crm/CRMView";
import { TrackOrderView } from "../components/admin/tracking/TrackOrderView";
import { CategoriesView } from "../components/admin/categories/CategoriesView";
import { SettingsView } from "../components/admin/settings/SettingsView";

export default function Admin() {
  // Session state (default authenticated for seamless admin experience, or logout to test login screen)
  const [currentUser, setCurrentUser] = useState<UserSession | null>({
    name: "Sindhu Reddy",
    email: "admin@rsfashions.in",
    role: "Superadmin",
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState<DashboardTab>("catalog");

  // Global State (Initialized fresh from Supabase)
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventory, setInventory] = useState<DashboardProduct[]>([]);
  const [stockHistory, setStockHistory] = useState<StockMovement[]>([]);
  const [salesHistory, setSalesHistory] = useState<CompletedSale[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [trackedOrders, setTrackedOrders] = useState<TrackedOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

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

  // Load all data from Supabase / StoreService
  const loadDatabaseData = async () => {
    setIsLoading(true);
    try {
      const [cats, prods, movs, sales, custs, tracked] = await Promise.all([
        StoreService.getCategories(),
        StoreService.getDashboardProducts(),
        StoreService.getStockMovements(),
        StoreService.getCompletedSales(),
        StoreService.getCustomers(),
        StoreService.getTrackedOrders(),
      ]);
      if (cats) setCategories(cats);
      if (prods) setInventory(prods);
      if (movs) setStockHistory(movs);
      if (sales) setSalesHistory(sales);
      if (custs) setCustomers(custs);
      if (tracked) setTrackedOrders(tracked);
    } catch (err) {
      console.warn("Supabase fetch notice:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();

    // Bidirectional Realtime Sync between Web and Desktop App
    const unsubscribe = StoreService.subscribeToRealtime((payload) => {
      console.log("Realtime sync event received on Web:", payload);
      loadDatabaseData();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const addToast = (
    title: string,
    message: string,
    type: "info" | "success" | "warning" | "error" = "info"
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  // Handlers with Supabase sync
  const handleAddProduct = async (newProduct: DashboardProduct, categoryId: string) => {
    setInventory((prev) => [newProduct, ...prev]);
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId ? { ...c, nextSequence: c.nextSequence + 1 } : c
      )
    );

    await StoreService.addDashboardProduct(newProduct, categoryId);

    newProduct.variants.forEach(async (v) => {
      const mov: StockMovement = {
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
        performedBy: currentUser?.name || "Sindhu Reddy",
        note: "Initial catalogue registration into vault",
      };
      await StoreService.addStockMovement(mov);
      setStockHistory((prev) => [mov, ...prev]);
    });

    addToast("Saree Catalogued", `${newProduct.name} saved to Supabase vault.`, "success");
  };

  const handleUpdateProduct = async (updatedProduct: DashboardProduct) => {
    setInventory((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    await StoreService.updateDashboardProduct(updatedProduct);
    addToast("Saree Updated", `${updatedProduct.name} details and stocks updated.`, "info");
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm("Are you sure you want to remove this saree from the vault?")) {
      setInventory((prev) => prev.filter((p) => p.id !== productId));
      await StoreService.deleteDashboardProduct(productId);
      addToast("Saree Removed", "Saree archived from active catalog.", "warning");
    }
  };

  const handleAddStockMovement = async (movement: StockMovement) => {
    setStockHistory((prev) => [movement, ...prev]);
    await StoreService.addStockMovement(movement);

    setInventory((prev) =>
      prev.map((prod) => {
        const hasVariant = prod.variants.some((v) => v.sku === movement.sku);
        if (!hasVariant) return prod;

        const updated = {
          ...prod,
          variants: prod.variants.map((v) =>
            v.sku === movement.sku ? { ...v, stock: movement.newStock } : v
          ),
        };
        StoreService.updateDashboardProduct(updated);
        return updated;
      })
    );

    addToast(
      "Stock Shift Logged",
      `${movement.type} (${movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}) recorded for ${movement.productName}.`,
      "success"
    );
  };

  const handleCompleteSale = async (sale: CompletedSale) => {
    setSalesHistory((prev) => [sale, ...prev]);
    await StoreService.addCompletedSale(sale);

    // 1. Deduct stock from live inventory
    setInventory((prevInventory) =>
      prevInventory.map((prod) => {
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

        const updated = { ...prod, variants: updatedVariants };
        StoreService.updateDashboardProduct(updated);
        return updated;
      })
    );

    // 2. Add each sold drape to stock audit log
    sale.items.forEach(async (item) => {
      const mov: StockMovement = {
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
        performedBy: currentUser?.name || "Sindhu Reddy",
        note: `Customer POS Counter sale for ${sale.customerName}`,
      };
      await StoreService.addStockMovement(mov);
      setStockHistory((prev) => [mov, ...prev]);
    });

    addToast(
      "Invoice Generated",
      `Invoice #${sale.invoiceNumber} completed for ₹${sale.total.toLocaleString("en-IN")}.`,
      "success"
    );
  };

  const handleAddCustomer = async (newCustomer: CustomerProfile) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    await StoreService.addCustomer(newCustomer);
    addToast("Patron Added", `${newCustomer.name} registered into VIP CRM.`, "success");
  };

  const handleAddTrackedOrder = async (newOrder: TrackedOrder) => {
    setTrackedOrders((prev) => [newOrder, ...prev]);
    await StoreService.addTrackedOrder(newOrder);
    addToast("Dispatch Registered", `Tracking #${newOrder.trackingNumber} registered.`, "success");
  };

  const handleAddCategory = async (newCat: Category) => {
    setCategories((prev) => [...prev, newCat]);
    await StoreService.addCategory(newCat);
    addToast("Weave Category Registered", `${newCat.name} (HSN ${newCat.hsn}) saved.`, "success");
  };

  const handleRevokeDevice = (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
    addToast("Device Revoked", "Terminal access key revoked.", "warning");
  };

  if (!currentUser) {
    return <AdminLogin onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#F6F4EE] flex select-none font-sans text-stone-800">
      {/* Ambient Windows Acrylic Sheen */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#F5E6DC] via-[#EBD5C6] to-transparent blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full bg-gradient-to-tl from-[#E5D7E3] via-[#F3EBE6] to-transparent blur-3xl opacity-60 pointer-events-none" />

      {/* 1. Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={(tab: DashboardTab) => setActiveTab(tab)}
        user={currentUser}
        onLogout={() => setCurrentUser(null)}
      />

      {/* 2. Main Workspace */}
      <main className="flex-1 h-full flex flex-col overflow-hidden z-10">
        {/* Top App Header */}
        <AdminHeader activeTab={activeTab} />

        {/* Dynamic Route Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#D4A373]">
                    Counter Intelligence
                  </span>
                  <h1 className="text-3xl font-display font-medium text-stone-900 mt-0.5">
                    Store Operations Overview
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadDatabaseData}
                    disabled={isLoading}
                    title="Refresh data from Supabase"
                    className="h-10 px-3.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <RefreshCw size={14} className={isLoading ? "animate-spin text-[#D4A373]" : "text-[#D4A373]"} />
                    <span>Sync</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("billing")}
                    className="h-10 px-4 rounded-xl bg-[#2A0E20] hover:bg-[#3d162f] text-amber-100 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
                  >
                    <ReceiptIndianRupee size={15} className="text-[#D4A373]" />
                    <span>Open Billing Counter</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("catalog")}
                    className="h-10 px-4 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors"
                  >
                    <ShoppingBag size={15} className="text-[#D4A373]" />
                    <span>View Saree Vault</span>
                  </button>
                </div>
              </div>

              {/* Overview Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-stone-500 mb-3">
                    <span className="text-xs font-medium">Daily Silk Sales</span>
                    <TrendingUp size={16} className="text-emerald-600" />
                  </div>
                  <div className="text-2xl font-display font-semibold text-stone-900">
                    ₹{salesHistory.reduce((acc, s) => acc + s.total, 0).toLocaleString("en-IN")}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    +{salesHistory.length} bills processed today
                  </span>
                </div>

                <div className="glass-panel p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-stone-500 mb-3">
                    <span className="text-xs font-medium">Drapes in Stock</span>
                    <Package size={16} className="text-[#D4A373]" />
                  </div>
                  <div className="text-2xl font-display font-semibold text-stone-900">
                    {inventory.reduce((acc, p) => acc + (p.variants ? p.variants.reduce((s, v) => s + (v.stock || 0), 0) : 0), 0)}
                  </div>
                  <span className="text-[11px] text-stone-500">Live showroom inventory</span>
                </div>

                <div className="glass-panel p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-stone-500 mb-3">
                    <span className="text-xs font-medium">Active Counters</span>
                    <Laptop size={16} className="text-indigo-600" />
                  </div>
                  <div className="text-2xl font-display font-semibold text-stone-900">
                    {devices.length} Online
                  </div>
                  <span className="text-[11px] text-stone-500">All terminals synced</span>
                </div>

                <div className="glass-panel p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-stone-500 mb-3">
                    <span className="text-xs font-medium">Stock Shift Events</span>
                    <History size={16} className="text-purple-700" />
                  </div>
                  <div className="text-2xl font-display font-semibold text-stone-900">
                    {stockHistory.length} Logs
                  </div>
                  <span className="text-[11px] text-stone-500">Audit trail active</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SAREE CATALOG */}
          {activeTab === "catalog" && (
            <CatalogView
              inventory={inventory}
              categories={categories}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onAddStockMovement={handleAddStockMovement}
              onOpenHistory={() => setActiveTab("history")}
            />
          )}

          {/* TAB: STOCK AUDIT HISTORY */}
          {activeTab === "history" && (
            <StockHistoryView
              history={stockHistory}
              inventory={inventory}
              onAddStockMovement={handleAddStockMovement}
            />
          )}

          {/* TAB: COUNTER BILLING */}
          {activeTab === "billing" && (
            <BillingView
              inventory={inventory}
              categories={categories}
              customers={customers}
              onCompleteSale={handleCompleteSale}
            />
          )}

          {/* TAB: TRANSACTION HISTORY */}
          {activeTab === "sales-ledger" && (
            <TransactionHistoryView salesHistory={salesHistory} />
          )}

          {/* TAB: STORE ANALYTICS */}
          {activeTab === "analytics" && (
            <AnalyticsView
              inventory={inventory}
              salesHistory={salesHistory}
              stockHistory={stockHistory}
              categories={categories}
            />
          )}

          {/* TAB: PATRONS & CLIENT CRM */}
          {activeTab === "crm" && (
            <CRMView
              customers={customers}
              onAddCustomer={handleAddCustomer}
            />
          )}

          {/* TAB: ORDER TRACKING */}
          {activeTab === "tracking" && (
            <TrackOrderView
              orders={trackedOrders}
              onAddTrackedOrder={handleAddTrackedOrder}
            />
          )}

          {/* TAB: WEAVES & HSN */}
          {activeTab === "categories" && (
            <CategoriesView
              categories={categories}
              onAddCategory={handleAddCategory}
            />
          )}

          {/* TAB: SETTINGS */}
          {activeTab === "settings" && (
            <SettingsView
              devices={devices}
              onRevokeDevice={handleRevokeDevice}
              currentUser={currentUser}
            />
          )}
        </div>
      </main>

      {/* Floating Notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}
