import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Package,
  Truck,
  CreditCard,
  MapPin,
  User,
  ExternalLink,
  Copy,
  Check,
  Printer,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  ShieldCheck,
  Clock,
  CheckCircle2,
  LogOut,
  ShoppingBag,
  Sparkles,
  Phone,
  Mail,
  Home,
  Briefcase,
  X,
} from "lucide-react";
import {
  getUserSession,
  setUserSession,
  clearUserSession,
  getSavedAddresses,
  saveAddress,
  deleteAddress,
  setDefaultAddress,
  getSavedPayments,
  savePaymentMethod,
  deletePaymentMethod,
  type UserSession,
  type SavedAddress,
  type SavedPayment,
} from "../utils/userSession";
import { API_BASE } from "../config/api";
import { StoreService } from "../services/supabase";
import {
  ORDER_FULFILLED_EVENT,
  getCourierTrackingUrl,
} from "../context/OrderFulfillmentContext";
import { useCart } from "../context/CartContext";
import logo from "../assets/logo/logo1.png";

type AccountTab = "orders" | "payments" | "addresses" | "cards" | "profile";

export interface DetectedCardNetwork {
  id:
    | "visa"
    | "mastercard"
    | "rupay"
    | "amex"
    | "maestro"
    | "diners"
    | "discover"
    | "unknown";
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
  if (/^(437551|416021|4571|4024|5241|5326|607485)/.test(bin6) || bin4 === "4375")
    return "HDFC Bank";
  if (/^(459150|459200|508500|607094|652150|5196|4213)/.test(bin6))
    return "State Bank of India";
  if (/^(431580|405454|5268|5319|607395|652200)/.test(bin6))
    return "ICICI Bank";
  if (/^(411971|4688|5363|607152|652180)/.test(bin6)) return "Axis Bank";
  if (/^(414746|428102|5129|607420)/.test(bin6)) return "Kotak Mahindra";
  return undefined;
}

function detectCardNetwork(rawInput: string): DetectedCardNetwork {
  const digits = rawInput.replace(/\D/g, "");
  const issuerHint = detectIssuerBankHint(digits);

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

  if (
    /^5[1-5]/.test(digits) ||
    /^(222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(digits)
  ) {
    return {
      id: "mastercard",
      name: "Mastercard",
      badgeText: "MASTERCARD",
      badgeBg: "bg-gradient-to-r from-red-600 to-amber-500 border-amber-300",
      badgeTextClass: "text-white",
      cardGradient: "from-[#2B1216] via-[#591C21] to-[#8C2D19]",
      validLengths: [16],
      maxLength: 16,
      cvvLength: 3,
      issuerHint,
    };
  }

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

function formatCardNumberDisplay(
  rawDigits: string,
  networkId: DetectedCardNetwork["id"]
): string {
  const digits = rawDigits.replace(/\D/g, "");
  if (networkId === "amex") {
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
  if (/^(\d)\1+$/.test(digits)) return true;
  if (/^(\d{2})\1{5,}$/.test(digits)) return true;
  if (/^(\d{4})\1{2,}$/.test(digits)) return true;
  if (/(\d)\1{7,}$/.test(digits)) return true;
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
    return {
      valid: false,
      error: "Please enter your debit card number.",
      network,
      digits,
    };
  }
  if (network.id === "unknown") {
    return {
      valid: false,
      error:
        "Unrecognized card prefix. Please enter a genuine Visa, Mastercard, RuPay, Amex, or Maestro card.",
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
      error: "Dummy or repetitive card numbers are not permitted.",
      network,
      digits,
    };
  }
  if (!passesLuhnChecksum(digits)) {
    return {
      valid: false,
      error: `Invalid ${network.name} card number — failed checksum verification.`,
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
  if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
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

  const [currentUser, setCurrentUser] = useState<UserSession | null>(() =>
    getUserSession()
  );
  const initialTab = (searchParams.get("tab") as AccountTab) || "orders";
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [copiedAwb, setCopiedAwb] = useState<string | null>(null);

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

  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [reorderSuccess, setReorderSuccess] = useState<string | null>(null);

  const [profileDob, setProfileDob] = useState<string>(
    () => currentUser?.birthday || ""
  );
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

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

  const handleTabChange = (tab: AccountTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (!currentUser) return;
    let isMounted = true;
    setIsLoadingOrders(true);

    async function loadOrders() {
      try {
        const data = await StoreService.getUserOrders(
          currentUser!.phone,
          currentUser!.email
        );
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

  const handleCopyAwb = (awb: string) => {
    navigator.clipboard.writeText(awb);
    setCopiedAwb(awb);
    setTimeout(() => setCopiedAwb(null), 2500);
  };

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
        images: [
          item.image ||
            "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200",
        ],
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

  const handleLogout = () => {
    clearUserSession();
    navigate("/login?redirect=/account", { replace: true });
  };

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

  const cardValidation = useMemo(() => {
    return validateCardNumber(paymentForm.details);
  }, [paymentForm.details]);

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setPaymentError(null);

    if (paymentForm.type === "upi") {
      const cleanUpi = paymentForm.details.trim().toLowerCase();
      if (!/^[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z]{2,32}$/.test(cleanUpi)) {
        setPaymentError(
          "Please enter a valid UPI ID (e.g. name@okhdfcbank or 9876543210@ybl)."
        );
        return;
      }
      const updated = savePaymentMethod(
        {
          type: "upi",
          title: paymentForm.title.trim() || "UPI Handle",
          details: cleanUpi,
          isDefault: paymentForm.isDefault,
        },
        currentUser.phone
      );
      setPayments(updated);
    } else {
      if (!cardValidation.valid) {
        setPaymentError(
          cardValidation.error || "Please enter a valid debit card number."
        );
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

  const getOrderStepProgress = (status: string, stage?: string) => {
    const s = (stage || status || "").toLowerCase();
    if (s.includes("delivered")) return 4;
    if (
      s.includes("shipped") ||
      s.includes("transit") ||
      s.includes("dispatch")
    )
      return 3;
    if (s.includes("pack") || s.includes("processing") || s.includes("loom"))
      return 2;
    return 1;
  };

  const totalSpent = useMemo(() => {
    return orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [orders]);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-linear-to-b from-[#F7EBEC] via-[#F4E7E4] to-[#E9C9C3]/40 py-4 sm:py-8 lg:py-10 px-3 sm:px-6 lg:px-10 text-[#2A2421]">
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.97) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes tabFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-modal-pop { animation: fadeInScale 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-tab-content { animation: tabFade 0.28s ease-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Banner Section */}
        <header className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-linear-to-br from-[#240A1A] via-[#351429] to-[#4A1B37] text-white p-4.5 sm:p-7 lg:p-8 shadow-lg sm:shadow-xl border border-white/10 transition-all">
          <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 sm:gap-6">
            <div className="flex items-center gap-3.5 sm:gap-5">
              <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-linear-to-br from-amber-300 via-amber-400 to-amber-600 text-stone-900 font-serif font-bold text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-md border-2 border-white/30 transform transition-transform duration-300 hover:rotate-3">
                {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
              </div>

              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold tracking-tight truncate">
                  {currentUser.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-300 mt-1 font-mono">
                  <span className="flex items-center gap-1.5 shrink-0">
                    <Phone size={13} className="text-amber-400 shrink-0" />
                    {currentUser.phone}
                  </span>
                  {currentUser.email && (
                    <span className="flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-none">
                      <Mail size={13} className="text-amber-400 shrink-0" />
                      <span className="truncate">{currentUser.email}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-6 bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-white/10">
              <div className="text-center px-1">
                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-stone-300">
                  Orders
                </p>
                <p className="text-base sm:text-xl font-serif font-bold text-amber-300 mt-0.5">
                  {orders.length}
                </p>
              </div>

              <div className="w-px h-7 bg-white/20 hidden sm:block" />

              <div className="text-center px-1">
                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-stone-300">
                  Spent
                </p>
                <p className="text-base sm:text-xl font-serif font-bold text-amber-300 mt-0.5 truncate">
                  ₹{totalSpent.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="w-px h-7 bg-white/20 hidden sm:block" />

              <button
                onClick={handleLogout}
                title="Sign Out"
                className="flex flex-col items-center justify-center p-1 rounded-lg text-[10px] sm:text-xs text-red-200 hover:text-white transition-all active:scale-95 group"
              >
                <LogOut
                  size={16}
                  className="sm:w-5 sm:h-5 text-red-300 group-hover:scale-110 transition-transform"
                />
                <span className="mt-0.5 font-medium">Log Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Notifications */}
        {reorderSuccess && (
          <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between shadow-xs transition-all animate-modal-pop">
            <span className="flex items-center gap-2 text-xs sm:text-sm font-medium">
              <CheckCircle2
                size={16}
                className="text-emerald-600 shrink-0"
              />
              {reorderSuccess}
            </span>
            <Link
              to="/cart"
              className="text-xs font-bold underline hover:text-emerald-950 shrink-0 ml-2"
            >
              View Bag &rarr;
            </Link>
          </div>
        )}

        {/* Tabs Bar */}
        <nav
          aria-label="Account Tabs"
          className="flex border-b border-stone-200/90 overflow-x-auto no-scrollbar gap-1 sm:gap-2 px-1"
        >
          {[
            { id: "orders", label: "Orders & Tracking", icon: Package, badge: orders.length },
            { id: "payments", label: "Payment History", icon: CreditCard },
            { id: "addresses", label: "Saved Addresses", icon: MapPin, badge: addresses.length },
            { id: "cards", label: "Cards & UPI", icon: ShieldCheck },
            { id: "profile", label: "Profile", icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as AccountTab)}
                className={`flex items-center gap-1.5 sm:gap-2 py-3 px-3 sm:px-4 font-serif text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap active:scale-95 ${
                  isActive
                    ? "border-[#38152B] text-[#38152B] font-bold"
                    : "border-transparent text-stone-500 hover:text-stone-900"
                }`}
              >
                <Icon size={16} className="shrink-0" />
                <span>{tab.label}</span>
                {typeof tab.badge === "number" && tab.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? "bg-[#38152B] text-white"
                        : "bg-stone-200 text-stone-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Tab 1: Orders & Live Tracking */}
        {activeTab === "orders" && (
          <div className="space-y-4 sm:space-y-6 animate-tab-content">
            {isLoadingOrders ? (
              <div className="py-16 text-center text-stone-500">
                <Clock className="w-7 h-7 animate-spin mx-auto text-[#38152B] mb-2" />
                <p className="text-xs sm:text-sm font-serif">
                  Loading order status and logistics records...
                </p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-stone-200 shadow-xs max-w-lg mx-auto space-y-3">
                <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-900 flex items-center justify-center mx-auto">
                  <ShoppingBag size={24} />
                </div>
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  No Orders Placed Yet
                </h3>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                  Your ordered heirloom sarees will appear here with dynamic courier dispatch status.
                </p>
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#38152B] text-white text-xs font-semibold hover:bg-[#2A0E20] transition-all shadow-sm active:scale-95"
                >
                  Explore Collection &rarr;
                </Link>
              </div>
            ) : (
              orders.map((order) => {
                const step = getOrderStepProgress(
                  order.orderStatus,
                  order.currentStage
                );
                const isDelivered = step === 4;
                const isCancelled = order.orderStatus === "cancelled";

                return (
                  <article
                    key={order.id}
                    className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden transition-all hover:shadow-md"
                  >
                    {/* Header */}
                    <div className="bg-stone-50/80 px-4 sm:px-6 py-3.5 border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                        <div>
                          <span className="text-stone-400 text-[10px] uppercase tracking-wider block">
                            Invoice
                          </span>
                          <span className="font-mono font-bold text-[#38152B]">
                            {order.invoiceNumber}
                          </span>
                        </div>
                        <div className="hidden sm:block h-6 w-px bg-stone-200" />
                        <div>
                          <span className="text-stone-400 text-[10px] uppercase tracking-wider block">
                            Date
                          </span>
                          <span className="font-medium text-stone-700">
                            {order.date}
                          </span>
                        </div>
                        <div className="hidden sm:block h-6 w-px bg-stone-200" />
                        <div>
                          <span className="text-stone-400 text-[10px] uppercase tracking-wider block">
                            Total
                          </span>
                          <span className="font-bold text-stone-900 font-serif">
                            ₹{Number(order.total).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                        <button
                          onClick={() => setSelectedInvoice(order)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-300 text-[11px] sm:text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors active:scale-95"
                        >
                          <Printer size={13} />
                          Invoice
                        </button>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold capitalize ${
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

                    <div className="p-4 sm:p-6 space-y-5">
                      {/* Step Progress Bar */}
                      {!isCancelled && (
                        <div className="p-3.5 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200/80">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] uppercase tracking-wider font-bold text-stone-600 flex items-center gap-1.5">
                              <Truck size={14} className="text-[#8E3D51]" />
                              Live Progress
                            </span>
                            <span className="text-[11px] font-semibold text-[#8E3D51]">
                              Stage: {order.currentStage || order.orderStatus || "Processing"}
                            </span>
                          </div>

                          <div className="relative flex items-center justify-between px-2 sm:px-4">
                            <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-stone-200 z-0" />
                            <div
                              className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-emerald-600 transition-all duration-500 z-0"
                              style={{
                                width: `calc(${Math.min(
                                  100,
                                  Math.max(0, (step - 1) * 33.33)
                                )}% - 16px)`,
                              }}
                            />

                            {[
                              { label: "Placed", stepNum: 1 },
                              { label: "Packaging", stepNum: 2 },
                              { label: "Shipped", stepNum: 3 },
                              { label: "Delivered", stepNum: 4 },
                            ].map((s) => {
                              const isCompleted = step >= s.stepNum;
                              const isCurrent = step === s.stepNum;

                              return (
                                <div
                                  key={s.stepNum}
                                  className="relative z-10 flex flex-col items-center"
                                >
                                  <div
                                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                                      isCompleted
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : "bg-white border-2 border-stone-300 text-stone-400"
                                    } ${
                                      isCurrent
                                        ? "ring-4 ring-emerald-100 scale-110"
                                        : ""
                                    }`}
                                  >
                                    {isCompleted ? (
                                      <Check size={12} strokeWidth={3} />
                                    ) : (
                                      s.stepNum
                                    )}
                                  </div>
                                  <span
                                    className={`text-[9px] sm:text-[11px] mt-1.5 font-medium text-center ${
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

                      {/* Courier & AWB Track Box */}
                      {order.awbNumber ? (
                        <div className="p-3.5 sm:p-4 rounded-2xl bg-linear-to-r from-amber-50/80 to-orange-50/50 border border-amber-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-[#8E3D51] flex items-center justify-center shrink-0">
                              <Truck size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
                                Dispatch Info
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
                                <span className="font-serif font-bold text-xs sm:text-sm text-stone-900">
                                  {order.carrierPartner || "Blue Dart"}
                                </span>
                                <span className="text-stone-300">•</span>
                                <code className="font-mono bg-white px-2 py-0.5 rounded border border-amber-200 text-xs font-bold text-[#8E3D51]">
                                  {order.awbNumber}
                                </code>
                                <button
                                  onClick={() => handleCopyAwb(order.awbNumber)}
                                  title="Copy AWB"
                                  className="text-stone-500 hover:text-stone-800 p-0.5 active:scale-95"
                                >
                                  {copiedAwb === order.awbNumber ? (
                                    <Check size={13} className="text-emerald-600" />
                                  ) : (
                                    <Copy size={13} />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {(() => {
                            const trackingLink =
                              order.trackingUrl ||
                              (order.awbNumber
                                ? getCourierTrackingUrl(
                                    order.carrierPartner,
                                    order.awbNumber
                                  )
                                : null);
                            if (!trackingLink) return null;
                            return (
                              <a
                                href={trackingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#8E3D51] text-white text-xs font-semibold hover:bg-[#732F41] transition-all shadow-xs active:scale-95"
                              >
                                Track Package
                                <ExternalLink size={13} />
                              </a>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 text-xs flex items-center gap-2">
                          <Clock size={15} className="text-amber-600 shrink-0" />
                          <span>
                            Loom weaving in progress. Tracking link activates once picked up by courier.
                          </span>
                        </div>
                      )}

                      {/* Items */}
                      <div className="divide-y divide-stone-100">
                        {order.items.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="py-3 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={
                                  item.image ||
                                  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=300"
                                }
                                alt={item.name}
                                className="w-13 h-16 sm:w-16 sm:h-20 object-cover rounded-xl border border-stone-200 bg-stone-100 shrink-0"
                              />
                              <div className="min-w-0">
                                <h5 className="font-serif font-bold text-stone-900 text-xs sm:text-sm truncate">
                                  {item.name}
                                </h5>
                                <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                                  Color: {item.color || "Standard"} • Qty:{" "}
                                  {item.quantity || item.qty || 1}
                                </p>
                                <p className="text-xs font-bold text-[#8E3D51] mt-0.5">
                                  ₹{Number(
                                    item.price || item.unitPrice || 0
                                  ).toLocaleString("en-IN")}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleReorder(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-[#38152B] hover:text-white transition-all shrink-0 active:scale-95"
                            >
                              <RotateCcw size={12} />
                              <span className="hidden sm:inline">Buy Again</span>
                            </button>
                          </div>
                        ))}
                      </div>

                      {order.shippingAddress && (
                        <div className="pt-2 text-xs text-stone-500 flex items-start gap-1.5 border-t border-stone-100">
                          <MapPin
                            size={13}
                            className="text-stone-400 mt-0.5 shrink-0"
                          />
                          <span className="truncate">
                            Delivering to:{" "}
                            <strong className="text-stone-700 font-medium">
                              {typeof order.shippingAddress === "string"
                                ? order.shippingAddress
                                : [
                                    order.shippingAddress.apartment,
                                    order.shippingAddress.address,
                                    order.shippingAddress.city,
                                    order.shippingAddress.pincode,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Payments */}
        {activeTab === "payments" && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-xs p-4 sm:p-6 space-y-4 animate-tab-content">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                Payment History
              </h3>
              <p className="text-xs text-stone-500">
                Complete record of gateway-settled orders.
              </p>
            </div>

            {orders.length === 0 ? (
              <div className="py-12 text-center text-stone-500 text-xs sm:text-sm">
                <CreditCard size={28} className="mx-auto text-stone-400 mb-2" />
                <p>No processed payment transactions recorded.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-[10px] uppercase tracking-wider text-stone-500 border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3">Invoice</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Mode</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {orders.map((o) => (
                      <tr
                        key={o.id}
                        className="hover:bg-stone-50/60 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-[#38152B]">
                          {o.invoiceNumber}
                        </td>
                        <td className="py-2.5 px-3 text-stone-600">{o.date}</td>
                        <td className="py-2.5 px-3 font-medium uppercase text-stone-700">
                          {o.paymentMethod || "UPI"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <Check size={10} strokeWidth={3} />
                            {o.paymentStatus || "Completed"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-serif font-bold text-stone-900">
                          ₹{Number(o.total).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => setSelectedInvoice(o)}
                            className="p-1.5 text-stone-600 hover:text-[#38152B] rounded-lg transition-colors"
                          >
                            <Printer size={14} />
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

        {/* Tab 3: Saved Addresses */}
        {activeTab === "addresses" && (
          <div className="space-y-4 sm:space-y-6 animate-tab-content">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                  Saved Delivery Addresses
                </h3>
                <p className="text-xs text-stone-500">
                  Manage shipping destinations for checkout speed.
                </p>
              </div>
              <button
                onClick={() => handleOpenAddressModal()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#38152B] text-white text-xs font-semibold hover:bg-[#2A0E20] transition-all shadow-xs active:scale-95"
              >
                <Plus size={14} />
                Add New Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-stone-200">
                <MapPin size={28} className="mx-auto text-stone-400 mb-2" />
                <h4 className="font-serif font-bold text-stone-800 text-sm sm:text-base">
                  No Saved Addresses
                </h4>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  Add an address to checkout in 1 click.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
                      addr.isDefault
                        ? "border-[#38152B] shadow-xs ring-1 ring-[#38152B]/20"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700 uppercase">
                          {addr.tag === "Home" ? (
                            <Home size={11} />
                          ) : (
                            <Briefcase size={11} />
                          )}
                          {addr.tag}
                        </span>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                            DEFAULT
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-stone-900 text-xs sm:text-sm font-serif">
                        {addr.name}
                      </h4>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        {addr.apartment ? `${addr.apartment}, ` : ""}
                        {addr.address}
                      </p>
                      <p className="text-xs text-stone-600">
                        {addr.city}, {addr.state} -{" "}
                        <span className="font-mono font-bold">
                          {addr.pincode}
                        </span>
                      </p>
                      <p className="text-xs text-stone-500 mt-2 font-mono flex items-center gap-1">
                        <Phone size={11} /> {addr.phone}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between">
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-xs text-[#8E3D51] font-semibold hover:underline"
                        >
                          Set Default
                        </button>
                      )}
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          onClick={() => handleOpenAddressModal(addr)}
                          className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Cards & UPI */}
        {activeTab === "cards" && (
          <div className="space-y-4 sm:space-y-6 animate-tab-content">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                  Saved Cards & UPI Handles
                </h3>
                <p className="text-xs text-stone-500">
                  Masked tokenized methods for immediate checkout.
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#38152B] text-white text-xs font-semibold hover:bg-[#2A0E20] transition-all shadow-xs active:scale-95"
              >
                <Plus size={14} />
                Add Payment Method
              </button>
            </div>

            {payments.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-stone-200">
                <CreditCard size={28} className="mx-auto text-stone-400 mb-2" />
                <h4 className="font-serif font-bold text-stone-800 text-sm sm:text-base">
                  No Saved Payment Options
                </h4>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  Save your UPI address or debit card safely.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700 shrink-0">
                        {p.type === "upi" ? (
                          <Sparkles size={16} />
                        ) : (
                          <CreditCard size={16} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs sm:text-sm text-stone-900 font-serif truncate">
                            {p.title}
                          </p>
                          {p.type === "card" && p.brand && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#38152B]/10 text-[#38152B]">
                              {p.brand}
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-xs text-stone-600 truncate mt-0.5">
                          {p.details}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeletePayment(p.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Profile */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 p-5 sm:p-7 max-w-xl mx-auto shadow-xs space-y-5 animate-tab-content">
            <div>
              <h3 className="text-lg font-serif font-bold text-stone-900">
                Personal Profile
              </h3>
              <p className="text-xs text-stone-500">
                Verified customer details associated with this account.
              </p>
            </div>

            <form onSubmit={handleSaveProfileDob} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-stone-600 uppercase block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={currentUser.name}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-stone-600 uppercase block mb-1">
                    Mobile
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={currentUser.phone}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 font-mono text-stone-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-stone-600 uppercase block mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={currentUser.email || "Not registered"}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 font-mono text-stone-800 text-xs truncate"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-stone-600 uppercase block mb-1">
                    Birthday
                  </label>
                  <input
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    value={profileDob}
                    onChange={(e) => setProfileDob(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white font-mono text-stone-800 focus:border-[#38152B] outline-hidden text-xs"
                  />
                </div>
              </div>

              {profileError && (
                <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                  {profileError}
                </p>
              )}

              {profileSuccess && (
                <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  {profileSuccess}
                </p>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#38152B] text-white text-xs font-semibold hover:bg-[#4E1D3D] transition-all active:scale-95"
                >
                  Update Profile
                </button>
              </div>

              <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-[11px] text-stone-400 text-center sm:text-left">
                  Session retained for convenience.
                </p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors"
                >
                  Log Out
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-stone-200 space-y-4 max-h-[92vh] overflow-y-auto animate-modal-pop">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900">
                {editingAddress ? "Edit Address" : "Add Address"}
              </h3>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.name}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl outline-hidden focus:border-[#38152B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl outline-hidden focus:border-[#38152B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Apartment / Suite
                </label>
                <input
                  type="text"
                  value={addressForm.apartment}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      apartment: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl outline-hidden focus:border-[#38152B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.address}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl outline-hidden focus:border-[#38152B]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, city: e.target.value })
                    }
                    className="w-full px-2.5 py-2 border border-stone-200 rounded-xl outline-hidden focus:border-[#38152B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, state: e.target.value })
                    }
                    className="w-full px-2.5 py-2 border border-stone-200 rounded-xl outline-hidden focus:border-[#38152B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    PIN *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={addressForm.pincode}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        pincode: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-2 border border-stone-200 rounded-xl outline-hidden focus:border-[#38152B]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <span className="text-[11px] font-semibold text-stone-600">
                  Tag:
                </span>
                {(["Home", "Work", "Other"] as const).map((tag) => (
                  <label
                    key={tag}
                    className="flex items-center gap-1 text-xs text-stone-700 cursor-pointer"
                  >
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

              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      isDefault: e.target.checked,
                    })
                  }
                />
                Set as default delivery address
              </label>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#38152B] text-white text-xs font-bold hover:bg-[#2A0E20] transition-all"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[92vh] overflow-y-auto animate-modal-pop">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900">
                  Add Payment Method
                </h3>
                <p className="text-[10px] text-stone-500">
                  Luhn & BIN verified checkout tokenization.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setPaymentError(null);
                }}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex rounded-xl bg-stone-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentError(null);
                    setPaymentForm({
                      ...paymentForm,
                      type: "upi",
                      details: "",
                    });
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    paymentForm.type === "upi"
                      ? "bg-white text-stone-900 shadow-xs"
                      : "text-stone-500"
                  }`}
                >
                  UPI VPA
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentError(null);
                    setPaymentForm({
                      ...paymentForm,
                      type: "card",
                      details: "",
                    });
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    paymentForm.type === "card"
                      ? "bg-white text-stone-900 shadow-xs"
                      : "text-stone-500"
                  }`}
                >
                  Debit Card
                </button>
              </div>

              {paymentForm.type === "upi" ? (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Google Pay / PhonePe"
                      value={paymentForm.title}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl outline-hidden focus:border-[#38152B] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      UPI ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. name@okhdfcbank"
                      value={paymentForm.details}
                      onChange={(e) => {
                        setPaymentError(null);
                        setPaymentForm({
                          ...paymentForm,
                          details: e.target.value,
                        });
                      }}
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl outline-hidden focus:border-[#38152B] font-mono text-xs"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Dynamic Card Artwork */}
                  <div
                    className={`rounded-2xl p-3.5 text-white bg-linear-to-br ${cardValidation.network.cardGradient} shadow-md border border-white/15 space-y-2 transition-all duration-300`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider text-white/70">
                        {cardValidation.network.issuerHint || "Bank Debit Card"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${cardValidation.network.badgeBg} ${cardValidation.network.badgeTextClass}`}
                      >
                        {cardValidation.network.badgeText}
                      </span>
                    </div>
                    <div className="font-mono text-sm sm:text-base tracking-[0.16em] font-semibold text-white/95">
                      {paymentForm.details || "•••• •••• •••• ••••"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Card Number *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        maxLength={
                          cardValidation.network.id === "amex" ? 17 : 23
                        }
                        placeholder="16-digit card number"
                        value={paymentForm.details}
                        onKeyDown={handleDigitsOnlyKeyDown}
                        onChange={(e) => {
                          setPaymentError(null);
                          const raw = e.target.value.replace(/\D/g, "");
                          const detected = detectCardNetwork(raw);
                          const capped = raw.slice(0, detected.maxLength);
                          setPaymentForm({
                            ...paymentForm,
                            details: formatCardNumberDisplay(capped, detected.id),
                          });
                        }}
                        className={`w-full pl-3 pr-20 py-2 border rounded-xl outline-hidden font-mono text-xs ${
                          cardValidation.valid
                            ? "border-emerald-500 bg-emerald-50/20"
                            : "border-stone-200 focus:border-[#38152B]"
                        }`}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${cardValidation.network.badgeBg} ${cardValidation.network.badgeTextClass}`}
                        >
                          {cardValidation.network.badgeText}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {paymentError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {paymentError}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    paymentForm.type === "card" && !cardValidation.valid
                  }
                  className="px-5 py-2 rounded-xl bg-[#38152B] text-white text-xs font-bold hover:bg-[#2A0E20] disabled:opacity-40 transition-all"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tax Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-stone-200 space-y-4 max-h-[92vh] overflow-y-auto animate-modal-pop">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2.5">
                <img src={logo} alt="RS Fashions" className="h-7 w-auto" />
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#38152B]">
                    RS FASHIONS
                  </h4>
                  <p className="text-[9px] text-stone-500">
                    Handloom Heritage Studio
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between bg-stone-50 p-2.5 rounded-xl">
                <div>
                  <span className="text-[10px] text-stone-500 block">
                    INVOICE
                  </span>
                  <strong className="font-mono text-[#38152B]">
                    {selectedInvoice.invoiceNumber}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-500 block">DATE</span>
                  <strong className="text-stone-800">
                    {selectedInvoice.date}
                  </strong>
                </div>
              </div>

              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase text-stone-500">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {selectedInvoice.items.map((it: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <p className="font-bold text-stone-800">{it.name}</p>
                          <span className="text-[10px] text-stone-400">
                            Color: {it.color || "Standard"}
                          </span>
                        </td>
                        <td className="p-2 text-center font-mono">
                          {it.quantity || it.qty || 1}
                        </td>
                        <td className="p-2 text-right font-mono font-bold">
                          ₹
                          {(
                            Number(it.price || it.unitPrice || 0) *
                            (it.quantity || it.qty || 1)
                          ).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 border-t border-stone-200 flex justify-between font-serif font-bold text-sm text-[#38152B]">
                <span>Grand Total:</span>
                <span>
                  ₹{Number(selectedInvoice.total).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-stone-200">
              <span className="text-[10px] text-stone-400">
                Official Purchase Receipt
              </span>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#38152B] text-white text-xs font-bold hover:bg-[#2A0E20] transition-all"
              >
                <Printer size={13} />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}