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
  FiSmartphone,
  FiRefreshCw,
  FiScissors,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";

type CheckoutStep = "address" | "payment" | "success";
type PaymentMethod = "razorpay" | "upi" | "cod";

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

function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();

  const [step, setStep] = useState<CheckoutStep>("address");
  const [address, setAddress] = useState<AddressForm>(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});

  // Stored snapshot for the receipt (fixes the ₹0 bug)
  const [completedOrder, setCompletedOrder] = useState<OrderSnapshot | null>(null);

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

  const validateAddress = () => {
    const newErrors: Partial<Record<keyof AddressForm, string>> = {};

    if (!address.firstName.trim()) newErrors.firstName = "First name is required";
    if (!address.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!address.address.trim()) newErrors.address = "Street address is required";
    if (!address.city.trim()) newErrors.city = "City is required";
    if (!address.state.trim()) newErrors.state = "State is required";
    if (!address.pincode.trim()) newErrors.pincode = "PIN code is required";

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

  const continueToPayment = () => {
    if (!validateAddress()) {
      window.scrollTo({ top: 120, behavior: "smooth" });
      return;
    }

    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const placeOrder = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    // Save snapshot of order before clearing state
    const snapshot: OrderSnapshot = {
      orderId: `BEC-${Date.now().toString().slice(-8)}`,
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
            <div className="bg-[#ff7575] p-6 sm:p-8 text-left border border-black/10 rounded-2xl shadow-[0_20px_60px_rgba(42,36,33,0.06)] print:shadow-none print:border-none">

              {/* Header Letterhead */}
              <div className="flex justify-between items-start border-b border-dashed border-black/15 pb-5">
                <div>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#8E3D51]">
                    Tax Invoice & Receipt
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl text-[#2A2421] tracking-tight mt-0.5">
                    BECHO ATELIER
                  </h2>
                  <p className="text-[9px] text-[#8C7A6B] leading-relaxed mt-0.5">
                    Heirloom Silk Sarees · Jubilee Hills, Hyderabad<br />
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
      <div className="mx-auto max-w-[1300px]">
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
                        value={address.pincode}
                        onChange={(val) => updateAddress("pincode", val)}
                        error={errors.pincode}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={continueToPayment}
                    className="group mt-6 sm:mt-8 flex w-full items-center justify-center gap-2.5 rounded-full bg-[#2A2421] py-3.5 sm:py-4 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-[#FAF7F2] shadow-md transition-all hover:bg-[#8E3D51] active:scale-95"
                  >
                    <span>Continue to Payment</span>
                    <FiArrowRight
                      size={13}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </button>
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
                    Select your preferred transaction channel.
                  </p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {/* Online Payment */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("razorpay")}
                    className={`w-full rounded-2xl sm:rounded-3xl border p-4 sm:p-5 text-left transition-all duration-200 bg-white ${paymentMethod === "razorpay"
                        ? "border-[#8E3D51] shadow-[0_10px_30px_rgba(142,61,81,0.08)] ring-2 ring-[#8E3D51]/20"
                        : "border-black/10 hover:border-black/20"
                      }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#FAF4ED] text-[#8E3D51]">
                        <FiCreditCard size={18} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-serif text-base sm:text-lg text-[#2A2421]">
                            Online Payment
                          </span>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8.5px] sm:text-[9px] font-semibold uppercase tracking-wider text-emerald-800">
                            Instant
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] sm:text-xs font-light text-[#756A60]">
                          Cards, Net Banking, International Wallets.
                        </p>
                      </div>

                      <div
                        className={`flex h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full border transition-all ${paymentMethod === "razorpay"
                            ? "border-[#8E3D51] bg-[#8E3D51] text-white"
                            : "border-black/20"
                          }`}
                      >
                        {paymentMethod === "razorpay" && <FiCheck size={10} />}
                      </div>
                    </div>
                  </button>

                  {/* UPI Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`w-full rounded-2xl sm:rounded-3xl border p-4 sm:p-5 text-left transition-all duration-200 bg-white ${paymentMethod === "upi"
                        ? "border-[#8E3D51] shadow-[0_10px_30px_rgba(142,61,81,0.08)] ring-2 ring-[#8E3D51]/20"
                        : "border-black/10 hover:border-black/20"
                      }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#FAF4ED] text-[#8E3D51]">
                        <FiSmartphone size={18} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-serif text-base sm:text-lg text-[#2A2421]">
                            UPI Transfer
                          </span>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8.5px] sm:text-[9px] font-semibold uppercase tracking-wider text-emerald-800">
                            Instant
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] sm:text-xs font-light text-[#756A60]">
                          GPay, PhonePe, Paytm & any UPI application.
                        </p>
                      </div>

                      <div
                        className={`flex h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full border transition-all ${paymentMethod === "upi"
                            ? "border-[#8E3D51] bg-[#8E3D51] text-white"
                            : "border-black/20"
                          }`}
                      >
                        {paymentMethod === "upi" && <FiCheck size={10} />}
                      </div>
                    </div>
                  </button>

                  {/* Cash on Delivery */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`w-full rounded-2xl sm:rounded-3xl border p-4 sm:p-5 text-left transition-all duration-200 bg-white ${paymentMethod === "cod"
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
                          Pay when your package is delivered to your address.
                        </p>
                      </div>

                      <div
                        className={`flex h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full border transition-all ${paymentMethod === "cod"
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
                      Inspected by atelier curators prior to tamper-evident packing with Silk Mark tags.
                    </p>
                  </div>

                  {/* Place Order CTA */}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={placeOrder}
                    className="mt-5 sm:mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-[#8E3D51] py-3.5 sm:py-4 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-[#FAF7F2] shadow-lg transition-all hover:bg-[#783144] active:scale-95 disabled:opacity-60"
                  >
                    {isProcessing ? (
                      <span>Authorizing Payment...</span>
                    ) : (
                      <>
                        <span>
                          {paymentMethod === "cod"
                            ? "Confirm Cash On Delivery Order"
                            : paymentMethod === "upi"
                              ? `Pay ₹${total.toLocaleString("en-IN")} via UPI`
                              : `Pay ₹${total.toLocaleString("en-IN")}`}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8C7A6B]">
        {label}
        {required && <span className="ml-1 text-[#8E3D51]">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={required ? label : `${label} (Optional)`}
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