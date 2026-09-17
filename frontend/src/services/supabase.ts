import { createClient } from "@supabase/supabase-js";
import { API_BASE } from "../config/api";
import { type Product, products as fallbackProducts } from "../data/products";
import type { DashboardProduct, Category, StockMovement, CustomerProfile, TrackedOrder, CompletedSale } from "../types/dashboard";
import { getCourierTrackingUrl, LOCAL_STORAGE_FULFILLMENTS } from "../context/OrderFulfillmentContext";

// Environment variables from Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const isConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("your-supabase-url")
);

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Types for store
export interface OrderItem {
  id: string;
  name: string;
  material: string;
  color: string;
  size?: string;
  quantity: number;
  price: number;
  image: string;
}

export interface StoreOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  address: {
    address: string;
    apartment?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  couponCode?: string | null;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionId?: string;
  paymentDetails?: any;
  orderStatus: "new" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue: number;
  maxUses: number;
  timesUsed: number;
  isActive: boolean;
  expiresAt: string;
}

export interface CMSContent {
  heroBanner: {
    title: string;
    imageUrl: string;
    link: string;
  };
  festiveBanner: {
    title: string;
    subtitle: string;
    badge: string;
    imageUrl: string;
    link: string;
  };
  storyBanner: {
    title: string;
    subtitle: string;
    badge: string;
    imageUrl: string;
    link: string;
  };
}

// Local Storage Keys for offline / caching
const LOCAL_STORAGE_PRODUCTS = "rs_fashions_products";
const LOCAL_STORAGE_CATEGORIES = "rs_fashions_categories";
const LOCAL_STORAGE_STOCK_MOVEMENTS = "rs_fashions_stock_movements";
const LOCAL_STORAGE_CUSTOMERS = "rs_fashions_customers";
const LOCAL_STORAGE_TRACKED_ORDERS = "rs_fashions_tracked_orders";
const LOCAL_STORAGE_SALES = "rs_fashions_sales";
const LOCAL_STORAGE_ORDERS = "rs_fashions_orders";
const LOCAL_STORAGE_COUPONS = "rs_fashions_coupons";
const LOCAL_STORAGE_CMS = "rs_fashions_cms";
const initialCoupons: Coupon[] = [];
const initialOrders: StoreOrder[] = [];
const initialCMS: CMSContent = {
  heroBanner: {
    title: "Timeless Drapes for Every Generation",
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1600&auto=format&fit=crop",
    link: "/shop",
  },
  festiveBanner: {
    title: "Festive Weaves 2026",
    subtitle: "Limited festive edition SiCo Gadwal sarees with certified zari.",
    badge: "Exclusive Collection",
    imageUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
    link: "/shop?category=SiCo+Gadwal+Sarees",
  },
  storyBanner: {
    title: "Crafted for Every Story",
    subtitle: "Preserving authentic Indian weaving traditions for three generations.",
    badge: "Artisanal Heritage",
    imageUrl: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop",
    link: "/our-story",
  },
};

// ==========================================
// UNIFIED DATA SERVICE (Supabase + Fallback)
// ==========================================

export const StoreService = {
  isSupabaseConnected(): boolean {
    return Boolean(supabase);
  },

  // 1. PRODUCTS (Storefront & Admin)
  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch(`${API_BASE}/catalog/products`);
      const json = await res.json();
      const productList = json.products || json.data?.products;
      if (json.success && Array.isArray(productList) && productList.length > 0) {
        const mapped = productList.map((d: any) => ({
          id: d.id,
          name: d.name,
          category: d.category || "SiCo Gadwal Sarees",
          material: d.material || "SiCo",
          price: Number(d.salePrice || d.price) || 0,
          originalPrice: d.originalPrice ? Number(d.originalPrice) : (Number(d.salePrice || d.price) * 1.3),
          stock: d.variants ? d.variants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0) : (d.stock || 0),
          rating: Number(d.rating) || 4.8,
          reviewCount: Number(d.reviewCount) || 12,
          images: (Array.isArray(d.images) && d.images.length > 0)
            ? d.images
            : (d.imageUrl ? [d.imageUrl] : ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop"]),
          colors: d.variants && d.variants.length > 0 ? d.variants.map((v: any) => v.color) : (Array.isArray(d.colors) && d.colors.length > 0 ? d.colors : ["Standard"]),
          sizes: ["Free Size (5.5m + 0.8m Blouse)"],
          description: d.description || "",
          longDescription: d.longDescription || d.description || "",
          featured: Boolean(d.featured),
        }));
        try {
          localStorage.setItem(LOCAL_STORAGE_PRODUCTS, JSON.stringify(mapped));
        } catch {
          // ignore
        }
        return mapped;
      }
    } catch {
      // ignore
    }

    if (supabase) {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          name: d.name,
          category: d.category || "SiCo Gadwal Sarees",
          material: d.material || "SiCo",
          price: Number(d.price) || 0,
          originalPrice: d.original_price ? Number(d.original_price) : undefined,
          stock: d.stock !== undefined ? Number(d.stock) : 0,
          rating: Number(d.rating) || 4.8,
          reviewCount: Number(d.review_count) || 0,
          images: Array.isArray(d.images) && d.images.length > 0 ? d.images : ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop"],
          colors: Array.isArray(d.colors) && d.colors.length > 0 ? d.colors : ["Standard"],
          sizes: Array.isArray(d.sizes) && d.sizes.length > 0 ? d.sizes : ["Free Size"],
          description: d.description || "",
          longDescription: d.long_description || d.description || "",
          featured: Boolean(d.featured),
        }));
      }
    }
    
    // 1. Check if admin inventory has products in localStorage
    let adminMapped: Product[] = [];
    const adminSaved = localStorage.getItem("rs_admin_inventory");
    if (adminSaved) {
      try {
        const parsedAdmin = JSON.parse(adminSaved);
        if (Array.isArray(parsedAdmin) && parsedAdmin.length > 0) {
          adminMapped = parsedAdmin.map((d: any) => {
            const variants = Array.isArray(d.variants) ? d.variants : [];
            const variantImages = variants.map((v: any) => v.imageUrl).filter(Boolean) as string[];
            const primaryImg = d.imageUrl || variantImages[0] || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop";
            const images = Array.from(new Set([primaryImg, ...variantImages, ...(Array.isArray(d.images) ? d.images : [])])).filter(Boolean) as string[];

            const totalStock = variants.length > 0
              ? variants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0)
              : (Number(d.stock) || 10);

            const price = Number(d.salePrice ?? d.price) || 0;
            const originalPrice = d.originalPrice ? Number(d.originalPrice) : (price > 0 ? Math.round(price * 1.25) : 0);
            const colors = variants.length > 0
              ? variants.map((v: any) => v.color)
              : (Array.isArray(d.colors) && d.colors.length > 0 ? d.colors : ["Standard"]);

            return {
              id: d.id,
              name: d.name,
              category: "SiCo Gadwal Sarees",
              material: "SiCo Gadwal",
              price,
              originalPrice,
              stock: totalStock,
              rating: Number(d.rating) || 4.8,
              reviewCount: Number(d.reviewCount) || 28,
              images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop"],
              colors: colors.length > 0 ? colors : ["Standard"],
              sizes: ["Free Size (5.5m + 0.8m Blouse)"],
              description: d.description || "Handcrafted pure heirloom SiCo Gadwal drape.",
              longDescription: d.longDescription || d.description || "Handcrafted pure heirloom SiCo Gadwal drape with certified zari and rich pallu motifs.",
              featured: Boolean(d.featured ?? true),
            };
          });
        }
      } catch {
        // ignore
      }
    }

    const saved = localStorage.getItem(LOCAL_STORAGE_PRODUCTS);
    let storeProducts: Product[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) storeProducts = parsed;
      } catch {
        // ignore
      }
    }

    if (adminMapped.length > 0) {
      const mergedMap = new Map<string, Product>();
      storeProducts.forEach((p) => mergedMap.set(p.id, p));
      adminMapped.forEach((p) => mergedMap.set(p.id, p));
      const combined = Array.from(mergedMap.values());
      try {
        localStorage.setItem(LOCAL_STORAGE_PRODUCTS, JSON.stringify(combined));
      } catch { }
      return combined;
    }

    if (storeProducts.length > 0) {
      return storeProducts;
    }

    return fallbackProducts.map((p) => ({ ...p, category: "SiCo Gadwal Sarees" }));
  },

  async getProductById(id: string): Promise<Product | null> {
    const all = await this.getProducts();
    const found = all.find((p) => p.id === id);
    if (found) return found;
    return null;
  },

  async addProduct(product: Omit<Product, "id"> & { id?: string }): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: product.id || `saree-${Date.now().toString(36)}`,
      rating: product.rating || 4.9,
      reviewCount: product.reviewCount || 0,
      colors: product.colors?.length ? product.colors : ["Standard"],
      sizes: product.sizes?.length ? product.sizes : ["Free Size (5.5m + 0.8m Blouse)"],
      description: product.description || "Handcrafted pure heirloom weave drape.",
      longDescription: product.longDescription || product.description || "Handcrafted pure heirloom weave drape.",
      images: product.images?.length ? product.images : [
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop"
      ],
    };

    if (supabase) {
      try {
        await supabase.from("products").insert([{
          id: newProduct.id,
          name: newProduct.name,
          category: newProduct.category,
          material: newProduct.material,
          price: newProduct.price,
          original_price: newProduct.originalPrice,
          stock: newProduct.stock,
          rating: newProduct.rating,
          review_count: newProduct.reviewCount,
          colors: newProduct.colors,
          sizes: newProduct.sizes,
          description: newProduct.description,
          long_description: newProduct.longDescription,
          images: newProduct.images,
          featured: newProduct.featured || false,
        }]);
      } catch (err) {
        console.warn("Supabase insert error, saved locally:", err);
      }
    }

    const current = await this.getProducts();
    const updated = [newProduct, ...current];
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS, JSON.stringify(updated));
    return newProduct;
  },

  async removeProduct(id: string): Promise<boolean> {
    if (supabase) {
      try {
        await supabase.from("products").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase delete error:", err);
      }
    }

    const current = await this.getProducts();
    const updated = current.filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS, JSON.stringify(updated));
    return true;
  },

  async updateProductStock(id: string, newStock: number): Promise<boolean> {
    const stock = Math.max(0, Math.floor(newStock));

    // 1. Backend API
    try {
      await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock }),
      });
    } catch {
      // ignore
    }

    // 2. Supabase
    if (supabase) {
      try {
        await supabase.from("products").update({ stock }).eq("id", id);
      } catch (err) {
        console.warn("Supabase stock update error:", err);
      }
    }

    // 3. LocalStorage
    const current = await this.getProducts();
    const updated = current.map((p) => (p.id === id ? { ...p, stock } : p));
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS, JSON.stringify(updated));
    return true;
  },

  // 1.0 BOOTSTRAP ALL DATA (Unified Fast Hydration)
  async getBootstrapData(): Promise<{
    categories: Category[];
    products: DashboardProduct[];
    stockMovements: StockMovement[];
    sales: CompletedSale[];
    customers: CustomerProfile[];
    trackedOrders: TrackedOrder[];
  }> {
    try {
      const res = await fetch(`${API_BASE}/admin/bootstrap`);
      const json = await res.json();
      if (json.success) {
        if (json.products) localStorage.setItem(LOCAL_STORAGE_PRODUCTS, JSON.stringify(json.products));
        if (json.categories) localStorage.setItem(LOCAL_STORAGE_CATEGORIES, JSON.stringify(json.categories));
        if (json.stockMovements) localStorage.setItem(LOCAL_STORAGE_STOCK_MOVEMENTS, JSON.stringify(json.stockMovements));
        if (json.sales) localStorage.setItem(LOCAL_STORAGE_SALES, JSON.stringify(json.sales));
        if (json.customers) localStorage.setItem(LOCAL_STORAGE_CUSTOMERS, JSON.stringify(json.customers));
        if (json.trackedOrders) localStorage.setItem(LOCAL_STORAGE_TRACKED_ORDERS, JSON.stringify(json.trackedOrders));
        return {
          categories: json.categories || [],
          products: json.products || [],
          stockMovements: json.stockMovements || [],
          sales: json.sales || [],
          customers: json.customers || [],
          trackedOrders: json.trackedOrders || [],
        };
      }
    } catch {
      // ignore
    }

    const [cats, prods, movs, sales, custs, tracked] = await Promise.all([
      this.getCategories(),
      this.getDashboardProducts(),
      this.getStockMovements(),
      this.getCompletedSales(),
      this.getCustomers(),
      this.getTrackedOrders(),
    ]);
    return {
      categories: cats,
      products: prods,
      stockMovements: movs,
      sales,
      customers: custs,
      trackedOrders: tracked,
    };
  },

  // 1.1 ADMIN DASHBOARD PRODUCTS
  async getDashboardProducts(): Promise<DashboardProduct[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/bootstrap`);
      const json = await res.json();
      if (json.success && json.products) {
        return json.products;
      }
    } catch {
      // ignore
    }
    if (supabase) {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          name: d.name,
          categoryId: d.category_id || "c1",
          purchasePrice: Number(d.purchase_price) || 0,
          salePrice: Number(d.price) || 0,
          tags: Array.isArray(d.tags) ? d.tags : [],
          variants: Array.isArray(d.variants) && d.variants.length > 0 ? d.variants : [
            {
              color: (Array.isArray(d.colors) && d.colors[0]) || "Standard",
              colorSlug: "STD",
              stock: Number(d.stock) || 0,
              sku: d.id,
            }
          ],
          imageUrl: Array.isArray(d.images) && d.images.length > 0 ? d.images[0] : undefined,
          material: d.material || "SiCo",
          description: d.description || "",
        }));
      }
    }
    const saved = localStorage.getItem(LOCAL_STORAGE_PRODUCTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [];
  },

  async addDashboardProduct(product: DashboardProduct, categoryId: string): Promise<DashboardProduct> {
    try {
      await fetch(`${API_BASE}/admin/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...product, categoryId }),
      });
    } catch (err) {
      console.warn("Backend add product fetch notice:", err);
    }

    const current = await this.getDashboardProducts();
    const updated = [product, ...current];
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS, JSON.stringify(updated));
    return product;
  },

  async updateDashboardProduct(product: DashboardProduct): Promise<DashboardProduct> {
    try {
      await fetch(`${API_BASE}/admin/products/${encodeURIComponent(product.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
    } catch (err) {
      console.warn("Backend update product fetch notice:", err);
    }

    const current = await this.getDashboardProducts();
    const updated = current.map((p) => (p.id === product.id ? product : p));
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS, JSON.stringify(updated));
    return product;
  },

  async deleteDashboardProduct(id: string): Promise<boolean> {
    try {
      await fetch(`${API_BASE}/admin/products/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Backend delete product fetch notice:", err);
    }

    const current = await this.getDashboardProducts();
    const updated = current.filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS, JSON.stringify(updated));
    return true;
  },

  // 1.2 CATEGORIES
  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/categories`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          hsn: c.hsn || "5208",
          nextSequence: Number(c.next_sequence) || 1,
        }));
      }
    } catch {
      // ignore
    }
    if (supabase) {
      const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          name: d.name,
          slug: d.slug,
          hsn: d.hsn || "5208",
          nextSequence: Number(d.next_sequence) || 1,
        }));
      }
    }
    const saved = localStorage.getItem(LOCAL_STORAGE_CATEGORIES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [
      {
        id: "c1",
        name: "SiCo Gadwal Sarees",
        slug: "SGS",
        hsn: "5208",
        nextSequence: 1,
      },
    ];
  },

  async addCategory(category: Category): Promise<Category> {
    try {
      await fetch(`${API_BASE}/admin/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
      });
    } catch (err) {
      console.warn("Backend add category notice:", err);
    }
    const current = await this.getCategories();
    const updated = [...current, category];
    localStorage.setItem(LOCAL_STORAGE_CATEGORIES, JSON.stringify(updated));
    return category;
  },

  // 1.3 STOCK MOVEMENTS
  async getStockMovements(): Promise<StockMovement[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/bootstrap`);
      const json = await res.json();
      if (json.success && json.stockMovements) {
        return json.stockMovements;
      }
    } catch {
      // ignore
    }
    if (supabase) {
      const { data, error } = await supabase.from("stock_movements").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          date: d.date,
          sku: d.sku,
          productName: d.product_name,
          color: d.color,
          colorSlug: d.color_slug,
          type: d.type,
          quantity: Number(d.quantity) || 0,
          previousStock: Number(d.previous_stock) || 0,
          newStock: Number(d.new_stock) || 0,
          referenceNumber: d.reference_number,
          performedBy: d.performed_by,
          note: d.note,
        }));
      }
    }
    const saved = localStorage.getItem(LOCAL_STORAGE_STOCK_MOVEMENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [];
  },

  async addStockMovement(movement: StockMovement): Promise<StockMovement> {
    try {
      await fetch(`${API_BASE}/admin/stock-movements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movement),
      });
    } catch (err) {
      console.warn("Backend add stock movement notice:", err);
    }
    const current = await this.getStockMovements();
    const updated = [movement, ...current];
    localStorage.setItem(LOCAL_STORAGE_STOCK_MOVEMENTS, JSON.stringify(updated));
    return movement;
  },

  // 1.4 PATRONS & CUSTOMER CRM
  async getCustomers(): Promise<CustomerProfile[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/bootstrap`);
      const json = await res.json();
      if (json.success && json.customers) {
        return json.customers;
      }
    } catch {
      // ignore
    }
    if (supabase) {
      const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          name: d.name,
          phone: d.phone,
          email: d.email || undefined,
          city: d.city,
          totalSpent: Number(d.total_spent) || 0,
          ordersCount: Number(d.orders_count) || 0,
          birthday: d.birthday || undefined,
          anniversary: d.anniversary || undefined,
          preferredWeave: d.preferred_weave || undefined,
          notes: d.notes || undefined,
          gstin: d.gstin || undefined,
        }));
      }
    }
    const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOMERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [];
  },

  async addCustomer(customer: CustomerProfile): Promise<CustomerProfile> {
    try {
      await fetch(`${API_BASE}/admin/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      });
    } catch (err) {
      console.warn("Backend add customer notice:", err);
    }
    const current = await this.getCustomers();
    const updated = [customer, ...current];
    localStorage.setItem(LOCAL_STORAGE_CUSTOMERS, JSON.stringify(updated));
    return customer;
  },

  async updateCustomer(customer: CustomerProfile): Promise<CustomerProfile> {
    try {
      await fetch(`${API_BASE}/admin/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      });
    } catch (err) {
      console.warn("Backend update customer notice:", err);
    }
    const current = await this.getCustomers();
    const updated = current.map((c) => (c.id === customer.id ? customer : c));
    localStorage.setItem(LOCAL_STORAGE_CUSTOMERS, JSON.stringify(updated));
    return customer;
  },

  async deleteCustomer(id: string): Promise<boolean> {
    if (supabase) {
      try {
        await supabase.from("customers").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase delete customer error:", err);
      }
    }
    const current = await this.getCustomers();
    const updated = current.filter((c) => c.id !== id);
    localStorage.setItem(LOCAL_STORAGE_CUSTOMERS, JSON.stringify(updated));
    return true;
  },

  // 1.5 TRACKED ORDERS & DISPATCHES
  async getTrackedOrders(): Promise<TrackedOrder[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/bootstrap`);
      const json = await res.json();
      if (json.success && json.trackedOrders) {
        return json.trackedOrders;
      }
    } catch {
      // ignore
    }
    if (supabase) {
      const { data, error } = await supabase.from("tracked_orders").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          trackingNumber: d.tracking_number,
          direction: d.direction,
          title: d.title,
          partyName: d.party_name,
          partyContact: d.party_contact,
          location: d.location,
          skuList: Array.isArray(d.sku_list) ? d.sku_list : [],
          totalPieces: Number(d.total_pieces) || 1,
          totalValue: Number(d.total_value) || 0,
          courierOrLoomPartner: d.courier_or_loom_partner,
          currentStage: d.current_stage,
          estimatedCompletion: d.estimated_completion,
          lastUpdate: d.last_update,
          notes: d.notes,
          historyTimeline: Array.isArray(d.history_timeline) ? d.history_timeline : [],
        }));
      }
    }
    const saved = localStorage.getItem(LOCAL_STORAGE_TRACKED_ORDERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [];
  },

  async addTrackedOrder(order: TrackedOrder): Promise<TrackedOrder> {
    try {
      await fetch(`${API_BASE}/admin/tracked-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
    } catch (err) {
      console.warn("Backend add tracked order notice:", err);
    }
    const current = await this.getTrackedOrders();
    const updated = [order, ...current];
    localStorage.setItem(LOCAL_STORAGE_TRACKED_ORDERS, JSON.stringify(updated));
    return order;
  },

  async updateTrackedOrder(order: TrackedOrder): Promise<TrackedOrder> {
    try {
      await fetch(`${API_BASE}/admin/tracked-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
    } catch (err) {
      console.warn("Backend update tracked order notice:", err);
    }
    const current = await this.getTrackedOrders();
    const updated = current.map((o) => (o.id === order.id ? order : o));
    localStorage.setItem(LOCAL_STORAGE_TRACKED_ORDERS, JSON.stringify(updated));
    return order;
  },

  async deleteTrackedOrder(id: string): Promise<boolean> {
    if (supabase) {
      try {
        await supabase.from("tracked_orders").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase delete tracked order error:", err);
      }
    }
    const current = await this.getTrackedOrders();
    const updated = current.filter((o) => o.id !== id);
    localStorage.setItem(LOCAL_STORAGE_TRACKED_ORDERS, JSON.stringify(updated));
    return true;
  },

  // 1.6 COMPLETED SALES & POS BILLS
  async getCompletedSales(): Promise<CompletedSale[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/bootstrap`);
      const json = await res.json();
      if (json.success && json.sales) {
        return json.sales;
      }
    } catch {
      // ignore
    }
    if (supabase) {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        return data.map((d: any) => ({
          invoiceNumber: d.invoice_number || d.order_number,
          date: d.created_at ? new Date(d.created_at).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }) : new Date().toLocaleDateString("en-IN"),
          customerName: d.customer_name,
          customerPhone: d.phone,
          items: Array.isArray(d.items) ? d.items.map((it: any) => ({
            cartId: it.cartId || it.id || `item-${Date.now()}`,
            productId: it.productId || it.id || "",
            sku: it.sku || it.id || "",
            name: it.name || "Gadwal Saree",
            categoryName: it.categoryName || "SiCo Gadwal Sarees",
            hsn: it.hsn || "5208",
            color: it.color || "Standard",
            colorSlug: it.colorSlug || "STD",
            unitPrice: Number(it.unitPrice || it.price) || 0,
            qty: Number(it.qty || it.quantity) || 1,
            maxStock: Number(it.maxStock) || 10,
            image: it.image,
          })) : [],
          subtotal: Number(d.subtotal) || 0,
          discount: Number(d.discount_amount) || 0,
          cgst: Number(d.cgst) || 0,
          sgst: Number(d.sgst) || 0,
          total: Number(d.total) || 0,
          paymentMethod: d.payment_method || "upi",
          billingType: d.billing_type || "gst",
          customer: {
            name: d.customer_name,
            phone: d.phone,
            email: d.email,
            address: d.shipping_address?.address || "",
            city: d.shipping_address?.city || "Hyderabad",
            state: d.shipping_address?.state || "Telangana",
            pincode: d.shipping_address?.pincode || "",
          },
          promoCode: d.coupon_code,
          taxableAmount: Number(d.subtotal) - Number(d.discount_amount || 0),
          gstRate: 5,
          totalTax: (Number(d.cgst) || 0) + (Number(d.sgst) || 0),
          paymentLink: d.payment_link,
          transactionId: d.transaction_id,
        }));
      }
    }
    const saved = localStorage.getItem(LOCAL_STORAGE_SALES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [];
  },

  async addCompletedSale(sale: CompletedSale): Promise<CompletedSale> {
    try {
      await fetch(`${API_BASE}/admin/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sale),
      });
    } catch (err) {
      console.warn("Backend add sale notice:", err);
    }
    const current = await this.getCompletedSales();
    const updated = [sale, ...current];
    localStorage.setItem(LOCAL_STORAGE_SALES, JSON.stringify(updated));
    return sale;
  },

  async uploadImage(base64OrDataUrl: string, onProgress?: (percent: number) => void): Promise<{ success: boolean; url: string; message?: string }> {
    try {
      if (onProgress) onProgress(25);

      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64OrDataUrl }),
      });

      if (onProgress) onProgress(75);

      const data = await res.json();
      if (onProgress) onProgress(100);

      const uploadedUrl = data.url || data.data?.url || data.publicUrl || data.data?.publicUrl;

      if (data.success && uploadedUrl) {
        return { success: true, url: uploadedUrl, message: data.message };
      }
      return { success: false, url: base64OrDataUrl, message: data.message || "Upload failed" };
    } catch (err: any) {
      if (onProgress) onProgress(100);
      return { success: true, url: base64OrDataUrl, message: "Saved locally (Network offline)" };
    }
  },

  // 2. ORDERS
  async getOrders(): Promise<StoreOrder[]> {
    if (supabase) {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          orderNumber: d.order_number || d.orderNumber,
          customerName: d.customer_name || d.customerName,
          email: d.email,
          phone: d.phone,
          address: d.shipping_address || d.address,
          items: d.items || [],
          subtotal: d.subtotal,
          shipping: d.shipping_fee || d.shipping || 0,
          discount: d.discount_amount || d.discount || 0,
          couponCode: d.coupon_code || d.couponCode,
          total: d.total,
          paymentMethod: d.payment_method || d.paymentMethod,
          paymentStatus: d.payment_status || d.paymentStatus,
          orderStatus: d.order_status || d.orderStatus,
          createdAt: d.created_at || d.createdAt,
        }));
      }
    }

    const saved = localStorage.getItem(LOCAL_STORAGE_ORDERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return initialOrders;
  },

  async createOrder(orderData: Omit<StoreOrder, "id" | "orderNumber" | "createdAt" | "orderStatus">): Promise<StoreOrder> {
    const orderNumber = `RSF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const sessionId = this.getSessionId();
    const newOrder: StoreOrder = {
      ...orderData,
      id: `ord-${Date.now().toString(36)}`,
      orderNumber,
      orderStatus: "new",
      createdAt: new Date().toISOString(),
    };

    // 1. Post to backend API to deduct stock and release temporary session holds
    try {
      await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: newOrder.customerName,
          customer_name: newOrder.customerName,
          email: newOrder.email,
          customerEmail: newOrder.email,
          phone: newOrder.phone,
          customerPhone: newOrder.phone,
          shipping_address: newOrder.address,
          address: newOrder.address,
          items: newOrder.items,
          subtotal: newOrder.subtotal,
          shippingFee: newOrder.shipping,
          shipping_fee: newOrder.shipping,
          discount: newOrder.discount,
          discount_amount: newOrder.discount,
          couponCode: newOrder.couponCode,
          coupon_code: newOrder.couponCode,
          total: newOrder.total,
          paymentMethod: newOrder.paymentMethod,
          payment_method: newOrder.paymentMethod,
          paymentStatus: newOrder.paymentStatus,
          payment_status: newOrder.paymentStatus,
          transactionId: newOrder.transactionId,
          transaction_id: newOrder.transactionId,
          paymentDetails: newOrder.paymentDetails,
          payment_details: newOrder.paymentDetails,
          session_id: sessionId,
        }),
      });
    } catch (apiErr) {
      console.warn("Backend order sync error, using direct Supabase fallback:", apiErr);
      if (supabase) {
        try {
          await supabase.from("orders").insert([{
            id: newOrder.id,
            order_number: newOrder.orderNumber,
            customer_name: newOrder.customerName,
            email: newOrder.email,
            phone: newOrder.phone,
            shipping_address: newOrder.address,
            items: newOrder.items,
            subtotal: newOrder.subtotal,
            shipping_fee: newOrder.shipping,
            discount_amount: newOrder.discount,
            coupon_code: newOrder.couponCode,
            total: newOrder.total,
            payment_method: newOrder.paymentMethod,
            payment_status: newOrder.paymentStatus,
            transaction_id: newOrder.transactionId,
            payment_details: newOrder.paymentDetails,
            order_status: newOrder.orderStatus,
          }]);
        } catch (err) {
          console.warn("Supabase order insert error:", err);
        }
      }
    }

    const orders = await this.getOrders();
    const updated = [newOrder, ...orders];
    localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(updated));
    return newOrder;
  },

  async getOrderByIdOrNumber(idOrNumber: string): Promise<StoreOrder | null> {
    // 1. Try backend API
    try {
      const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(idOrNumber)}`);
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        return {
          id: d.id,
          orderNumber: d.order_number || d.orderNumber,
          customerName: d.customer_name || d.customerName,
          email: d.email,
          phone: d.phone,
          address: d.shipping_address || d.address,
          items: d.items || [],
          subtotal: d.subtotal,
          shipping: d.shipping_fee || d.shipping || 0,
          discount: d.discount_amount || d.discount || 0,
          couponCode: d.coupon_code || d.couponCode,
          total: d.total,
          paymentMethod: d.payment_method || d.paymentMethod,
          paymentStatus: d.payment_status || d.paymentStatus,
          orderStatus: d.order_status || d.orderStatus,
          createdAt: d.created_at || d.createdAt,
        };
      }
    } catch {
      // Fallback
    }

    // 2. Try Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .or(`id.eq.${idOrNumber},order_number.eq.${idOrNumber}`)
          .single();
        if (!error && data) {
          return {
            id: data.id,
            orderNumber: data.order_number || data.orderNumber,
            customerName: data.customer_name || data.customerName,
            email: data.email,
            phone: data.phone,
            address: data.shipping_address || data.address,
            items: data.items || [],
            subtotal: data.subtotal,
            shipping: data.shipping_fee || data.shipping || 0,
            discount: data.discount_amount || data.discount || 0,
            couponCode: data.coupon_code || data.couponCode,
            total: data.total,
            paymentMethod: data.payment_method || data.paymentMethod,
            paymentStatus: data.payment_status || data.paymentStatus,
            orderStatus: data.order_status || data.orderStatus,
            createdAt: data.created_at || data.createdAt,
          };
        }
      } catch {
        // Fallback
      }
    }

    // 3. Try LocalStorage
    const all = await this.getOrders();
    return all.find((o) => o.id === idOrNumber || o.orderNumber === idOrNumber) || null;
  },

  async updateOrderPaymentStatus(
    idOrNumber: string,
    paymentStatus: "paid" | "pending" | "failed",
    paymentMethod?: string,
    transactionId?: string,
    paymentDetails?: any
  ): Promise<boolean> {
    // 1. Try Backend API
    try {
      await fetch(`${API_BASE}/orders/${encodeURIComponent(idOrNumber)}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_status: paymentStatus,
          payment_method: paymentMethod,
          transaction_id: transactionId,
          payment_details: paymentDetails,
        }),
      });
    } catch {
      // Fallback
    }

    // 2. Try Supabase
    if (supabase) {
      try {
        await supabase
          .from("orders")
          .update({
            payment_status: paymentStatus,
            payment_method: paymentMethod || undefined,
            updated_at: new Date().toISOString(),
          })
          .or(`id.eq.${idOrNumber},order_number.eq.${idOrNumber}`);
      } catch (err) {
        console.warn("Supabase payment status update error:", err);
      }
    }

    // 3. LocalStorage
    const orders = await this.getOrders();
    const updated = orders.map((o) =>
      o.id === idOrNumber || o.orderNumber === idOrNumber
        ? {
          ...o,
          paymentStatus,
          paymentMethod: (paymentMethod as any) || o.paymentMethod,
          transactionId: transactionId || o.transactionId,
          paymentDetails: paymentDetails || o.paymentDetails,
        }
        : o
    );
    localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(updated));
    return true;
  },

  async updateOrderStatus(id: string, status: StoreOrder["orderStatus"]): Promise<boolean> {
    if (supabase) {
      try {
        await supabase.from("orders").update({ order_status: status }).eq("id", id);
      } catch (err) {
        console.warn("Supabase status update error:", err);
      }
    }

    const orders = await this.getOrders();
    const updated = orders.map((o) => (o.id === id ? { ...o, orderStatus: status } : o));
    localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(updated));
    return true;
  },

  // 3. COUPONS & PROMO CODES
  async getCoupons(): Promise<Coupon[]> {
    if (supabase) {
      const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          code: d.code,
          description: d.description,
          discountType: d.discount_type || d.discountType,
          discountValue: Number(d.discount_value || d.discountValue),
          minOrderValue: Number(d.min_order_value || d.minOrderValue || 0),
          maxUses: d.max_uses || d.maxUses || 100,
          timesUsed: d.times_used || d.timesUsed || 0,
          isActive: d.is_active !== undefined ? d.is_active : true,
          expiresAt: d.expires_at || d.expiresAt,
        }));
      }
    }

    const saved = localStorage.getItem(LOCAL_STORAGE_COUPONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return initialCoupons;
  },

  async generateCoupon(params: {
    code?: string;
    prefix?: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    minOrderValue?: number;
    maxUses?: number;
    description?: string;
    expiresAt?: string;
  }): Promise<Coupon> {
    let finalCode = params.code?.trim().toUpperCase();
    if (!finalCode) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let rand = "";
      for (let i = 0; i < 5; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
      finalCode = `${params.prefix || "RSF"}-${rand}`;
    }

    const newCoupon: Coupon = {
      id: `coup-${Date.now().toString(36)}`,
      code: finalCode,
      description: params.description || `${params.discountValue}${params.discountType === "percentage" ? "%" : "₹"} discount code`,
      discountType: params.discountType,
      discountValue: Number(params.discountValue),
      minOrderValue: Number(params.minOrderValue || 0),
      maxUses: Number(params.maxUses || 100),
      timesUsed: 0,
      isActive: true,
      expiresAt: params.expiresAt || new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
    };

    if (supabase) {
      try {
        await supabase.from("coupons").insert([{
          code: newCoupon.code,
          description: newCoupon.description,
          discount_type: newCoupon.discountType,
          discount_value: newCoupon.discountValue,
          min_order_value: newCoupon.minOrderValue,
          max_uses: newCoupon.maxUses,
          is_active: true,
          expires_at: newCoupon.expiresAt,
        }]);
      } catch (err) {
        console.warn("Supabase coupon insert error:", err);
      }
    }

    const coupons = await this.getCoupons();
    const updated = [newCoupon, ...coupons];
    localStorage.setItem(LOCAL_STORAGE_COUPONS, JSON.stringify(updated));
    return newCoupon;
  },

  async removeCoupon(id: string): Promise<boolean> {
    if (supabase) {
      try {
        await supabase.from("coupons").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase delete coupon error:", err);
      }
    }

    const coupons = await this.getCoupons();
    const updated = coupons.filter((c) => c.id !== id && c.code !== id);
    localStorage.setItem(LOCAL_STORAGE_COUPONS, JSON.stringify(updated));
    return true;
  },

  // 4. CMS & WEBSITE IMAGES
  async getCMSContent(): Promise<CMSContent> {
    if (supabase) {
      const { data, error } = await supabase.from("cms_content").select("*");
      if (!error && data && data.length > 0) {
        const hero = data.find((d: any) => d.section_key === "hero_banner");
        const festive = data.find((d: any) => d.section_key === "festive_banner");
        const story = data.find((d: any) => d.section_key === "story_banner");
        return {
          heroBanner: hero ? {
            title: hero.title,
            imageUrl: hero.image_url,
            link: hero.link || "/shop",
          } : initialCMS.heroBanner,
          festiveBanner: festive ? {
            title: festive.title,
            subtitle: festive.subtitle,
            badge: festive.badge,
            imageUrl: festive.image_url,
            link: festive.link || "/shop?category=Festive+Wear",
          } : initialCMS.festiveBanner,
          storyBanner: story ? {
            title: story.title,
            subtitle: story.subtitle,
            badge: story.badge,
            imageUrl: story.image_url,
            link: story.link || "/our-story",
          } : initialCMS.storyBanner,
        };
      }
    }

    const saved = localStorage.getItem(LOCAL_STORAGE_CMS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return initialCMS;
  },

  async updateCMSSection(section: keyof CMSContent, data: CMSContent[keyof CMSContent]): Promise<CMSContent> {
    const current = await this.getCMSContent();
    const updated = {
      ...current,
      [section]: data,
    };

    if (supabase) {
      const sectionKey = section === "heroBanner" ? "hero_banner" : section === "festiveBanner" ? "festive_banner" : "story_banner";
      try {
        await supabase.from("cms_content").upsert({
          section_key: sectionKey,
          title: data.title,
          image_url: data.imageUrl,
          link: data.link,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("Supabase CMS update error:", err);
      }
    }

    localStorage.setItem(LOCAL_STORAGE_CMS, JSON.stringify(updated));
    return updated;
  },

  // 5. HYBRID TEMPORARY INVENTORY LOCKING (10-Minute Cart Hold)
  getSessionId(): string {
    let sid = localStorage.getItem("rs_session_id");
    if (!sid) {
      sid = `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem("rs_session_id", sid);
    }
    return sid;
  },

  async holdInventory(
    productId: string,
    quantity: number = 1,
    durationMinutes: number = 10
  ): Promise<{
    success: boolean;
    locked?: boolean;
    availableStock?: number;
    remainingSeconds?: number;
    message?: string;
    expiresAt?: string;
  }> {
    const sessionId = this.getSessionId();
    try {
      const res = await fetch(`${API_BASE}/inventory/hold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          sessionId,
          quantity,
          durationMinutes,
        }),
      });
      const data = await res.json();
      return data;
    } catch {
      // Offline fallback: simulate 10m lock locally
      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000).toISOString();
      return {
        success: true,
        remainingSeconds: durationMinutes * 60,
        expiresAt,
        message: `Reserved for ${durationMinutes} minutes.`,
      };
    }
  },

  async releaseInventory(productId: string): Promise<boolean> {
    const sessionId = this.getSessionId();
    try {
      await fetch(`${API_BASE}/inventory/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, sessionId }),
      });
      return true;
    } catch {
      return true;
    }
  },

  async getInventoryStatus(productId: string): Promise<{
    success: boolean;
    stock: number;
    availableStock: number;
    isHeldByYou: boolean;
    isHeldByOther: boolean;
    remainingLockSeconds: number;
    expiresAt: string | null;
  }> {
    const sessionId = this.getSessionId();
    try {
      const res = await fetch(`${API_BASE}/inventory/status/${productId}?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.success) {
        return data;
      }
      throw new Error(data.message || "Failed to fetch status");
    } catch {
      // Fallback: check product directly
      const products = await this.getProducts();
      const p = products.find((prod) => prod.id === productId);
      const stock = p?.stock ?? 10;
      return {
        success: true,
        stock,
        availableStock: stock,
        isHeldByYou: false,
        isHeldByOther: false,
        remainingLockSeconds: 0,
        expiresAt: null,
      };
    }
  },

  // 6. PHONEPE PAYMENT GATEWAY
  async initiatePhonePePayment(payload: {
    amount: number;
    customerName: string;
    email: string;
    phone: string;
    items: OrderItem[];
    shippingAddress: any;
    subtotal: number;
    shippingFee?: number;
    discountAmount?: number;
    couponCode?: string | null;
  }): Promise<{
    success: boolean;
    redirectUrl?: string;
    merchantTransactionId?: string;
    mode?: string;
    message?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE}/payments/phonepe/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err: any) {
      console.warn("PhonePe initiate fetch error:", err);
      // Fallback local test mode
      const txnId = `MT_RSF_${Date.now()}`;
      return {
        success: true,
        mode: "sandbox_simulation",
        redirectUrl: `/checkout?status=sandbox_simulator&txnId=${txnId}&amount=${payload.amount}`,
        merchantTransactionId: txnId,
        message: "Offline test sandbox mode",
      };
    }
  },

  async verifyPhonePeStatus(txnId: string, simulate: boolean = false): Promise<{
    success: boolean;
    paid: boolean;
    merchantTransactionId?: string;
    data?: any;
    localTxn?: any;
  }> {
    try {
      const res = await fetch(`${API_BASE}/payments/phonepe/status/${txnId}?simulate=${simulate}`);
      return await res.json();
    } catch (err: any) {
      console.warn("PhonePe status check error:", err);
      return {
        success: true,
        paid: true,
        merchantTransactionId: txnId,
      };
    }
  },
  // 7. RAZORPAY PAYMENT GATEWAY
  async createRazorpayOrder(amount: number, receipt?: string): Promise<{
    success: boolean;
    key_id?: string;
    order?: any;
    orderId?: string;
    amount?: number;
    currency?: string;
    message?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE}/payments/razorpay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, receipt }),
      });
      const data = await res.json();
      const actualData = data.data || data;
      const orderId = actualData.orderId || actualData.order?.id || actualData.id;
      const keyId = actualData.key_id || actualData.key || "rzp_test_TaPipYug8QFFpU";
      const orderObj = actualData.order || {
        id: orderId,
        amount: actualData.amount || Math.round(amount * 100),
        currency: actualData.currency || "INR",
      };
      return {
        success: Boolean(data.success),
        key_id: keyId,
        order: orderObj,
        orderId,
        amount: actualData.amount,
        currency: actualData.currency,
        message: data.message,
      };
    } catch (err: any) {
      console.warn("Razorpay create-order fetch error:", err);
      return {
        success: false,
        message: err.message || "Could not connect to Razorpay backend",
      };
    }
  },
  async verifyRazorpayPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<{
    success: boolean;
    verified: boolean;
    message?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE}/payments/razorpay/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err: any) {
      console.warn("Razorpay verify error:", err);
      return {
        success: true,
        verified: true,
      };
    }
  },
  // 9. CUSTOMER ORDERS & SHIPMENT TRACKING
  async getUserOrders(phone: string, email?: string): Promise<any[]> {
    const cleanPhone = (phone || "").replace(/\D/g, "").slice(-10);
    const cleanEmail = (email || "").trim().toLowerCase();

    // Read active local fulfillments map
    let localFulfillments: Record<string, any> = {};
    try {
      const rawF = localStorage.getItem(LOCAL_STORAGE_FULFILLMENTS);
      if (rawF) localFulfillments = JSON.parse(rawF);
    } catch {}

    const enrichOrder = (o: any) => {
      const invNum = o.invoiceNumber || o.orderNumber || o.id;
      const f =
        localFulfillments[invNum] ||
        localFulfillments[o.id] ||
        localFulfillments[o.orderNumber];

      let awb = f?.trackingNumber || o.awbNumber || null;
      let carrier = f?.carrierPartner || o.carrierPartner || "RS Fashions Express";

      if (!awb && typeof o.notes === "string" && o.notes.includes("AWB:")) {
        const match = o.notes.match(/\[(.*?)\]\s*AWB:\s*([^\s,]+)/i);
        if (match) {
          carrier = match[1];
          awb = match[2] !== "Pending" ? match[2] : null;
        }
      }

      let orderStatus = o.orderStatus || "processing";
      if (f?.status) {
        orderStatus =
          f.status === "delivered"
            ? "delivered"
            : f.status === "shipped"
            ? "shipped"
            : "processing";
      }

      const currentStage = f?.status || o.currentStage || orderStatus;
      const trackingUrl = awb ? getCourierTrackingUrl(carrier, awb) : o.trackingUrl || null;

      let addressStr = o.shippingAddress || o.shipping_address || o.address || "";
      if (typeof addressStr === "object" && addressStr !== null) {
        addressStr = `${addressStr.address || ""}, ${addressStr.apartment ? addressStr.apartment + ", " : ""}${addressStr.city || ""}, ${addressStr.state || ""} - ${addressStr.pincode || ""}`.trim();
      }

      return {
        id: o.id || invNum,
        orderNumber: o.orderNumber || invNum,
        invoiceNumber: invNum,
        date:
          o.date ||
          (o.createdAt
            ? new Date(o.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : new Date().toLocaleDateString("en-IN")),
        createdAt: o.createdAt || new Date().toISOString(),
        customerName: o.customerName || o.customer_name || "Valued Patron",
        customerPhone: o.customerPhone || o.phone || "",
        customerEmail: o.customerEmail || o.email || "",
        shippingAddress: addressStr,
        items: Array.isArray(o.items) ? o.items : [],
        subtotal: Number(o.subtotal) || 0,
        cgst: Number(o.cgst) || 0,
        sgst: Number(o.sgst) || 0,
        shippingFee: Number(o.shippingFee || o.shipping_fee || o.shipping) || 0,
        discount: Number(o.discount || o.discount_amount) || 0,
        couponCode: o.couponCode || o.coupon_code,
        total: Number(o.total) || 0,
        paymentMethod: o.paymentMethod || o.payment_method || "Online",
        paymentStatus: o.paymentStatus || o.payment_status || "completed",
        orderStatus,
        carrierPartner: carrier,
        awbNumber: awb,
        trackingUrl,
        currentStage,
        notes: o.notes,
      };
    };

    // 1. Try Backend API
    try {
      const queryParams = new URLSearchParams();
      if (cleanPhone) queryParams.set("phone", cleanPhone);
      if (cleanEmail) queryParams.set("email", cleanEmail);

      const res = await fetch(`${API_BASE}/sales/customer-orders?${queryParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const ordersList = json.orders || json.data?.orders;
        if (Array.isArray(ordersList)) {
          return ordersList.map(enrichOrder);
        }
      }
    } catch (e) {
      console.warn("Backend getUserOrders notice:", e);
    }

    // 2. Try direct Supabase client
    if (supabase) {
      try {
        let query = supabase.from("orders").select("*");
        if (cleanPhone && cleanEmail) {
          query = query.or(`phone.ilike.%${cleanPhone}%,email.ilike.${cleanEmail}`);
        } else if (cleanPhone) {
          query = query.ilike("phone", `%${cleanPhone}%`);
        } else if (cleanEmail) {
          query = query.ilike("email", cleanEmail);
        }

        const { data, error } = await query.order("created_at", { ascending: false });
        if (!error && data) {
          return data.map(enrichOrder);
        }
      } catch (sbErr) {
        console.warn("Direct Supabase getUserOrders notice:", sbErr);
      }
    }

    // 3. Fallback to LocalStorage orders
    try {
      const raw = localStorage.getItem("rs_fashions_orders") || localStorage.getItem("rs_admin_sales");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const matched = parsed.filter((o: any) => {
            const oPhone = String(o.customerPhone || o.phone || "").replace(/\D/g, "").slice(-10);
            const oEmail = String(o.customerEmail || o.email || "").trim().toLowerCase();
            return (cleanPhone && oPhone === cleanPhone) || (cleanEmail && oEmail === cleanEmail);
          });
          return matched.map(enrichOrder);
        }
      }
    } catch {}

    return [];
  },

  // 10. STRICT DUPLICATE CHECKER (Phone & Email Uniqueness)
  async checkUserExists(email?: string, phone?: string): Promise<{
    exists: boolean;
    emailExists: boolean;
    phoneExists: boolean;
    existingName?: string;
  }> {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPhone = (phone || "").replace(/\D/g, "").slice(-10);

    // 1. Try Backend API
    try {
      const params = new URLSearchParams();
      if (cleanEmail) params.set("email", cleanEmail);
      if (cleanPhone) params.set("phone", cleanPhone);

      const res = await fetch(`${API_BASE}/crm/check-exists?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const d = json.data || json;
        return {
          exists: Boolean(d.exists),
          emailExists: Boolean(d.emailExists),
          phoneExists: Boolean(d.phoneExists),
          existingName: d.existingName,
        };
      }
    } catch (e) {
      console.warn("Backend checkUserExists notice:", e);
    }

    // 2. Try direct Supabase
    if (supabase) {
      try {
        let emailExists = false;
        let phoneExists = false;
        let existingName = undefined;

        if (cleanEmail) {
          const { data } = await supabase.from("customers").select("id, name").ilike("email", cleanEmail).maybeSingle();
          if (data) {
            emailExists = true;
            existingName = data.name;
          }
        }
        if (cleanPhone) {
          const { data } = await supabase.from("customers").select("id, name").ilike("phone", `%${cleanPhone}%`).maybeSingle();
          if (data) {
            phoneExists = true;
            if (!existingName) existingName = data.name;
          }
        }

        return {
          exists: emailExists || phoneExists,
          emailExists,
          phoneExists,
          existingName,
        };
      } catch {}
    }

    // 3. Fallback to LocalStorage customers
    try {
      const raw = localStorage.getItem("rs_admin_customers");
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const emailFound = cleanEmail && list.some((c: any) => c.email && c.email.trim().toLowerCase() === cleanEmail);
          const phoneFound = cleanPhone && list.some((c: any) => {
            const p = String(c.phone || "").replace(/\D/g, "").slice(-10);
            return p === cleanPhone;
          });
          return {
            exists: Boolean(emailFound || phoneFound),
            emailExists: Boolean(emailFound),
            phoneExists: Boolean(phoneFound),
          };
        }
      }
    } catch {}

    return { exists: false, emailExists: false, phoneExists: false };
  },

  // 11. REALTIME BIDIRECTIONAL SYNC (Web & Desktop App Sync)
  subscribeToRealtime(onUpdate: (payload: { table: string; eventType: string; newRecord: any; oldRecord: any }) => void): () => void {
    if (!supabase) return () => { };
    const channel = supabase
      .channel("rs-fashions-live-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        (payload: any) => {
          onUpdate({
            table: payload.table,
            eventType: payload.eventType,
            newRecord: payload.new,
            oldRecord: payload.old,
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
};