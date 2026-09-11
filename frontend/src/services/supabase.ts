import { createClient } from "@supabase/supabase-js";
import type { Product } from "../data/products";
import type {
  DashboardProduct,
  Category,
  StockMovement,
  CustomerProfile,
  TrackedOrder,
  CompletedSale,
} from "../types/dashboard";

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
    subtitle: string;
    badge: string;
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
    subtitle: "Heirloom Silks & Pure Handloom Drapes curated from master weavers across India.",
    badge: "The Royal Heritage Vault",
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1600&auto=format&fit=crop",
    link: "/shop",
  },
  festiveBanner: {
    title: "Festive Weaves 2026",
    subtitle: "Limited festive edition Kanjivarams and Banarasis with certified zari.",
    badge: "Exclusive Atelier",
    imageUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
    link: "/shop?category=Festive+Wear",
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
    if (supabase) {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          name: d.name,
          category: d.category || "SiCo Gadwal Sarees",
          material: d.material || "Silk Cotton (SiCo)",
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
      await fetch(`http://localhost:5001/api/products/${encodeURIComponent(id)}`, {
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

  // 1.1 ADMIN DASHBOARD PRODUCTS
  async getDashboardProducts(): Promise<DashboardProduct[]> {
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
          material: d.material || "Silk Cotton (SiCo)",
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
    const totalStock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    const colorNames = product.variants.map((v) => v.color);
    const images = product.imageUrl ? [product.imageUrl] : [];

    if (supabase) {
      try {
        await supabase.from("products").insert([{
          id: product.id,
          name: product.name,
          category_id: categoryId,
          category: product.material || "SiCo Gadwal Sarees",
          material: product.material || "Silk Cotton (SiCo)",
          purchase_price: product.purchasePrice,
          price: product.salePrice,
          stock: totalStock,
          variants: product.variants,
          tags: product.tags,
          images: images,
          colors: colorNames,
          description: product.description || `Handcrafted ${product.name} saree.`,
        }]);

        // Increment sequence in category
        try {
          await supabase.rpc("increment_category_sequence", { cat_id: categoryId });
        } catch {
          await supabase.from("categories").update({ next_sequence: 2 }).eq("id", categoryId);
        }
      } catch (err) {
        console.warn("Supabase insert error:", err);
      }
    }

    const current = await this.getDashboardProducts();
    const updated = [product, ...current];
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS, JSON.stringify(updated));
    return product;
  },

  async updateDashboardProduct(product: DashboardProduct): Promise<DashboardProduct> {
    const totalStock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    const colorNames = product.variants.map((v) => v.color);

    if (supabase) {
      try {
        await supabase.from("products").update({
          name: product.name,
          category_id: product.categoryId,
          purchase_price: product.purchasePrice,
          price: product.salePrice,
          stock: totalStock,
          variants: product.variants,
          tags: product.tags,
          colors: colorNames,
          images: product.imageUrl ? [product.imageUrl] : undefined,
          material: product.material,
          description: product.description,
          updated_at: new Date().toISOString(),
        }).eq("id", product.id);
      } catch (err) {
        console.warn("Supabase update error:", err);
      }
    }

    const current = await this.getDashboardProducts();
    const updated = current.map((p) => (p.id === product.id ? product : p));
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS, JSON.stringify(updated));
    return product;
  },

  async deleteDashboardProduct(id: string): Promise<boolean> {
    if (supabase) {
      try {
        await supabase.from("products").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase delete error:", err);
      }
    }

    const current = await this.getDashboardProducts();
    const updated = current.filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS, JSON.stringify(updated));
    return true;
  },

  // 1.2 CATEGORIES
  async getCategories(): Promise<Category[]> {
    if (supabase) {
      const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true });
      if (!error && data) {
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
    if (supabase) {
      try {
        await supabase.from("categories").insert([{
          id: category.id,
          name: category.name,
          slug: category.slug,
          hsn: category.hsn,
          next_sequence: category.nextSequence,
        }]);
      } catch (err) {
        console.warn("Supabase add category error:", err);
      }
    }
    const current = await this.getCategories();
    const updated = [...current, category];
    localStorage.setItem(LOCAL_STORAGE_CATEGORIES, JSON.stringify(updated));
    return category;
  },

  // 1.3 STOCK MOVEMENTS
  async getStockMovements(): Promise<StockMovement[]> {
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
    if (supabase) {
      try {
        await supabase.from("stock_movements").insert([{
          id: movement.id,
          date: movement.date,
          sku: movement.sku,
          product_name: movement.productName,
          color: movement.color,
          color_slug: movement.colorSlug,
          type: movement.type,
          quantity: movement.quantity,
          previous_stock: movement.previousStock,
          new_stock: movement.newStock,
          reference_number: movement.referenceNumber,
          performed_by: movement.performedBy,
          note: movement.note,
        }]);
      } catch (err) {
        console.warn("Supabase stock movement insert error:", err);
      }
    }
    const current = await this.getStockMovements();
    const updated = [movement, ...current];
    localStorage.setItem(LOCAL_STORAGE_STOCK_MOVEMENTS, JSON.stringify(updated));
    return movement;
  },

  // 1.4 PATRONS & CUSTOMER CRM
  async getCustomers(): Promise<CustomerProfile[]> {
    if (supabase) {
      const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          name: d.name,
          phone: d.phone,
          email: d.email || undefined,
          city: d.city,
          tier: d.tier,
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
    if (supabase) {
      try {
        await supabase.from("customers").insert([{
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          city: customer.city,
          tier: customer.tier,
          total_spent: customer.totalSpent,
          orders_count: customer.ordersCount,
          birthday: customer.birthday || null,
          anniversary: customer.anniversary || null,
          preferred_weave: customer.preferredWeave,
          notes: customer.notes,
          gstin: customer.gstin,
        }]);
      } catch (err) {
        console.warn("Supabase add customer error:", err);
      }
    }
    const current = await this.getCustomers();
    const updated = [customer, ...current];
    localStorage.setItem(LOCAL_STORAGE_CUSTOMERS, JSON.stringify(updated));
    return customer;
  },

  async updateCustomer(customer: CustomerProfile): Promise<CustomerProfile> {
    if (supabase) {
      try {
        await supabase.from("customers").update({
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          city: customer.city,
          tier: customer.tier,
          total_spent: customer.totalSpent,
          orders_count: customer.ordersCount,
          birthday: customer.birthday || null,
          anniversary: customer.anniversary || null,
          preferred_weave: customer.preferredWeave,
          notes: customer.notes,
          gstin: customer.gstin,
          updated_at: new Date().toISOString(),
        }).eq("id", customer.id);
      } catch (err) {
        console.warn("Supabase update customer error:", err);
      }
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
    if (supabase) {
      try {
        await supabase.from("tracked_orders").insert([{
          id: order.id,
          tracking_number: order.trackingNumber,
          direction: order.direction,
          title: order.title,
          party_name: order.partyName,
          party_contact: order.partyContact,
          location: order.location,
          sku_list: order.skuList,
          total_pieces: order.totalPieces,
          total_value: order.totalValue,
          courier_or_loom_partner: order.courierOrLoomPartner,
          current_stage: order.currentStage,
          estimated_completion: order.estimatedCompletion,
          last_update: order.lastUpdate,
          notes: order.notes,
          history_timeline: order.historyTimeline,
        }]);
      } catch (err) {
        console.warn("Supabase add tracked order error:", err);
      }
    }
    const current = await this.getTrackedOrders();
    const updated = [order, ...current];
    localStorage.setItem(LOCAL_STORAGE_TRACKED_ORDERS, JSON.stringify(updated));
    return order;
  },

  async updateTrackedOrder(order: TrackedOrder): Promise<TrackedOrder> {
    if (supabase) {
      try {
        await supabase.from("tracked_orders").update({
          direction: order.direction,
          title: order.title,
          party_name: order.partyName,
          party_contact: order.partyContact,
          location: order.location,
          sku_list: order.skuList,
          total_pieces: order.totalPieces,
          total_value: order.totalValue,
          courier_or_loom_partner: order.courierOrLoomPartner,
          current_stage: order.currentStage,
          estimated_completion: order.estimatedCompletion,
          last_update: order.lastUpdate,
          notes: order.notes,
          history_timeline: order.historyTimeline,
          updated_at: new Date().toISOString(),
        }).eq("id", order.id);
      } catch (err) {
        console.warn("Supabase update tracked order error:", err);
      }
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
    if (supabase) {
      try {
        await supabase.from("orders").insert([{
          id: `ord-${Date.now().toString(36)}`,
          order_number: sale.invoiceNumber,
          invoice_number: sale.invoiceNumber,
          billing_type: sale.billingType || "gst",
          customer_name: sale.customerName,
          email: sale.customer?.email,
          phone: sale.customerPhone,
          shipping_address: sale.customer ? {
            address: sale.customer.address,
            city: sale.customer.city,
            state: sale.customer.state,
            pincode: sale.customer.pincode,
          } : {},
          items: sale.items,
          subtotal: sale.subtotal,
          shipping_fee: 0,
          discount_amount: sale.discount,
          coupon_code: sale.promoCode,
          cgst: sale.cgst,
          sgst: sale.sgst,
          total: sale.total,
          payment_method: sale.paymentMethod,
          payment_status: "paid",
          transaction_id: sale.transactionId,
          payment_link: sale.paymentLink,
          order_status: "delivered",
        }]);
      } catch (err) {
        console.warn("Supabase add completed sale error:", err);
      }
    }
    const current = await this.getCompletedSales();
    const updated = [sale, ...current];
    localStorage.setItem(LOCAL_STORAGE_SALES, JSON.stringify(updated));
    return sale;
  },

  async uploadImage(base64OrDataUrl: string, onProgress?: (percent: number) => void): Promise<{ success: boolean; url: string; message?: string }> {
    try {
      if (onProgress) onProgress(25);
      
      const res = await fetch("http://localhost:5001/api/upload/cloudinary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64OrDataUrl }),
      });

      if (onProgress) onProgress(75);

      const data = await res.json();
      if (onProgress) onProgress(100);

      if (data.success && data.url) {
        return { success: true, url: data.url, message: data.message };
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
      await fetch("http://localhost:5001/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
      const res = await fetch(`http://localhost:5001/api/orders/${encodeURIComponent(idOrNumber)}`);
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
      await fetch(`http://localhost:5001/api/orders/${encodeURIComponent(idOrNumber)}/payment`, {
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
            subtitle: hero.subtitle,
            badge: hero.badge,
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
          subtitle: data.subtitle,
          badge: data.badge,
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
      const res = await fetch("http://localhost:5001/api/inventory/hold", {
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
      await fetch("http://localhost:5001/api/inventory/release", {
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
      const res = await fetch(`http://localhost:5001/api/inventory/status/${productId}?sessionId=${sessionId}`);
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
      const res = await fetch("http://localhost:5001/api/payments/phonepe/initiate", {
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
      const res = await fetch(`http://localhost:5001/api/payments/phonepe/status/${txnId}?simulate=${simulate}`);
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
    message?: string;
  }> {
    try {
      const res = await fetch("http://localhost:5001/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, receipt }),
      });
      return await res.json();
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
      const res = await fetch("http://localhost:5001/api/payments/razorpay/verify", {
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

  // 8. REALTIME BIDIRECTIONAL SYNC (Web & Desktop App Sync)
  subscribeToRealtime(onUpdate: (payload: { table: string; eventType: string; newRecord: any; oldRecord: any }) => void): () => void {
    if (!supabase) return () => {};

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



