import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Package, Truck, CreditCard, MapPin, User, ExternalLink, Copy, Check, Printer, RotateCcw, Plus, Trash2, Edit2, ShieldCheck, Clock, CheckCircle2, LogOut, ShoppingBag, Sparkles, Phone, Mail, Home, Briefcase, X } from "lucide-react";
import { getUserSession, setUserSession, clearUserSession, getSavedAddresses, saveAddress, deleteAddress, setDefaultAddress, getSavedPayments, savePaymentMethod, deletePaymentMethod, type UserSession, type SavedAddress, type SavedPayment } from "../utils/userSession";
import { API_BASE } from "../config/api";
import { StoreService } from "../services/supabase";
import { ORDER_FULFILLED_EVENT, getCourierTrackingUrl } from "../context/OrderFulfillmentContext";
import { useCart } from "../context/CartContext";
import logo from "../assets/logo/logo1.png";

type AccountTab = "orders" | "payments" | "addresses" | "cards" | "profile";

export interface DetectedCardNetwork {
  id: "visa" | "mastercard" | "rupay" | "amex" | "maestro" | "diners" | "discover" | "unknown";
  name: string;
  badgeText: string;
  badgeBg: string;
  badgeTextClass: string;
  cardGradient: string;
  validLengths: number[];
  maxLength: number;
  cvvLength: number;
  issuerHint?: string;
}

const KNOWN_TEST_OR_FAKE_CARDS = new Set([
  "4242424242424242",
  "4111111111111111",
  "4012888888881881",
  "4000000000000002",
  "4000000000009995",
  "5555555555554444",
  "5105105105105100",
  "5200828282828210",
  "378282246310005",
  "371449635398431",
  "6011111111111117",
  "6011000990139424",
  "30569309025904",
  "38520000023237",
  "1234567812345670",
]);

function detectIssuerBankHint(digits: string): string | undefined {
  if (digits.length < 6) return undefined;
  const bin6 = digits.slice(0, 6);
  const bin4 = digits.slice(0, 4);
  if (/^(437551|416021|4571|4024|5241|5326|607485)/.test(bin6) || bin4 === "4375") return "HDFC Bank";
  if (/^(459150|459200|508500|607094|652150|5196|4213)/.test(bin6)) return "State Bank of India";
  if (/^(431580|405454|5268|5319|607395|652200)/.test(bin6)) return "ICICI Bank";
  if (/^(411971|4688|5363|607152|652180)/.test(bin6)) return "Axis Bank";
  if (/^(414746|428102|5129|607420)/.test(bin6)) return "Kotak Mahindra";
  return undefined;
}

function detectCardNetwork(rawInput: string): DetectedCardNetwork {
  const digits = rawInput.replace(/\D/g, "");
  const issuerHint = detectIssuerBankHint(digits);

  // 1. American Express: 34, 37 (15 digits)
  if (/^3[47]/.test(digits)) {
    return {
      id: "amex",
      name: "American Express",
      badgeText: "AMEX",
      badgeBg: "bg-sky-600 border-sky-400",
      badgeTextClass: "text-white",
      cardGradient: "from-[#0B3B59] via-[#13547A] to-[#1D709E]",
      validLengths: [15],
      maxLength: 15,
      cvvLength: 4,
      issuerHint,
    };
  }

  // 2. RuPay (Indian National Payment Network): 60, 6521, 6522, 5085-5089, 353, 356, 81, 82
  if (
    /^(6521|6522|508[5-9]|35[36]|8[12])/.test(digits) ||
    (/^60/.test(digits) && !/^6011/.test(digits))
  ) {
    return {
      id: "rupay",
      name: "RuPay",
      badgeText: "RuPay",
      badgeBg: "bg-orange-600 border-orange-400",
      badgeTextClass: "text-white",
      cardGradient: "from-[#1A2A52] via-[#243B6B] to-[#C85A17]",
      validLengths: [16],
      maxLength: 16,
      cvvLength: 3,
      issuerHint,
    };
  }

  // 3. Visa: starts with 4 (16 digits standard)
  if (/^4/.test(digits)) {
    return {
      id: "visa",
      name: "Visa",
      badgeText: "VISA",
      badgeBg: "bg-[#1A1F71] border-indigo-400",
      badgeTextClass: "text-amber-300",
      cardGradient: "from-[#1A1F71] via-[#252D8A] to-[#3B44A8]",
      validLengths: [16],
      maxLength: 16,
      cvvLength: 3,
      issuerHint,
    };
  }

  // 4. Mastercard: 51-55 or 2221-2720 (16 digits)
  if (/^5[1-5]/.test(digits) || /^(222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(digits)) {
    return {
      id: "mastercard",
      name: "Mastercard",
      badgeText: "MASTERCARD",
      badgeBg: "bg-linear-to-r from-red-600 to-amber-500 border-amber-300",
      badgeTextClass: "text-white",
      cardGradient: "from-[#2B1216] via-[#591C21] to-[#8C2D19]",
      validLengths: [16],
      maxLength: 16,
      cvvLength: 3,
      issuerHint,
    };
  }

  // 5. Discover: 6011, 644-649, 65 (when not 6521/6522 RuPay)
  if (/^(6011|64[4-9]|65)/.test(digits)) {
    return {
      id: "discover",
      name: "Discover",
      badgeText: "DISCOVER",
      badgeBg: "bg-amber-600 border-amber-400",
      badgeTextClass: "text-white",
      cardGradient: "from-[#3D2314] via-[#6B3A1E] to-[#A65A2A]",
      validLengths: [16],
      maxLength: 16,
      cvvLength: 3,
      issuerHint,
    };
  }

  // 6. Maestro: 5018, 5020, 5038, 5893, 6304, 6759, 6761-6763, 6220
  if (/^(5018|5020|5038|5893|6304|6759|676[1-3]|6220)/.test(digits)) {
    return {
      id: "maestro",
      name: "Maestro",
      badgeText: "MAESTRO",
      badgeBg: "bg-blue-700 border-blue-400",
      badgeTextClass: "text-white",
      cardGradient: "from-[#1A2942] via-[#1E3F66] to-[#7A1C32]",
      validLengths: [16, 17, 18, 19],
      maxLength: 19,
      cvvLength: 3,
      issuerHint,
    };
  }

  // 7. Diners Club: 300-305, 36, 38, 39
  if (/^(30[0-5]|3[689])/.test(digits)) {
    return {
      id: "diners",
      name: "Diners Club",
      badgeText: "DINERS",
      badgeBg: "bg-slate-700 border-slate-400",
      badgeTextClass: "text-white",
      cardGradient: "from-[#1F2937] via-[#374151] to-[#4B5563]",
      validLengths: [14, 16],
      maxLength: 16,
      cvvLength: 3,
      issuerHint,
    };
  }

  return {
    id: "unknown",
    name: "Unknown Network",
    badgeText: "CARD",
    badgeBg: "bg-stone-700 border-stone-500",
    badgeTextClass: "text-stone-200",
    cardGradient: "from-[#2A0E20] via-[#38152B] to-[#4F1D3C]",
    validLengths: [16],
    maxLength: 16,
    cvvLength: 3,
  };
}

function formatCardNumberDisplay(rawDigits: string, networkId: DetectedCardNetwork["id"]): string {
  const digits = rawDigits.replace(/\D/g, "");
  if (networkId === "amex") {
    // 4-6-5 grouping for American Express
    const p1 = digits.slice(0, 4);
    const p2 = digits.slice(4, 10);
    const p3 = digits.slice(10, 15);
    return [p1, p2, p3].filter(Boolean).join(" ");
  }
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function passesLuhnChecksum(digits: string): boolean {
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function isSuspiciousOrFakePattern(digits: string): boolean {
  if (KNOWN_TEST_OR_FAKE_CARDS.has(digits)) return true;
  // Reject all identical digits (e.g. 4444444444444444)
  if (/^(\d)\1+$/.test(digits)) return true;
  // Reject repeating 2-digit or 4-digit blocks (e.g. 4242424242424242, 4123412341234123)
  if (/^(\d{2})\1{5,}$/.test(digits)) return true;
  if (/^(\d{4})\1{2,}$/.test(digits)) return true;
  // Reject 8+ identical trailing digits (e.g. 4532000000000000)
  if (/(\d)\1{7,}$/.test(digits)) return true;
  // Reject ascending or descending sequential runs
  if ("01234567890123456789".includes(digits.slice(0, 10))) return true;
  if ("98765432109876543210".includes(digits.slice(0, 10))) return true;
  return false;
}

function validateCardNumber(rawInput: string): {
  valid: boolean;
  error?: string;
  network: DetectedCardNetwork;
  digits: string;
} {
  const digits = rawInput.replace(/\D/g, "");
  const network = detectCardNetwork(digits);

  if (!digits) {
    return { valid: false, error: "Please enter your debit card number.", network, digits };
  }
  if (network.id === "unknown") {
    return {
      valid: false,
      error: "Unrecognized card BIN prefix. Please enter a genuine Visa, Mastercard, RuPay, Amex, or Maestro card.",
      network,
      digits,
    };
  }
  if (!network.validLengths.includes(digits.length)) {
    const expected = network.validLengths.join(" or ");
    return {
      valid: false,
      error: `${network.name} cards require ${expected} digits (currently ${digits.length}).`,
      network,
      digits,
    };
  }
  if (isSuspiciousOrFakePattern(digits)) {
    return {
      valid: false,
      error: "Test, dummy, or repetitive card numbers are not permitted. Please enter a genuine active card.",
      network,
      digits,
    };
  }
  if (!passesLuhnChecksum(digits)) {
    return {
      valid: false,
      error: `Invalid ${network.name} card number — failed bank Luhn checksum verification.`,
      network,
      digits,
    };
  }
  return { valid: true, network, digits };
}

function handleDigitsOnlyKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  const allowedKeys = [
    "Backspace",
    "Delete",
    "Tab",
    "Escape",
    "Enter",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
  ];
  if (
    allowedKeys.includes(e.key) ||
    e.ctrlKey ||
    e.metaKey
  ) {
    return;
  }
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
  }
}

export default function Account() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();

  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => getUserSession());
  const initialTab = (searchParams.get("tab") as AccountTab) || "orders";
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [copiedAwb, setCopiedAwb] = useState<string | null>(null);

  // Saved Addresses State
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [addressForm, setAddressForm] = useState<Omit<SavedAddress, "id">>({
    name: "",
    phone: "",
    email: "",
    address: "",
    apartment: "",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "",
    tag: "Home",
    isDefault: false,
  });

  // Saved Payments State
  const [payments, setPayments] = useState<SavedPayment[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    type: "upi" as "upi" | "card",
    title: "",
    details: "",
    expiry: "",
    cvv: "",
    cardholderName: "",
    isDefault: false,
  });

  // Selected Order for Invoice modal
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [reorderSuccess, setReorderSuccess] = useState<string | null>(null);

  // Profile Edit State
  const [profileDob, setProfileDob] = useState<string>(() => currentUser?.birthday || "");
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Authentication check: locks redirection to Account upon login instead of home or shop
  useEffect(() => {
    const session = getUserSession();
    if (!session) {
      navigate("/login?redirect=/account", { replace: true });
    } else {
      setCurrentUser(session);
      if (session.birthday) setProfileDob(session.birthday);
      setAddresses(getSavedAddresses(session.phone, session.email, session.id));
      setPayments(getSavedPayments(session.phone));
    }
  }, [navigate]);

  const handleSaveProfileDob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setProfileError(null);
    setProfileSuccess(null);
    if (profileDob) {
      const birthDate = new Date(profileDob);
      const today = new Date();
      if (isNaN(birthDate.getTime()) || birthDate >= today) {
        setProfileError("Please enter a valid past Date of Birth.");
        return;
      }
    }

    const updatedSession = setUserSession({
      ...currentUser,
      birthday: profileDob || undefined,
    });
    setCurrentUser(updatedSession);

    try {
      await fetch(`${API_BASE}/crm/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: updatedSession.id,
          name: updatedSession.name,
          email: updatedSession.email,
          phone: updatedSession.phone,
          birthday: profileDob || undefined,
        }),
      });
    } catch {}

    setProfileSuccess("Profile updated successfully!");
    setTimeout(() => setProfileSuccess(null), 3000);
  };

  // Sync tab with URL
  const handleTabChange = (tab: AccountTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Fetch orders for current user
  useEffect(() => {
    if (!currentUser) return;
    let isMounted = true;
    setIsLoadingOrders(true);

    async function loadOrders() {
      try {
        const data = await StoreService.getUserOrders(currentUser!.phone, currentUser!.email);
        if (isMounted) {
          setOrders(data || []);
        }
      } catch (err) {
        console.error("Error loading user orders:", err);
      } finally {
        if (isMounted) setIsLoadingOrders(false);
      }
    }

    loadOrders();
    const interval = setInterval(loadOrders, 15000);

    const handleFulfillmentEvent = () => {
      loadOrders();
    };

    window.addEventListener(ORDER_FULFILLED_EVENT, handleFulfillmentEvent);
    window.addEventListener("storage", handleFulfillmentEvent);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener(ORDER_FULFILLED_EVENT, handleFulfillmentEvent);
      window.removeEventListener("storage", handleFulfillmentEvent);
    };
  }, [currentUser]);

  // Copy AWB
  const handleCopyAwb = (awb: string) => {
    navigator.clipboard.writeText(awb);
    setCopiedAwb(awb);
    setTimeout(() => setCopiedAwb(null), 2500);
  };

  // Buy Again / Reorder
  const handleReorder = (item: any) => {
    addToCart(
      {
        id: item.productId || item.id,
        name: item.name,
        category: "SiCo Gadwal Sarees",
        material: "SiCo",
        price: Number(item.price || item.unitPrice) || 0,
        stock: 10,
        rating: 4.8,
        reviewCount: 15,
        images: [item.image || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200"],
        colors: [item.color || "Standard"],
        sizes: ["Free Size"],
        description: item.description || item.name || "",
        longDescription: item.description || item.name || "",
      },
      { quantity: 1, selectedColor: item.color }
    );
    setReorderSuccess(`"${item.name}" added to bag!`);
    setTimeout(() => setReorderSuccess(null), 3000);
  };

  // Handle Logout: Stays cleanly on Account/Login path
  const handleLogout = () => {
    clearUserSession();
    navigate("/login?redirect=/account", { replace: true });
  };

  // Address Handlers
  const handleOpenAddressModal = (addr?: SavedAddress) => {
    if (addr) {
      setEditingAddress(addr);
      setAddressForm({
        name: addr.name,
        phone: addr.phone,
        email: addr.email || "",
        address: addr.address,
        apartment: addr.apartment || "",
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        tag: addr.tag,
        isDefault: addr.isDefault,
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        name: currentUser?.name || "",
        phone: currentUser?.phone || "",
        email: currentUser?.email || "",
        address: "",
        apartment: "",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "",
        tag: "Home",
        isDefault: addresses.length === 0,
      });
    }
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const updated = saveAddress(
      {
        ...(editingAddress ? { id: editingAddress.id } : {}),
        ...addressForm,
      },
      currentUser.phone,
      currentUser.email,
      currentUser.id
    );
    setAddresses(updated);
    setIsAddressModalOpen(false);
  };

  const handleDeleteAddress = (id: string) => {
    if (!currentUser) return;
    const updated = deleteAddress(id, currentUser.phone, currentUser.email);
    setAddresses(updated);
  };

  const handleSetDefaultAddress = (id: string) => {
    if (!currentUser) return;
    const updated = setDefaultAddress(id, currentUser.phone, currentUser.email);
    setAddresses(updated);
  };

  // Live card validation state
  const cardValidation = useMemo(() => {
    return validateCardNumber(paymentForm.details);
  }, [paymentForm.details]);

  // Payment Handlers
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setPaymentError(null);

    if (paymentForm.type === "upi") {
      const cleanUpi = paymentForm.details.trim().toLowerCase();
      if (!/^[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z]{2,32}$/.test(cleanUpi)) {
        setPaymentError("Please enter a valid UPI VPA handle (e.g., name@okaxis or 9876543210@ybl).");
        return;
      }
      const updated = savePaymentMethod(
        {
          type: "upi",
          title: paymentForm.title.trim() || "UPI VPA",
          details: cleanUpi,
          isDefault: paymentForm.isDefault,
        },
        currentUser.phone
      );
      setPayments(updated);
    } else {
      if (!cardValidation.valid) {
        setPaymentError(cardValidation.error || "Please enter a valid debit card number.");
        return;
      }

      const last4 = cardValidation.digits.slice(-4);
      const maskedNumber =
        cardValidation.network.id === "amex"
          ? `•••• •••••• •${last4}`
          : `•••• •••• •••• ${last4}`;
      const autoTitle = cardValidation.network.issuerHint
        ? `${cardValidation.network.issuerHint} ${cardValidation.network.name}`
        : `${cardValidation.network.name} Debit Card`;

      const updated = savePaymentMethod(
        {
          type: "card",
          title: paymentForm.title.trim() || autoTitle,
          details: maskedNumber,
          brand: cardValidation.network.name,
          isDefault: paymentForm.isDefault,
        },
        currentUser.phone
      );
      setPayments(updated);
    }

    setIsPaymentModalOpen(false);
    setPaymentError(null);
    setPaymentForm({
      type: "upi",
      title: "",
      details: "",
      expiry: "",
      cvv: "",
      cardholderName: "",
      isDefault: false,
    });
  };

  const handleDeletePayment = (id: string) => {
    if (!currentUser) return;
    const updated = deletePaymentMethod(id, currentUser.phone);
    setPayments(updated);
  };

  // Progress Steps Helper (Synchronized with 4 canonical states: new, packaging, shipped, delivered)
  const getOrderStepProgress = (status: string, stage?: string) => {
    const s = (stage || status || "").toLowerCase();
    if (s.includes("delivered")) return 4;
    if (s.includes("shipped") || s.includes("transit") || s.includes("dispatch")) return 3;
    if (s.includes("pack") || s.includes("processing") || s.includes("loom")) return 2;
    return 1;
  };

  const totalSpent = useMemo(() => {
    return orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [orders]);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4 sm:px-6 lg:px-12 text-[#2A2421]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Identity Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#2A0E20] via-[#38152B] to-[#4F1D3C] text-white p-6 sm:p-8 shadow-xl border border-white/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-linear-to-br from-amber-400 to-amber-600 text-stone-900 font-serif font-bold text-2xl sm:text-3xl flex items-center justify-center shadow-lg border-2 border-white/30">
                {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
                    {currentUser.name}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-stone-300 mt-2 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Phone size={14} className="text-amber-400" />
                    {currentUser.phone}
                  </span>
                  {currentUser.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail size={14} className="text-amber-400" />
                      {currentUser.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 sm:gap-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 w-full md:w-auto justify-around">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider text-stone-300 font-sans">Total Orders</p>
                <p className="text-xl sm:text-2xl font-serif font-bold text-amber-300 mt-0.5">
                  {orders.length}
                </p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider text-stone-300 font-sans">Total Spent</p>
                <p className="text-xl sm:text-2xl font-serif font-bold text-amber-300 mt-0.5">
                  ₹{totalSpent.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="flex flex-col items-center justify-center text-xs text-stone-300 hover:text-white transition-colors group cursor-pointer"
              >
                <LogOut size={20} className="text-red-300 group-hover:scale-110 transition-transform" />
                <span className="mt-1">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Reorder Notification Toast */}
        {reorderSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between shadow-sm">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 size={18} className="text-emerald-600" />
              {reorderSuccess}
            </span>
            <Link to="/cart" className="text-xs font-bold underline hover:text-emerald-950">
              View Bag & Checkout &rarr;
            </Link>
          </div>
        )}

        {/* Main Tabs Navigation */}
        <div className="flex border-b border-stone-200 overflow-x-auto no-scrollbar gap-2 sm:gap-4">
          <button
            onClick={() => handleTabChange("orders")}
            className={`flex items-center gap-2 py-3.5 px-4 font-serif text-sm sm:text-base border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "orders"
                ? "border-[#38152B] text-[#38152B] font-bold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Package size={18} />
            My Orders & Live Tracking
            {orders.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-[#38152B] text-white">
                {orders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange("payments")}
            className={`flex items-center gap-2 py-3.5 px-4 font-serif text-sm sm:text-base border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "payments"
                ? "border-[#38152B] text-[#38152B] font-bold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <CreditCard size={18} />
            Payment History
          </button>

          <button
            onClick={() => handleTabChange("addresses")}
            className={`flex items-center gap-2 py-3.5 px-4 font-serif text-sm sm:text-base border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "addresses"
                ? "border-[#38152B] text-[#38152B] font-bold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <MapPin size={18} />
            Saved Addresses ({addresses.length})
          </button>

          <button
            onClick={() => handleTabChange("cards")}
            className={`flex items-center gap-2 py-3.5 px-4 font-serif text-sm sm:text-base border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "cards"
                ? "border-[#38152B] text-[#38152B] font-bold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <ShieldCheck size={18} />
            Saved Cards & UPI
          </button>

          <button
            onClick={() => handleTabChange("profile")}
            className={`flex items-center gap-2 py-3.5 px-4 font-serif text-sm sm:text-base border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "profile"
                ? "border-[#38152B] text-[#38152B] font-bold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <User size={18} />
            Profile Settings
          </button>
        </div>

        {/* TAB 1: MY ORDERS & LIVE TRACKING */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {isLoadingOrders ? (
              <div className="py-20 text-center text-stone-500">
                <Clock className="w-8 h-8 animate-spin mx-auto text-[#38152B] mb-3" />
                <p className="font-serif">Retrieving your orders and live shipment coordinates...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-sm max-w-xl mx-auto space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto">
                  <ShoppingBag size={28} />
                </div>
                <h3 className="text-xl font-serif font-bold">No Orders Placed Yet</h3>
                <p className="text-stone-600 text-sm">
                  You haven't ordered any handcrafted SiCo Gadwal sarees yet. Explore our bespoke boutique collection today.
                </p>
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#38152B] text-white font-medium hover:bg-[#2A0E20] transition-colors"
                >
                  Explore Saree Collection &rarr;
                </Link>
              </div>
            ) : (
              orders.map((order) => {
                const step = getOrderStepProgress(order.orderStatus, order.currentStage);
                const isDelivered = step === 4;
                const isCancelled = order.orderStatus === "cancelled";

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden transition-all hover:shadow-md"
                  >
                    {/* Order Header */}
                    <div className="bg-stone-50/80 px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
                        <div>
                          <span className="text-stone-500 uppercase tracking-wider block text-[11px]">Invoice #</span>
                          <span className="font-mono font-bold text-[#38152B]">{order.invoiceNumber}</span>
                        </div>
                        <div className="h-6 w-px bg-stone-300" />
                        <div>
                          <span className="text-stone-500 uppercase tracking-wider block text-[11px]">Date</span>
                          <span className="font-medium text-stone-800">{order.date}</span>
                        </div>
                        <div className="h-6 w-px bg-stone-300" />
                        <div>
                          <span className="text-stone-500 uppercase tracking-wider block text-[11px]">Total</span>
                          <span className="font-bold text-stone-900 font-serif">₹{Number(order.total).toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedInvoice(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                        >
                          <Printer size={14} />
                          Invoice
                        </button>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            isDelivered
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : isCancelled
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {order.orderStatus || "Processing"}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Visual Stepper */}
                      {!isCancelled && (
                        <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200/80">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs uppercase tracking-widest font-bold text-stone-600 flex items-center gap-2">
                              <Truck size={15} className="text-[#8E3D51]" />
                              Live Shipment Tracking
                            </h4>
                            <span className="text-xs font-semibold text-[#8E3D51]">
                              Stage: {order.currentStage || order.orderStatus || "Processing"}
                            </span>
                          </div>

                          <div className="relative flex items-center justify-between">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-stone-200 z-0" />
                            <div
                              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-600 transition-all duration-500 z-0"
                              style={{ width: `${Math.min(100, Math.max(0, (step - 1) * 33.33))}%` }}
                            />

                            {[
                              { label: "Order Placed", stepNum: 1 },
                              { label: "Packaging", stepNum: 2 },
                              { label: "Shipped", stepNum: 3 },
                              { label: "Delivered", stepNum: 4 },
                            ].map((s) => {
                              const isCompleted = step >= s.stepNum;
                              const isCurrent = step === s.stepNum;

                              return (
                                <div key={s.stepNum} className="relative z-10 flex flex-col items-center">
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                      isCompleted
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "bg-white border-2 border-stone-300 text-stone-400"
                                    } ${isCurrent ? "ring-4 ring-emerald-100 scale-110" : ""}`}
                                  >
                                    {isCompleted ? <Check size={14} strokeWidth={3} /> : s.stepNum}
                                  </div>
                                  <span
                                    className={`text-[10px] sm:text-xs mt-2 font-medium text-center max-w-20 sm:max-w-none ${
                                      isCurrent
                                        ? "text-emerald-800 font-bold"
                                        : isCompleted
                                        ? "text-stone-800"
                                        : "text-stone-400"
                                    }`}
                                  >
                                    {s.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Courier Partner Card */}
                      {order.awbNumber ? (
                        <div className="p-4 rounded-2xl bg-linear-to-r from-amber-50 to-orange-50/50 border border-amber-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-[#8E3D51] flex items-center justify-center shrink-0">
                              <Truck size={22} />
                            </div>
                            <div>
                              <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
                                Courier Partner & AWB
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-serif font-bold text-stone-900">
                                  {order.carrierPartner || "Blue Dart"}
                                </span>
                                <span className="text-stone-300">•</span>
                                <code className="font-mono bg-white px-2 py-0.5 rounded border border-amber-200 text-xs font-bold text-[#8E3D51]">
                                  {order.awbNumber}
                                </code>
                                <button
                                  onClick={() => handleCopyAwb(order.awbNumber)}
                                  title="Copy AWB Number"
                                  className="text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                                >
                                  {copiedAwb === order.awbNumber ? (
                                    <Check size={14} className="text-emerald-600" />
                                  ) : (
                                    <Copy size={14} />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {(() => {
                            const trackingLink =
                              order.trackingUrl ||
                              (order.awbNumber
                                ? getCourierTrackingUrl(order.carrierPartner, order.awbNumber)
                                : null);
                            if (!trackingLink) return null;
                            return (
                              <a
                                href={trackingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8E3D51] text-white text-xs sm:text-sm font-semibold hover:bg-[#732F41] transition-all shadow-sm hover:shadow active:scale-95 whitespace-nowrap"
                              >
                                Track on {order.carrierPartner || "Courier"} Website
                                <ExternalLink size={15} />
                              </a>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-600 text-xs flex items-center gap-2">
                          <Clock size={16} className="text-amber-600 shrink-0" />
                          <span>
                            Loom weaving / packaging in progress. Your courier AWB tracking link will activate here immediately once dispatched by our studio.
                          </span>
                        </div>
                      )}

                      {/* Items List */}
                      <div className="divide-y divide-stone-100">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <img
                                src={item.image || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=300"}
                                alt={item.name}
                                className="w-16 h-20 object-cover rounded-xl border border-stone-200 bg-stone-100"
                              />
                              <div>
                                <h5 className="font-serif font-bold text-stone-900 text-sm sm:text-base">
                                  {item.name}
                                </h5>
                                <p className="text-xs text-stone-500 mt-0.5">
                                  Color: <span className="font-medium text-stone-700">{item.color || "Standard"}</span> • Qty: {item.quantity || item.qty || 1}
                                </p>
                                <p className="text-xs font-bold text-[#8E3D51] mt-1">
                                  ₹{Number(item.price || item.unitPrice || 0).toLocaleString("en-IN")}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleReorder(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-[#38152B] hover:text-white transition-all cursor-pointer"
                            >
                              <RotateCcw size={13} />
                              Buy Again
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Delivery Address */}
                      {order.shippingAddress && (
                        <div className="pt-2 text-xs text-stone-500 flex items-start gap-2 border-t border-stone-100">
                          <MapPin size={14} className="text-stone-400 mt-0.5 shrink-0" />
                          <span>
                            Delivery to: <strong className="text-stone-700">
                              {typeof order.shippingAddress === "string"
                                ? order.shippingAddress
                                : [
                                    order.shippingAddress.address,
                                    order.shippingAddress.apartment,
                                    order.shippingAddress.city,
                                    order.shippingAddress.state,
                                    order.shippingAddress.pincode,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: PAYMENT HISTORY */}
        {activeTab === "payments" && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden p-6 space-y-6">
            <div>
              <h3 className="text-lg font-serif font-bold text-stone-900">Payment History & Transaction Ledger</h3>
              <p className="text-xs text-stone-500 mt-1">
                Complete record of all orders and verified payment gateway transactions.
              </p>
            </div>

            {orders.length === 0 ? (
              <div className="py-12 text-center text-stone-500">
                <CreditCard size={32} className="mx-auto text-stone-400 mb-2" />
                <p>No transactions found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                    <tr>
                      <th className="py-3 px-4">Invoice / Txn</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Payment Mode</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-xs text-[#38152B]">
                          {o.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 text-stone-600 text-xs">{o.date}</td>
                        <td className="py-3 px-4 font-medium uppercase text-xs text-stone-700">
                          {o.paymentMethod || "UPI / Card"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <Check size={11} strokeWidth={3} />
                            {o.paymentStatus || "Completed"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-serif font-bold text-stone-900">
                          ₹{Number(o.total).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedInvoice(o)}
                            className="p-1.5 text-stone-600 hover:text-[#38152B] rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                            title="View Invoice Receipt"
                          >
                            <Printer size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SAVED ADDRESSES */}
        {activeTab === "addresses" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-900">Saved Delivery Addresses</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Manage your shipping destinations for fast 1-click checkout.
                </p>
              </div>
              <button
                onClick={() => handleOpenAddressModal()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#38152B] text-white text-xs font-semibold hover:bg-[#2A0E20] transition-colors cursor-pointer"
              >
                <Plus size={16} />
                Add New Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
                <MapPin size={32} className="mx-auto text-stone-400 mb-2" />
                <h4 className="font-serif font-bold text-stone-800">No Saved Addresses</h4>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  Add a delivery address to enjoy seamless 1-click ordering during checkout.
                </p>
                <button
                  onClick={() => handleOpenAddressModal()}
                  className="mt-4 px-5 py-2 rounded-xl bg-[#38152B] text-white text-xs font-medium cursor-pointer"
                >
                  Add Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`bg-white rounded-2xl p-5 border transition-all relative flex flex-col justify-between ${
                      addr.isDefault
                        ? "border-[#38152B] shadow-sm ring-1 ring-[#38152B]/20"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-stone-100 text-stone-700 uppercase">
                          {addr.tag === "Home" ? <Home size={12} /> : <Briefcase size={12} />}
                          {addr.tag}
                        </span>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800">
                            DEFAULT
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-stone-900 text-sm font-serif">{addr.name}</h4>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        {addr.apartment ? `${addr.apartment}, ` : ""}
                        {addr.address}
                      </p>
                      <p className="text-xs text-stone-600">
                        {addr.city}, {addr.state} - <span className="font-mono font-bold">{addr.pincode}</span>
                      </p>
                      <p className="text-xs text-stone-500 mt-2 font-mono flex items-center gap-1">
                        <Phone size={11} /> {addr.phone}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-xs text-[#8E3D51] font-semibold hover:underline cursor-pointer"
                        >
                          Set Default
                        </button>
                      )}
                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          onClick={() => handleOpenAddressModal(addr)}
                          className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                          title="Edit Address"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Address"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SAVED CARDS & UPI */}
        {activeTab === "cards" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-900">Saved Cards & UPI Handles</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Secure tokenized payment accounts for expedited checkout.
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#38152B] text-white text-xs font-semibold hover:bg-[#2A0E20] transition-colors cursor-pointer"
              >
                <Plus size={16} />
                Add Payment Method
              </button>
            </div>

            {payments.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
                <CreditCard size={32} className="mx-auto text-stone-400 mb-2" />
                <h4 className="font-serif font-bold text-stone-800">No Saved Payment Methods</h4>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  Save your UPI ID (Google Pay, PhonePe, Paytm) or card for quick settlement.
                </p>
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="mt-4 px-5 py-2 rounded-xl bg-[#38152B] text-white text-xs font-medium cursor-pointer"
                >
                  Add UPI / Card
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl p-5 border border-stone-200 hover:border-stone-300 shadow-sm flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700 shrink-0">
                        {p.type === "upi" ? <Sparkles size={18} /> : <CreditCard size={18} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-stone-900 font-serif truncate">{p.title}</p>
                          {p.type === "card" && p.brand && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#38152B]/10 text-[#38152B] border border-[#38152B]/20">
                              {p.brand}
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-xs text-stone-600 mt-0.5">{p.details}</p>
                        {p.type === "card" && (p.expiry || p.cardholderName) && (
                          <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                            {p.cardholderName ? `${p.cardholderName} • ` : ""}
                            {p.expiry ? `Exp ${p.expiry}` : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeletePayment(p.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                      title="Remove Payment Method"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PROFILE SETTINGS */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-3xl border border-stone-200 p-8 max-w-2xl mx-auto shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-serif font-bold text-stone-900">Personal Patron Profile</h3>
              <p className="text-xs text-stone-500 mt-1">
                Your credentials and preferences across RS Fashions.
              </p>
            </div>

            <form onSubmit={handleSaveProfileDob} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider block mb-1">Full Name</label>
                  <input
                    type="text"
                    readOnly
                    value={currentUser.name}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-medium text-stone-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider block mb-1">Mobile Number</label>
                  <input
                    type="text"
                    readOnly
                    value={currentUser.phone}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono text-stone-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider block mb-1">Email Address</label>
                  <input
                    type="email"
                    readOnly
                    value={currentUser.email || "Not specified"}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono text-stone-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    value={profileDob}
                    onChange={(e) => setProfileDob(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white font-mono text-stone-800 focus:border-[#38152B] outline-none"
                  />
                  <p className="mt-1 text-[10px] text-stone-400">Used for birthday privileges &amp; gifts.</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider block mb-1">Preferred Weave</label>
                <input
                  type="text"
                  readOnly
                  value={currentUser.preferredWeave || "SiCo Gadwal Handloom"}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800"
                />
              </div>

              {profileError && (
                <p className="text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-xl border border-red-200">
                  {profileError}
                </p>
              )}

              {profileSuccess && (
                <p className="text-xs text-emerald-700 font-medium bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  {profileSuccess}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#38152B] text-white text-xs font-semibold hover:bg-[#4E1D3D] transition-colors cursor-pointer"
                >
                  Save Profile Details
                </button>
              </div>

              <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                <p className="text-xs text-stone-400">
                  Account session active for 30 days of inactivity.
                </p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-5 py-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer"
                >
                  Log Out from Account
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h3 className="font-serif font-bold text-xl text-stone-900">
                {editingAddress ? "Edit Delivery Address" : "Add New Delivery Address"}
              </h3>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:border-[#38152B] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:border-[#38152B] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Flat / House No. / Building</label>
                <input
                  type="text"
                  value={addressForm.apartment}
                  onChange={(e) => setAddressForm({ ...addressForm, apartment: e.target.value })}
                  placeholder="e.g. Flat 402, Villa 12"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:border-[#38152B] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Street Address & Landmark *</label>
                <input
                  type="text"
                  required
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  placeholder="e.g. Road No 36, Jubilee Hills"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:border-[#38152B] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:border-[#38152B] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:border-[#38152B] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:border-[#38152B] outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="text-xs font-semibold text-stone-600">Address Type:</label>
                {(["Home", "Work", "Other"] as const).map((tag) => (
                  <label key={tag} className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="tag"
                      checked={addressForm.tag === tag}
                      onChange={() => setAddressForm({ ...addressForm, tag })}
                    />
                    {tag}
                  </label>
                ))}
              </div>

              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                />
                Make this my default delivery address
              </label>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#38152B] text-white text-xs font-bold hover:bg-[#2A0E20] transition-colors cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900">Add Payment Method</h3>
                <p className="text-[11px] text-stone-500">
                  256-Bit Encrypted &bull; Bank BIN &amp; Luhn Checksum Verified
                </p>
              </div>
              <button
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setPaymentError(null);
                }}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4 text-sm">
              <div className="flex rounded-xl bg-stone-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentError(null);
                    setPaymentForm({
                      ...paymentForm,
                      type: "upi",
                      details: "",
                      expiry: "",
                      cvv: "",
                    });
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    paymentForm.type === "upi" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500"
                  }`}
                >
                  UPI VPA Handle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentError(null);
                    setPaymentForm({
                      ...paymentForm,
                      type: "card",
                      details: "",
                      expiry: "",
                      cvv: "",
                    });
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    paymentForm.type === "card" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500"
                  }`}
                >
                  Debit Card
                </button>
              </div>

              {paymentForm.type === "upi" ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Account Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Google Pay / PhonePe UPI"
                      value={paymentForm.title}
                      onChange={(e) => setPaymentForm({ ...paymentForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:border-[#38152B] outline-hidden text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">UPI ID (VPA) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ananya@okaxis or 9876543210@ybl"
                      value={paymentForm.details}
                      onChange={(e) => {
                        setPaymentError(null);
                        setPaymentForm({ ...paymentForm, details: e.target.value });
                      }}
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:border-[#38152B] outline-hidden font-mono text-xs"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Live Interactive Card Preview */}
                  <div
                    className={`rounded-2xl p-4 text-white bg-linear-to-br ${cardValidation.network.cardGradient} shadow-lg border border-white/15 space-y-3 transition-all duration-300`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-white/75 block">
                          {cardValidation.network.issuerHint || "RS Fashions Secure Vault"}
                        </span>
                        <span className="text-xs font-serif font-semibold text-amber-200">
                          {paymentForm.title.trim() ||
                            (cardValidation.network.id !== "unknown"
                              ? `${cardValidation.network.name} Debit Card`
                              : "Verified Debit Card")}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-extrabold tracking-wider border ${cardValidation.network.badgeBg} ${cardValidation.network.badgeTextClass} shadow-xs`}
                      >
                        {cardValidation.network.badgeText}
                      </span>
                    </div>

                    <div className="font-mono text-base sm:text-lg tracking-[0.18em] font-semibold text-white/95 pt-1">
                      {paymentForm.details || "•••• •••• •••• ••••"}
                    </div>
                  </div>

                  {/* Card Nickname */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">
                      Card Nickname (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder={
                        cardValidation.network.id !== "unknown"
                          ? `e.g. My ${cardValidation.network.name} Card`
                          : "e.g. HDFC Millennia Visa"
                      }
                      value={paymentForm.title}
                      onChange={(e) => setPaymentForm({ ...paymentForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:border-[#38152B] outline-hidden text-xs"
                    />
                  </div>

                  {/* Card Number — Strictly Numbers Only + Auto Network Detection */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-stone-600">
                        Debit Card Number (Digits Only) *
                      </label>
                      {cardValidation.digits.length > 0 && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            cardValidation.network.id !== "unknown"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {cardValidation.network.id !== "unknown"
                            ? `Detected: ${cardValidation.network.name}${
                                cardValidation.network.issuerHint
                                  ? ` (${cardValidation.network.issuerHint})`
                                  : ""
                              }`
                            : "Unrecognized BIN"}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        required
                        maxLength={cardValidation.network.id === "amex" ? 17 : 23}
                        placeholder="Enter 16-digit card number"
                        value={paymentForm.details}
                        onKeyDown={handleDigitsOnlyKeyDown}
                        onChange={(e) => {
                          setPaymentError(null);
                          const rawDigits = e.target.value.replace(/\D/g, "");
                          const detected = detectCardNetwork(rawDigits);
                          const cappedDigits = rawDigits.slice(0, detected.maxLength);
                          const formatted = formatCardNumberDisplay(cappedDigits, detected.id);
                          setPaymentForm({
                            ...paymentForm,
                            details: formatted,
                          });
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedDigits = e.clipboardData.getData("text").replace(/\D/g, "");
                          const detected = detectCardNetwork(pastedDigits);
                          const cappedDigits = pastedDigits.slice(0, detected.maxLength);
                          const formatted = formatCardNumberDisplay(cappedDigits, detected.id);
                          setPaymentError(null);
                          setPaymentForm({
                            ...paymentForm,
                            details: formatted,
                          });
                        }}
                        className={`w-full pl-3 pr-24 py-2.5 border rounded-xl outline-hidden font-mono text-xs tracking-wider transition-colors ${
                          cardValidation.digits.length === 0
                            ? "border-stone-200 focus:border-[#38152B]"
                            : cardValidation.valid
                            ? "border-emerald-500 bg-emerald-50/20"
                            : "border-amber-400 bg-amber-50/20"
                        }`}
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                        {cardValidation.valid && (
                          <CheckCircle2 size={15} className="text-emerald-600" />
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${cardValidation.network.badgeBg} ${cardValidation.network.badgeTextClass}`}
                        >
                          {cardValidation.network.badgeText}
                        </span>
                      </div>
                    </div>

                    {/* Real-time genuineness / Luhn feedback */}
                    {cardValidation.digits.length > 0 && (
                      <p
                        className={`mt-1.5 text-[11px] font-medium flex items-center gap-1 ${
                          cardValidation.valid ? "text-emerald-700" : "text-amber-800"
                        }`}
                      >
                        {cardValidation.valid ? (
                          <>
                            <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                            Verified Genuine {cardValidation.network.name} Card (Luhn &amp; BIN Passed)
                          </>
                        ) : (
                          <span>{cardValidation.error}</span>
                        )}
                      </p>
                    )}
                  </div>

                  <p className="text-[10px] text-stone-400 leading-relaxed">
                    Your card number is verified locally using ISO/IEC 7812 Luhn checksums and never stored in plain text. Only the masked last 4 digits are saved.
                  </p>
                </>
              )}

              {paymentError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {paymentError}
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setPaymentError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentForm.type === "card" && !cardValidation.valid}
                  className="px-5 py-2 rounded-xl bg-[#38152B] text-white text-xs font-bold hover:bg-[#2A0E20] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Verify &amp; Save Payment Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tax Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center gap-3">
                <img src={logo} alt="RS Fashions" className="h-8 w-auto" />
                <div>
                  <h4 className="font-serif font-bold text-base text-[#38152B]">RS FASHIONS HYDERABAD</h4>
                  <p className="text-[10px] text-stone-500">GSTIN: 36ABCDE1234F1Z5 • Handloom Heritage</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between bg-stone-50 p-3 rounded-xl">
                <div>
                  <span className="text-stone-500 block">TAX INVOICE</span>
                  <strong className="text-sm font-mono text-[#38152B]">{selectedInvoice.invoiceNumber}</strong>
                </div>
                <div className="text-right">
                  <span className="text-stone-500 block">DATE</span>
                  <strong className="text-stone-800">{selectedInvoice.date}</strong>
                </div>
              </div>

              <div>
                <span className="text-stone-500 block font-semibold mb-1">BILLED TO:</span>
                <p className="font-bold text-stone-900">{selectedInvoice.customerName}</p>
                <p className="text-stone-600">{selectedInvoice.customerPhone}</p>
                {selectedInvoice.shippingAddress && (
                  <p className="text-stone-600 mt-1">
                    {typeof selectedInvoice.shippingAddress === "string"
                      ? selectedInvoice.shippingAddress
                      : JSON.stringify(selectedInvoice.shippingAddress)}
                  </p>
                )}
              </div>

              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase tracking-wider text-stone-500">
                    <tr>
                      <th className="p-2">Item Description</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Price</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {selectedInvoice.items.map((it: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <p className="font-bold text-stone-800">{it.name}</p>
                          <span className="text-[10px] text-stone-500">HSN: 5208 • Color: {it.color || "Standard"}</span>
                        </td>
                        <td className="p-2 text-center font-mono">{it.quantity || it.qty || 1}</td>
                        <td className="p-2 text-right font-mono">₹{Number(it.price || it.unitPrice || 0).toLocaleString("en-IN")}</td>
                        <td className="p-2 text-right font-mono font-bold">
                          ₹{(Number(it.price || it.unitPrice || 0) * (it.quantity || it.qty || 1)).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-stone-200 text-right">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{Number(selectedInvoice.subtotal || selectedInvoice.total).toLocaleString("en-IN")}</span>
                </div>
                {selectedInvoice.cgst > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>CGST (2.5%):</span>
                    <span className="font-mono">₹{Number(selectedInvoice.cgst).toLocaleString("en-IN")}</span>
                  </div>
                )}
                {selectedInvoice.sgst > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>SGST (2.5%):</span>
                    <span className="font-mono">₹{Number(selectedInvoice.sgst).toLocaleString("en-IN")}</span>
                  </div>
                )}
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span className="font-mono">-₹{Number(selectedInvoice.discount).toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between font-serif font-bold text-base text-[#38152B] pt-2 border-t border-stone-200">
                  <span>Grand Total Paid:</span>
                  <span>₹{Number(selectedInvoice.total).toLocaleString("en-IN")}</span>
                </div>
              </div>

              {selectedInvoice.awbNumber && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex justify-between items-center">
                  <span>Courier: <strong>{selectedInvoice.carrierPartner}</strong></span>
                  <span>AWB: <strong>{selectedInvoice.awbNumber}</strong></span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-200">
              <span className="text-[11px] text-stone-400">Authentic SiCo Gadwal Handlooms</span>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#38152B] text-white text-xs font-bold hover:bg-[#2A0E20] transition-colors cursor-pointer"
              >
                <Printer size={15} />
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}