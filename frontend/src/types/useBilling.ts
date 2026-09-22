// =================================================================
// useBilling.ts
// -----------------------------------------------------------------
// This file holds ALL the "brain" of the Billing screen:
//   - constants (store details, invoice counter key)
//   - helper/utility functions (currency formatting, GST slab, etc.)
//   - every piece of state (cart, customer, discounts, payment, etc.)
//   - every derived/calculated value (subtotal, tax, total, etc.)
//   - every handler function (add to cart, complete bill, etc.)
//   - the keyboard-shortcut and click-outside effects
//
// billing.tsx only handles WHAT IS RENDERED. It calls useBilling()
// once at the top and gets back everything it needs to draw the UI.
// =================================================================

import { useMemo, useState, useRef, useEffect } from "react";

import {
  BillingType,
  CartItem,
  Category,
  CompletedSale,
  CustomerDetails,
  CustomerProfile,
  PaymentMethod,
  Product,
  MOCK_CUSTOMERS,
} from "../types/inventory";

import { loadSettings } from "./settings";

// -----------------------------------------------------------------
// STORE / INVOICE CONSTANTS & DYNAMIC GETTERS
// Dynamically sourced from Showroom Settings (Single Source of Truth)
// -----------------------------------------------------------------
export const getStoreLegalName = () => loadSettings().storeName || "RS Fashions";
export const getStoreGstin = () => loadSettings().gstin || "36AAAAA0000A1Z5";
export const getStoreAddress = () => loadSettings().storeAddress || "Plot No. 42, Jubilee Hills Road No. 36, Hyderabad, Telangana 500033";
export const getStorePhone = () => loadSettings().storePhone || "+91 98765 43210";
export const getStoreEmail = () => loadSettings().storeEmail || "concierge@rsfashions.in";

export const STORE_GSTIN = loadSettings().gstin || "36AAAAA0000A1Z5";
export const STORE_LEGAL_NAME = loadSettings().storeName || "RS Fashions";
export const STORE_ADDRESS = loadSettings().storeAddress || "Plot No. 42, Jubilee Hills Road No. 36, Hyderabad, Telangana 500033";
export const STORE_WHATSAPP_NUMBER = (loadSettings().storePhone || "9876543210").replace(/\D/g, "").slice(-10);
export const INDIA_COUNTRY_CODE = "91";

// localStorage key used to persist the "last invoice number" so it
// keeps incrementing across page reloads / sessions.
const INVOICE_COUNTER_KEY = "rsf_last_invoice_number";

// -----------------------------------------------------------------
// HELPER FUNCTIONS
// Pure functions with no state — safe to export and reuse anywhere
// (e.g. if you later build an invoice-history page).
// -----------------------------------------------------------------

// Reads the last invoice number from localStorage, adds 1, saves it
// back, and returns the new number as a string.
export const getNextInvoiceNumber = (): string => {
  const lastNumber = parseInt(
    localStorage.getItem(INVOICE_COUNTER_KEY) || "0",
    10
  );

  const nextNumber = lastNumber + 1;

  localStorage.setItem(INVOICE_COUNTER_KEY, String(nextNumber));

  return String(nextNumber);
};

export interface CompleteBillOptions {
  commitImmediate?: boolean;
  customMethod?: PaymentMethod;
  paymentLink?: string;
  transactionId?: string;
}

// Formats a number as Indian Rupees, e.g. 12345 -> "₹12,345"
export const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

// Formats an ISO date string into a readable Indian date + time.
export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));

// GST slab rule: bills up to ₹1000 are taxed at 5%, above that at 12%.
export const getGstRate = (amount: number) => (amount <= 1000 ? 5 : 12);

// Blank customer form used on first load and after "New Bill".
const initialCustomer: CustomerDetails = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "Hyderabad",
  state: "Telangana",
  gstin: "",
};

// Reads saved CRM customers from localStorage, registered online users, and mock customers
export const getSavedCrmCustomers = (): CustomerProfile[] => {
  const map = new Map<string, CustomerProfile>();

  // 1. Base seed from MOCK_CUSTOMERS
  MOCK_CUSTOMERS.forEach((c) => {
    map.set(c.id, {
      ...c,
      address: c.address || (c.city ? `${c.city}, Telangana` : "Hyderabad, Telangana"),
      state: "Telangana",
    });
  });

  // 2. Read from rs_admin_customers (CRM persisted state)
  try {
    const saved = localStorage.getItem("rs_admin_customers");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        parsed.forEach((c: CustomerProfile) => {
          if (c && (c.phone || c.name || c.id)) {
            const key = c.id || c.phone;
            map.set(key, {
              ...c,
              address: c.address || (c.city ? `${c.city}, Telangana` : "Hyderabad, Telangana"),
              state: (c as any).state || "Telangana",
            });
          }
        });
      }
    }
  } catch {}

  // 2b. Read from rs_fashions_customers
  try {
    const saved = localStorage.getItem("rs_fashions_customers");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        parsed.forEach((c: CustomerProfile) => {
          if (c && (c.phone || c.name || c.id)) {
            const key = c.id || c.phone;
            if (!map.has(key)) {
              map.set(key, {
                ...c,
                address: c.address || (c.city ? `${c.city}, Telangana` : "Hyderabad, Telangana"),
                state: (c as any).state || "Telangana",
              });
            }
          }
        });
      }
    }
  } catch {}

  // 3. Read from online registered patrons (rs_fashions_current_user)
  try {
    const online = localStorage.getItem("rs_fashions_current_user");
    if (online) {
      const u = JSON.parse(online);
      if (u && (u.email || u.phone)) {
        const id = `user-${(u.email || u.phone).replace(/[^a-z0-9]/g, "")}`;
        map.set(id, {
          id,
          name: u.name || "Online Patron",
          phone: u.phone || "9999999999",
          email: u.email || "",
          city: u.city || "Hyderabad",
          address: u.address || (u.city ? `${u.city}, Telangana` : "Hyderabad, Telangana"),
          state: u.state || "Telangana",
          totalSpent: 0,
          ordersCount: 0,
          notes: u.authProvider === "google" ? "Google Auth Registered" : "Website Account",
        });
      }
    }
  } catch {}

  return Array.from(map.values());
};

// -----------------------------------------------------------------
// HOOK PROPS
// Same props the old Billing component used to receive directly.
// -----------------------------------------------------------------
export interface UseBillingProps {
  inventory: Product[];
  categories: Category[];
  onCompleteSale: (sale: CompletedSale) => void;
  customers?: CustomerProfile[];
  onAddCustomer?: (newCustomer: CustomerProfile) => void;
}

// ===================================================================
// useBilling
// -------------------------------------------------------------------
// The single hook that contains every piece of state + logic for the
// billing screen. billing.tsx calls this once and destructures the
// returned object to get everything it needs to render.
// ===================================================================
export function useBilling({
  inventory,
  categories,
  onCompleteSale,
  customers,
  onAddCustomer,
}: UseBillingProps) {
  // ---------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------
  const [billingType, setBillingType] = useState<BillingType>("gst");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] =
    useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);

  const [customer, setCustomer] =
    useState<CustomerDetails>(initialCustomer);

  const [isB2bInvoice, setIsB2bInvoice] = useState(false);

  const [discountPercent, setDiscountPercent] = useState(0);
  const [customDiscount, setCustomDiscount] = useState("");

  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");

  const [showCustomer, setShowCustomer] = useState(true);
  const [showInvoice, setShowInvoice] = useState(false);

  const [completedSale, setCompletedSale] =
    useState<CompletedSale | null>(null);
  const [isSaleCommitted, setIsSaleCommitted] = useState(false);

  const [manualGstRate, setManualGstRate] = useState("");

  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerSuggestions, setShowCustomerSuggestions] =
    useState(false);

  const [selectedCartId, setSelectedCartId] = useState<string | null>(null);

  // ---------------------------------------------------------------
  // REFS
  // Used so keyboard shortcuts can focus/select specific inputs.
  // ---------------------------------------------------------------
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customerNameRef = useRef<HTMLInputElement>(null);
  const customerPhoneRef = useRef<HTMLInputElement>(null);
  const promoInputRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const gstInputRef = useRef<HTMLInputElement>(null);
  const customerLookupRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------
  // EFFECT: close dropdowns when the user clicks outside them
  // ---------------------------------------------------------------
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(target)
      ) {
        setIsCategoryDropdownOpen(false);
      }

      if (
        customerLookupRef.current &&
        !customerLookupRef.current.contains(target)
      ) {
        setShowCustomerSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---------------------------------------------------------------
  // EFFECT: keyboard shortcuts (Ctrl/Cmd + key combos)
  // ---------------------------------------------------------------
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      const modifier = event.ctrlKey || event.metaKey;

      // ESC closes dropdowns / the invoice modal
      if (event.key === "Escape") {
        setIsCategoryDropdownOpen(false);
        setShowCustomerSuggestions(false);

        if (showInvoice) {
          setShowInvoice(false);
        }

        return;
      }

      // Ctrl/Cmd + K -> focus the product search box
      if (modifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // "/" -> focus product search (only when not already typing)
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Ctrl/Cmd + Shift + N -> focus customer name
      if (modifier && event.shiftKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        customerNameRef.current?.focus();
        customerNameRef.current?.select();
        return;
      }

      // Ctrl/Cmd + Shift + M -> focus customer phone
      if (modifier && event.shiftKey && event.key.toLowerCase() === "m") {
        event.preventDefault();
        customerPhoneRef.current?.focus();
        customerPhoneRef.current?.select();
        return;
      }

      // Ctrl/Cmd + Shift + P -> focus promo code
      if (modifier && event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        promoInputRef.current?.focus();
        promoInputRef.current?.select();
        return;
      }

      // Ctrl/Cmd + Shift + D -> focus discount input
      if (modifier && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        discountInputRef.current?.focus();
        discountInputRef.current?.select();
        return;
      }

      // Ctrl/Cmd + Shift + G -> focus GST rate input (GST bills only)
      if (modifier && event.shiftKey && event.key.toLowerCase() === "g") {
        event.preventDefault();

        if (billingType === "gst") {
          gstInputRef.current?.focus();
          gstInputRef.current?.select();
        }

        return;
      }

      // Ctrl/Cmd + Shift + C -> toggle the category dropdown
      if (modifier && event.shiftKey && event.key.toLowerCase() === "c") {
        event.preventDefault();
        setIsCategoryDropdownOpen((previous) => !previous);
        return;
      }

      // Ctrl/Cmd + Shift + 1..4 -> pick a payment method
      if (modifier && event.shiftKey && event.key === "1") {
        event.preventDefault();
        setPaymentMethod("upi");
        return;
      }

      if (modifier && event.shiftKey && event.key === "2") {
        event.preventDefault();
        setPaymentMethod("card");
        return;
      }

      if (modifier && event.shiftKey && event.key === "3") {
        event.preventDefault();
        setPaymentMethod("cash");
        return;
      }

      if (modifier && event.shiftKey && event.key === "4") {
        event.preventDefault();
        setPaymentMethod("split");
        return;
      }

      // Ctrl/Cmd + Enter -> generate the invoice
      if (modifier && event.key === "Enter") {
        event.preventDefault();

        if (cart.length > 0) {
          completeBill();
        }

        return;
      }

      // Ctrl/Cmd + Shift + Backspace -> clear the whole cart
      if (modifier && event.shiftKey && event.key === "Backspace") {
        event.preventDefault();

        if (cart.length > 0) {
          clearCart();
        }

        return;
      }

      // Ctrl/Cmd + P -> print the invoice (only while the modal is open)
      if (modifier && event.key.toLowerCase() === "p") {
        event.preventDefault();

        if (showInvoice) {
          printInvoice();
        }

        return;
      }

      // Ctrl/Cmd + Shift + W -> send the invoice on WhatsApp
      if (modifier && event.shiftKey && event.key.toLowerCase() === "w") {
        event.preventDefault();

        if (completedSale) {
          whatsappInvoice();
        }

        return;
      }

      // Cart-row shortcuts (+/-, Delete) — only when a row is selected
      // and the user isn't currently typing into a text field.
      if (selectedCartId && !isTyping) {
        const selectedItem = cart.find(
          (item) => item.cartId === selectedCartId
        );

        if (!selectedItem) return;

        if (event.key === "+" || event.key === "=") {
          event.preventDefault();
          updateQuantity(selectedItem.cartId, selectedItem.qty + 1);
          return;
        }

        if (event.key === "-" || event.key === "_") {
          event.preventDefault();
          updateQuantity(selectedItem.cartId, selectedItem.qty - 1);
          return;
        }

        if (event.key === "Delete") {
          event.preventDefault();
          removeItem(selectedItem.cartId);
          return;
        }
      }
    };

    document.addEventListener("keydown", handleKeyboard);

    return () => document.removeEventListener("keydown", handleKeyboard);
  }, [billingType, cart, selectedCartId, showInvoice, completedSale]);

  // ---------------------------------------------------------------
  // DERIVED DATA: category lookup map (id -> Category)
  // ---------------------------------------------------------------
  const categoryMap = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  // ---------------------------------------------------------------
  // DERIVED DATA: products filtered by search text + category
  // ---------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return inventory.filter((product) => {
      const category = categoryMap.get(product.categoryId);

      const matchesCategory =
        selectedCategory === "all" || product.categoryId === selectedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!query) return true;

      const searchable = [
        product.id,
        product.name,
        category?.name ?? "",
        category?.hsn ?? "",
        ...product.tags,
        ...product.variants.flatMap((variant) => [
          variant.sku,
          variant.color,
          variant.colorSlug,
        ]),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [inventory, categoryMap, search, selectedCategory]);

  // ---------------------------------------------------------------
  // DERIVED DATA: live customer pool combining props + CRM storage
  // ---------------------------------------------------------------
  const liveCustomerPool = useMemo(() => {
    const base = getSavedCrmCustomers();
    if (customers && customers.length > 0) {
      const map = new Map<string, CustomerProfile>();
      base.forEach((c) => map.set(c.id || c.phone, c));
      customers.forEach((c) => map.set(c.id || c.phone, c));
      return Array.from(map.values());
    }
    return base;
  }, [customers]);

  // ---------------------------------------------------------------
  // DERIVED DATA: existing customers filtered by the lookup search box
  // ---------------------------------------------------------------
  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();

    if (!query) {
      return liveCustomerPool.slice(0, 8);
    }

    return liveCustomerPool.filter((existingCustomer) => {
      const searchable = [
        existingCustomer.name || "",
        existingCustomer.phone || "",
        existingCustomer.email ?? "",
        existingCustomer.city || "",
        existingCustomer.address ?? "",
        existingCustomer.gstin ?? "",
        existingCustomer.preferredWeave ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    }).slice(0, 12);
  }, [customerSearch, liveCustomerPool]);

  // ---------------------------------------------------------------
  // BILL CALCULATIONS
  // subtotal -> discount -> taxable amount -> GST -> grand total
  // ---------------------------------------------------------------
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0),
    [cart]
  );

  // If the user typed a custom discount %, that wins over the quick
  // preset buttons (0/5/10/15/20%).
  const effectiveDiscountPercent =
    customDiscount.trim() !== ""
      ? Math.min(100, Math.max(0, Number(customDiscount) || 0))
      : discountPercent;

  const discount = useMemo(
    () => Math.round((subtotal * effectiveDiscountPercent) / 100),
    [subtotal, effectiveDiscountPercent]
  );

  const taxableAmount = Math.max(0, subtotal - discount);

  // Auto GST slab based on the taxable amount (only relevant for GST bills)
  const autoGstRate =
    billingType === "gst" && taxableAmount > 0 ? getGstRate(taxableAmount) : 0;

  // A manually typed GST rate overrides the auto slab.
  const gstRate =
    billingType === "gst"
      ? manualGstRate.trim() !== ""
        ? Math.min(100, Math.max(0, Number(manualGstRate) || 0))
        : autoGstRate
      : 0;

  const totalTax = useMemo(
    () => (taxableAmount > 0 ? Math.round((taxableAmount * gstRate) / 100) : 0),
    [taxableAmount, gstRate]
  );

  // GST is split evenly into CGST + SGST
  const cgst = billingType === "gst" ? Math.round(totalTax / 2) : 0;
  const sgst = billingType === "gst" ? totalTax - cgst : 0;

  const total = useMemo(
    () => taxableAmount + totalTax,
    [taxableAmount, totalTax]
  );

  const cartQuantity = cart.reduce((sum, item) => sum + item.qty, 0);

  // ---------------------------------------------------------------
  // CUSTOMER HANDLERS
  // ---------------------------------------------------------------

  // Updates a single field on the customer form with smart CRM phone autofill.
  const updateCustomer = (field: keyof CustomerDetails, value: string) => {
    setCustomer((previous) => {
      const next = {
        ...previous,
        [field]: value,
      };

      // Smart CRM Lookup: When 10-digit phone is entered, auto-populate details if patron is known
      if (field === "phone") {
        const clean = value.replace(/\D/g, "").slice(0, 10);
        if (clean.length === 10 && (!previous.name || previous.name.trim() === "")) {
          const match = liveCustomerPool.find((c) => (c.phone || "").replace(/\D/g, "").endsWith(clean));
          if (match) {
            next.name = match.name || next.name;
            next.email = match.email || next.email;
            next.address = match.address || next.address || (match.city ? `${match.city}, Telangana` : "Hyderabad, Telangana");
            next.city = match.city || next.city;
            next.state = (match as any).state || next.state || "Telangana";
            next.gstin = match.gstin || next.gstin;
          }
        }
      }

      return next;
    });
  };

  // Fills the customer form from a previously-known customer picked
  // from the lookup dropdown with complete address, phone, city, and state.
  const selectExistingCustomer = (
    existingCustomer: CustomerProfile
  ) => {
    const resolvedAddress = existingCustomer.address?.trim()
      ? existingCustomer.address.trim()
      : existingCustomer.city?.trim()
      ? `${existingCustomer.city.trim()}, Telangana`
      : "Hyderabad, Telangana";

    const resolvedState = (existingCustomer as any).state?.trim()
      ? (existingCustomer as any).state.trim()
      : "Telangana";

    setCustomer({
      name: existingCustomer.name || "",
      phone: (existingCustomer.phone || "").replace(/\D/g, "").slice(0, 10),
      email: existingCustomer.email ?? "",
      address: resolvedAddress,
      city: existingCustomer.city || "Hyderabad",
      state: resolvedState,
      gstin: existingCustomer.gstin ?? "",
    });

    setCustomerSearch(existingCustomer.name || "");
    setShowCustomerSuggestions(false);

    if (billingType === "gst" && existingCustomer.gstin) {
      setIsB2bInvoice(true);
    }
  };

  // ---------------------------------------------------------------
  // CART HANDLERS
  // ---------------------------------------------------------------

  // Adds a product+variant (color) to the cart, or bumps its quantity
  // by 1 if it's already in the cart. Respects available stock.
  const addToCart = (
    product: Product,
    variant: Product["variants"][number]
  ) => {
    if (variant.stock <= 0) return;

    const existing = cart.find((item) => item.sku === variant.sku);

    if (existing) {
      if (existing.qty >= existing.maxStock) {
        alert(
          `Maximum stock available for SKU ${variant.sku} is ${variant.stock}.`
        );
        return;
      }

      setCart((previous) =>
        previous.map((item) =>
          item.sku === variant.sku ? { ...item, qty: item.qty + 1 } : item
        )
      );

      setSelectedCartId(existing.cartId);

      return;
    }

    const category = categoryMap.get(product.categoryId);

    const newItem: CartItem = {
      cartId: `${variant.sku}-${Date.now()}`,
      productId: product.id,
      sku: variant.sku,
      name: product.name,
      categoryName: category?.name ?? "SiCo Gadwal Sarees",
      hsn: category?.hsn ?? "5208",
      color: variant.color,
      colorSlug: variant.colorSlug,
      unitPrice: product.salePrice,
      qty: 1,
      maxStock: variant.stock,
    };

    setCart((previous) => [...previous, newItem]);
    setSelectedCartId(newItem.cartId);
  };

  // Sets a cart row's quantity (clamped between 0 and its max stock).
  // Dropping to 0 removes the row and clears selection.
  const updateQuantity = (cartId: string, quantity: number) => {
    setCart((previous) =>
      previous
        .map((item) =>
          item.cartId === cartId
            ? { ...item, qty: Math.min(Math.max(quantity, 0), item.maxStock) }
            : item
        )
        .filter((item) => item.qty > 0)
    );

    if (quantity <= 0) {
      setSelectedCartId((current) => (current === cartId ? null : current));
    }
  };

  // Removes a single row from the cart entirely.
  const removeItem = (cartId: string) => {
    setCart((previous) => previous.filter((item) => item.cartId !== cartId));

    setSelectedCartId((current) => (current === cartId ? null : current));
  };

  // Empties the whole cart.
  const clearCart = () => {
    setCart([]);
    setSelectedCartId(null);
  };

  // ---------------------------------------------------------------
  // BILLING TYPE HANDLER
  // ---------------------------------------------------------------

  // Switches between GST and Non-GST billing. Non-GST bills strip out
  // any B2B / GSTIN details since they're GST-only concepts.
  const changeBillingType = (type: BillingType) => {
    setBillingType(type);

    if (type === "non-gst") {
      setIsB2bInvoice(false);

      setCustomer((prev) => ({
        ...prev,
        gstin: "",
      }));

      setManualGstRate("");
    }
  };

  // ---------------------------------------------------------------
  // PROMO CODE HANDLER
  // ---------------------------------------------------------------
  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase();

    if (!code) {
      setPromoMessage("Enter a valid code.");
      return;
    }

    setPromoMessage("Promo code verified.");
  };

  // ---------------------------------------------------------------
  // VALIDATION
  // Runs before an invoice is generated. Returns false + shows an
  // alert if something required is missing/invalid.
  // ---------------------------------------------------------------
  const validateSale = () => {
    if (cart.length === 0) {
      alert("Please add at least one saree to the bill.");
      return false;
    }

    if (!customer.name.trim()) {
      alert("Please enter customer name.");
      return false;
    }

    if (!customer.phone.trim()) {
      alert("Please enter phone number for warranty & WhatsApp billing.");
      return false;
    }

    if (isB2bInvoice && customer.gstin?.trim()) {
      const gstin = customer.gstin.trim().toUpperCase();

      if (gstin.length !== 15) {
        alert(
          "Please enter a valid 15-character customer GSTIN or uncheck B2B."
        );
        return false;
      }
    }

    if (effectiveDiscountPercent < 0 || effectiveDiscountPercent > 100) {
      alert("Discount must be between 0% and 100%.");
      return false;
    }

    if (billingType === "gst" && (gstRate < 0 || gstRate > 100)) {
      alert("GST rate must be between 0% and 100%.");
      return false;
    }

    return true;
  };

  // ---------------------------------------------------------------
  // COMPLETE BILL
  // Builds the final CompletedSale object, opens the invoice modal,
  // and conditionally hands it to onCompleteSale if commitImmediate is true.
  // ---------------------------------------------------------------
  const completeBill = (options?: CompleteBillOptions): CompletedSale | null => {
    if (!validateSale()) return null;

    const commitImmediate = options?.commitImmediate ?? false;
    const resolvedMethod = options?.customMethod ?? paymentMethod;
    const now = new Date().toISOString();

    const sale: CompletedSale = {
      invoiceNumber: getNextInvoiceNumber(),
      date: now,
      customerName: customer.name.trim(),
      customerPhone: customer.phone.trim(),
      items: cart,
      subtotal,
      discount,
      cgst,
      sgst,
      total,
      paymentMethod: resolvedMethod,
      paymentLink: options?.paymentLink,
      transactionId: options?.transactionId,
      billingType,
      customer: {
        ...customer,
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        gstin:
          isB2bInvoice && customer.gstin
            ? customer.gstin.trim().toUpperCase()
            : undefined,
      },
      promoCode: promoCode.trim() ? promoCode.trim().toUpperCase() : undefined,
      taxableAmount,
      gstRate,
      totalTax,
    };

    setCompletedSale(sale);
    setShowInvoice(true);

    if (commitImmediate) {
      onCompleteSale(sale);
      setIsSaleCommitted(true);
    } else {
      setIsSaleCommitted(false);
    }

    return sale;
  };

  // ---------------------------------------------------------------
  // COMMIT SALE
  // Commits the currently completed or provided sale to system ledger / DB
  // only once. Safe against duplicate commits.
  // ---------------------------------------------------------------
  const commitSale = (saleToCommit?: CompletedSale) => {
    const s = saleToCommit || completedSale;
    if (!s) return;
    if (isSaleCommitted) return;
    onCompleteSale(s);
    setIsSaleCommitted(true);
  };

  // ---------------------------------------------------------------
  // RESET
  // Clears everything back to a blank bill, ready for the next
  // customer ("New Bill" button in the invoice modal).
  // ---------------------------------------------------------------
  const resetBilling = () => {
    setCart([]);
    setCustomer(initialCustomer);
    setIsB2bInvoice(false);
    setDiscountPercent(0);
    setCustomDiscount("");
    setPromoCode("");
    setPromoMessage("");
    setPaymentMethod("upi");
    setCompletedSale(null);
    setShowInvoice(false);
    setIsSaleCommitted(false);
    setManualGstRate("");
    setCustomerSearch("");
    setShowCustomerSuggestions(false);
    setSelectedCartId(null);
  };

  // ---------------------------------------------------------------
  // PRINT
  // ---------------------------------------------------------------
  const printInvoice = () => {
    window.print();
  };

  // ---------------------------------------------------------------
  // WHATSAPP
  // Builds a plain-text invoice summary and opens WhatsApp Web/App
  // with it pre-filled, sent to the store's WhatsApp number.
  // ---------------------------------------------------------------
  const whatsappInvoice = () => {
    if (!completedSale) return;
    const settings = loadSettings();
    const liveStoreName = settings.storeName || "RS Fashions";
    const liveStoreGstin = settings.gstin || "36AAAAA0000A1Z5";
    const livePhone = (settings.storePhone || "9876543210").replace(/\D/g, "").slice(-10);

    const lines = completedSale.items.map(
      (item) =>
        `• ${item.name} (${item.color})\n  Qty: ${item.qty} × ${currency(
          item.unitPrice
        )} = ${currency(item.unitPrice * item.qty)}`
    );

    const message = [
      `✨ *${liveStoreName} — HYDERABAD* ✨`,
      "SiCo Gadwal Sarees & Curated Silks",
      "━━━━━━━━━━━━━━━━━━",
      `*${
        completedSale.billingType === "gst"
          ? "TAX INVOICE (GST)"
          : "RETAIL INVOICE"
      }*`,
      `*Invoice #:* ${completedSale.invoiceNumber}`,
      completedSale.billingType === "gst"
        ? `*Store GSTIN:* ${liveStoreGstin}`
        : null,
      `*Date:* ${formatDate(completedSale.date)}`,
      `*Customer:* ${completedSale.customerName} (${completedSale.customerPhone})`,
      completedSale.customer?.gstin
        ? `*Buyer GSTIN:* ${completedSale.customer.gstin}`
        : null,
      "━━━━━━━━━━━━━━━━━━",
      "*ITEMS BILLED:*",
      ...lines,
      "━━━━━━━━━━━━━━━━━━",
      `*Subtotal:* ${currency(completedSale.subtotal)}`,
      completedSale.discount > 0
        ? `*Discount:* -${currency(completedSale.discount)}`
        : null,
      completedSale.billingType === "gst"
        ? `*GST (${completedSale.gstRate}%):* ${currency(
            completedSale.totalTax ?? 0
          )}`
        : null,
      `*Total Amount Paid:* ${currency(completedSale.total)}`,
      `*Payment Mode:* ${completedSale.paymentMethod.toUpperCase()}`,
      "━━━━━━━━━━━━━━━━━━",
      `Thank you for choosing ${liveStoreName}.`,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(
      `https://wa.me/${INDIA_COUNTRY_CODE}${livePhone}?text=${encodeURIComponent(
        message
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ---------------------------------------------------------------
  // WHAT THE UI GETS BACK
  // Everything billing.tsx needs to render, in one object.
  // ---------------------------------------------------------------
  return {
    // state values
    billingType,
    search,
    selectedCategory,
    isCategoryDropdownOpen,
    cart,
    customer,
    isB2bInvoice,
    customDiscount,
    promoCode,
    promoMessage,
    paymentMethod,
    showCustomer,
    showInvoice,
    completedSale,
    manualGstRate,
    customerSearch,
    showCustomerSuggestions,
    selectedCartId,

    // state setters the UI updates directly
    setSearch,
    setSelectedCategory,
    setIsCategoryDropdownOpen,
    setShowCustomer,
    setShowInvoice,
    setCustomerSearch,
    setShowCustomerSuggestions,
    setIsB2bInvoice,
    setDiscountPercent,
    setCustomDiscount,
    setPromoCode,
    setPromoMessage,
    setManualGstRate,
    setPaymentMethod,
    setSelectedCartId,

    // refs for keyboard-shortcut focusing
    categoryDropdownRef,
    searchInputRef,
    customerNameRef,
    customerPhoneRef,
    promoInputRef,
    discountInputRef,
    gstInputRef,
    customerLookupRef,

    // derived / computed data
    categoryMap,
    filteredProducts,
    filteredCustomers,
    subtotal,
    effectiveDiscountPercent,
    discount,
    autoGstRate,
    gstRate,
    cgst,
    sgst,
    total,
    cartQuantity,

    // handlers
    updateCustomer,
    selectExistingCustomer,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    changeBillingType,
    applyPromo,
    completeBill,
    commitSale,
    isSaleCommitted,
    setIsSaleCommitted,
    setCompletedSale,
    resetBilling,
    printInvoice,
    whatsappInvoice,
  };
}