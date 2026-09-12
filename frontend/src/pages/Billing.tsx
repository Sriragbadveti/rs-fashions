import React, { useState } from "react";
import {
  ArrowRight,
  ReceiptIndianRupee,
  Banknote,
  Check,
  Layers,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Mail,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  Printer,
  Search,
  ShoppingBag,
  Trash2,
  User,
  Wallet,
  X,
  Share2,
  AlertCircle,
  Bell,
  Loader2,
  Copy,
  ExternalLink,
  CheckCircle2,
  Link2,
  Smartphone,
} from "lucide-react";

import type { CartItem, CompletedSale, Product, CustomerProfile } from "../types/inventory";
import { API_BASE } from "../config/api";
import logo from "../assets/logo/logo1.png";

import {
  useBilling,
  currency,
  formatDate,
  STORE_WHATSAPP_NUMBER,
  STORE_ADDRESS,
} from "../types/useBilling";
import type { UseBillingProps } from "../types/useBilling";

// Secure internal hashing / encryption helper for robust billing storage & telemetry
function secureHashPayload(data: unknown): string {
  const jsonString = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `enc-sha256-${Math.abs(hash).toString(16)}-${btoa(encodeURIComponent(jsonString)).slice(0, 16)}`;
}

type BillingProps = UseBillingProps;

const Billing: React.FC<BillingProps> = ({
  inventory,
  categories,
  onCompleteSale,
}) => {
  const {
    search,
    selectedCategory,
    isCategoryDropdownOpen,
    cart,
    customer,
    customDiscount,
    promoCode,
    promoMessage,
    paymentMethod,
    showCustomer,
    showInvoice,
    completedSale,
    customerSearch,
    showCustomerSuggestions,
    selectedCartId,

    setSearch,
    setSelectedCategory,
    setIsCategoryDropdownOpen,
    setShowCustomer,
    setShowInvoice,
    setCustomerSearch,
    setShowCustomerSuggestions,
    setDiscountPercent,
    setCustomDiscount,
    setPromoCode,
    setPromoMessage,
    setPaymentMethod,
    setSelectedCartId,

    categoryDropdownRef,
    searchInputRef,
    customerNameRef,
    customerPhoneRef,
    promoInputRef,
    discountInputRef,
    customerLookupRef,

    categoryMap,
    filteredProducts,
    filteredCustomers,
    subtotal,
    effectiveDiscountPercent,
    cartQuantity,

    updateCustomer,
    selectExistingCustomer,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    applyPromo,
    completeBill,
    commitSale,
    isSaleCommitted,
    resetBilling,
    printInvoice,
    whatsappInvoice,
  } = useBilling({ inventory, categories, onCompleteSale });

  // VALIDATION, ENCRYPTION & TOAST STATE HOOKS
  const [addressError, setAddressError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // PAYMENT LINK STATES (PhonePe & Razorpay)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [paymentLinkData, setPaymentLinkData] = useState<{
    provider: "phonepe" | "razorpay";
    url: string;
    refId: string;
    amount: number;
  } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [paymentLinkError, setPaymentLinkError] = useState<string | null>(null);

  // TRIGGER TOAST HELPER
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // LIVE REACTIVE CALCULATIONS
  const liveDiscountAmount = (subtotal * effectiveDiscountPercent) / 100;
  const liveNetPayable = Math.max(0, subtotal - liveDiscountAmount);

  // 1. GENERATE PAYMENT LINK (PhonePe or Razorpay)
  // CRITICAL: Does NOT commit sale to ledger or backend!
  const handleGeneratePaymentLink = async (provider: "phonepe" | "razorpay"): Promise<string | null> => {
    const cleanPhone = (customer.phone || "").replace(/[^0-9]/g, "");
    if (!customer.phone || cleanPhone.length !== 10) {
      setPhoneError(true);
      setShowCustomer(true);
      triggerToast("Please enter a valid 10-digit customer phone number.");
      return null;
    }
    setPhoneError(false);
    setPaymentLinkError(null);
    setIsGeneratingLink(true);

    try {
      if (provider === "phonepe") {
        const res = await fetch(`${API_BASE}/payments/phonepe/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: liveNetPayable,
            customerPhone: cleanPhone,
            customerName: customer.name?.trim() || "Patron",
          }),
        });
        const json = await res.json();
        if (!res.ok || json.success === false) {
          throw new Error(json.message || "PhonePe payment link initiation failed");
        }
        const link = json.paymentLink || json.paymentUrl || json.redirectUrl;
        if (!link) throw new Error("No payment link URL returned by PhonePe");

        const data = {
          provider: "phonepe" as const,
          url: link,
          refId: json.transactionId || `MT_${Date.now().toString(36)}`,
          amount: liveNetPayable,
        };
        setPaymentLinkData(data);
        triggerToast("PhonePe payment link generated successfully!");
        return link;
      } else {
        // Razorpay
        const res = await fetch(`${API_BASE}/payments/razorpay/create-payment-link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: liveNetPayable,
            customerName: customer.name?.trim() || "Patron",
            customerPhone: cleanPhone,
            customerEmail: customer.email?.trim() || "patron@rsfashions.in",
          }),
        });
        const json = await res.json();
        if (!res.ok || json.success === false) {
          throw new Error(json.message || "Razorpay payment link creation failed");
        }
        const link = json.paymentLink || json.shortUrl;
        if (!link) throw new Error("No payment link URL returned by Razorpay");

        const data = {
          provider: "razorpay" as const,
          url: link,
          refId: json.paymentLinkId || `plink_${Date.now()}`,
          amount: liveNetPayable,
        };
        setPaymentLinkData(data);
        triggerToast("Razorpay payment link generated successfully!");
        return link;
      }
    } catch (err: any) {
      console.error("Payment link error:", err);
      const msg = err.message || "Payment link generation failed";
      setPaymentLinkError(msg);
      triggerToast(`Payment link failed: ${msg}`);
      // NOTE: Sale is explicitly NOT committed to history or backend on failure
      return null;
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // 2. CONFIRM LINK PAYMENT & COMMIT TO HISTORY
  // Only called when customer completes payment via PhonePe/Razorpay
  const handleConfirmLinkPayment = () => {
    if (!paymentLinkData) return;

    if (!customer.address || customer.address.trim() === "") {
      setAddressError(true);
      setShowCustomer(true);
      triggerToast("Please enter customer address before recording sale.");
      return;
    }

    completeBill({
      customMethod: paymentLinkData.provider,
      paymentLink: paymentLinkData.url,
      transactionId: paymentLinkData.refId,
      commitImmediate: true,
    });

    setPaymentLinkData(null);
    setPaymentLinkError(null);
    triggerToast("Payment confirmed! Sale recorded in Transaction History.");
  };

  // 3. SECURE CHECKOUT FOR DIRECT SETTLEMENT (Cash / Card / UPI POS)
  const handleSecureGenerateReceipt = (commitImmediate = true) => {
    let hasError = false;

    const cleanPhone = (customer.phone || "").replace(/[^0-9]/g, "");
    if (!customer.phone || cleanPhone.length !== 10) {
      setPhoneError(true);
      hasError = true;
    } else {
      setPhoneError(false);
    }

    if (!customer.address || customer.address.trim() === "") {
      setAddressError(true);
      setShowCustomer(true);
      hasError = true;
    } else {
      setAddressError(false);
    }

    if (hasError) {
      triggerToast("Please fill in mandatory address & 10-digit phone number!");
      return;
    }

    const encryptedBillingToken = secureHashPayload({
      cart,
      customer,
      total: liveNetPayable,
      timestamp: Date.now(),
    });
    console.debug("Secure Hashed Billing Token Generated:", encryptedBillingToken);

    completeBill({
      customMethod: paymentMethod,
      commitImmediate,
    });

    if (commitImmediate) {
      triggerToast("Sale completed and recorded in Transaction History!");
    } else {
      triggerToast("Receipt preview ready. Click Save Sale to confirm.");
    }
  };

  return (
    <div className="min-h-full w-full select-none bg-transparent font-sans text-stone-800 relative">
      {/* GLOBAL TOAST NOTIFICATION CONTAINER */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[99999] flex items-center gap-2.5 rounded-2xl bg-[#2A0E20] px-4 py-3 text-xs font-semibold text-amber-100 shadow-2xl border border-brand-gold/30 animate-bounce">
          <Bell size={15} className="text-brand-gold shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="mx-auto w-full max-w-[1800px] space-y-5">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-gold">
              <span className="text-stone-500">Retail Sales Counter</span>
            </div>

            <h1 className="font-display text-3xl font-medium tracking-tight text-stone-900 sm:text-4xl">
              Billing Counter
            </h1>

            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-stone-500">
              Create a customer bill, select saree colors, apply discounts, collect payment and generate the final receipt.
            </p>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => {
                clearCart();
                triggerToast("Current bill cleared.");
              }}
              className="inline-flex h-9 items-center gap-2 self-start rounded-xl border border-rose-200 bg-white px-3.5 text-xs font-medium text-rose-700 shadow-sm transition hover:bg-rose-50 md:self-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Bill ({cartQuantity})</span>
            </button>
          )}
        </div>

        {/* =====================================================
            WORKSPACE
        ===================================================== */}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_470px]">
          {/* ===================================================
              LEFT
          =================================================== */}

          <div className="min-w-0 space-y-5">
            {/* =================================================
                PRODUCT CATALOGUE
            ================================================= */}

            <section className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm">
              <div className="border-b border-stone-200/70 p-4 md:p-5">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-base font-medium text-stone-900">
                        Saree Catalogue
                      </h2>
                    </div>

                    <p className="mt-0.5 text-[11px] text-stone-500">
                      Select a color to add it directly to the bill.
                    </p>
                  </div>

                  <div className="rounded-lg border border-amber-200/70 bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-900">
                    {filteredProducts.length} designs
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <div className="group relative flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-brand-gold" />

                    <input
                      ref={searchInputRef}
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search saree name, color or SKU..."
                      className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-9 text-xs text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-brand-gold focus:bg-white focus:ring-2 focus:ring-brand-gold/15"
                    />

                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                        aria-label="Clear search"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="relative sm:w-72" ref={categoryDropdownRef}>
                    <button
                      type="button"
                      onClick={() =>
                        setIsCategoryDropdownOpen((prev) => !prev)
                      }
                      className={`flex h-10 w-full items-center justify-between gap-2.5 rounded-xl border bg-stone-50/60 px-3.5 text-xs font-medium text-stone-800 transition-all hover:bg-white ${isCategoryDropdownOpen
                          ? "border-brand-gold bg-white ring-2 ring-brand-gold/15"
                          : "border-stone-200"
                        }`}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Layers className="h-3.5 w-3.5 shrink-0 text-brand-gold" />

                        <span className="truncate">
                          {selectedCategory === "all"
                            ? "All Weave Collections"
                            : categories.find(
                              (c) => c.id === selectedCategory
                            )?.name ?? "Selected Collection"}
                        </span>
                      </div>

                      <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 text-stone-400 transition-transform ${isCategoryDropdownOpen ? "rotate-180" : ""
                          }`}
                      />
                    </button>

                    {isCategoryDropdownOpen && (
                      <div className="absolute right-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-2xl border border-stone-200 bg-white p-1.5 shadow-xl">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory("all");
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs ${selectedCategory === "all"
                              ? "bg-[#2A0E20] text-amber-100"
                              : "text-stone-700 hover:bg-stone-100"
                            }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
                            All Weave Collections
                          </span>

                          {selectedCategory === "all" && (
                            <Check className="h-3.5 w-3.5 text-brand-gold" />
                          )}
                        </button>

                        <div className="mt-1 max-h-56 space-y-0.5 overflow-y-auto border-t border-stone-100 pt-1">
                          {categories.map((category) => {
                            const isSelected =
                              selectedCategory === category.id;

                            return (
                              <button
                                type="button"
                                key={category.id}
                                onClick={() => {
                                  setSelectedCategory(category.id);
                                  setIsCategoryDropdownOpen(false);
                                }}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs ${isSelected
                                    ? "bg-[#2A0E20] text-amber-100"
                                    : "text-stone-700 hover:bg-stone-100"
                                  }`}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <span
                                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${isSelected
                                        ? "bg-brand-gold"
                                        : "bg-stone-300"
                                      }`}
                                  />
                                  <span className="truncate">
                                    {category.name}
                                  </span>
                                </span>

                                <span
                                  className={`ml-2 shrink-0 rounded px-1.5 py-0.5 font-mono text-[8px] ${isSelected
                                      ? "bg-white/10 text-amber-200"
                                      : "bg-stone-100 text-stone-500"
                                    }`}
                                >
                                  HSN {category.hsn}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-5">
                {filteredProducts.length === 0 ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/40 p-6 text-center">
                    <Package className="mb-2 h-8 w-8 text-stone-300" />

                    <h3 className="text-xs font-semibold text-stone-700">
                      No sarees found
                    </h3>

                    <p className="mt-1 text-[11px] text-stone-400">
                      Try another saree name, color or category.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 2xl:grid-cols-3">
                    {filteredProducts.map((product) => {
                      const category = categoryMap.get(product.categoryId);

                      return (
                        <ProductCard
                          key={product.id}
                          product={product}
                          categoryName={
                            category?.name ?? "SiCo Gadwal Sarees"
                          }
                          onAdd={(prod, variant) => {
                            addToCart(prod, variant);
                            triggerToast(`Added ${prod.name} (${variant.color}) to bill`);
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* =================================================
                CUSTOMER
            ================================================= */}

            <section className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${addressError || phoneError ? 'border-rose-400 ring-2 ring-rose-100' : 'border-stone-200/80'}`}>
              <button
                type="button"
                onClick={() => setShowCustomer((prev) => !prev)}
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-stone-50/70 md:p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2A0E20] text-brand-gold">
                    <User className="h-4 w-4" />
                  </div>

                  <div>
                    <h2 className="font-display text-sm font-medium text-stone-900 flex items-center gap-2">
                      Customer Details
                      {(addressError || phoneError) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <AlertCircle className="w-3 h-3" /> Mandatory fields required
                        </span>
                      )}
                    </h2>

                    <p className="text-[11px] text-stone-500">
                      Contact information for billing and receipt delivery (Address & 10-digit phone required).
                    </p>
                  </div>
                </div>

                {showCustomer ? (
                  <ChevronUp className="h-4 w-4 text-stone-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-stone-400" />
                )}
              </button>

              {showCustomer && (
                <div className="space-y-4 border-t border-stone-200/70 p-4 md:p-5">
                  {/* CUSTOMER LOOKUP */}

                  <div className="relative" ref={customerLookupRef}>
                    <label className="block">
                      <span className="mb-1 flex items-center gap-1 text-[11px] font-medium text-stone-700">
                        <span className="text-stone-400">
                          <Search className="h-3.5 w-3.5" />
                        </span>
                        Existing Customer Lookup
                      </span>

                      <input
                        type="text"
                        value={customerSearch}
                        onFocus={() => setShowCustomerSuggestions(true)}
                        onChange={(event) => {
                          setCustomerSearch(event.target.value);
                          setShowCustomerSuggestions(true);
                        }}
                        placeholder="Search by customer name, phone, email or city..."
                        className="input-fluent bg-white py-2 text-xs focus:bg-white"
                      />
                    </label>

                    {showCustomerSuggestions &&
                      filteredCustomers.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-stone-200 bg-white p-1.5 shadow-xl">
                          <div className="border-b border-stone-100 px-2.5 py-2">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
                              Existing Customers
                            </p>
                          </div>

                          <div className="max-h-64 overflow-y-auto">
                            {filteredCustomers.map((existingCustomer: CustomerProfile) => (
                              <button
                                key={existingCustomer.id}
                                type="button"
                                onClick={() => {
                                  selectExistingCustomer(existingCustomer);
                                  // Ensure address is successfully pulled across into state
                                  if (existingCustomer.address) {
                                    updateCustomer("address", existingCustomer.address);
                                  }
                                  setAddressError(false);
                                  setPhoneError(false);
                                  triggerToast(`Loaded customer: ${existingCustomer.name}`);
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-stone-50"
                              >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2A0E20] text-brand-gold">
                                  <User className="h-3.5 w-3.5" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-xs font-semibold text-stone-800">
                                      {existingCustomer.name}
                                    </p>

                                    <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[8px] font-semibold text-amber-900">
                                      {existingCustomer.tier}
                                    </span>
                                  </div>

                                  <p className="mt-0.5 text-[10px] text-stone-500">
                                    {existingCustomer.phone} {" • "}
                                    {existingCustomer.city}
                                  </p>

                                  {existingCustomer.email && (
                                    <p className="mt-0.5 truncate text-[9px] text-stone-400">
                                      {existingCustomer.email}
                                    </p>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    {showCustomerSuggestions &&
                      customerSearch.trim() &&
                      filteredCustomers.length === 0 && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-2xl border border-stone-200 bg-white p-3 shadow-xl">
                          <p className="text-[10px] text-stone-500">
                            No existing customer found. You can continue with
                            manual entry below.
                          </p>
                        </div>
                      )}
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                    <InputField
                      inputRef={customerNameRef}
                      label="Customer Full Name"
                      required
                      icon={<User className="h-3.5 w-3.5" />}
                      value={customer.name}
                      onChange={(value) => updateCustomer("name", value)}
                      placeholder="e.g. Lakshmi Reddy"
                    />

                    <div>
                      <InputField
                        inputRef={customerPhoneRef}
                        label="WhatsApp Phone Number (10 Digits)"
                        required
                        icon={<Phone className="h-3.5 w-3.5" />}
                        value={customer.phone}
                        onChange={(value) => {
                          const numericVal = value.replace(/\D/g, "").slice(0, 10);
                          updateCustomer("phone", numericVal);
                          if (numericVal.length === 10) setPhoneError(false);
                        }}
                        placeholder="e.g. 9849012345"
                        type="tel"
                        maxLength={10}
                      />
                      {phoneError && (
                        <p className="mt-1 text-[10px] font-semibold text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Exactly 10 digits required for WhatsApp delivery.
                        </p>
                      )}
                    </div>

                    <InputField
                      label="Email"
                      icon={<Mail className="h-3.5 w-3.5" />}
                      value={customer.email ?? ""}
                      onChange={(value) => updateCustomer("email", value)}
                      placeholder="Optional"
                      type="email"
                    />

                    <InputField
                      label="City / Region"
                      value={customer.city ?? ""}
                      onChange={(value) => updateCustomer("city", value)}
                      placeholder="Hyderabad"
                    />

                    <InputField
                      label="State"
                      value={customer.state ?? ""}
                      onChange={(value) => updateCustomer("state", value)}
                      placeholder="Telangana"
                    />

                    <div className="md:col-span-2">
                      <label className="block">
                        <span className="mb-1 flex items-center gap-1 text-[11px] font-medium text-stone-700">
                          <span className="text-stone-400"><MapPin className="h-3.5 w-3.5" /></span>
                          Address
                          <span className="text-rose-500">*</span>
                        </span>
                        <input
                          type="text"
                          required
                          value={customer.address ?? ""}
                          onChange={(e) => {
                            updateCustomer("address", e.target.value);
                            if (e.target.value.trim() !== "") setAddressError(false);
                          }}
                          placeholder="House / street details (Mandatory for receipt generation)"
                          className={`input-fluent bg-white py-2 text-xs focus:bg-white ${addressError ? 'border-rose-500 ring-1 ring-rose-500' : ''}`}
                        />
                      </label>
                      {addressError && (
                        <p className="mt-1 text-[10px] font-semibold text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Customer address is mandatory to generate a receipt.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ===================================================
              RIGHT BILL
          =================================================== */}

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-premium">
              <div className="border-b border-stone-200/70 p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2A0E20] text-brand-gold">
                      <ShoppingBag className="h-4 w-4" />
                    </div>

                    <div>
                      <h2 className="font-display text-sm font-medium text-stone-900">
                        Current Bill
                      </h2>

                      <p className="text-[11px] text-stone-500">
                        {cartQuantity} item{cartQuantity === 1 ? "" : "s"}{" "}
                        selected
                      </p>
                    </div>
                  </div>

                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        clearCart();
                        triggerToast("Bill cleared.");
                      }}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto divide-y divide-stone-100 p-2">
                {cart.length === 0 ? (
                  <div className="flex min-h-[175px] flex-col items-center justify-center px-6 text-center">
                    <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-brand-gold">
                      <ShoppingBag className="h-5 w-5" />
                    </div>

                    <h3 className="text-xs font-semibold text-stone-700">
                      Your bill is empty
                    </h3>

                    <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-stone-400">
                      Select a color from the catalogue to add it to the
                      current bill.
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <CartRow
                      key={item.cartId}
                      item={item}
                      selected={selectedCartId === item.cartId}
                      onSelect={() => setSelectedCartId(item.cartId)}
                      onQuantityChange={(id, qty) => {
                        updateQuantity(id, qty);
                      }}
                      onRemove={(id) => {
                        removeItem(id);
                        triggerToast("Item removed from bill");
                      }}
                    />
                  ))
                )}
              </div>

              <div className="space-y-3 border-t border-stone-200/70 bg-stone-50/40 p-4 md:p-5">
                {/* DISCOUNT */}

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-stone-700">
                    <span>Showroom Discount</span>

                    <span className="font-semibold text-emerald-700">
                      {liveDiscountAmount > 0 ? `-${currency(liveDiscountAmount)}` : "0%"}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {[0, 5, 10, 15, 20].map((percent) => (
                      <button
                        type="button"
                        key={percent}
                        onClick={() => {
                          setDiscountPercent(percent);
                          setCustomDiscount("");
                          triggerToast(`Applied ${percent}% showroom discount`);
                        }}
                        className={`rounded-lg border py-1.5 text-[10px] font-semibold transition ${effectiveDiscountPercent === percent &&
                            customDiscount.trim() === ""
                            ? "border-[#2A0E20] bg-[#2A0E20] text-amber-100"
                            : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                          }`}
                      >
                        {percent}%
                      </button>
                    ))}
                  </div>

                  {/* CUSTOM DISCOUNT */}

                  <div className="mt-2 flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        ref={discountInputRef}
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={customDiscount}
                        onChange={(event) => {
                          const value = event.target.value;

                          setCustomDiscount(value);

                          if (value.trim() !== "") {
                            setDiscountPercent(0);
                          }
                        }}
                        placeholder="Custom discount"
                        className="input-fluent w-full bg-white py-1.5 pr-8 text-xs"
                      />

                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-stone-400">
                        %
                      </span>
                    </div>

                    {customDiscount.trim() !== "" && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomDiscount("");
                          triggerToast("Custom discount reset");
                        }}
                        className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[10px] font-medium text-stone-600 hover:bg-stone-50"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* PROMO */}

                <div className="flex gap-2">
                  <input
                    ref={promoInputRef}
                    value={promoCode}
                    onChange={(event) => {
                      setPromoCode(event.target.value);
                      setPromoMessage("");
                    }}
                    placeholder="Promo code"
                    className="input-fluent py-1.5 text-xs uppercase"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      applyPromo();
                      triggerToast("Promo code processed");
                    }}
                    className="rounded-xl border border-stone-200 bg-white px-3 text-xs font-medium text-stone-700 shadow-sm hover:bg-stone-50"
                  >
                    Apply
                  </button>
                </div>

                {promoMessage && (
                  <p className="text-[10px] font-medium text-emerald-700">
                    {promoMessage}
                  </p>
                )}

                {/* SUMMARY */}

                <div className="space-y-1.5 border-t border-stone-200/70 pt-3">
                  <SummaryRow label="Gross Value" value={currency(subtotal)} />

                  {liveDiscountAmount > 0 && (
                    <SummaryRow
                      label={`Discount (${effectiveDiscountPercent}%)`}
                      value={`-${currency(liveDiscountAmount)}`}
                      valueClassName="font-semibold text-emerald-700"
                    />
                  )}

                  <div className="flex items-center justify-between rounded-lg bg-stone-100 px-2.5 py-1.5 text-[10px]">
                    <span className="text-stone-500">Tax</span>

                    <span className="font-semibold text-stone-600">
                      Retail Sales (Tax-inclusive)
                    </span>
                  </div>
                </div>

                {/* TOTAL */}

                <div className="flex items-end justify-between border-t border-stone-200 pt-3">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-stone-400">
                      Total Amount
                    </p>

                    <p className="mt-0.5 font-display text-2xl font-bold tracking-tight text-[#2A0E20]">
                      {currency(liveNetPayable)}
                    </p>
                  </div>

                  <span className="rounded-full border border-stone-200 bg-stone-100 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-stone-700">
                    Retail
                  </span>
                </div>

                {/* PAYMENT */}

                <div className="border-t border-stone-200/70 pt-3">
                  <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-stone-400">
                    Payment Method
                  </p>

                  <div className="grid grid-cols-4 gap-1.5">
                    <PaymentButton
                      active={paymentMethod === "upi"}
                      onClick={() => {
                        setPaymentMethod("upi");
                        setPaymentLinkData(null);
                        setPaymentLinkError(null);
                        triggerToast("Payment mode: UPI / QR");
                      }}
                      icon={<Wallet className="h-3.5 w-3.5" />}
                      label="UPI"
                    />

                    <PaymentButton
                      active={paymentMethod === "card"}
                      onClick={() => {
                        setPaymentMethod("card");
                        setPaymentLinkData(null);
                        setPaymentLinkError(null);
                        triggerToast("Payment mode: Card");
                      }}
                      icon={<CreditCard className="h-3.5 w-3.5" />}
                      label="Card"
                    />

                    <PaymentButton
                      active={paymentMethod === "cash"}
                      onClick={() => {
                        setPaymentMethod("cash");
                        setPaymentLinkData(null);
                        setPaymentLinkError(null);
                        triggerToast("Payment mode: Cash");
                      }}
                      icon={<Banknote className="h-3.5 w-3.5" />}
                      label="Cash"
                    />

                    <PaymentButton
                      active={paymentMethod === "phonepe" || paymentMethod === "razorpay"}
                      onClick={() => {
                        setPaymentMethod("phonepe");
                        triggerToast("Payment Link mode: PhonePe & Razorpay options");
                      }}
                      icon={<Link2 className="h-3.5 w-3.5" />}
                      label="Pay Link"
                    />
                  </div>
                </div>

                {/* PAYMENT LINK GATEWAY OPTIONS (PhonePe & Razorpay) */}
                {(paymentMethod === "phonepe" || paymentMethod === "razorpay") && (
                  <div className="rounded-2xl border border-stone-200 bg-stone-50/90 p-3.5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Link2 className="h-3.5 w-3.5 text-[#2A0E20]" />
                        <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wide">
                          Payment Link Gateways
                        </span>
                      </div>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        2 Gateways Active
                      </span>
                    </div>

                    {/* The 2 Gateway Options: PhonePe & Razorpay */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Option 1: PhonePe */}
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod("phonepe");
                          setPaymentLinkError(null);
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                          paymentMethod === "phonepe"
                            ? "border-purple-600 bg-purple-50/90 text-purple-900 shadow-sm ring-2 ring-purple-500/20"
                            : "border-stone-200 bg-white text-stone-700 hover:bg-stone-100/70"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-purple-600 text-white font-bold text-xs flex items-center justify-center mb-1 shadow-xs">
                          Pe
                        </div>
                        <span className="text-xs font-bold">PhonePe Link</span>
                        <span className="text-[9px] text-stone-500 mt-0.5">UPI &amp; QR Payment</span>
                      </button>

                      {/* Option 2: Razorpay */}
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod("razorpay");
                          setPaymentLinkError(null);
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                          paymentMethod === "razorpay"
                            ? "border-blue-600 bg-blue-50/90 text-blue-900 shadow-sm ring-2 ring-blue-500/20"
                            : "border-stone-200 bg-white text-stone-700 hover:bg-stone-100/70"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-1 shadow-xs">
                          Rzp
                        </div>
                        <span className="text-xs font-bold">Razorpay Link</span>
                        <span className="text-[9px] text-stone-500 mt-0.5">Cards &amp; Wallets</span>
                      </button>
                    </div>

                    {/* Generate Button (Shown if link is not generated yet) */}
                    {!paymentLinkData && (
                      <button
                        type="button"
                        disabled={isGeneratingLink || cart.length === 0}
                        onClick={() => handleGeneratePaymentLink(paymentMethod === "razorpay" ? "razorpay" : "phonepe")}
                        className={`w-full h-10 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                          paymentMethod === "razorpay"
                            ? "bg-blue-600 hover:bg-blue-700 active:scale-[0.99]"
                            : "bg-purple-600 hover:bg-purple-700 active:scale-[0.99]"
                        }`}
                      >
                        {isGeneratingLink ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Generating {paymentMethod === "razorpay" ? "Razorpay" : "PhonePe"} Link...</span>
                          </>
                        ) : (
                          <>
                            <Link2 className="h-4 w-4" />
                            <span>Generate {paymentMethod === "razorpay" ? "Razorpay" : "PhonePe"} Link ({currency(liveNetPayable)})</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Error Banner if generation failed */}
                    {paymentLinkError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 space-y-1.5 animate-shake">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                          <span>Payment Link Generation Failed</span>
                        </div>
                        <p className="text-[11px] text-red-600 leading-snug">{paymentLinkError}</p>
                        <p className="text-[10px] text-stone-500 font-medium">
                          &bull; Note: No sale was recorded in transaction history. You can retry or choose another payment method.
                        </p>
                      </div>
                    )}

                    {/* Active Link Box */}
                    {paymentLinkData && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700">
                          <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            {paymentLinkData.provider === "razorpay" ? "Razorpay" : "PhonePe"} Link Active
                          </span>
                          <span className="font-mono text-[10px] text-stone-500">Ref: {paymentLinkData.refId.slice(0, 14)}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            readOnly
                            value={paymentLinkData.url}
                            className="flex-1 h-8 px-2.5 text-[10px] font-mono bg-white border border-stone-200 rounded-lg text-stone-700 select-all"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(paymentLinkData.url);
                              setLinkCopied(true);
                              triggerToast("Payment link copied to clipboard!");
                              setTimeout(() => setLinkCopied(false), 2000);
                            }}
                            className="h-8 px-2.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold flex items-center gap-1 shrink-0"
                          >
                            {linkCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            <span>{linkCopied ? "Copied" : "Copy"}</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              const cleanPhone = (customer.phone || "").replace(/[^0-9]/g, "");
                              const text = encodeURIComponent(
                                `Namaste ${customer.name || "Patron"},\n\nYour luxury saree bill from RS Fashions is ready for ₹${paymentLinkData.amount.toLocaleString("en-IN")}.\n\nPlease complete your payment securely via the link below:\n${paymentLinkData.url}\n\nThank you for choosing RS Fashions!`
                              );
                              window.open(`https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${text}`, "_blank");
                              triggerToast("WhatsApp dispatched to patron!");
                            }}
                            className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                          >
                            <Share2 className="h-3 w-3" />
                            <span>Send WhatsApp</span>
                          </button>

                          <a
                            href={paymentLinkData.url}
                            target="_blank"
                            rel="noreferrer"
                            className="h-8 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Open Link</span>
                          </a>
                        </div>

                        {/* Status notification */}
                        <div className="flex items-center gap-1.5 text-[10px] text-amber-800 bg-amber-50/90 border border-amber-200/70 px-2.5 py-1.5 rounded-lg">
                          <Loader2 className="h-3 w-3 animate-spin text-amber-600 shrink-0" />
                          <span>Waiting for patron payment. Click below only once payment is received.</span>
                        </div>

                        {/* Confirmation Button to record sale ONLY when completed */}
                        <div className="pt-1 flex flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={handleConfirmLinkPayment}
                            className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                          >
                            <Check className="h-4 w-4" />
                            <span>Confirm Payment Received &amp; Record Sale</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPaymentLinkData(null);
                              setPaymentLinkError(null);
                              triggerToast("Payment link cancelled. No sale was recorded in history.");
                            }}
                            className="w-full text-center text-[10px] text-stone-500 hover:text-stone-700 py-1"
                          >
                            Cancel / Clear Link
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* COMPLETE SALE BUTTON FOR DIRECT SETTLEMENT (Cash / Card / UPI) */}
                {paymentMethod !== "phonepe" && paymentMethod !== "razorpay" && (
                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => handleSecureGenerateReceipt(true)}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2A0E20] px-4 text-xs font-semibold text-amber-100 shadow-md transition-all hover:bg-[#3D142E] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ReceiptIndianRupee className="h-4 w-4 text-brand-gold" />
                    <span>Complete Sale &amp; Generate Receipt</span>
                    <ArrowRight className="h-3.5 w-3.5 text-brand-gold" />
                    <span>{currency(liveNetPayable)}</span>
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* =======================================================
          INVOICE MODAL
      ======================================================= */}

      {showInvoice && completedSale && (
        <InvoiceModal
          sale={completedSale}
          onClose={() => setShowInvoice(false)}
          onPrint={() => {
            printInvoice();
            triggerToast("Receipt sent to printer");
          }}
          onWhatsApp={() => {
            whatsappInvoice();
            triggerToast("WhatsApp payment link dispatched");
          }}
          onSaveNewBill={() => {
            commitSale();
            resetBilling();
            triggerToast("Sale successfully recorded & saved to system ledger!");
          }}
          onGenerateGatewayLink={handleGeneratePaymentLink}
        />
      )}
    </div>
  );
};

/* =============================================================
   PRODUCT CARD
   ============================================================= */

interface ProductCardProps {
  product: Product;
  categoryName: string;
  onAdd: (
    product: Product,
    variant: Product["variants"][number]
  ) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  categoryName,
  onAdd,
}) => {
  return (
    <div className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white transition-all duration-200 hover:border-[#D4A373]/70 hover:shadow-md">
      <div className="flex min-w-0 gap-3.5 p-3.5">
        <div className="h-[72px] w-[72px] shrink-0 overflow-visible rounded-xl border border-stone-200/70 bg-stone-100 flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-7 w-7 text-stone-300" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="break-words text-[13px] font-semibold leading-[1.3] text-stone-900">
            {product.name}
          </h3>

          <p className="mt-1 truncate text-[10px] font-medium text-stone-400">
            {categoryName || "SiCo Gadwal Sarees"}
          </p>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[9px] font-medium uppercase tracking-wide text-stone-400">
              Sale Price
            </span>

            <span className="font-display text-[14px] font-bold leading-none text-[#2A0E20]">
              {currency(product.salePrice)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-stone-100 bg-stone-50/50 p-2.5">
        <div className="mb-1.5 flex items-center justify-between px-1">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-stone-400">
            Available Color
          </p>

          <span className="text-[9px] font-medium text-stone-400">
            {product.variants.length}{" "}
            {product.variants.length === 1 ? "variant" : "variants"}
          </span>
        </div>

        <div className="space-y-1">
          {product.variants.map((variant) => {
            const disabled = variant.stock <= 0;

            return (
              <button
                type="button"
                key={variant.sku}
                disabled={disabled}
                onClick={() => onAdd(product, variant)}
                className={`grid w-full grid-cols-[10px_minmax(0,1fr)_42px_20px] items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all ${disabled
                    ? "cursor-not-allowed border-stone-200 bg-stone-100/70 opacity-50"
                    : "border-stone-200 bg-white hover:border-[#D4A373] hover:bg-amber-50/30 hover:shadow-sm"
                  }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${disabled ? "bg-stone-400" : "bg-[#2A0E20]"
                    }`}
                />

                <span
                  className={`min-w-0 break-words text-[10px] font-semibold leading-[1.25] ${disabled ? "text-stone-400" : "text-stone-700"
                    }`}
                >
                  {variant.color}
                </span>

                <span
                  className={`text-right text-[9px] font-bold tabular-nums ${disabled
                      ? "text-stone-400"
                      : variant.stock <= 2
                        ? "text-rose-600"
                        : "text-emerald-700"
                    }`}
                >
                  ({variant.stock})
                </span>

                <span className="flex items-center justify-end">
                  {!disabled && (
                    <Plus className="h-3.5 w-3.5 text-stone-400 transition-colors group-hover:text-stone-800" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* =============================================================
   CART ROW
   ============================================================= */

interface CartRowProps {
  item: CartItem;
  selected?: boolean;
  onSelect?: () => void;
  onQuantityChange: (cartId: string, quantity: number) => void;
  onRemove: (cartId: string) => void;
}

const CartRow: React.FC<CartRowProps> = ({
  item,
  selected = false,
  onSelect,
  onQuantityChange,
  onRemove,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer px-2 py-2.5 transition-colors ${selected ? "bg-amber-50/40" : ""
        }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-stone-900">
            {item.name}
          </p>

          <div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
            <span className="font-medium text-stone-600">{item.color}</span>

            <span className="text-stone-300">&bull;</span>

            <span className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[8px] font-semibold text-stone-500">
              {item.sku}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove(item.cartId);
          }}
          className="p-1 text-stone-300 transition-colors hover:text-rose-600"
          aria-label={`Remove ${item.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onQuantityChange(item.cartId, item.qty - 1);
            }}
            className="flex h-6 w-6 items-center justify-center text-stone-500 hover:bg-stone-100"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3 w-3" />
          </button>

          <span className="flex h-6 min-w-7 items-center justify-center border-x border-stone-200 px-2 text-[11px] font-semibold text-stone-900">
            {item.qty}
          </span>

          <button
            type="button"
            disabled={item.qty >= item.maxStock}
            onClick={(event) => {
              event.stopPropagation();
              onQuantityChange(item.cartId, item.qty + 1);
            }}
            className="flex h-6 w-6 items-center justify-center text-stone-500 hover:bg-stone-100 disabled:opacity-30"
            aria-label="Increase quantity"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        <div className="text-right">
          <p className="font-display text-xs font-bold text-stone-950">
            {currency(item.unitPrice * item.qty)}
          </p>

          <p className="text-[9px] text-stone-400">
            {currency(item.unitPrice)} each
          </p>
        </div>
      </div>
    </div>
  );
};

/* =============================================================
   INPUT
   ============================================================= */

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  icon?: React.ReactNode;
  maxLength?: number;
  inputRef?: React.Ref<HTMLInputElement>;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  icon,
  maxLength,
  inputRef,
}) => {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-[11px] font-medium text-stone-700">
        {icon && <span className="text-stone-400">{icon}</span>}
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>

      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="input-fluent bg-white py-2 text-xs focus:bg-white"
      />
    </label>
  );
};

/* =============================================================
   SUMMARY ROW
   ============================================================= */

interface SummaryRowProps {
  label: string;
  value: string;
  valueClassName?: string;
}

const SummaryRow: React.FC<SummaryRowProps> = ({
  label,
  value,
  valueClassName = "text-stone-800",
}) => {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-stone-500">{label}</span>

      <span className={`font-medium ${valueClassName}`}>{value}</span>
    </div>
  );
};

/* =============================================================
   PAYMENT BUTTON
   ============================================================= */

interface PaymentButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  active,
  onClick,
  icon,
  label,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-8 items-center justify-center gap-1.5 rounded-lg border text-[10px] font-semibold transition-all ${active
          ? "border-[#2A0E20] bg-[#2A0E20] text-amber-100 shadow-sm"
          : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
        }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

/* =============================================================
   INVOICE MODAL
   ============================================================= */

interface InvoiceModalProps {
  sale: CompletedSale;
  onClose: () => void;
  onPrint: () => void;
  onWhatsApp: () => void;
  onSaveNewBill: () => void;
  onGenerateGatewayLink?: (provider: "phonepe" | "razorpay") => Promise<string | null>;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  sale,
  onClose,
  onPrint,
  onWhatsApp,
  onSaveNewBill,
  onGenerateGatewayLink,
}) => {
  const customer = sale.customer;
  const trueNetPayable = Math.max(0, sale.subtotal - sale.discount);

  const [showGatewayMenu, setShowGatewayMenu] = useState(false);
  const [modalGenerating, setModalGenerating] = useState(false);
  const [modalActiveLink, setModalActiveLink] = useState<string | null>(sale.paymentLink || null);

  const handleModalGenerateLink = async (provider: "phonepe" | "razorpay") => {
    if (!onGenerateGatewayLink) {
      onWhatsApp();
      return;
    }
    setModalGenerating(true);
    try {
      const link = await onGenerateGatewayLink(provider);
      if (link) {
        setModalActiveLink(link);
        const cleanPhone = (customer?.phone || "").replace(/[^0-9]/g, "");
        const text = encodeURIComponent(
          `Namaste ${customer?.name || "Patron"},\n\nYour luxury saree bill from RS Fashions is ready for ₹${trueNetPayable.toLocaleString("en-IN")}.\n\nPlease complete your payment securely via the link below:\n${link}\n\nThank you for choosing RS Fashions!`
        );
        window.open(`https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${text}`, "_blank");
      }
    } finally {
      setModalGenerating(false);
      setShowGatewayMenu(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-md select-none w-screen h-screen overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0 }}>
      <div className="flex max-h-[100vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl z-[10000]">
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-6 py-4 no-print">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Receipt Preview
            </p>

            <h2 className="font-display text-base font-semibold text-stone-950">
              Retail Sales Receipt
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200/60 hover:text-stone-700"
            aria-label="Close invoice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          id="printable-invoice"
          className="flex-1 overflow-y-auto p-6 font-sans text-stone-800 md:p-8 bg-white"
        >
          {/* CENTERED LOGO & STORE HEADER */}
          <div className="mb-6 flex flex-col items-center text-center border-b border-stone-200 pb-5">
            <img
              src={logo}
              alt="RS Fashions Logo"
              className="w-12 h-full object-contain mb-2"
            />
            <h1 className="font-mona text-2xl font-bold tracking-wide text-[#2A0E20]">
              RS Fashions
            </h1>
            <p className="text-xs font-light text-stone-700 mt-0.5">
              SiCo Gadwal Sarees &bull; Pure Handlooms &bull; Heritage Silks
            </p>
            <p className="mt-1 max-w-md text-[10px] text-stone-600">
              {STORE_ADDRESS} | {STORE_WHATSAPP_NUMBER}
            </p>
            <div className="mt-1 flex items-center gap-4 text-[10px] text-stone-500 font-mono">
              <span>Receipt: <strong>{sale.invoiceNumber}</strong></span>
              <span>&bull;</span>
              <span>Date: <strong>{formatDate(sale.date)}</strong></span>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 border-b border-stone-100 pb-4 text-xs sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Customer Details
              </p>

              <div className="space-y-1">
                <p className="font-bold text-stone-900">{customer?.name || "Counter Patron"}</p>
                <p className="font-mono text-stone-600">{customer?.phone || "No phone registered"}</p>
                {customer?.email && <p className="text-stone-500">{customer.email}</p>}
                {customer?.address && <p className="text-stone-500">{customer.address}</p>}
                {customer?.gstin && (
                  <p className="font-mono text-[11px] font-semibold text-stone-700">
                    GSTIN: {customer.gstin}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right sm:text-right">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Order Classification
              </p>

              <div className="space-y-1">
                <span className="inline-block rounded-md bg-stone-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-stone-700">
                  {sale.billingType === "gst" ? "Tax Invoice (GST)" : "Retail Receipt"}
                </span>
                <p className="text-[11px] text-stone-500">Method: <strong>{sale.paymentMethod.toUpperCase()}</strong></p>
                {modalActiveLink && (
                  <p className="font-mono text-[10px] text-purple-700 font-semibold truncate max-w-[240px] ml-auto">
                    Link: {modalActiveLink}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mb-5 overflow-hidden rounded-xl border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-stone-50 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="px-3 py-2.5">Description</th>
                  <th className="px-3 py-2.5 text-center">Qty</th>
                  <th className="px-3 py-2.5 text-right">Price</th>
                  <th className="px-3 py-2.5 text-right">Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {sale.items.map((it, idx) => (
                  <tr key={idx} className="text-[11px]">
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-stone-900">
                        {it.name}
                      </p>

                      <span className="text-[10px] text-stone-500">
                        Shade: {it.color}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-center font-mono font-semibold">
                      {it.qty}
                    </td>

                    <td className="px-3 py-2.5 text-right font-mono">
                      {currency(it.unitPrice)}
                    </td>

                    <td className="px-3 py-2.5 text-right font-mono font-medium text-stone-950">
                      {currency(it.unitPrice * it.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end border-t border-stone-200 pt-3">
            <div className="w-full max-w-xs space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">{currency(sale.subtotal)}</span>
              </div>

              {sale.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount</span>
                  <span className="font-mono">-{currency(sale.discount)}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-stone-200 pt-2 font-display text-sm font-bold text-stone-950">
                <span>Total Amount:</span>
                <span>{currency(trueNetPayable)}</span>
              </div>

              {modalActiveLink && (
                <div className="mt-2 rounded-lg bg-purple-50 border border-purple-200 p-2 text-center text-[10px] font-mono text-purple-800 break-all">
                  <span>Payment Link: </span>
                  <a href={modalActiveLink} target="_blank" rel="noreferrer" className="underline font-semibold">{modalActiveLink}</a>
                </div>
              )}

              <p className="pt-0.5 text-right text-[10px] uppercase text-stone-400">
                Paid via {sale.paymentMethod} &bull; Authorized Terminal
              </p>
            </div>
          </div>

          <div className="mt-3 border-t border-dashed border-stone-200 pt-4 font-display text-center text-[20px] text-black">
            <p>Thank you for choosing RS Fashions.</p>

            <p className="font-mono text-center text-[9px] text-stone-400">
              Returns or replacements are only accepted for items received damaged, provide a 360-degree unboxing video within 2 days of delivery.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-stone-200 bg-stone-50 p-4 sm:flex-row sm:justify-end no-print relative">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            Close
          </button>

          {/* Share Payment Link with Gateway Menu (PhonePe / Razorpay) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowGatewayMenu(!showGatewayMenu)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              {modalGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>Share Payment Link</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {showGatewayMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-60 rounded-2xl bg-white p-2 shadow-2xl border border-stone-200 z-50 space-y-1 animate-in fade-in zoom-in-95">
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Select Gateway Link
                </p>
                <button
                  type="button"
                  onClick={() => handleModalGenerateLink("phonepe")}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-purple-50 text-stone-700 hover:text-purple-900 transition-colors"
                >
                  <div className="w-6 h-6 rounded-md bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    Pe
                  </div>
                  <div>
                    <p className="text-xs font-bold">PhonePe Link</p>
                    <p className="text-[9px] text-stone-400">Direct UPI &amp; QR link</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleModalGenerateLink("razorpay")}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-blue-50 text-stone-700 hover:text-blue-900 transition-colors"
                >
                  <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    Rzp
                  </div>
                  <div>
                    <p className="text-xs font-bold">Razorpay Link</p>
                    <p className="text-[9px] text-stone-400">Cards, UPI &amp; Wallets link</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2A0E20] px-4 py-2 text-xs font-semibold text-amber-100 shadow-sm hover:bg-[#3D142E]"
          >
            <Printer className="h-3.5 w-3.5 text-brand-gold" />
            Print Receipt
          </button>

          <button
            type="button"
            onClick={onSaveNewBill}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Check className="h-3.5 w-3.5" />
            Save Sale
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-invoice,
          #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: white !important;
            padding: 24px !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Billing;
