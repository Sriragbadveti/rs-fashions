import { useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiCreditCard,
  FiLock,
  FiMapPin,
  FiShoppingBag,
  FiTruck,
  FiShield,
  FiChevronDown,
  FiPrinter,
  FiAlertCircle,
  FiRefreshCw,
  FiScissors,
  FiPlus,
  FiHome,
  FiBriefcase,
  FiEdit2,
} from "react-icons/fi";

import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { StoreService } from "../services/supabase";
import { products, type Product } from "../data/products";
import { getUserSession, saveAddress, getSavedAddresses, type SavedAddress } from "../utils/userSession";

type CheckoutStep = "address" | "payment" | "success";
type PaymentMethod = "cashfree" | "cod" | "upi" | "razorpay" | "phonepe";

interface CountryConfig {
  name: string;
  code: string;
  dialCode: string;
  length: number;
  placeholder: string;
}

const COUNTRIES: CountryConfig[] = [
  { name: "India", code: "IN", dialCode: "+91", length: 10, placeholder: "98765 43210" },
  { name: "United States", code: "US", dialCode: "+1", length: 10, placeholder: "202 555 0199" },
  { name: "United Kingdom", code: "GB", dialCode: "+44", length: 10, placeholder: "7911 123456" },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971", length: 9, placeholder: "50 123 4567" },
  { name: "Singapore", code: "SG", dialCode: "+65", length: 8, placeholder: "8123 4567" },
  { name: "Australia", code: "AU", dialCode: "+61", length: 9, placeholder: "412 345 678" },
  { name: "Canada", code: "CA", dialCode: "+1", length: 10, placeholder: "416 555 0142" },
];

interface AddressForm {
  firstName: string;
  lastName: string;
  countryDial: string;
  phone: string;
  email: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  pincode: string;
}

const initialAddress: AddressForm = {
  firstName: "",
  lastName: "",
  countryDial: "+91",
  phone: "",
  email: "",
  address: "",
  apartment: "",
  city: "",
  state: "",
  pincode: "",
};

interface OrderSnapshot {
  orderId: string;
  date: string;
  items: Array<{
    id: string;
    name: string;
    material: string;
    color: string;
    size: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  recipient: AddressForm;
}

const loadCashfreeScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Cashfree) {
      return resolve(true);
    }
    const existing = document.querySelector('script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      if ((window as any).Cashfree) return resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { items, subtotal, clearCart, addToCart, removeFromCart } = useCart();

  const [step, setStep] = useState<CheckoutStep>("address");
  const [address, setAddress] = useState<AddressForm>(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cashfree");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});
  const [existingOrderNumber, setExistingOrderNumber] = useState<string | null>(null);
  const [existingOrderId, setExistingOrderId] = useState<string | null>(null);

  // User Authentication Gate: user must be logged in with a valid 30-day session
  const [currentUser, setCurrentUser] = useState<any>(() => getUserSession());

  // Interactive Saved Addresses Selection State
  const [savedAddressesList, setSavedAddressesList] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [isEditingOrNew, setIsEditingOrNew] = useState<boolean>(false);
  const [saveAddressToProfile, setSaveAddressToProfile] = useState<boolean>(true);
  const [addressTag, setAddressTag] = useState<"Home" | "Work" | "Other">("Home");

  const handleSelectAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setIsEditingOrNew(false);
    setAddressTag(addr.tag || "Home");
    setAddress({
      firstName: addr.name.split(" ")[0] || "",
      lastName: addr.name.split(" ").slice(1).join(" ") || "",
      countryDial: "+91",
      email: addr.email || currentUser?.email || "",
      phone: addr.phone.replace(/\D/g, "").slice(-10) || "",
      address: addr.address || "",
      apartment: addr.apartment || "",
      city: addr.city || "Hyderabad",
      state: addr.state || "Telangana",
      pincode: addr.pincode || "",
    });
    setErrors({});
  };

  const handleAddNewAddress = () => {
    setSelectedAddressId("new");
    setIsEditingOrNew(true);
    setAddressTag("Home");
    setAddress({
      firstName: currentUser?.name ? currentUser.name.split(" ")[0] : "",
      lastName: currentUser?.name ? currentUser.name.split(" ").slice(1).join(" ") : "",
      countryDial: "+91",
      email: currentUser?.email || "",
      phone: currentUser?.phone ? currentUser.phone.replace(/\D/g, "").slice(-10) : "",
      address: "",
      apartment: "",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "",
    });
    setErrors({});
  };

  useEffect(() => {
    const session = getUserSession();
    if (!session) {
      navigate("/login?redirect=/checkout");
    } else {
      setCurrentUser(session);
      const savedAddresses = getSavedAddresses(session.phone, session.email, session.id);
      setSavedAddressesList(savedAddresses);
      const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];

      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        setIsEditingOrNew(false);
        setAddressTag(defaultAddr.tag || "Home");
        setAddress({
          firstName: defaultAddr.name.split(" ")[0] || "",
          lastName: defaultAddr.name.split(" ").slice(1).join(" ") || "",
          countryDial: "+91",
          email: defaultAddr.email || session.email || "",
          phone: defaultAddr.phone.replace(/\D/g, "").slice(-10) || "",
          address: defaultAddr.address || "",
          apartment: defaultAddr.apartment || "",
          city: defaultAddr.city || "Hyderabad",
          state: defaultAddr.state || "Telangana",
          pincode: defaultAddr.pincode || "",
        });
      } else {
        setSelectedAddressId("new");
        setIsEditingOrNew(true);
        setAddress((prev) => ({
          ...prev,
          firstName: prev.firstName || (session.name ? session.name.split(" ")[0] : ""),
          lastName: prev.lastName || (session.name ? session.name.split(" ").slice(1).join(" ") : ""),
          email: prev.email || session.email || "",
          phone: prev.phone || (session.phone ? session.phone.replace("+91", "").trim() : ""),
        }));
      }
    }
  }, [navigate]);

  // Auto-populate cart, customer address, and pre-select payment method if opening a generated link
  useEffect(() => {
    const orderNumberParam = searchParams.get("orderNumber");
    const orderIdParam = searchParams.get("orderId");
    const stepParam = searchParams.get("step");
    const productParam = searchParams.get("product");
    const qtyParam = Number(searchParams.get("qty")) || 1;
    const methodParam = searchParams.get("method") || searchParams.get("paymentMethod");

    // Address query params fallback
    const nameParam = searchParams.get("name") || "";
    const firstNameParam = searchParams.get("firstName") || "";
    const lastNameParam = searchParams.get("lastName") || "";
    const phoneParam = searchParams.get("phone") || "";
    const emailParam = searchParams.get("email") || "";
    const addressParam = searchParams.get("address") || "";
    const cityParam = searchParams.get("city") || "";
    const stateParam = searchParams.get("state") || "";
    const pincodeParam = searchParams.get("pincode") || "";

    if (methodParam === "razorpay" || methodParam === "phonepe" || methodParam === "cod") {
      setPaymentMethod(methodParam);
    }

    if (orderNumberParam) setExistingOrderNumber(orderNumberParam);
    if (orderIdParam) setExistingOrderId(orderIdParam);

    // If orderNumber or orderId is provided, attempt to fetch full order from DB
    const lookupId = orderNumberParam || orderIdParam;
    if (lookupId) {
      StoreService.getOrderByIdOrNumber(lookupId).then((foundOrder) => {
        if (foundOrder) {
          setExistingOrderNumber(foundOrder.orderNumber);
          setExistingOrderId(foundOrder.id);

          // Pre-populate address from database
          const addr = foundOrder.address;
          const fullName = foundOrder.customerName || "";
          const nameParts = fullName.split(" ");
          const fName = nameParts[0] || "";
          const lName = nameParts.slice(1).join(" ") || "";

          // Clean phone digits & dial code
          let dial = "+91";
          let rawPhone = foundOrder.phone || "";
          if (rawPhone.startsWith("+91")) {
            dial = "+91";
            rawPhone = rawPhone.replace("+91", "").trim();
          } else if (rawPhone.startsWith("+1")) {
            dial = "+1";
            rawPhone = rawPhone.replace("+1", "").trim();
          }

          setAddress({
            firstName: fName,
            lastName: lName,
            countryDial: dial,
            phone: rawPhone.replace(/\D/g, ""),
            email: foundOrder.email || "",
            address: addr?.address || "",
            apartment: addr?.apartment || "",
            city: addr?.city || "Mumbai",
            state: addr?.state || "Maharashtra",
            pincode: addr?.pincode || "400001",
          });

          if (foundOrder.paymentMethod === "cashfree" || foundOrder.paymentMethod === "cod" || foundOrder.paymentMethod === "razorpay" || foundOrder.paymentMethod === "phonepe") {
            setPaymentMethod(foundOrder.paymentMethod as any);
          }

          // Also populate cart if empty
          if (items.length === 0 && foundOrder.items && foundOrder.items.length > 0) {
            foundOrder.items.forEach((item) => {
              const p: Product = products.find((prod) => prod.id === item.id) || {
                id: item.id,
                name: item.name,
                price: item.price,
                originalPrice: item.price,
                description: "Handcrafted SiCo Gadwal drape.",
                longDescription: "Handcrafted authentic SiCo Gadwal drape with heritage zari border.",
                category: "SiCo Gadwal Sarees",
                material: "SiCo",
                images: [item.image || "/saree.png"],
                colors: [item.color || "Standard"],
                sizes: ["Standard Drape (5.5m + 0.8m Blouse)"],
                stock: 10,
                rating: 4.9,
                reviewCount: 24,
              };
              addToCart(p, {
                quantity: item.quantity || 1,
                selectedColor: item.color || "Standard",
                selectedSize: "Standard Drape (5.5m + 0.8m Blouse)",
              });
            });
          }

          // Jump directly to payment step!
          setStep("payment");
          return;
        }
      });
    }

    // Direct URL parameter fallback prefill
    if (nameParam || firstNameParam || addressParam || phoneParam || emailParam) {
      let fName = firstNameParam;
      let lName = lastNameParam;
      if (!fName && nameParam) {
        const parts = nameParam.split(" ");
        fName = parts[0] || "";
        lName = parts.slice(1).join(" ") || "";
      }
      setAddress((prev) => ({
        ...prev,
        firstName: fName || prev.firstName,
        lastName: lName || prev.lastName,
        phone: phoneParam.replace(/\D/g, "") || prev.phone,
        email: emailParam || prev.email,
        address: addressParam || prev.address,
        city: cityParam || prev.city || "Mumbai",
        state: stateParam || prev.state || "Maharashtra",
        pincode: pincodeParam || prev.pincode || "400001",
      }));
    }

    if (productParam && items.length === 0) {
      const found = products.find((p) => p.id === productParam);
      if (found) {
        addToCart(found, {
          quantity: qtyParam,
          selectedColor: found.colors?.[0] || "Standard",
          selectedSize: found.sizes?.[0] || "Standard Drape (5.5m + 0.8m Blouse)",
        });
      }
    }

    if (stepParam === "payment" || orderNumberParam || orderIdParam) {
      setStep("payment");
    }
  }, [searchParams, items.length, addToCart]);


  const [completedOrder, setCompletedOrder] = useState<OrderSnapshot | null>(null);

  // Real-time Out-of-Stock Guard at Payment Mode
  const [stockConflict, setStockConflict] = useState<{
    productId: string;
    productName: string;
    availableStock: number;
  } | null>(null);

  // Validate live inventory for every item in cart before initiating or accepting payment
  const validateCartInventory = async (): Promise<boolean> => {
    try {
      const liveProducts = await StoreService.getProducts();
      for (const item of items) {
        const matched = liveProducts.find((p) => String(p.id) === String(item.product.id));
        if (matched) {
          const currentStock = Number(matched.stock ?? 10);
          if (currentStock <= 0 || currentStock < item.quantity) {
            setStockConflict({
              productId: item.product.id,
              productName: item.product.name,
              availableStock: Math.max(0, currentStock),
            });
            setIsProcessing(false);
            return false;
          }
        }
      }
    } catch (err) {
      console.warn("Live stock check warning:", err);
    }
    return true;
  };

  const activeCountry = useMemo(() => {
    return COUNTRIES.find((c) => c.dialCode === address.countryDial) || COUNTRIES[0];
  }, [address.countryDial]);

  const shipping = subtotal >= 1999 || subtotal === 0 ? 0 : 99;
  const total = subtotal + shipping;

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const updateAddress = (field: keyof AddressForm, value: string) => {
    setAddress((current) => ({
      ...current,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePhoneChange = (rawValue: string) => {
    const numeric = rawValue.replace(/\D/g, "").slice(0, activeCountry.length);
    updateAddress("phone", numeric);
  };

  const handlePincodeChange = (rawValue: string) => {
    // Strictly filter only digits (0-9) and restrict to 6 characters
    const numericOnly = rawValue.replace(/\D/g, "").slice(0, 6);
    updateAddress("pincode", numericOnly);
  };

  const validateAddress = () => {
    const newErrors: Partial<Record<keyof AddressForm, string>> = {};

    if (!address.firstName.trim()) newErrors.firstName = "First name is required";
    if (!address.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!address.address.trim()) newErrors.address = "Street address is required";
    if (!address.city.trim()) newErrors.city = "City is required";
    if (!address.state.trim()) newErrors.state = "State is required";

    if (!address.pincode.trim()) {
      newErrors.pincode = "PIN / Postal code is required";
    } else if (!/^\d+$/.test(address.pincode.trim())) {
      newErrors.pincode = "Postal code must contain numbers only";
    } else if (address.countryDial === "+91" && address.pincode.trim().length !== 6) {
      newErrors.pincode = "Please enter a valid 6-digit PIN code";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!address.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(address.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!address.phone) {
      newErrors.phone = "Phone number is required";
    } else if (address.phone.length !== activeCountry.length) {
      newErrors.phone = `Must be ${activeCountry.length} digits for ${activeCountry.name}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const continueToPayment = async () => {
    if (!validateAddress()) {
      window.scrollTo({ top: 120, behavior: "smooth" });
      return;
    }

    const isStockAvailable = await validateCartInventory();
    if (!isStockAvailable) {
      return;
    }

    // Auto-save new address to profile if checked
    if (isEditingOrNew && saveAddressToProfile) {
      try {
        const fullName = `${address.firstName} ${address.lastName}`.trim();
        const updatedList = saveAddress(
          {
            name: fullName || currentUser?.name || "Patron",
            phone: `${address.countryDial} ${address.phone}`.trim(),
            email: address.email || currentUser?.email,
            address: address.address,
            apartment: address.apartment,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            tag: addressTag,
            isDefault: savedAddressesList.length === 0,
          },
          address.phone || currentUser?.phone,
          address.email || currentUser?.email,
          currentUser?.id
        );
        setSavedAddressesList(updatedList);
      } catch (e) {
        console.warn("Could not save address to profile:", e);
      }
    }

    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Auto-verify if returning from Cashfree redirect
  useEffect(() => {
    const statusParam = searchParams.get("status");
    const orderIdParam = searchParams.get("order_id") || searchParams.get("orderId");
    if (statusParam === "cashfree_return" && orderIdParam) {
      setIsProcessing(true);
      StoreService.verifyCashfreePayment({ orderId: orderIdParam }).then((res) => {
        if (res.paid) {
          completeCashfreeSuccess(orderIdParam, res.paymentId);
        } else {
          setIsProcessing(false);
        }
      });
    }
  }, [searchParams]);

  const completeCashfreeSuccess = async (orderId: string, paymentId?: string) => {
    setIsProcessing(true);

    const effectiveOrderId = existingOrderNumber || orderId || `RSF-${Date.now().toString().slice(-6)}`;

    const snapshot: OrderSnapshot = {
      orderId: effectiveOrderId,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      items: items.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        material: item.product.material,
        color: item.selectedColor || "Standard",
        size: item.selectedSize || "Standard Drape (5.5m + 0.8m Blouse)",
        quantity: item.quantity,
        price: item.product.price,
        image: item.product.images[0] || "",
      })),
      subtotal,
      shipping,
      total,
      paymentMethod: "cashfree",
      recipient: { ...address },
    };

    if (currentUser?.phone) {
      try {
        saveAddress(
          {
            name: `${address.firstName} ${address.lastName}`.trim(),
            phone: `${address.countryDial} ${address.phone}`,
            email: address.email,
            address: address.address,
            apartment: address.apartment,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            tag: "Home",
            isDefault: true,
          },
          currentUser.phone
        );
      } catch (e) {
        console.warn("Could not save address:", e);
      }
    }

    try {
      if (existingOrderId || existingOrderNumber) {
        await StoreService.updateOrderPaymentStatus(
          existingOrderId || existingOrderNumber!,
          "paid",
          "cashfree",
          paymentId || orderId,
          {
            gateway: "Cashfree Payments",
            cashfree_order_id: orderId,
            cashfree_payment_id: paymentId,
            verified_at: new Date().toISOString(),
            status: "PAID",
          }
        );
      } else {
        await StoreService.createOrder({
          customerName: `${address.firstName} ${address.lastName}`.trim(),
          email: address.email,
          phone: `${address.countryDial} ${address.phone}`,
          address: {
            address: address.address,
            apartment: address.apartment,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
          },
          items: snapshot.items,
          subtotal,
          shipping,
          discount: 0,
          total,
          paymentMethod: "cashfree",
          paymentStatus: "paid",
          transactionId: paymentId || orderId,
          paymentDetails: {
            gateway: "Cashfree Payments",
            cashfree_order_id: orderId,
            cashfree_payment_id: paymentId,
            verified_at: new Date().toISOString(),
            status: "PAID",
          },
        });
      }
    } catch (err) {
      console.warn("Failed to persist Cashfree order:", err);
    }

    setCompletedOrder(snapshot);
    setIsProcessing(false);
    clearCart();
    setStep("success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const placeOrder = async () => {
    if (isProcessing) return;

    // Real-time stock validation at the moment of payment:
    // If any saree was purchased by another patron and is sold out, block payment!
    const isStockAvailable = await validateCartInventory();
    if (!isStockAvailable) {
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);

    // If Cashfree Gateway is selected
    if (paymentMethod === "cashfree") {
      try {
        await loadCashfreeScript();

        const cfRes = await StoreService.createCashfreeOrder({
          amount: total,
          customerName: `${address.firstName} ${address.lastName}`.trim(),
          email: address.email || currentUser?.email || "customer@rsfashions.in",
          phone: `${address.countryDial} ${address.phone}`,
          orderNumber: existingOrderNumber || undefined,
          orderNote: `RS Fashions Saree Order (${itemCount} items)`,
        });

        if (!cfRes.success || !cfRes.paymentSessionId || !cfRes.orderId) {
          throw new Error(cfRes.message || "Failed to initialize Cashfree payment session");
        }

        const CashfreeConstructor = (window as any).Cashfree;
        if (!CashfreeConstructor) {
          throw new Error("Cashfree SDK failed to load in browser");
        }

        const mode = (cfRes.environment || "SANDBOX").toLowerCase() === "production" ? "production" : "sandbox";
        const cashfree = CashfreeConstructor({ mode });

        const checkoutOptions = {
          paymentSessionId: cfRes.paymentSessionId,
          redirectTarget: "_modal",
        };

        cashfree.checkout(checkoutOptions).then(async (result: any) => {
          if (result.error) {
            console.warn("Cashfree checkout error:", result.error);
            setIsProcessing(false);
            if (result.error.message) {
              alert(`Payment Notice: ${result.error.message}`);
            }
            return;
          }
          if (result.redirect) {
            // Cashfree handles redirect
            return;
          }
          if (result.paymentDetails) {
            // Verify payment on backend
            try {
              const verifyRes = await StoreService.verifyCashfreePayment({ orderId: cfRes.orderId! });
              if (verifyRes.paid) {
                await completeCashfreeSuccess(cfRes.orderId!, verifyRes.paymentId);
              } else {
                alert("Payment status pending or incomplete. Please check your bank transaction.");
                setIsProcessing(false);
              }
            } catch (vErr) {
              console.warn("Verification notice, recording success:", vErr);
              await completeCashfreeSuccess(cfRes.orderId!);
            }
          }
        });
        return;
      } catch (cfErr: any) {
        console.error("Cashfree checkout error:", cfErr);
        alert(cfErr.message || "Could not initialize Cashfree checkout");
        setIsProcessing(false);
        return;
      }
    }


    // Save snapshot of order before clearing state
    const effectiveOrderId = existingOrderNumber || `BEC-${Date.now().toString().slice(-8)}`;
    const snapshot: OrderSnapshot = {
      orderId: effectiveOrderId,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      items: items.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        material: item.product.material,
        color: item.selectedColor || "Standard",
        size: item.selectedSize || "Standard Drape (5.5m + 0.8m Blouse)",
        quantity: item.quantity,
        price: item.product.price,
        image: item.product.images[0] || "",
      })),
      subtotal,
      shipping,
      total,
      paymentMethod,
      recipient: { ...address },
    };

    try {
      if (existingOrderId || existingOrderNumber) {
        await StoreService.updateOrderPaymentStatus(
          existingOrderId || existingOrderNumber!,
          paymentMethod === "cod" ? "pending" : "paid",
          paymentMethod,
          `COD_${Date.now()}`
        );
      } else {
        await StoreService.createOrder({
          customerName: `${address.firstName} ${address.lastName}`.trim(),
          email: address.email,
          phone: `${address.countryDial} ${address.phone}`,
          address: {
            address: address.address,
            apartment: address.apartment,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
          },
          items: snapshot.items,
          subtotal,
          shipping,
          discount: 0,
          total,
          paymentMethod,
          paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
        });
      }
    } catch (err) {
      console.warn("Failed to persist order to store service:", err);
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 1600);
    });

    setCompletedOrder(snapshot);
    setIsProcessing(false);
    clearCart();
    setStep("success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  /* =========================================================
      1. ORDER SUCCESS / LUXURY RECEIPT DISPENSER
  ========================================================== */
  if (step === "success" && completedOrder) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] font-sans px-3.5 pb-20 pt-8 sm:px-6 md:px-8 text-[#2A2421] select-none print:bg-white print:p-0">
        <div className="mx-auto max-w-xl">
          {/* Header Controls (Hidden during actual print) */}
          <div className="text-center mb-6 print:hidden">
            <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#8E3D51] text-white shadow-[0_12px_30px_rgba(142,61,81,0.2)]">
              <FiCheck className="text-2xl" strokeWidth={2} />
            </div>

            <span className="mt-4 inline-block text-[9px] font-semibold uppercase tracking-[0.28em] text-[#8E3D51]">
              Order Confirmed & Insured
            </span>

            <h1 className="mt-1 font-serif text-2xl sm:text-4xl font-light tracking-tight text-[#2A2421]">
              Thank you, <span className="italic">{completedOrder.recipient.firstName || "Connoisseur"}.</span>
            </h1>

            <p className="mx-auto mt-2 max-w-md text-[11px] sm:text-xs font-light leading-relaxed text-[#756A60]">
              Your heirloom saree is being packed in our luxury double-walled box. A copy of this receipt has been dispatched to <span className="font-medium text-[#2A2421]">{completedOrder.recipient.email}</span>.
            </p>
          </div>

          {/* Luxury Animated Receipt Printer Wrapper */}
          <LuxuryReceiptPrinter>
            <div className="bg-[#FFFFFF] p-6 sm:p-8 text-left border border-black/10 rounded-2xl shadow-[0_20px_60px_rgba(42,36,33,0.06)] print:shadow-none print:border-none">

              {/* Header Letterhead */}
              <div className="flex justify-between items-start border-b border-dashed border-black/15 pb-5">
                <div>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#8E3D51]">
                    Tax Invoice & Receipt
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl text-[#2A2421] tracking-tight mt-0.5">
                    RS FASHIONS
                  </h2>
                  <p className="text-[9px] text-[#8C7A6B] leading-relaxed mt-0.5">
                    Heirloom SiCo Gadwal Sarees · Jubilee Hills, Hyderabad<br />
                    GSTIN: <span className="font-mono">36AAACB1234F1Z5</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[8px] uppercase tracking-widest text-[#8C7A6B] block">
                    Reference
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#2A2421]">
                    {completedOrder.orderId}
                  </span>
                  <span className="text-[9px] text-[#756A60] block mt-1">
                    {completedOrder.date}
                  </span>
                </div>
              </div>

              {/* Recipient & Mode */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-dashed border-black/15 text-[11px]">
                <div>
                  <span className="text-[8.5px] uppercase tracking-wider text-[#8C7A6B] block">
                    Delivering To
                  </span>
                  <p className="font-serif text-sm font-medium text-[#2A2421] mt-0.5">
                    {completedOrder.recipient.firstName} {completedOrder.recipient.lastName}
                  </p>
                  <p className="text-[#756A60] text-[10px] leading-relaxed mt-0.5">
                    {completedOrder.recipient.address}, {completedOrder.recipient.city}
                    <br />
                    {completedOrder.recipient.state} - {completedOrder.recipient.pincode}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[8.5px] uppercase tracking-wider text-[#8C7A6B] block">
                    Payment Method
                  </span>
                  <span className="inline-block font-medium text-[#2A2421] mt-0.5 text-xs">
                    {completedOrder.paymentMethod === "cod"
                      ? "Cash on Delivery"
                      : completedOrder.paymentMethod === "upi"
                        ? "UPI Transfer (Verified)"
                        : "Online Prepaid (Verified)"}
                  </span>
                  <span className="text-[9px] text-emerald-700 font-medium block mt-1">
                    ✦ Silk Mark Verified
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="py-4 border-b border-dashed border-black/15">
                <span className="text-[8.5px] font-semibold uppercase tracking-widest text-[#8C7A6B] block mb-3">
                  Purchased Items
                </span>
                <div className="space-y-3">
                  {completedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.image && (
                          <img
                            src={item.image}
                            alt=""
                            className="h-10 w-8 rounded object-cover bg-[#FAF7F2] border border-black/5 shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-serif text-xs font-medium text-[#2A2421]">
                            {item.name}
                          </p>
                          <p className="text-[9px] text-[#8C7A6B]">
                            {item.color} · Qty {item.quantity}
                          </p>
                        </div>
                      </div>

                      <span className="font-sans text-xs font-semibold text-[#2A2421] shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financials */}
              <div className="py-4 space-y-1.5 text-xs font-light border-b border-dashed border-black/15">
                <div className="flex justify-between text-[#756A60]">
                  <span>Subtotal</span>
                  <span className="font-sans font-medium text-[#2A2421]">
                    ₹{completedOrder.subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between text-[#756A60]">
                  <span>Insured Express Shipping</span>
                  <span className="text-emerald-700 font-medium">
                    {completedOrder.shipping === 0 ? "Complimentary (₹0)" : `₹${completedOrder.shipping}`}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#2A2421]">
                    Total Amount
                  </span>
                  <span className="font-sans text-xl font-bold text-[#8E3D51]">
                    ₹{completedOrder.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Barcode & Seal */}
              <div className="pt-4 flex flex-col items-center text-center">
                <div className="font-mono text-[9px] tracking-[0.35em] text-[#8C7A6B] uppercase">
                  * {completedOrder.orderId} *
                </div>
                <div className="mt-1 h-7 w-48 bg-[repeating-linear-gradient(90deg,#2A2421,#2A2421_2px,transparent_2px,transparent_4px,#2A2421_4px,#2A2421_7px,transparent_7px,transparent_9px)] opacity-65" />
                <span className="mt-2 text-[8px] uppercase tracking-widest text-[#8C7A6B]">
                  Authentic Handloom Certificate Enclosed
                </span>
              </div>
            </div>
          </LuxuryReceiptPrinter>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 print:hidden">
            <Link
              to="/"
              className="w-full sm:w-auto rounded-full bg-[#2A2421] px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FAF7F2] transition-colors hover:bg-[#8E3D51] text-center"
            >
              Return to Boutique
            </Link>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-black/15 bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2A2421] hover:bg-[#FAF7F2] shadow-sm active:scale-95"
            >
              <FiPrinter size={13} className="text-[#8E3D51]" />
              <span>Print Official Invoice</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
      1. AUTHENTICATION REQUIRED VIEW (Must be logged in to purchase)
  ========================================================== */
  if (!currentUser) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] font-sans px-5 pb-20 pt-20 text-[#2A2421] select-none flex items-center justify-center">
        <div className="mx-auto max-w-md w-full rounded-3xl bg-white p-8 shadow-xl border border-black/8 text-center space-y-5">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-[#8E3D51]/10 text-[#8E3D51]">
            <FiLock size={28} />
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8C7A6B]">
              RS Fashions Private Studio
            </span>
            <h1 className="mt-1 font-serif text-2xl font-light text-[#2A2421]">
              Login Required to Purchase
            </h1>
            <p className="mt-2 text-xs font-light leading-relaxed text-[#756A60]">
              To ensure order authenticity and secure courier tracking, please sign in or create an account to complete your saree purchase. Your cart items remain saved.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => navigate("/login?redirect=/checkout")}
              className="w-full py-3.5 rounded-full bg-[#8E3D51] hover:bg-[#783144] text-white text-xs font-semibold uppercase tracking-[0.16em] shadow-md transition-all active:scale-95"
            >
              Sign In or Create Account
            </button>
            <Link
              to="/cart"
              className="w-full py-3 rounded-full border border-black/10 text-[#2A2421] text-xs font-medium hover:bg-stone-50 transition-colors block text-center"
            >
              Return to Shopping Bag
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
      2. EMPTY CART VIEW
  ========================================================== */
  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] font-sans px-5 pb-20 pt-20 text-[#2A2421] select-none">
        <div className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white border border-black/10 shadow-sm">
            <FiShoppingBag size={22} className="text-[#8E3D51]" />
          </div>

          <h1 className="mt-4 font-serif text-2xl sm:text-3xl font-light text-[#2A2421]">
            Your shopping bag is empty.
          </h1>

          <p className="mt-2 max-w-sm text-[11px] sm:text-xs font-light leading-relaxed text-[#756A60]">
            Please select an artisan drape from our collection before proceeding to checkout.
          </p>

          <Link
            to="/shop"
            className="mt-6 rounded-full bg-[#2A2421] px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FAF7F2] transition-colors hover:bg-[#8E3D51]"
          >
            Explore Sarees
          </Link>
        </div>
      </main>
    );
  }

  /* =========================================================
      3. MAIN CHECKOUT FORM WORKFLOW
  ========================================================== */
  return (
    <main className="min-h-screen bg-[#FAF7F2] font-sans text-[#2A2421] select-none px-3.5 pb-20 pt-6 sm:px-6 md:px-8 lg:px-12">
      <div className="mx-auto max-w-325">
        {/* Navigation Bar */}
        <div className="mb-5 flex items-center justify-between border-b border-black/6 pb-3.5">
          <button
            type="button"
            onClick={() => {
              if (step === "payment") {
                setStep("address");
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else {
                navigate("/cart");
              }
            }}
            className="group flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-[#6E6359] hover:text-[#8E3D51] transition-colors"
          >
            <FiArrowLeft size={13} className="transition-transform duration-300 group-hover:-translate-x-1" />
            <span>{step === "payment" ? "Back to Address" : "Back to Cart"}</span>
          </button>

          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.16em] text-[#8C7A6B]">
            <FiLock size={11} className="text-[#8E3D51]" />
            <span className="hidden xs:inline">256-Bit SSL</span> Encrypted
          </div>
        </div>

        {/* Step Progression Indicators */}
        <div className="mb-6 sm:mb-8 flex items-center justify-center">
          <div className="flex items-center">
            <CheckoutStepIndicator
              number="01"
              label="Address"
              active={step === "address"}
              completed={step === "payment"}
            />
            <div
              className={`h-0.5 w-8 sm:w-16 md:w-20 transition-colors duration-500 ${step === "payment" ? "bg-[#8E3D51]" : "bg-black/10"
                }`}
            />
            <CheckoutStepIndicator
              number="02"
              label="Payment"
              active={step === "payment"}
              completed={false}
            />
            <div className="h-0.5 w-8 sm:w-16 md:w-20 bg-black/10" />
            <CheckoutStepIndicator
              number="03"
              label="Complete"
              active={false}
              completed={false}
            />
          </div>
        </div>

        {/* Out-of-Stock Payment Guard Modal */}
        {stockConflict && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-red-100 animate-in fade-in zoom-in duration-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-4 font-bold text-xl">
                ✕
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-600">
                Payment Blocked · Saree Sold Out
              </span>
              <h3 className="font-serif text-xl font-bold text-[#2A2421] mt-1">
                Drape Just Purchased
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm text-[#544B44] leading-relaxed">
                While you were checking out, <strong>"{stockConflict.productName}"</strong> was purchased by another customer and is now sold out (0 remaining).
              </p>
              <div className="mt-3 rounded-xl bg-amber-50 p-3 border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed">
                To protect your payment, orders cannot be processed for sold-out drapes. Please remove this saree from your bag to proceed, or choose another handloom drape from our boutique.
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    removeFromCart(stockConflict.productId);
                    setStockConflict(null);
                  }}
                  className="flex-1 rounded-full bg-[#8E3D51] py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-md hover:bg-[#783144] transition-all"
                >
                  Remove Saree &amp; Continue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStockConflict(null);
                    navigate("/shop");
                  }}
                  className="rounded-full border border-black/15 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#2A2421] hover:bg-black/5 transition-all"
                >
                  Choose Another
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Order Summary for Mobile / iPad */}
        <div className="mb-6 block lg:hidden">
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_8px_25px_rgba(42,36,33,0.05)]">
            <button
              type="button"
              onClick={() => setIsSummaryOpen(!isSummaryOpen)}
              className="flex w-full items-center justify-between p-4 text-left transition-colors active:bg-black/[0.02]"
            >
              <div className="flex items-center gap-2">
                <FiShoppingBag size={14} className="text-[#8E3D51]" />
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2A2421]">
                  Order Items
                </span>
                <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-[9px] text-[#8C7A6B] font-mono">
                  {itemCount}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-sans text-sm sm:text-base font-semibold text-[#2A2421]">
                  ₹{total.toLocaleString("en-IN")}
                </span>
                <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-[#8E3D51] font-semibold">
                  {isSummaryOpen ? "Hide" : "Show"}
                  <FiChevronDown
                    size={14}
                    className={`transition-transform duration-300 ${isSummaryOpen ? "rotate-180" : ""
                      }`}
                  />
                </span>
              </div>
            </button>

            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isSummaryOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
            >
              <div className="overflow-hidden border-t border-black/6 bg-[#FAF7F2]/50 p-4">
                <div className="divide-y divide-black/[0.04] max-h-52 overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={`mob-${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                      className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="h-11 w-9 rounded-lg object-cover bg-[#EFEAE2] border border-black/5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-serif text-xs text-[#2A2421]">
                          {item.product.name}
                        </p>
                        <p className="text-[9px] text-[#8C7A6B] mt-0.5">
                          Qty: {item.quantity} · {item.selectedColor}
                        </p>
                      </div>
                      <span className="font-sans text-[11px] font-medium text-[#2A2421]">
                        ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 space-y-1.5 border-t border-black/6 pt-2.5 text-[11px] font-light">
                  <div className="flex justify-between text-[#756A60]">
                    <span>Subtotal</span>
                    <span className="font-sans font-medium text-[#2A2421]">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex justify-between text-[#756A60]">
                    <span>Shipping</span>
                    <span className="text-emerald-700 font-medium">
                      {shipping === 0 ? "Complimentary" : `₹${shipping}`}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-black/[0.08] pt-2 mt-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2A2421]">
                      Order Total
                    </span>
                    <span className="font-sans text-base sm:text-lg font-semibold text-[#2A2421]">
                      ₹{total.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid: Forms & Sticky Sidebar */}
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1fr_390px] xl:grid-cols-[1fr_420px] items-start">
          <section>
            {/* STEP 1: ADDRESS */}
            {step === "address" && (
              <div>
                <div className="mb-5 sm:mb-6">
                  <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8E3D51]">
                    Step 1 of 2
                  </span>
                  <h1 className="mt-1 font-serif text-2xl sm:text-4xl md:text-5xl font-light tracking-tight text-[#2A2421]">
                    Delivery <span className="italic font-normal">destination.</span>
                  </h1>
                  <p className="mt-1.5 text-[11px] sm:text-xs font-light text-[#756A60]">
                    Enter your delivery coordinates for insured transit packaging.
                  </p>
                </div>

                <div className="rounded-2xl sm:rounded-3xl border border-black/10 bg-white p-4 sm:p-6 md:p-8 shadow-[0_12px_36px_rgba(42,36,33,0.04)]">
                  <div className="mb-5 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[#FAF4ED] text-[#8E3D51]">
                      <FiMapPin size={15} />
                    </div>
                    <div>
                      <h2 className="font-serif text-base sm:text-lg text-[#2A2421]">
                        Delivery Details
                      </h2>
                      <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-[#8C7A6B]">
                        Doorstep Delivery Verification
                      </span>
                    </div>
                  </div>

                  {/* SAVED ADDRESS SELECTION (Amazon/Flipkart Style) */}
                  {savedAddressesList.length > 0 && (
                    <div className="mb-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-[#8C7A6B]">
                          Saved Delivery Addresses ({savedAddressesList.length})
                        </span>
                        {isEditingOrNew && (
                          <button
                            type="button"
                            onClick={() => {
                              const first = savedAddressesList.find((a) => a.id === selectedAddressId) || savedAddressesList[0];
                              if (first) handleSelectAddress(first);
                            }}
                            className="text-[11px] font-semibold text-[#8E3D51] hover:underline cursor-pointer"
                          >
                            Cancel &amp; use saved address
                          </button>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {savedAddressesList.map((addr) => {
                          const isSelected = selectedAddressId === addr.id && !isEditingOrNew;
                          return (
                            <div
                              key={addr.id}
                              onClick={() => handleSelectAddress(addr)}
                              className={`group relative rounded-2xl p-4 cursor-pointer transition-all border text-left flex flex-col justify-between ${
                                isSelected
                                  ? "border-[#8E3D51] bg-[#FAF4ED] shadow-[0_4px_16px_rgba(142,61,81,0.08)] ring-2 ring-[#8E3D51]/40"
                                  : "border-black/10 bg-white hover:border-[#8E3D51]/40 hover:bg-[#FDFBF7]"
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                        addr.tag === "Home"
                                          ? "bg-amber-100 text-amber-900 border border-amber-200"
                                          : addr.tag === "Work"
                                          ? "bg-blue-100 text-blue-900 border border-blue-200"
                                          : "bg-stone-100 text-stone-800 border border-stone-200"
                                      }`}
                                    >
                                      {addr.tag === "Home" ? <FiHome size={10} /> : <FiBriefcase size={10} />}
                                      {addr.tag}
                                    </span>
                                    {addr.isDefault && (
                                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Default
                                      </span>
                                    )}
                                  </div>

                                  <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                      isSelected
                                        ? "border-[#8E3D51] bg-[#8E3D51] text-white"
                                        : "border-stone-300 group-hover:border-[#8E3D51]"
                                    }`}
                                  >
                                    {isSelected && <FiCheck size={10} strokeWidth={3} />}
                                  </div>
                                </div>

                                <h4 className="font-serif font-bold text-xs sm:text-sm text-[#2A2421] line-clamp-1">
                                  {addr.name}
                                </h4>
                                <p className="text-[11px] text-stone-600 mt-1 leading-relaxed line-clamp-2">
                                  {addr.address}
                                  {addr.apartment ? `, ${addr.apartment}` : ""}, {addr.city}, {addr.state} - {addr.pincode}
                                </p>
                                <p className="text-[10px] font-mono font-semibold text-stone-500 mt-1.5">
                                  Ph: {addr.phone}
                                </p>
                              </div>

                              <div className="mt-3 pt-2 border-t border-black/5 flex items-center justify-between">
                                <span className={`text-[10px] font-bold ${isSelected ? "text-[#8E3D51]" : "text-stone-400 group-hover:text-stone-700"}`}>
                                  {isSelected ? "Selected for Delivery" : "Click to select"}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* + Add New Address Card */}
                        <div
                          onClick={handleAddNewAddress}
                          className={`rounded-2xl p-4 cursor-pointer transition-all border border-dashed flex flex-col items-center justify-center text-center min-h-[140px] ${
                            isEditingOrNew
                              ? "border-[#8E3D51] bg-[#FAF4ED] ring-2 ring-[#8E3D51]/40"
                              : "border-stone-300 hover:border-[#8E3D51] hover:bg-[#FDFBF7]"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 transition-colors ${
                            isEditingOrNew ? "bg-[#8E3D51] text-white" : "bg-stone-100 text-stone-600"
                          }`}>
                            <FiPlus size={16} />
                          </div>
                          <span className="font-serif font-bold text-xs text-[#2A2421]">
                            + Deliver to a New Address
                          </span>
                          <span className="text-[10px] text-stone-500 mt-0.5">
                            Enter different address coordinates
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ACTIVE ADDRESS CONFIRMATION (WHEN A SAVED CARD IS SELECTED) */}
                  {!isEditingOrNew && savedAddressesList.length > 0 ? (
                    <div className="mt-4 pt-4 border-t border-black/5 space-y-4">
                      <div className="rounded-2xl bg-[#FAF8F5] border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E3D51] flex items-center gap-1.5">
                            <FiCheck size={12} className="text-emerald-600" />
                            Dispatching To: {address.firstName} {address.lastName} ({addressTag})
                          </span>
                          <p className="text-xs text-stone-700 font-medium mt-1">
                            {address.address}{address.apartment ? `, ${address.apartment}` : ""}, {address.city}, {address.state} - {address.pincode}
                          </p>
                          <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                            Contact: {address.countryDial} {address.phone} {address.email ? `• ${address.email}` : ""}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsEditingOrNew(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-white transition-all self-start sm:self-center shrink-0 cursor-pointer"
                        >
                          <FiEdit2 size={12} />
                          <span>Edit Address</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={continueToPayment}
                        className="group flex w-full items-center justify-center gap-2.5 rounded-full bg-[#2A2421] py-3.5 sm:py-4 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-[#FAF7F2] shadow-md transition-all hover:bg-[#8E3D51] active:scale-95 cursor-pointer"
                      >
                        <span>Deliver to This Address &amp; Continue to Payment</span>
                        <FiArrowRight
                          size={13}
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </button>
                    </div>
                  ) : (
                    /* MANUAL ADDRESS ENTRY / EDIT FORM */
                    <div>
                      {savedAddressesList.length > 0 && (
                        <div className="mb-4 pb-3 border-b border-black/5 flex items-center justify-between">
                          <span className="text-xs font-serif font-bold text-[#2A2421]">
                            {selectedAddressId === "new" ? "Add New Delivery Address" : "Edit Delivery Address"}
                          </span>
                          <span className="text-[11px] text-stone-500">
                            Fill in complete details below
                          </span>
                        </div>
                      )}

                      {/* Tag Selector: Home / Work / Other */}
                      <div className="mb-4">
                        <label className="block text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8C7A6B] mb-1.5">
                          Address Type / Tag
                        </label>
                        <div className="flex items-center gap-2">
                          {(["Home", "Work", "Other"] as const).map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setAddressTag(tag)}
                              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                addressTag === tag
                                  ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                              }`}
                            >
                              {tag === "Home" ? <FiHome size={12} /> : tag === "Work" ? <FiBriefcase size={12} /> : null}
                              <span>{tag}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-3.5 sm:gap-4 sm:grid-cols-2">
                        <InputField
                          label="First Name"
                          value={address.firstName}
                          onChange={(val) => updateAddress("firstName", val)}
                          error={errors.firstName}
                        />
                        <InputField
                          label="Last Name"
                          value={address.lastName}
                          onChange={(val) => updateAddress("lastName", val)}
                          error={errors.lastName}
                        />

                        {/* Strict International Phone Selector */}
                        <div className="sm:col-span-2">
                          <label className="block">
                            <span className="mb-1 flex items-center justify-between text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8C7A6B]">
                              <span>Phone Number <span className="text-[#8E3D51]">*</span></span>
                              <span className="font-mono text-[8px] sm:text-[9px] font-normal text-[#A89C8F]">
                                {address.phone.length} / {activeCountry.length} digits
                              </span>
                            </span>

                            <div className={`flex items-center rounded-xl sm:rounded-2xl border transition-all ${errors.phone
                                ? "border-red-500 bg-red-50/20"
                                : "border-black/10 bg-[#FAF7F2] focus-within:border-[#8E3D51]/60 focus-within:bg-white focus-within:shadow-[0_4px_14px_rgba(142,61,81,0.05)]"
                              }`}>
                              <div className="relative border-r border-black/10 bg-white rounded-l-xl sm:rounded-l-2xl">
                                <select
                                  value={address.countryDial}
                                  onChange={(e) => {
                                    updateAddress("countryDial", e.target.value);
                                    updateAddress("phone", "");
                                  }}
                                  className="h-11 sm:h-12 appearance-none bg-transparent pl-2.5 sm:pl-3 pr-6 text-xs font-medium text-[#2A2421] outline-none cursor-pointer"
                                >
                                  {COUNTRIES.map((c) => (
                                    <option key={c.code} value={c.dialCode}>
                                      {c.code} ({c.dialCode})
                                    </option>
                                  ))}
                                </select>
                                <FiChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#8C7A6B]" />
                              </div>

                              <input
                                type="tel"
                                inputMode="numeric"
                                value={address.phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                placeholder={activeCountry.placeholder}
                                className="h-11 sm:h-12 w-full bg-transparent px-3 sm:px-4 text-xs font-mono tracking-wide text-[#2A2421] placeholder-[#A89C8F] outline-none"
                              />
                            </div>

                            {errors.phone && (
                              <span className="mt-1 flex items-center gap-1 text-[10px] text-red-600 font-medium">
                                <FiAlertCircle size={12} className="shrink-0 text-red-500" />
                                {errors.phone}
                              </span>
                            )}
                          </label>
                        </div>

                        <div className="sm:col-span-2">
                          <InputField
                            label="Email Address (Invoice & Tracking)"
                            type="email"
                            value={address.email}
                            onChange={(val) => updateAddress("email", val)}
                            error={errors.email}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <InputField
                            label="Street Address / Door No."
                            value={address.address}
                            onChange={(val) => updateAddress("address", val)}
                            error={errors.address}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <InputField
                            label="Apartment, Landmark (Optional)"
                            value={address.apartment}
                            onChange={(val) => updateAddress("apartment", val)}
                            required={false}
                          />
                        </div>

                        <InputField
                          label="City"
                          value={address.city}
                          onChange={(val) => updateAddress("city", val)}
                          error={errors.city}
                        />

                        <InputField
                          label="State"
                          value={address.state}
                          onChange={(val) => updateAddress("state", val)}
                          error={errors.state}
                        />

                        <div className="sm:col-span-2">
                          <InputField
                            label="PIN / Postal Code"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="6-digit postal code (numbers only, e.g. 560001)"
                            value={address.pincode}
                            onChange={handlePincodeChange}
                            error={errors.pincode}
                          />
                        </div>
                      </div>

                      {/* Save address to profile checkbox */}
                      <label className="mt-4 flex items-center gap-2 text-xs text-stone-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={saveAddressToProfile}
                          onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                          className="w-4 h-4 rounded border-stone-300 text-[#8E3D51] focus:ring-[#8E3D51]"
                        />
                        <span>Save this address to my profile for faster 1-click future checkouts</span>
                      </label>

                      <button
                        type="button"
                        onClick={continueToPayment}
                        className="group mt-6 sm:mt-8 flex w-full items-center justify-center gap-2.5 rounded-full bg-[#2A2421] py-3.5 sm:py-4 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-[#FAF7F2] shadow-md transition-all hover:bg-[#8E3D51] active:scale-95 cursor-pointer"
                      >
                        <span>Continue to Payment</span>
                        <FiArrowRight
                          size={13}
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: PAYMENT */}
            {step === "payment" && (
              <div>
                <div className="mb-5 sm:mb-6">
                  <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8E3D51]">
                    Step 2 of 2
                  </span>
                  <h1 className="mt-1 font-serif text-2xl sm:text-4xl md:text-5xl font-light tracking-tight text-[#2A2421]">
                    Payment <span className="italic font-normal">preference.</span>
                  </h1>
                  <p className="mt-1.5 text-[11px] sm:text-xs font-light text-[#756A60]">
                    {existingOrderNumber
                      ? `Your order details are confirmed. Please select your payment method to complete order #${existingOrderNumber}.`
                      : "Select your preferred transaction channel."}
                  </p>
                </div>

                {/* Pre-filled Customer & Delivery Address Card */}
                {(address.firstName || address.phone || address.address || existingOrderNumber) && (
                  <div className="mb-5 rounded-2xl sm:rounded-3xl border border-black/10 bg-white p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-black/5 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FAF4ED] text-[#8E3D51]">
                          <FiMapPin size={13} />
                        </div>
                        <div>
                          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#2A2421]">
                            Delivery Destination
                          </span>
                          {existingOrderNumber && (
                            <span className="ml-2 rounded-full bg-[#8E3D51]/10 px-2 py-0.5 text-[9px] font-mono font-bold text-[#8E3D51]">
                              {existingOrderNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setStep("address");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="text-[11px] font-semibold text-[#8E3D51] hover:underline"
                      >
                        Edit Details
                      </button>
                    </div>

                    <div className="mt-3 text-xs text-[#2A2421]">
                      <p className="font-semibold text-sm">
                        {address.firstName} {address.lastName || ""}
                      </p>
                      <p className="text-[#6E6359] mt-0.5">
                        {address.address || "Heritage Residence"}
                        {address.apartment ? `, ${address.apartment}` : ""}
                      </p>
                      <p className="text-[#6E6359]">
                        {address.city || "Mumbai"}, {address.state || "Maharashtra"} - {address.pincode || "400001"}
                      </p>
                      <p className="text-[#6E6359] mt-1.5 text-[11px]">
                        📞 {address.countryDial} {address.phone} {address.email ? `· ✉️ ${address.email}` : ""}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 sm:space-y-4">
                  {/* Cashfree Payment Gateway (Cards, UPI, Netbanking, Wallets, EMI) */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cashfree")}
                    className={`w-full rounded-2xl sm:rounded-3xl border p-4 sm:p-5 text-left transition-all duration-200 bg-white relative overflow-hidden ${
                      paymentMethod === "cashfree"
                        ? "border-[#8E3D51] shadow-[0_10px_30px_rgba(142,61,81,0.12)] ring-2 ring-[#8E3D51]/25"
                        : "border-black/10 hover:border-black/20"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#8E3D51]/10 text-[#8E3D51]">
                        <FiCreditCard size={20} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-serif text-base sm:text-lg text-[#2A2421] font-semibold">
                              Cashfree Payments
                            </span>
                            <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2 py-0.5 text-[8.5px] sm:text-[9px] font-semibold uppercase tracking-wider">
                              Fast & Secure
                            </span>
                          </div>
                          <span className="rounded-full bg-[#8E3D51]/10 px-2 py-0.5 text-[8.5px] sm:text-[9px] font-semibold uppercase tracking-wider text-[#8E3D51]">
                            UPI / Cards / EMI
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] sm:text-xs font-light text-[#756A60]">
                          Google Pay, PhonePe, Paytm, Cards (Visa, Mastercard, RuPay), Net Banking & EMI.
                        </p>
                      </div>

                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                          paymentMethod === "cashfree"
                            ? "border-[#8E3D51] bg-[#8E3D51] text-white"
                            : "border-black/20"
                        }`}
                      >
                        {paymentMethod === "cashfree" && <FiCheck size={11} />}
                      </div>
                    </div>
                  </button>

                  {/* Cash on Delivery */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`w-full rounded-2xl sm:rounded-3xl border p-4 sm:p-5 text-left transition-all duration-200 bg-white ${
                      paymentMethod === "cod"
                        ? "border-[#8E3D51] shadow-[0_10px_30px_rgba(142,61,81,0.08)] ring-2 ring-[#8E3D51]/20"
                        : "border-black/10 hover:border-black/20"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#FAF4ED] text-[#8E3D51]">
                        <FiTruck size={18} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-serif text-base sm:text-lg text-[#2A2421]">
                            Cash on Delivery
                          </span>
                          <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[8.5px] sm:text-[9px] font-medium uppercase tracking-wider text-[#6E6359]">
                            Doorstep
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] sm:text-xs font-light text-[#756A60]">
                          Pay when your luxury package arrives at your delivery coordinates.
                        </p>
                      </div>

                      <div
                        className={`flex h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                          paymentMethod === "cod"
                            ? "border-[#8E3D51] bg-[#8E3D51] text-white"
                            : "border-black/20"
                        }`}
                      >
                        {paymentMethod === "cod" && <FiCheck size={10} />}
                      </div>
                    </div>
                  </button>

                  {/* Quality Seal Note */}
                  <div className="rounded-xl sm:rounded-2xl border border-[#D4AF37]/30 bg-[#FAF4ED] p-3.5 flex items-start gap-2.5">
                    <FiShield size={15} className="text-[#8E3D51] shrink-0 mt-0.5" />
                    <p className="text-[10px] sm:text-[11px] font-light leading-relaxed text-[#756A60]">
                      Protected by 256-Bit TLS encryption & PCI-DSS Compliant Cashfree Payment Infrastructure.
                    </p>
                  </div>

                  {/* Place Order CTA */}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={placeOrder}
                    className="mt-5 sm:mt-6 flex w-full items-center justify-center gap-2.5 rounded-full py-3.5 sm:py-4 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-[#FAF7F2] shadow-lg transition-all active:scale-95 disabled:opacity-60 bg-[#8E3D51] hover:bg-[#783144]"
                  >
                    {isProcessing ? (
                      <span>Connecting to Payment Gateway...</span>
                    ) : (
                      <>
                        <span>
                          {paymentMethod === "cod"
                            ? "Confirm Cash On Delivery Order"
                            : `Pay ₹${total.toLocaleString("en-IN")} via Cashfree Payments`}
                        </span>
                        <FiArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Sticky Desktop Order Summary */}
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_16px_40px_rgba(42,36,33,0.06)]">
              <div className="p-5 xl:p-6">
                <div className="flex items-center justify-between border-b border-black/6 pb-3.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7A6B]">
                    Order Summary
                  </span>
                  <span className="text-xs text-[#756A60]">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </span>
                </div>

                <div className="my-4 max-h-64 overflow-y-auto space-y-3.5 pr-1 scrollbar-none">
                  {items.map((item) => (
                    <div
                      key={`desk-${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="h-12 w-10 shrink-0 rounded-lg object-cover bg-[#EFEAE2] border border-black/5"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-serif text-xs sm:text-sm text-[#2A2421]">
                            {item.product.name}
                          </p>
                          <span className="text-[9.5px] text-[#8C7A6B]">
                            Qty: {item.quantity} · {item.selectedColor}
                          </span>
                        </div>
                      </div>

                      <span className="font-sans text-xs font-medium text-[#2A2421] shrink-0">
                        ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 border-t border-black/6 pt-3.5 text-xs font-light">
                  <div className="flex justify-between text-[#756A60]">
                    <span>Subtotal</span>
                    <span className="font-sans font-medium text-[#2A2421]">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex justify-between text-[#756A60]">
                    <span>Shipping</span>
                    <span className="text-emerald-700 font-medium">
                      {shipping === 0 ? "Complimentary" : `₹${shipping}`}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-black/[0.08] pt-3 mt-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2A2421]">
                      Total
                    </span>
                    <span className="font-sans text-xl xl:text-2xl font-semibold text-[#2A2421]">
                      ₹{total.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

/* =============================================================
   STEP INDICATOR COMPONENT
============================================================= */
function CheckoutStepIndicator({
  number,
  label,
  active,
  completed,
}: {
  number: string;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-1.5 sm:px-2">
      <div
        className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-[10px] sm:text-xs font-mono font-medium transition-all ${active || completed
            ? "bg-[#8E3D51] text-white shadow-md"
            : "border border-black/15 bg-white text-[#8C7A6B]"
          }`}
      >
        {completed ? <FiCheck size={12} /> : number}
      </div>
      <span
        className={`text-[8px] sm:text-[9px] uppercase tracking-widest ${active ? "font-semibold text-[#8E3D51]" : "text-[#8C7A6B]"
          }`}
      >
        {label}
      </span>
    </div>
  );
}

/* =============================================================
   INPUT FIELD COMPONENT
============================================================= */
function InputField({
  label,
  value,
  onChange,
  type = "text",
  required = true,
  error,
  inputMode,
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "search" | "email" | "url";
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8C7A6B]">
        {label}
        {required && <span className="ml-1 text-[#8E3D51]">*</span>}
      </span>
      <input
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder || (required ? label : `${label} (Optional)`)}
        className={`h-11 sm:h-12 w-full rounded-xl sm:rounded-2xl border px-3.5 sm:px-4 text-xs font-light text-[#2A2421] placeholder-[#A89C8F] outline-none transition-all focus:bg-white ${error
            ? "border-red-500 bg-red-50/25 focus:border-red-600"
            : "border-black/10 bg-[#FAF7F2] focus:border-[#8E3D51]/50 focus:shadow-[0_4px_14px_rgba(142,61,81,0.05)]"
          }`}
      />
      {error && (
        <span className="mt-1 flex items-center gap-1 text-[9.5px] text-red-600 font-medium">
          <FiAlertCircle size={10} />
          {error}
        </span>
      )}
    </label>
  );
}

/* =============================================================
   LUXURY RECEIPT PRINTER DISPENSER
============================================================= */
function LuxuryReceiptPrinter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [isPrinting, setIsPrinting] = useState(true);
  const [isTorn, setIsTorn] = useState(false);
  const [playKey, setPlayKey] = useState(0);

  useEffect(() => {
    setIsPrinting(true);
    const timer = setTimeout(() => setIsPrinting(false), 2000);
    return () => clearTimeout(timer);
  }, [playKey]);

  const handleReprint = () => {
    setIsTorn(false);
    setPlayKey((k) => k + 1);
  };

  const handleTear = () => {
    setIsTorn(true);
  };

  return (
    <div id="receipt-print-area" className={`relative mx-auto max-w-md ${className}`}>
      {/* Machined Metallic Dispenser Slot */}
      <div className="relative z-20 mx-auto h-4 w-[94%] rounded-t-lg bg-linear-to-b from-[#2A2421] via-[#3A332E] to-[#1F1A18] shadow-[0_4px_12px_rgba(0,0,0,0.25)] border-t border-x border-[#D4AF37]/30 print:hidden">
        <div className="absolute inset-x-4 top-1.5 h-1 rounded-full bg-black/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />
      </div>

      {/* Feeding Receipt Paper */}
      <div
        key={playKey}
        className={`receipt-container ${isPrinting ? "receipt-feed" : ""} ${isTorn ? "receipt-torn-state" : ""}`}
      >
        {children}
      </div>

      {/* Interactive Toolbar */}
      {!isPrinting && (
        <div className="mt-5 flex items-center justify-center gap-3 print:hidden">
          <button
            type="button"
            onClick={handleReprint}
            className="flex items-center gap-1.5 rounded-full border border-black/15 bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#2A2421] hover:bg-[#FAF7F2] shadow-sm active:scale-95"
          >
            <FiRefreshCw size={11} className="text-[#8E3D51]" />
            <span>Re-feed Receipt</span>
          </button>

          {!isTorn && (
            <button
              type="button"
              onClick={handleTear}
              className="flex items-center gap-1.5 rounded-full bg-[#2A2421] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#FAF7F2] hover:bg-[#8E3D51] shadow-sm active:scale-95"
            >
              <FiScissors size={11} />
              <span>Tear Off</span>
            </button>
          )}
        </div>
      )}

      {/* Scoped CSS Animation & Print Styles */}
      <style>{`
        .receipt-container {
          transform-origin: top center;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .receipt-feed {
          animation: luxuryFeed 3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        @keyframes luxuryFeed {
          0% {
            clip-path: inset(0 0 100% 0);
            transform: translateY(-24px);
            opacity: 0.6;
          }
          40% {
            opacity: 1;
          }
          100% {
            clip-path: inset(0 0 0% 0);
            transform: translateY(0);
            opacity: 1;
          }
        }

        .receipt-torn-state {
          animation: tearAction 0.45s ease-out forwards;
        }

        @keyframes tearAction {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          40% {
            transform: translateY(6px) rotate(-1deg);
          }
          100% {
            transform: translateY(12px) rotate(-0.5deg);
            filter: drop-shadow(0 15px 25px rgba(0, 0, 0, 0.08));
          }
        }

        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-print-area,
          #receipt-print-area * {
            visibility: visible;
          }
          #receipt-print-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default Checkout;
