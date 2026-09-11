import React, { useState, useMemo } from "react";
import {
  Search,
  ReceiptIndianRupee,
  User,
} from "lucide-react";
import type {
  DashboardProduct,
  Category,
  CartItem,
  CompletedSale,
  CustomerDetails,
  PaymentMethod,
  BillingType,
  CustomerProfile,
} from "../../../types/dashboard";
import { BillingCart } from "./BillingCart";
import { PaymentModal } from "./PaymentModal";
import { InvoiceModal } from "./InvoiceModal";

interface BillingViewProps {
  inventory: DashboardProduct[];
  categories: Category[];
  customers?: CustomerProfile[];
  onCompleteSale: (sale: CompletedSale) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  inventory,
  categories,
  customers = [],
  onCompleteSale,
}) => {
  const [billingType, setBillingType] = useState<BillingType>("gst");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoCode, setPromoCode] = useState("");

  // Customer State
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: "",
    phone: "",
    city: "Hyderabad",
    state: "Telangana",
    address: "",
  });
  const [customerSearch, setCustomerSearch] = useState("");

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [invoiceSale, setInvoiceSale] = useState<CompletedSale | null>(null);

  // Filter products
  const filteredProducts = useMemo(() => {
    return inventory.filter((p) => {
      if (selectedCategory !== "all" && p.categoryId !== selectedCategory) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.variants.some((v) => v.color.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [inventory, selectedCategory, search]);

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.unitPrice * item.qty, 0);
  }, [cart]);

  const discount = useMemo(() => {
    return Math.round((subtotal * discountPercent) / 100);
  }, [subtotal, discountPercent]);

  const taxableAmount = subtotal - discount;
  const gstRate = billingType === "gst" ? (taxableAmount <= 1000 ? 5 : 12) : 0;
  const cgst = billingType === "gst" ? Math.round(((taxableAmount * gstRate) / 100) / 2) : 0;
  const sgst = billingType === "gst" ? Math.round(((taxableAmount * gstRate) / 100) / 2) : 0;
  const total = taxableAmount + cgst + sgst;

  // Add to cart
  const handleAddToCart = (product: DashboardProduct, variantSku: string) => {
    const variant = product.variants.find((v) => v.sku === variantSku);
    if (!variant || variant.stock <= 0) {
      alert("This color shade is currently out of stock.");
      return;
    }

    const cat = categories.find((c) => c.id === product.categoryId);
    const cartId = `${product.id}-${variant.colorSlug}`;
    const existing = cart.find((item) => item.cartId === cartId);

    if (existing) {
      if (existing.qty >= variant.stock) {
        alert(`Maximum available stock (${variant.stock}) already in cart.`);
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.cartId === cartId ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      const newItem: CartItem = {
        cartId,
        productId: product.id,
        sku: variant.sku,
        name: product.name,
        categoryName: cat?.name || "SiCo Gadwal Sarees",
        hsn: cat?.hsn || "5208",
        color: variant.color,
        colorSlug: variant.colorSlug,
        unitPrice: product.salePrice,
        qty: 1,
        maxStock: variant.stock,
        image: product.imageUrl,
      };
      setCart((prev) => [...prev, newItem]);
    }
  };

  const handleUpdateQty = (cartId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((i) => i.cartId !== cartId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.cartId === cartId ? { ...item, qty: newQty } : item
      )
    );
  };

  const handleRemoveItem = (cartId: string) => {
    setCart((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountPercent(0);
  };

  const handleCompletePayment = (
    method: PaymentMethod,
    paymentLink?: string,
    transactionId?: string
  ) => {
    const saleRecord: CompletedSale = {
      invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
      date: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      customerName: customer.name || "Walk-in Patron",
      customerPhone: customer.phone || "N/A",
      items: cart,
      subtotal,
      discount,
      cgst,
      sgst,
      total,
      paymentMethod: method,
      billingType,
      customer,
      taxableAmount,
      gstRate,
      totalTax: cgst + sgst,
      paymentLink,
      transactionId,
    };

    onCompleteSale(saleRecord);
    setIsPaymentModalOpen(false);
    setInvoiceSale(saleRecord);
    setCart([]);
    setDiscountPercent(0);
  };

  const handleSelectCustomerSuggestion = (c: any) => {
    setCustomer({
      name: c.name,
      phone: c.phone,
      email: c.email,
      city: c.city,
      address: c.city,
      gstin: c.gstin,
    });
    setCustomerSearch("");
  };

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto select-none">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4A373] mb-1">
            <ReceiptIndianRupee size={14} />
            <span>Point of Sale Terminal #1</span>
          </div>
          <h1 className="text-3xl font-display font-medium text-stone-900 tracking-tight">
            Counter Billing &amp; Invoicing
          </h1>
          <p className="text-xs text-stone-500 max-w-xl mt-0.5">
            Select drapes, assign patron profile, apply privilege discounts, and collect payment via UPI, Card, PhonePe, or Razorpay.
          </p>
        </div>

        {/* Billing Type Switch */}
        <div className="flex items-center bg-stone-100/80 p-1 rounded-2xl border border-stone-200/60 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setBillingType("gst")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              billingType === "gst"
                ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            GST Tax Invoice
          </button>
          <button
            type="button"
            onClick={() => setBillingType("non-gst")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              billingType === "non-gst"
                ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Non-GST Estimate
          </button>
        </div>
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customer Profile + Product Catalog Picker */}
        <div className="lg:col-span-8 space-y-5">
          {/* Patron Info Card */}
          <div className="glass-panel p-4 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
                <User size={15} className="text-[#D4A373]" />
                <span>Patron Details</span>
              </div>

              {/* Quick Customer Lookup */}
              <div className="relative">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Lookup VIP Patron..."
                  className="h-8 pl-7 pr-3 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#D4A373]"
                />
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />

                {customerSearch.trim() && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-stone-200 p-1 z-30 space-y-0.5">
                    {customers.filter((c) =>
                      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                      c.phone.includes(customerSearch)
                    ).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCustomerSuggestion(c)}
                        className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-stone-900">{c.name}</p>
                          <p className="text-[10px] text-stone-500">{c.phone}</p>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                          {c.tier}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Patron Name
                </label>
                <input
                  type="text"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="e.g. Smt. Shailaja Reddy"
                  className="w-full h-9 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] text-stone-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  WhatsApp Contact
                </label>
                <input
                  type="tel"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  placeholder="9849012345"
                  className="w-full h-9 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] text-stone-900 font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  City / Location
                </label>
                <input
                  type="text"
                  value={customer.city}
                  onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                  placeholder="Hyderabad"
                  className="w-full h-9 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] text-stone-900"
                />
              </div>
            </div>
          </div>

          {/* Saree Catalog Selector */}
          <div className="space-y-3">
            {/* Search & Category Filter */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search drapes by pattern or color..."
                  className="w-full h-10 pl-10 pr-3 text-xs bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#D4A373]"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 px-3 text-xs bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#D4A373] text-stone-700 font-medium"
              >
                <option value="all">All Weaves</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Saree Cards Grid for Adding to Bill */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[560px] overflow-y-auto pr-1">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3.5 rounded-2xl bg-white/90 border border-stone-200/80 shadow-2xs hover:shadow-md hover:border-stone-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-display font-semibold text-xs text-stone-900 truncate">
                          {prod.name}
                        </h4>
                        <p className="font-mono text-[10px] text-stone-400 truncate">
                          {prod.id}
                        </p>
                      </div>
                      <span className="font-display font-bold text-xs text-stone-900 shrink-0">
                        ₹{prod.salePrice.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Variant Shade Pills to click & add */}
                    <div className="space-y-1 pt-1 border-t border-stone-100">
                      <span className="text-[10px] text-stone-500 font-medium block">
                        Tap Shade to Bill:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {prod.variants.map((v) => {
                          const isOos = v.stock <= 0;
                          return (
                            <button
                              key={v.sku}
                              type="button"
                              disabled={isOos}
                              onClick={() => handleAddToCart(prod, v.sku)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all ${
                                isOos
                                  ? "bg-stone-100 text-stone-400 opacity-50 cursor-not-allowed"
                                  : "bg-amber-50 hover:bg-[#2A0E20] hover:text-amber-100 text-stone-800 border border-amber-200/60"
                              }`}
                            >
                              <span>{v.color}</span>
                              <span className="font-mono text-[9px] opacity-75">
                                ({v.stock})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Billing Cart & Payment trigger */}
        <div className="lg:col-span-4 sticky top-6">
          <BillingCart
            cart={cart}
            subtotal={subtotal}
            discount={discount}
            cgst={cgst}
            sgst={sgst}
            total={total}
            discountPercent={discountPercent}
            promoCode={promoCode}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onDiscountPercentChange={(pct) => setDiscountPercent(pct)}
            onPromoCodeChange={(code) => setPromoCode(code)}
            onCheckout={() => setIsPaymentModalOpen(true)}
          />
        </div>
      </div>

      {/* Payment & Invoice Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        totalAmount={total}
        customer={customer}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirmPayment={handleCompletePayment}
      />

      <InvoiceModal
        sale={invoiceSale}
        onClose={() => setInvoiceSale(null)}
      />
    </div>
  );
};
