import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Menu,
  X,
  Tag,
  ChevronRight,
  Star,
} from "lucide-react";
import Overview from "./Overview";
import Catalog from "./SareeStock";
import SettingsView from "./Settings";
import Billing from "./Billing";
import SaleManager from "./SaleManager";
import StockHistory from "./StockHistory";
import TransactionHistory from "./TransactionHistory";
import Analysis from "./Analysis";
import CRM from "./CRM";
import TrackOrder from "./TrackOrder";
import ReviewsManager from "./ReviewsManager";
import AutomatedLowstock from "./AutomatedLowstock";
import Notifications from "./Notifications";
import { sound } from "../types/soundEngine";
import BulkStock from "./BulkStock";
import { OrderFulfillmentProvider } from "../context/OrderFulfillmentContext";
import { API_BASE } from "../config/api";
import { adminFetch, getAdminToken, clearAdminSession } from "../utils/adminSession";
import logo from "../assets/logo/logo1.png";
import type {
  Product,
  Category,
  DashboardTab,
  Device,
  CompletedSale,
  StockMovement,
  CustomerProfile,
} from "../types/inventory";
import type { BulkRestockResult } from "../types/bulkstock";
import {
  MOCK_CATEGORIES,
  MOCK_INVENTORY,
  MOCK_STOCK_HISTORY,
  MOCK_CUSTOMERS,
  CANONICAL_SAREE_CATEGORIES,
} from "../types/inventory";
import { syncColorsToRuntime } from "../types/catalog";
import { getSavedCrmCustomers } from "../types/useBilling";
import { getDeviceUUID, getDeviceMetadata } from "../utils/userSession";
import {
  isUnrenderedHeicDataUrl,
  convertHeicDataUrlToJpeg,
  recoverHeicUrlIfNeeded,
} from "../utils/imageConverter";

const DUMMY_PRODUCT_IDS = new Set([
  "emerald-sico-gadwal",
  "midnight-sico-gadwal",
  "rose-sico-gadwal",
  "ivory-sico-gadwal",
]);

const DUMMY_ORDER_IDS = new Set([
  "inv-mu7lz088-ba09",
  "inv-mu7jzpbh-tfl1",
  "RSF-921901",
]);

interface DashboardProps {
  user: { name: string; email: string; role: string };
  onLogout: () => void;
}

const ACTIVE_TAB_STORAGE_KEY = "rs_active_tab";
const NOTIFICATIONS_SEEN_KEY = "rs_notifications_last_seen";

interface NavItemConfig {
  id: DashboardTab;
  label: string;
  icon: any;
  badge?: string | number;
}

interface NavSectionConfig {
  title: string;
  items: NavItemConfig[];
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTabState] = useState<DashboardTab>(() => {
    const saved = sessionStorage.getItem(ACTIVE_TAB_STORAGE_KEY) as DashboardTab | null;
    return saved || "overview";
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const [lastSeenTime, setLastSeenTime] = useState<number>(() => {
    return Number(localStorage.getItem(NOTIFICATIONS_SEEN_KEY) || 0);
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const setActiveTab = (tab: DashboardTab) => {
    sound.playClick();
    sessionStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
    setActiveTabState(tab);
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSidebarOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem("rs_admin_categories");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const nonVerticals = parsed.filter(
            (c) =>
              c.name.toLowerCase().includes("gadwal") ||
              c.name.toLowerCase().includes("sico")
          );
          if (nonVerticals.length > 0) {
            return nonVerticals;
          }
        }
      }
    } catch { }
    return [...CANONICAL_SAREE_CATEGORIES];
  });

  // Automatic cache buster: purge any legacy deleted stock from localStorage on initial load
  useEffect(() => {
    try {
      const CACHE_KEY = "rs_inventory_cache_ver";
      const CURRENT_VER = "v2_2026_09_28_purge";
      if (localStorage.getItem(CACHE_KEY) !== CURRENT_VER) {
        localStorage.removeItem("rs_admin_inventory");
        localStorage.removeItem("rs_fashions_products");
        localStorage.setItem(CACHE_KEY, CURRENT_VER);
      }
    } catch {}
  }, []);

  const [inventory, setInventory] = useState<Product[]>(() => {
    try {
      const CACHE_KEY = "rs_inventory_cache_ver";
      const CURRENT_VER = "v2_2026_09_28_purge";
      if (localStorage.getItem(CACHE_KEY) !== CURRENT_VER) {
        localStorage.removeItem("rs_admin_inventory");
        localStorage.removeItem("rs_fashions_products");
        localStorage.setItem(CACHE_KEY, CURRENT_VER);
        return [];
      }
      const saved = localStorage.getItem("rs_admin_inventory");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (p: any) => p && p.id && !DUMMY_PRODUCT_IDS.has(String(p.id))
          );
          if (cleaned.length !== parsed.length) {
            try {
              localStorage.setItem("rs_admin_inventory", JSON.stringify(cleaned));
            } catch {}
          }
          return cleaned;
        }
      }
    } catch { }
    return [];
  });

  const [stockHistory, setStockHistory] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem("rs_admin_stock_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { }
    return [];
  });

  const [salesHistory, setSalesHistory] = useState<CompletedSale[]>(() => {
    try {
      const saved = localStorage.getItem("rs_admin_sales_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (s: any) =>
              s &&
              !DUMMY_ORDER_IDS.has(String((s as any).id || "")) &&
              !DUMMY_ORDER_IDS.has(String(s.invoiceNumber || ""))
          );
          if (cleaned.length !== parsed.length) {
            try {
              localStorage.setItem("rs_admin_sales_history", JSON.stringify(cleaned));
            } catch {}
          }
          return cleaned;
        }
      }
    } catch { }
    return [];
  });

  const [customers, setCustomers] = useState<CustomerProfile[]>(() => {
    try {
      const saved = localStorage.getItem("rs_admin_customers");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { }
    return [];
  });

  const [initialFulfillments, setInitialFulfillments] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem("rs_order_fulfillments");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [devices, setDevices] = useState<Device[]>([]);

  // Dot is displayed ONLY when there are genuinely unseen notifications
  const hasUnreadNotifications = useMemo(() => {
    if (isNotificationsOpen) return false;

    // 1. Any sales completed after lastSeenTime
    const hasNewSale = salesHistory.some((s) => {
      const saleTime = new Date(s.date).getTime();
      return !Number.isNaN(saleTime) && saleTime > lastSeenTime;
    });

    // 2. Any stock adjustments logged after lastSeenTime
    const hasNewStockMov = stockHistory.some((m) => {
      const movTime = new Date(m.date).getTime();
      return !Number.isNaN(movTime) && movTime > lastSeenTime;
    });

    return hasNewSale || hasNewStockMov;
  }, [salesHistory, stockHistory, lastSeenTime, isNotificationsOpen]);

  const handleOpenNotifications = () => {
    sound.playClick();
    sound.playNotification();
    setIsNotificationsOpen(true);

    const now = Date.now();
    setLastSeenTime(now);
    localStorage.setItem(NOTIFICATIONS_SEEN_KEY, String(now));
  };

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
        // Safe fallback
      }
    }
  };

  const lastDispatchedInventoryRef = useRef<string>("");
  const isBootstrapFetchingRef = useRef(false);
  const lastBootstrapFetchTimeRef = useRef(0);
  const pendingCreatedProductsRef = useRef<Map<string, Product>>(new Map());
  // Incremented on every local catalog write. A bootstrap response that was requested before
  // the latest write is stale for products and must not overwrite the saved state.
  const catalogMutationSeqRef = useRef(0);
  const refreshQueuedRef = useRef(false);

  const syncInventoryToStorefront = useCallback((inventoryList: Product[]) => {
    try {
      const cleanList = (inventoryList || []).filter(
        (p: any) => p && p.id && !DUMMY_PRODUCT_IDS.has(String(p.id))
      );
      const storeProducts = cleanList.map((p: any) => {
        const variants = Array.isArray(p.variants) ? p.variants : [];
        const variantImages = variants.map((v: any) => v.imageUrl).filter(Boolean) as string[];
        const primaryImg =
          p.imageUrl ||
          variantImages[0] ||
          "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop";
        const images = Array.from(
          new Set([primaryImg, ...variantImages, ...(Array.isArray(p.images) ? p.images : [])])
        ).filter(Boolean) as string[];

        const totalStock =
          variants.length > 0
            ? variants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0)
            : Number(p.stock) || 10;

        const price = Number(p.salePrice ?? p.price) || 0;
        const originalPrice = p.originalPrice
          ? Number(p.originalPrice)
          : price > 0
            ? Math.round(price * 1.25)
            : 0;
        const colors =
          variants.length > 0
            ? variants.map((v: any) => v.color)
            : Array.isArray(p.colors) && p.colors.length > 0
              ? p.colors
              : ["Standard"];

        return {
          id: p.id,
          name: p.name,
          category: "SiCo Gadwal Sarees",
          material: "SiCo Gadwal",
          price,
          originalPrice,
          stock: totalStock,
          rating: Number(p.rating) || 4.8,
          reviewCount: Number(p.reviewCount) || 0,
          images: images.length > 0 ? images : [primaryImg],
          colors: colors.length > 0 ? colors : ["Standard"],
          sizes: ["Free Size (5.5m + 0.8m Blouse)"],
          description: p.description || "Authentic handwoven SiCo Gadwal drape.",
          longDescription:
            p.longDescription ||
            p.description ||
            "Handcrafted pure heirloom SiCo Gadwal drape featuring pure zari accents and rich traditional border motifs.",
          featured: Boolean(p.featured ?? true),
        };
      });

      const serialized = JSON.stringify(storeProducts);
      if (serialized !== lastDispatchedInventoryRef.current) {
        lastDispatchedInventoryRef.current = serialized;
        safeStorageSet("rs_fashions_products", storeProducts);
        window.dispatchEvent(new Event("rs_inventory_updated"));
        window.dispatchEvent(new Event("catalogUpdated"));
      }
    } catch (e) {
      console.warn("Storefront sync notice:", e);
    }
  }, []);

  useEffect(() => {
    syncInventoryToStorefront(inventory);
  }, [inventory, syncInventoryToStorefront]);

  const loadLiveBootstrap = useCallback(async (forceRefresh = false): Promise<void> => {
    const now = Date.now();
    // Guard against concurrent execution. A forced refresh requested meanwhile runs right after.
    if (isBootstrapFetchingRef.current) {
      if (forceRefresh) refreshQueuedRef.current = true;
      return;
    }
    // Debounce rapid calls (unless forceRefresh is explicitly requested)
    if (!forceRefresh && now - lastBootstrapFetchTimeRef.current < 2500) return;

    isBootstrapFetchingRef.current = true;
    lastBootstrapFetchTimeRef.current = now;
    const mutationSeqAtStart = catalogMutationSeqRef.current;

    try {
      setSyncError(null);
      const res = await adminFetch(`${API_BASE}/admin/bootstrap${forceRefresh ? "?refresh=true" : ""}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          console.warn("[Dashboard] Admin session invalid or expired. Logging out.");
          await clearAdminSession();
          onLogout();
          return;
        }
        throw new Error(`Data sync failed (Server HTTP ${res.status})`);
      }
      const json = await res.json();
      const d = json?.data || json;
      if (d) {
        if (Array.isArray(d.categories)) {
          const filtered = d.categories.filter(
            (c: any) =>
              c.name.toLowerCase().includes("gadwal") ||
              c.name.toLowerCase().includes("sico")
          );
          const merged = filtered.length > 0 ? filtered : [...CANONICAL_SAREE_CATEGORIES];
          setCategories(merged);
          safeStorageSet("rs_admin_categories", merged);
        }
        if (Array.isArray(d.colors)) {
          syncColorsToRuntime(d.colors);
        }
        if (Array.isArray(d.products) && mutationSeqAtStart !== catalogMutationSeqRef.current) {
          // A save happened while this request was in flight; fetch again instead of
          // rolling the catalog back to the pre-save snapshot.
          refreshQueuedRef.current = true;
        } else if (Array.isArray(d.products)) {
          const remoteProducts = d.products.filter(
            (p: any) => p && p.id && !DUMMY_PRODUCT_IDS.has(String(p.id))
          );

          // Clear any pending products that now exist in the remote database response
          const remoteIds = new Set(remoteProducts.map((p: any) => String(p.id)));
          pendingCreatedProductsRef.current.forEach((_, id) => {
            if (remoteIds.has(id)) {
              pendingCreatedProductsRef.current.delete(id);
            }
          });

          // Merge any still-in-flight locally created products so they never vanish
          const pendingList = Array.from(pendingCreatedProductsRef.current.values());
          const merged = [...pendingList, ...remoteProducts];

          setInventory(merged);
          safeStorageSet("rs_admin_inventory", merged);
          syncInventoryToStorefront(merged);
        }
        if (Array.isArray(d.stockMovements)) {
          setStockHistory(d.stockMovements);
          safeStorageSet("rs_admin_stock_history", d.stockMovements);
        }
        if (Array.isArray(d.sales)) {
          const cleanSales = d.sales.filter(
            (s: any) =>
              s &&
              !DUMMY_ORDER_IDS.has(String(s.id || "")) &&
              !DUMMY_ORDER_IDS.has(String(s.invoiceNumber || ""))
          );
          setSalesHistory(cleanSales);
          safeStorageSet("rs_admin_sales_history", cleanSales);
        }
        if (Array.isArray(d.customers)) {
          setCustomers(d.customers);
          safeStorageSet("rs_admin_customers", d.customers);
        }

        const fulfillMap: Record<string, any> = {};
        if (Array.isArray(d.sales)) {
          d.sales.forEach((s: any) => {
            if (s.invoiceNumber) {
              const st = (s.orderStatus || s.order_status || "").toLowerCase();
              fulfillMap[s.invoiceNumber] = {
                status:
                  st === "delivered"
                    ? "delivered"
                    : st === "shipped"
                      ? "shipped"
                      : st === "packaging" || st === "processing"
                        ? "packaging"
                        : st === "refused_by_user" || st === "refused"
                          ? "refused_by_user"
                          : st === "cancelled"
                            ? "cancelled"
                            : "ordered",
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
              fulfillMap[inv].carrierPartner =
                t.courierOrLoomPartner || fulfillMap[inv].carrierPartner;
              if (t.currentStage) fulfillMap[inv].status = t.currentStage;
            }
          });
        }
        if (Object.keys(fulfillMap).length > 0) {
          setInitialFulfillments((prev) => ({ ...prev, ...fulfillMap }));
        }

        // Fetch Real Authorized Terminal Sessions
        try {
          const sessRes = await adminFetch(`${API_BASE}/auth/sessions`);
          if (sessRes.ok) {
            const sessJson = await sessRes.json();
            const rawList = sessJson?.data?.devices || sessJson?.devices || [];
            const curUuid = getDeviceUUID();
            const formatted: Device[] = rawList.map((d: any) => ({
              id: d.id || d.uuid,
              uuid: d.uuid || d.id,
              name: d.name || "Showroom Terminal",
              platform: d.platform || "windows",
              lastActive: d.lastActive || "Active now",
              isCurrentDevice: d.uuid === curUuid || d.id === curUuid,
              ipAddress: d.ipAddress || "127.0.0.1",
            }));

            // If current device not yet in list, ensure current device is represented
            if (!formatted.some((d) => d.isCurrentDevice)) {
              const meta = getDeviceMetadata();
              formatted.unshift({
                id: `sess-${curUuid.slice(-8)}`,
                uuid: curUuid,
                name: `${meta.deviceName} (Current Terminal)`,
                platform: meta.platform as any,
                lastActive: "Active now",
                isCurrentDevice: true,
                ipAddress: "127.0.0.1",
              });
            }
            setDevices(formatted);
          }
        } catch {
          // Gracefully suppress network errors on background sessions check
        }
      }
    } catch (err: any) {
      console.warn("Bootstrap sync notice:", err);
      setSyncError(err.message || "Unable to sync with live database");
    } finally {
      isBootstrapFetchingRef.current = false;
      if (refreshQueuedRef.current) {
        refreshQueuedRef.current = false;
        await loadLiveBootstrapRef.current(true);
      }
    }
  }, [onLogout, syncInventoryToStorefront]);

  const loadLiveBootstrapRef = useRef(loadLiveBootstrap);
  useEffect(() => {
    loadLiveBootstrapRef.current = loadLiveBootstrap;
  }, [loadLiveBootstrap]);

  // Synchronize on mount and when tab/screen becomes visible
  useEffect(() => {
    loadLiveBootstrap();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadLiveBootstrap();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [loadLiveBootstrap]);

  // Periodic automatic cross-device telemetry sync every 25 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadLiveBootstrap();
      }
    }, 25000);
    return () => clearInterval(timer);
  }, [loadLiveBootstrap]);

  const triggerRefresh = useCallback(() => {
    sound.playGunReload();
    setIsRefreshing(true);
    loadLiveBootstrap(true).finally(() => {
      window.setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
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

  function reportSaveWarnings(json: any) {
    const warnings: string[] = json?.warnings || json?.data?.warnings || [];
    if (Array.isArray(warnings) && warnings.length > 0) {
      // Saved, but some fields could not be stored; keep it visible without blocking the admin.
      console.warn("[Catalog] Saved with warnings:", warnings);
      setSyncError(`Saved, but ${warnings.join(" ")}`);
    }
  }

  async function handleAddProduct(newProduct: Product, categoryId: string): Promise<boolean> {
    sound.playClick();
    // The backend allocates the SKU (RS0001 format), so the product is shown once the database
    // has confirmed it and returned its SKU, instead of optimistically under a browser-made ID.
    const { id: _clientId, ...body } = newProduct;
    catalogMutationSeqRef.current++;
    try {
      const res = await adminFetch(`${API_BASE}/catalog`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Allow-Bulk-Create": "true",
        },
        body: JSON.stringify({ ...body, categoryId }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.message || `Server returned ${res.status}`);
      }

      const saved = json?.product || json?.data?.product;
      if (saved?.id) {
        const savedProduct: Product = {
          ...newProduct,
          id: saved.id,
          variants: Array.isArray(saved.variants) && saved.variants.length > 0 ? saved.variants : newProduct.variants,
        };
        setInventory((prev) => {
          const updated = [savedProduct, ...prev.filter((p) => p.id !== savedProduct.id)];
          safeStorageSet("rs_admin_inventory", updated);
          syncInventoryToStorefront(updated);
          return updated;
        });
      }

      reportSaveWarnings(json);
      // Re-hydrate directly from database to confirm persistence
      await loadLiveBootstrap(true);
      return true;
    } catch (err: any) {
      console.warn("Catalog sync error:", err);
      alert(`"${newProduct.name}" was NOT saved: ${String(err?.message || "server error").replace(/\.+$/, "")}.\nYour changes are still in the form — please try again.`);
      return false;
    }
  }

  async function handleBulkRestock(newProducts: Product[]): Promise<BulkRestockResult> {
    sound.playClick();
    catalogMutationSeqRef.current++;
    // Each product carries a clientRef (its bulk row) and no ID: the backend allocates the SKUs
    // and reports, per clientRef, which SKU was stored or why it failed.
    const clientRefs = newProducts.map((p, idx) => String((p as Product & { clientRef?: string }).clientRef ?? idx));
    let inserted: { clientRef: string; id: string }[] = [];
    let failed: { clientRef?: string; id?: string | null; error: string }[] = [];
    let message = "";

    try {
      const res = await adminFetch(`${API_BASE}/inventory/bulk-intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: newProducts, performer: user.name }),
      });
      const json = await res.json().catch(() => ({}));
      const d = json?.data || json || {};
      inserted = Array.isArray(d.inserted) ? d.inserted.map((x: any) => ({ clientRef: String(x.clientRef), id: String(x.id) })) : [];
      failed = Array.isArray(d.failed) ? d.failed : [];
      message = json?.message || "";

      if (!res.ok && res.status !== 207 && failed.length === 0) {
        const reason = message || `Server returned ${res.status}`;
        inserted = [];
        failed = clientRefs.map((clientRef) => ({ clientRef, error: reason }));
      }
      reportSaveWarnings(json);
    } catch (err: any) {
      console.warn("Bulk intake sync error:", err);
      inserted = [];
      failed = clientRefs.map((clientRef) => ({ clientRef, error: err?.message || "Network error" }));
    }

    // Anything the database did not confirm is reported as failed, so the admin never sees a
    // product that only exists in this browser.
    const confirmedRefs = new Set(inserted.map((x) => x.clientRef));
    clientRefs.forEach((clientRef) => {
      if (!confirmedRefs.has(clientRef) && !failed.some((f) => String(f.clientRef) === clientRef)) {
        failed.push({ clientRef, error: "Not confirmed by the database" });
      }
    });

    await loadLiveBootstrap(true);
    return { inserted, failed, message };
  }

  async function handleUpdateProduct(updatedProduct: Product): Promise<boolean> {
    sound.playClick();
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

          adminFetch(`${API_BASE}/inventory/movements`, {
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

    setInventory((prev) => {
      const updated = prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
      safeStorageSet("rs_admin_inventory", updated);
      syncInventoryToStorefront(updated);
      return updated;
    });
    // If this product is still awaiting creation, keep the pending copy in step with the edit;
    // otherwise the next sync would merge the stale pending copy back over it.
    if (pendingCreatedProductsRef.current.has(String(updatedProduct.id))) {
      pendingCreatedProductsRef.current.set(String(updatedProduct.id), updatedProduct);
    }

    catalogMutationSeqRef.current++;
    try {
      let res = await adminFetch(`${API_BASE}/catalog/${encodeURIComponent(updatedProduct.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct),
      });
      let json = await res.json().catch(() => ({}));

      if (res.status === 404) {
        // Shown in the admin but missing from the database (e.g. an earlier create/bulk intake
        // that failed silently). Saving the edit must persist it rather than drop it.
        res = await adminFetch(`${API_BASE}/catalog`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Allow-Bulk-Create": "true" },
          body: JSON.stringify(updatedProduct),
        });
        json = await res.json().catch(() => ({}));
      }

      if (!res.ok) {
        throw new Error(json.message || `Server returned ${res.status}`);
      }

      reportSaveWarnings(json);
      await loadLiveBootstrap(true);
      return true;
    } catch (err: any) {
      console.warn("Catalog update error:", err);
      alert(`Changes to "${updatedProduct.name}" were NOT saved: ${String(err?.message || "server error").replace(/\.+$/, "")}.\nPlease try again.`);
      // Re-sync so the screen shows what is actually stored.
      await loadLiveBootstrap(true);
      return false;
    }
  }

  function handleDeleteProduct(productId: string) {
    sound.playClick();
    setInventory((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      safeStorageSet("rs_admin_inventory", updated);
      syncInventoryToStorefront(updated);
      return updated;
    });

    adminFetch(`${API_BASE}/catalog/${productId}`, {
      method: "DELETE",
    }).catch((err) => console.warn("Catalog delete error:", err));
  }

  function handleBatchDelete(productIds: string[]) {
    sound.playClick();
    if (!productIds || productIds.length === 0) return;

    setInventory((prev) => {
      const updated = prev.filter((p) => !productIds.includes(p.id));
      safeStorageSet("rs_admin_inventory", updated);
      syncInventoryToStorefront(updated);
      return updated;
    });

    adminFetch(`${API_BASE}/catalog/batch-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: productIds }),
    }).catch((err) => {
      console.warn("Batch delete API notice:", err);
      // Fallback: delete sequentially if batch endpoint unavailable
      productIds.forEach((id) => {
        adminFetch(`${API_BASE}/catalog/${id}`, {
          method: "DELETE",
        }).catch((e) => console.warn("Individual delete fallback error:", e));
      });
    });
  }

  function revokeDevice(id: string) {
    sound.playClick();
    setDevices((prev) => prev.filter((d) => d.id !== id && d.uuid !== id));
    adminFetch(`${API_BASE}/auth/sessions/${id}`, {
      method: "DELETE",
    }).catch((err) => console.warn("Revoke device error:", err));
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
      syncInventoryToStorefront(updatedInventory);
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
      note: `Counter sale for ${sale.customerName}`,
    }));

    setStockHistory((prev) => {
      const updated = [...newMovements, ...prev];
      safeStorageSet("rs_admin_stock_history", updated);
      return updated;
    });

    if (sale.customerPhone || sale.customerName) {
      setCustomers((prev) => {
        const cleanPhone = (sale.customerPhone || "").replace(/\D/g, "").slice(-10);
        const updated = prev.map((cust) => {
          const custPhone = (cust.phone || "").replace(/\D/g, "").slice(-10);
          const isPhoneMatch = cleanPhone && custPhone && cleanPhone === custPhone;
          const isNameMatch =
            sale.customerName &&
            cust.name &&
            cust.name.trim().toLowerCase() === sale.customerName.trim().toLowerCase();
          if (isPhoneMatch || isNameMatch) {
            return {
              ...cust,
              totalSpent: (cust.totalSpent || 0) + (sale.total || sale.grandTotal || 0),
              ordersCount: (cust.ordersCount || 0) + 1,
            };
          }
          return cust;
        });
        safeStorageSet("rs_admin_customers", updated);
        return updated;
      });
    }

    adminFetch(`${API_BASE}/billing/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...sale,
        customerPhone: sale.customerPhone || "9999999999",
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Could not persist sale to server.");
        return loadLiveBootstrap(true);
      })
      .catch((err) => console.warn("Checkout sync error:", err));
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

    adminFetch(`${API_BASE}/inventory/movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movement),
    })
      .then(() => loadLiveBootstrap())
      .catch((err) => console.warn("Movement sync error:", err));
  }

  async function handleAddCustomer(newCustomer: CustomerProfile): Promise<boolean> {
    sound.playClick();
    setCustomers((prev) => {
      const updated = [
        newCustomer,
        ...prev.filter((c) => c.id !== newCustomer.id && c.phone !== newCustomer.phone),
      ];
      safeStorageSet("rs_admin_customers", updated);
      return updated;
    });

    try {
      const res = await adminFetch(`${API_BASE}/crm/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `Server returned ${res.status}`);
      reportSaveWarnings(json);
      // Pull the stored record (normalised birthday / anniversary) back from the database.
      await loadLiveBootstrap(true);
      return true;
    } catch (err: any) {
      console.warn("Customer sync error:", err);
      // Never show a customer that the database did not store: it would vanish on the next sync.
      setCustomers((prev) => {
        const updated = prev.filter((c) => c.id !== newCustomer.id);
        safeStorageSet("rs_admin_customers", updated);
        return updated;
      });
      alert(`Customer "${newCustomer.name}" was NOT saved: ${String(err?.message || "server error").replace(/\.+$/, "")}.`);
      return false;
    }
  }

  const navSections: NavSectionConfig[] = useMemo(
    () => [
      {
        title: "Main",
        items: [{ id: "overview", label: "Overview", icon: LayoutDashboard }],
      },
      {
        title: "Inventory & Stock",
        items: [
          { id: "catalog", label: "Saree Stock", icon: ShoppingBag, badge: inventory.length },
          { id: "bulk-stock", label: "Bulk Stock Entry", icon: PackagePlus },
          { id: "history", label: "Stock History", icon: History },
          { id: "categories", label: "Weave Types & HSN", icon: Layers },
          { id: "low-stock" as DashboardTab, label: "Low Stock & POs", icon: AlertTriangle },
        ],
      },
      {
        title: "Sales & Checkout",
        items: [
          { id: "billing", label: "Billing Counter", icon: ReceiptIndianRupee },
          { id: "sales-ledger", label: "Sales Receipts", icon: ScrollText, badge: salesHistory.length },
          { id: "sale" as DashboardTab, label: "Special Offers", icon: Tag },
        ],
      },
      {
        title: "Operations & CRM",
        items: [
          { id: "tracking", label: "Order Tracking", icon: Truck },
          { id: "crm", label: "Customer Profiles", icon: Users, badge: customers.length },
          { id: "reviews" as DashboardTab, label: "Reviews", icon: Star },
          { id: "analytics", label: "Store Analytics", icon: BarChart2 },
          { id: "settings", label: "Settings", icon: Settings },
        ],
      },
    ],
    [inventory.length, salesHistory.length, customers.length]
  );

  return (
    <OrderFulfillmentProvider initialFulfillments={initialFulfillments}>
      <div className="relative h-screen w-screen overflow-hidden bg-[#FBF9F5] flex select-none font-sans text-stone-800 antialiased">
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -top-48 -left-48 h-[650px] w-[650px] rounded-full bg-linear-to-br from-[#EEDFD5]/60 via-[#E4CEBD]/30 to-transparent blur-3xl opacity-70" />
        <div className="pointer-events-none absolute -bottom-48 -right-48 h-[750px] w-[750px] rounded-full bg-linear-to-tl from-[#E5D7E2]/50 via-[#F3EAE3]/40 to-transparent blur-3xl opacity-70" />

        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 z-40 bg-stone-950/40 backdrop-blur-xs transition-opacity duration-300 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR NAVIGATION */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-r border-white/80 bg-white/70 backdrop-blur-2xl shadow-[0_12px_40px_rgba(42,14,32,0.06)] transition-transform duration-300 ease-out md:static md:z-20 md:w-64 md:max-w-none md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          aria-label="Admin Navigation"
        >
          {/* Brand Header */}
          <div className="flex h-20 shrink-0 items-center justify-between border-b border-stone-200/50 px-5">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-white to-[#F7F2EB] p-1.5 shadow-[0_4px_16px_rgba(42,14,32,0.08)] border border-white">
                <img
                  src={logo}
                  alt="RS Fashions Emblem"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h1 className="font-serif text-base font-medium tracking-wide text-stone-900 leading-tight">
                  RS Fashions
                </h1>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8E3D51]">
                  SiCo Gadwal Sarees
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 md:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav List */}
          <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
                  {section.title}
                </p>

                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`group relative flex h-10 w-full items-center justify-between rounded-xl px-3 text-xs font-semibold tracking-wide transition-all duration-200 ${isActive
                          ? "bg-[#2A0E20] text-amber-100 shadow-[0_6px_20px_rgba(42,14,32,0.18)] translate-x-0.5"
                          : "text-stone-600 hover:bg-white/80 hover:text-stone-900 hover:shadow-xs"
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          size={16}
                          className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-[#D4A373]" : "text-stone-400 group-hover:text-[#8E3D51]"
                            }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 font-mono text-[9.5px] font-bold transition-colors ${isActive
                              ? "bg-white/15 text-amber-200"
                              : "bg-stone-200/70 text-stone-600 group-hover:bg-stone-200"
                            }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* User Profile Footer */}
          <div className="border-t border-stone-200/60 p-3.5 bg-linear-to-t from-white/90 to-transparent">
            <div className="flex items-center justify-between rounded-2xl border border-stone-200/70 bg-white/80 p-2.5 shadow-xs backdrop-blur-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#2A0E20] to-[#431534] font-serif text-xs font-bold text-amber-200 shadow-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-stone-900">{user.name}</p>
                  <p className="truncate text-[10px] font-medium text-stone-400 capitalize">
                    {user.role}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  sound.playLogout();
                  setTimeout(onLogout, 300);
                }}
                title="Sign out from store"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN VIEWPORT */}
        <main className="relative flex-1 flex flex-col h-full overflow-hidden z-10">
          <header className="h-20 shrink-0 border-b border-white/60 bg-white/60 px-5 sm:px-8 backdrop-blur-xl flex items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200/80 bg-white/80 text-stone-700 shadow-xs hover:bg-white md:hidden"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open navigation drawer"
              >
                <Menu size={18} />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-stone-400">
                  <span>RS Fashions</span>
                  <ChevronRight size={12} />
                  <span className="font-semibold text-[#8E3D51] capitalize">
                    {activeTab.replace("-", " ")}
                  </span>
                </div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-950 tracking-tight capitalize truncate mt-0.5">
                  {activeTab === "catalog"
                    ? "SiCo Gadwal Inventory"
                    : activeTab === "bulk-stock"
                      ? "Bulk Consignment Intake"
                      : activeTab === "billing"
                        ? "Point of Sale Billing"
                        : activeTab === "sales-ledger"
                          ? "Sales Receipts & Invoices"
                          : activeTab === "tracking"
                            ? "Dispatch & Delivery Tracking"
                            : activeTab === "crm"
                              ? "Customer Book & Profiles"
                              : activeTab === ("low-stock" as DashboardTab)
                                ? "Low Stock Alerts & Weaver POs"
                                : activeTab === ("sale" as DashboardTab)
                                  ? "Promotional Bundles & Offers"
                                  : activeTab === "history"
                                    ? "Stock Movement Ledger"
                                    : activeTab === "analytics"
                                      ? "Store Performance Analytics"
                                      : activeTab}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="hidden xl:flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/70 px-3.5 py-1.5 text-xs font-mono font-semibold text-stone-700 shadow-2xs">
                <span>{currentTime || "Live"}</span>
              </div>

              <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />
                <span>Cloud Connected</span>
              </div>

              {/* Bell Icon: Dot displays ONLY when hasUnreadNotifications is true */}
              <button
                type="button"
                onClick={handleOpenNotifications}
                title={hasUnreadNotifications ? "New notifications available" : "Notifications & Activity"}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200/80 bg-white/80 text-stone-700 shadow-xs transition-all hover:border-[#8E3D51] hover:bg-white hover:text-[#8E3D51] active:scale-95"
              >
                <Bell size={16} />
                {hasUnreadNotifications && (
                  <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#8E3D51] ring-2 ring-white" />
                )}
              </button>
            </div>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-7 [scrollbar-width:thin] [scrollbar-color:rgba(168,162,158,0.5)_transparent]">
            <div className="mx-auto max-w-[1600px] animate-in fade-in duration-200">
              {syncError && (
                <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-200/80 p-3.5 flex items-center justify-between text-xs text-amber-900 shadow-xs animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                    <span>Live data sync note: {syncError}. Displaying current state.</span>
                  </div>
                  <button
                    type="button"
                    onClick={triggerRefresh}
                    className="px-3 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 font-semibold text-amber-950 transition-colors active:scale-95"
                  >
                    Retry Sync
                  </button>
                </div>
              )}

              {activeTab === "overview" && (
                <Overview
                  salesHistory={salesHistory}
                  inventory={inventory}
                  devices={devices}
                  stockHistory={stockHistory}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === "catalog" && (
                <Catalog
                  inventory={inventory}
                  categories={categories}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onBatchDelete={handleBatchDelete}
                  onOpenHistory={() => setActiveTab("history")}
                />
              )}

              {activeTab === "bulk-stock" && (
                <BulkStock
                  inventory={inventory}
                  categories={categories}
                  onBulkRestock={handleBulkRestock}
                />
              )}

              {activeTab === "history" && (
                <StockHistory
                  history={stockHistory}
                  inventory={inventory}
                  onAddStockMovement={handleAddStockMovement}
                />
              )}

              {activeTab === "billing" && (
                <Billing
                  inventory={inventory}
                  categories={categories}
                  onCompleteSale={handleCompleteSale}
                  customers={customers}
                  onAddCustomer={handleAddCustomer}
                />
              )}

              {activeTab === "sales-ledger" && (
                <TransactionHistory salesHistory={salesHistory} />
              )}

              {activeTab === "categories" && (
                <div className="max-w-4xl mx-auto space-y-5">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#D4A373]">
                      Tax Classification
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
                      Weave Standards &amp; HSN Codes
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="rounded-3xl border border-stone-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-md flex items-center justify-between"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-stone-900">{cat.name}</h4>
                          <p className="text-xs text-stone-500 mt-1">
                            SKU Identifier:{" "}
                            <span className="font-mono font-bold text-stone-800">{cat.slug}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="px-3 py-1 rounded-xl bg-stone-100 text-stone-800 text-xs font-mono font-bold">
                            HSN {cat.hsn}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

              {activeTab === "analytics" && (
                <Analysis
                  inventory={inventory}
                  salesHistory={salesHistory}
                  stockHistory={stockHistory}
                  categories={categories}
                />
              )}

              {activeTab === "crm" && (
                <CRM customers={customers} onAddCustomer={handleAddCustomer} />
              )}

              {activeTab === ("low-stock" as DashboardTab) && (
                <AutomatedLowstock
                  inventory={inventory}
                  onUpdateProduct={handleUpdateProduct}
                />
              )}

              {activeTab === ("sale" as DashboardTab) && (
                <SaleManager inventory={inventory} />
              )}

              {activeTab === "tracking" && (
                <TrackOrder salesHistory={salesHistory} />
              )}

              {activeTab === ("reviews" as DashboardTab) && (
                <ReviewsManager inventory={inventory} />
              )}
            </div>
          </div>
        </main>

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