import { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  MOCK_CATEGORIES,
  MOCK_INVENTORY,
  MOCK_STOCK_HISTORY,
  MOCK_CUSTOMERS,
} from "../types/inventory";
import { getSavedCrmCustomers } from "../types/useBilling";
import { getDeviceUUID, getDeviceMetadata } from "../utils/userSession";

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
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (c) => c.name === "SiCo Gadwal Sarees" || c.id === "c1"
          );
          if (filtered.length > 0) {
            return filtered.map((c) => ({
              ...c,
              name: "SiCo Gadwal Sarees",
              slug: "SGS",
              hsn: "5208",
            }));
          }
        }
      }
    } catch { }
    return MOCK_CATEGORIES;
  });

  const [inventory, setInventory] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem("rs_admin_inventory");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p) => ({
            ...p,
            categoryId: "c1",
          }));
        }
      }
    } catch { }
    return MOCK_INVENTORY;
  });

  const [stockHistory, setStockHistory] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem("rs_admin_stock_history");
      if (saved) return JSON.parse(saved);
    } catch { }
    return MOCK_STOCK_HISTORY;
  });

  const [salesHistory, setSalesHistory] = useState<CompletedSale[]>(() => {
    try {
      const saved = localStorage.getItem("rs_admin_sales_history");
      let list: CompletedSale[] = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(list)) list = [];

      // Also merge any storefront customer orders from rs_fashions_orders
      const rawStoreOrders = localStorage.getItem("rs_fashions_orders");
      if (rawStoreOrders) {
        const storeOrders = JSON.parse(rawStoreOrders);
        if (Array.isArray(storeOrders)) {
          const existingInvoices = new Set(list.map((s) => s.invoiceNumber));
          storeOrders.forEach((o: any) => {
            const invNum = o.orderNumber || o.invoiceNumber || o.id;
            if (invNum && !existingInvoices.has(invNum)) {
              existingInvoices.add(invNum);
              list.unshift({
                invoiceNumber: invNum,
                date: o.createdAt || new Date().toISOString(),
                customerName: o.customerName || "Customer",
                customerPhone: o.phone || "",
                customer: {
                  name: o.customerName || "Customer",
                  phone: o.phone || "",
                  email: o.email || "",
                  address: typeof o.address === "object" ? `${o.address.address || ""}, ${o.address.city || ""}, ${o.address.state || ""} ${o.address.pincode || ""}` : (o.address || ""),
                  city: typeof o.address === "object" ? o.address.city : undefined,
                  state: typeof o.address === "object" ? o.address.state : undefined,
                  pincode: typeof o.address === "object" ? o.address.pincode : undefined,
                },
                items: (o.items || []).map((it: any) => ({
                  cartId: it.id || `it-${Date.now()}-${Math.random()}`,
                  productId: it.id || it.productId,
                  sku: it.sku || `SKU-${it.id || "SAREE"}`,
                  name: it.name || "Handcrafted SiCo Gadwal Saree",
                  categoryName: "SiCo Gadwal Sarees",
                  hsn: "5208",
                  color: it.color || "Standard",
                  colorSlug: (it.color || "standard").toLowerCase(),
                  unitPrice: Number(it.price || it.unitPrice) || 0,
                  qty: Number(it.quantity || it.qty) || 1,
                  maxStock: 10,
                })),
                subtotal: Number(o.subtotal) || 0,
                discount: Number(o.discount) || 0,
                cgst: 0,
                sgst: 0,
                total: Number(o.total) || 0,
                paymentMethod: (o.paymentMethod || "cash") as any,
              });
            }
          });
        }
      }
      return list;
    } catch { }
    return [];
  });

  const [customers, setCustomers] = useState<CustomerProfile[]>(() => {
    try {
      const list = getSavedCrmCustomers();
      if (list && list.length > 0) return list;
    } catch { }
    return MOCK_CUSTOMERS;
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

  const syncInventoryToStorefront = useCallback((inventoryList: Product[]) => {
    try {
      const storeProducts = (inventoryList || []).map((p: any) => {
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
          reviewCount: Number(p.reviewCount) || 28,
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

      safeStorageSet("rs_fashions_products", storeProducts);
      window.dispatchEvent(new Event("rs_inventory_updated"));
    } catch (e) {
      console.warn("Storefront sync notice:", e);
    }
  }, []);

  useEffect(() => {
    if (inventory && inventory.length > 0) {
      syncInventoryToStorefront(inventory);
    }
  }, [syncInventoryToStorefront]);

  const loadLiveBootstrap = useCallback(async (forceRefresh = false) => {
    try {
      const res = await fetch(`${API_BASE}/admin/bootstrap${forceRefresh ? "?refresh=true" : ""}`);
      if (!res.ok) return;
      const json = await res.json();
      const d = json?.data || json;
      if (d) {
        if (Array.isArray(d.categories) && d.categories.length > 0) setCategories(d.categories);
        if (Array.isArray(d.products) && d.products.length > 0) setInventory(d.products);
        if (Array.isArray(d.stockMovements)) setStockHistory(d.stockMovements);
        if (Array.isArray(d.sales)) setSalesHistory(d.sales);
        if (Array.isArray(d.customers) && d.customers.length > 0) {
          setCustomers((prev) => {
            const map = new Map<string, CustomerProfile>();
            prev.forEach((c) => map.set(c.id || c.phone, c));
            d.customers.forEach((c: CustomerProfile) => map.set(c.id || c.phone, c));
            const merged = Array.from(map.values());
            safeStorageSet("rs_admin_customers", merged);
            return merged;
          });
        }

        if (Array.isArray(d.categories) && d.categories.length > 0)
          safeStorageSet("rs_admin_categories", d.categories);
        if (Array.isArray(d.products) && d.products.length > 0) {
          safeStorageSet("rs_admin_inventory", d.products);
          syncInventoryToStorefront(d.products);
        }
        if (Array.isArray(d.stockMovements))
          safeStorageSet("rs_admin_stock_history", d.stockMovements);
        if (Array.isArray(d.sales)) safeStorageSet("rs_admin_sales_history", d.sales);

        const fulfillMap: Record<string, any> = {};
        if (Array.isArray(d.sales)) {
          d.sales.forEach((s: any) => {
            if (s.invoiceNumber) {
              fulfillMap[s.invoiceNumber] = {
                status:
                  s.orderStatus === "delivered"
                    ? "delivered"
                    : s.orderStatus === "shipped"
                      ? "shipped"
                      : "packaging",
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
          const sessRes = await fetch(`${API_BASE}/auth/sessions`);
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
        } catch (sessErr) {
          console.warn("Sessions fetch notice:", sessErr);
        }
      }
    } catch (err) {
      console.warn("Bootstrap sync notice:", err);
    }
  }, []);

  useEffect(() => {
    loadLiveBootstrap();
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

  function handleAddProduct(newProduct: Product, categoryId: string) {
    sound.playClick();
    setInventory((prev) => {
      const updated = [newProduct, ...prev];
      safeStorageSet("rs_admin_inventory", updated);
      syncInventoryToStorefront(updated);
      return updated;
    });
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
          note: "Initial catalogue intake",
        },
        ...prev,
      ]);
    });
    fetch(`${API_BASE}/catalog`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProduct),
    }).catch((err) => console.warn("Catalog sync error:", err));
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

    const bulkMovements: StockMovement[] = newProducts.flatMap((newProduct) =>
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
        note: "Bulk Stock Consignment Intake",
      }))
    );

    setInventory((prev) => {
      const updated = [...newProducts, ...prev];
      safeStorageSet("rs_admin_inventory", updated);
      syncInventoryToStorefront(updated);
      return updated;
    });
    setStockHistory((prev) => [...bulkMovements, ...prev]);

    fetch(`${API_BASE}/inventory/bulk-intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: newProducts, performer: user.name }),
    }).catch((err) => console.warn("Bulk intake sync error:", err));
  }

  function handleUpdateProduct(updatedProduct: Product) {
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

    setInventory((prev) => {
      const updated = prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
      safeStorageSet("rs_admin_inventory", updated);
      syncInventoryToStorefront(updated);
      return updated;
    });

    fetch(`${API_BASE}/catalog/${updatedProduct.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedProduct),
    }).catch((err) => console.warn("Catalog update error:", err));
  }

  function handleDeleteProduct(productId: string) {
    sound.playClick();
    setInventory((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      safeStorageSet("rs_admin_inventory", updated);
      syncInventoryToStorefront(updated);
      return updated;
    });

    fetch(`${API_BASE}/catalog/${productId}`, {
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

    productIds.forEach((id) => {
      fetch(`${API_BASE}/catalog/${id}`, {
        method: "DELETE",
      }).catch((err) => console.warn("Batch delete error:", err));
    });
  }

  function revokeDevice(id: string) {
    sound.playClick();
    setDevices((prev) => prev.filter((d) => d.id !== id && d.uuid !== id));
    fetch(`${API_BASE}/auth/sessions/${id}`, {
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

    fetch(`${API_BASE}/billing/checkout`, {
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

    fetch(`${API_BASE}/inventory/movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movement),
    })
      .then(() => loadLiveBootstrap())
      .catch((err) => console.warn("Movement sync error:", err));
  }

  function handleAddCustomer(newCustomer: CustomerProfile) {
    sound.playClick();
    setCustomers((prev) => {
      const updated = [
        newCustomer,
        ...prev.filter((c) => c.id !== newCustomer.id && c.phone !== newCustomer.phone),
      ];
      safeStorageSet("rs_admin_customers", updated);
      return updated;
    });
    fetch(`${API_BASE}/crm/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCustomer),
    }).catch((err) => console.warn("Customer sync error:", err));
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
        <div className="pointer-events-none absolute -top-48 -left-48 h-[650px] w-[650px] rounded-full bg-gradient-to-br from-[#EEDFD5]/60 via-[#E4CEBD]/30 to-transparent blur-3xl opacity-70" />
        <div className="pointer-events-none absolute -bottom-48 -right-48 h-[750px] w-[750px] rounded-full bg-gradient-to-tl from-[#E5D7E2]/50 via-[#F3EAE3]/40 to-transparent blur-3xl opacity-70" />

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
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-[#F7F2EB] p-1.5 shadow-[0_4px_16px_rgba(42,14,32,0.08)] border border-white">
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
          <div className="border-t border-stone-200/60 p-3.5 bg-gradient-to-t from-white/90 to-transparent">
            <div className="flex items-center justify-between rounded-2xl border border-stone-200/70 bg-white/80 p-2.5 shadow-xs backdrop-blur-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2A0E20] to-[#431534] font-serif text-xs font-bold text-amber-200 shadow-xs">
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
                              ? "Patron Book & Profiles"
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

              <button
                type="button"
                onClick={triggerRefresh}
                title="Synchronize store records (Ctrl + R)"
                className="group flex h-10 items-center justify-center gap-2 rounded-xl border border-stone-200/80 bg-white/80 px-3.5 text-xs font-bold text-stone-700 shadow-xs transition-all hover:border-[#D4A373] hover:bg-white hover:text-stone-900 active:scale-95"
              >
                <RotateCw
                  size={14}
                  className={`text-[#D4A373] transition-transform duration-500 ${isRefreshing ? "animate-spin" : "group-hover:rotate-180"
                    }`}
                />
                <span className="hidden md:inline">Sync</span>
              </button>

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