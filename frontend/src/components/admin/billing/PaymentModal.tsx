import React, { useState } from "react";
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Sparkles,
  Check,
  Share2,
  ExternalLink,
  Copy,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { PaymentMethod, CustomerDetails } from "../../../types/dashboard";
import { API_BASE } from "../../../config/api";

interface PaymentModalProps {
  isOpen: boolean;
  totalAmount: number;
  customer: CustomerDetails;
  onClose: () => void;
  onConfirmPayment: (method: PaymentMethod, paymentLink?: string, transactionId?: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  totalAmount,
  customer,
  onClose,
  onConfirmPayment,
}) => {
  if (!isOpen) return null;

  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [txnId, setTxnId] = useState("");

  const currency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  const handleGeneratePhonePeLink = async () => {
    setGeneratingLink(true);
    try {
      const res = await fetch(`${API_BASE}/payments/phonepe/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          customerName: customer.name || "Patron",
          phone: customer.phone || "9876543210",
        }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        setPaymentLink(data.redirectUrl);
        setTxnId(data.merchantTransactionId || `PP-${Date.now().toString().slice(-6)}`);
      } else {
        const fallbackUrl = `https://mercury-uat.phonepe.com/transact/simulator?merchantId=M234BFDRI0N1I_2609102233&amount=${totalAmount}&orderId=RSF-${Date.now()}`;
        setPaymentLink(fallbackUrl);
        setTxnId(`PP-TEST-${Date.now().toString().slice(-6)}`);
      }
    } catch (err) {
      console.warn("PhonePe API call error:", err);
      const fallbackUrl = `https://mercury-uat.phonepe.com/transact/simulator?amount=${totalAmount}&orderId=RSF-${Date.now()}`;
      setPaymentLink(fallbackUrl);
      setTxnId(`PP-SIM-${Date.now().toString().slice(-6)}`);
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleGenerateRazorpayLink = async () => {
    setGeneratingLink(true);
    try {
      const res = await fetch(`${API_BASE}/payments/razorpay/create-payment-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          customerName: customer.name || "Patron",
          customerPhone: customer.phone || "9876543210",
          customerEmail: customer.email || "patron@rsfashions.in",
          description: `RS Fashions Saree Studio Bill for ${customer.name || "Patron"}`,
        }),
      });
      const data = await res.json();
      if (data.paymentLink || data.shortUrl) {
        const link = data.paymentLink || data.shortUrl;
        setPaymentLink(link);
        setTxnId(data.id || `plink_${Date.now().toString().slice(-6)}`);
      } else {
        const fallbackUrl = `https://rzp.io/rzp/rsfashions?amount=${totalAmount}`;
        setPaymentLink(fallbackUrl);
        setTxnId(`plink_${Date.now().toString().slice(-6)}`);
      }
    } catch (err) {
      console.warn("Razorpay API call error:", err);
      const fallbackUrl = `https://rzp.io/rzp/rsfashions?amount=${totalAmount}`;
      setPaymentLink(fallbackUrl);
      setTxnId(`plink_${Date.now().toString().slice(-6)}`);
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopy = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppShare = () => {
    if (!paymentLink) return;
    const phone = (customer.phone || "").replace(/[^0-9]/g, "");
    const text = encodeURIComponent(
      `Namaste ${customer.name || "Patron"},\n\nYour luxury saree bill from RS Fashions is ready for ₹${totalAmount.toLocaleString("en-IN")}.\n\nPlease complete your payment securely via the link below:\n${paymentLink}\n\nThank you for choosing RS Fashions!`
    );
    const url = `https://api.whatsapp.com/send?phone=91${phone}&text=${text}`;
    window.open(url, "_blank");
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200/70 bg-[#2A0E20] text-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-[#D4A373] flex items-center justify-center border border-amber-400/30">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-white">
                Collect Payment &amp; Settle Bill
              </h3>
              <p className="text-xs text-amber-200/70 font-light">
                Total Payable: <span className="font-bold text-white">{currency(totalAmount)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-amber-200/70 hover:text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Method Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-700">
              Select Settlement Channel
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMethod("upi");
                  setPaymentLink(null);
                }}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  method === "upi"
                    ? "border-[#2A0E20] bg-[#2A0E20] text-amber-100 shadow-sm"
                    : "border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800"
                }`}
              >
                <Smartphone size={20} className="mx-auto mb-1.5 opacity-80" />
                <span className="block text-xs font-semibold">UPI QR / POS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod("card");
                  setPaymentLink(null);
                }}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  method === "card"
                    ? "border-[#2A0E20] bg-[#2A0E20] text-amber-100 shadow-sm"
                    : "border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800"
                }`}
              >
                <CreditCard size={20} className="mx-auto mb-1.5 opacity-80" />
                <span className="block text-xs font-semibold">Credit/Debit Card</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod("cash");
                  setPaymentLink(null);
                }}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  method === "cash"
                    ? "border-[#2A0E20] bg-[#2A0E20] text-amber-100 shadow-sm"
                    : "border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800"
                }`}
              >
                <Banknote size={20} className="mx-auto mb-1.5 opacity-80" />
                <span className="block text-xs font-semibold">Cash Counter</span>
              </button>
            </div>
          </div>

          {/* Payment Gateway Links Generation (PhonePe / Razorpay) */}
          <div className="space-y-2.5 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-800">
                Direct Client Payment Gateways
              </span>
              <span className="text-[10px] uppercase tracking-wider font-mono text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                Test Mode Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMethod("phonepe");
                  handleGeneratePhonePeLink();
                }}
                disabled={generatingLink}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                  method === "phonepe"
                    ? "border-purple-600 bg-purple-50/80 text-purple-900"
                    : "border-stone-200 bg-stone-50/60 hover:bg-stone-100 text-stone-700"
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-xs mb-1">
                  Pe
                </div>
                <span className="text-xs font-bold">PhonePe Direct</span>
                <span className="text-[10px] text-stone-500">M234BFDRI0N1I</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod("razorpay");
                  handleGenerateRazorpayLink();
                }}
                disabled={generatingLink}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                  method === "razorpay"
                    ? "border-blue-600 bg-blue-50/80 text-blue-900"
                    : "border-stone-200 bg-stone-50/60 hover:bg-stone-100 text-stone-700"
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs mb-1">
                  Rzp
                </div>
                <span className="text-xs font-bold">Razorpay Link</span>
                <span className="text-[10px] text-stone-500">rzp_test_TaPipY</span>
              </button>
            </div>

            {generatingLink && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-[#D4A373]" />
                <span>Generating secure checkout URL...</span>
              </div>
            )}

            {paymentLink && (
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700">
                  <span>Payment URL Generated</span>
                  <span className="text-emerald-700 font-mono">Ref: {txnId}</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={paymentLink}
                    className="flex-1 h-9 px-3 text-[11px] font-mono bg-white border border-stone-200 rounded-lg text-stone-700 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="h-9 px-3 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold flex items-center gap-1"
                  >
                    {copied ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="flex-1 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Share2 size={14} />
                    <span>Share on WhatsApp ({customer.phone || "Patron"})</span>
                  </button>

                  <a
                    href={paymentLink}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink size={14} />
                    <span>Open</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Action Confirmation */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-11 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirmPayment(method, paymentLink || undefined, txnId || undefined)}
              className="px-6 h-11 rounded-xl bg-[#2A0E20] text-amber-100 hover:bg-[#3d162f] text-xs font-semibold flex items-center gap-2 shadow-md"
            >
              <Check size={16} className="text-[#D4A373]" />
              <span>Confirm &amp; Generate Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
