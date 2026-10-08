import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Receipt,
  Store,
  ArrowRight,
  Loader2,
  Sparkles,
  ExternalLink,
  AlertCircle,
  Clock,
  Phone,
  User,
} from "lucide-react";
import { StoreService } from "../services/supabase";
import { loadRazorpayCheckout, openRazorpayCheckout, razorpayKeyId, describeRazorpayFailure } from "../utils/razorpay";
import { LEGAL_BUSINESS_NAME, PROPRIETOR_NAME, SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL, POLICY_LINKS } from "../config/business";

export default function QuickPay() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id") || "";
  const amountStr = searchParams.get("amount") || "";
  const invoiceNumber = searchParams.get("invoice") || "";
  const customerName = searchParams.get("customer") || "Valued Patron";

  // Links from the previous gateway carried a session_id and an RSF_… reference: they can't be paid now.
  const isRazorpayLink = /^order_[A-Za-z0-9]+$/.test(orderId);

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{ paymentId?: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    orderId && !isRazorpayLink ? "This payment link has expired. Please ask the showroom for a new link." : null
  );
  // What Razorpay will actually charge (from the server), shown instead of the URL's amount.
  const [serverAmountPaise, setServerAmountPaise] = useState<number | null>(null);
  const [serverKeyId, setServerKeyId] = useState<string | undefined>(undefined);

  // On open: ask the server whether this link is already paid, and what it will charge.
  useEffect(() => {
    if (!isRazorpayLink) return;
    let isMounted = true;
    StoreService.getPaymentStatus(orderId).then((status) => {
      if (!isMounted || !status) return;
      if (status.paid) {
        setIsPaid(true);
        setPaymentDetails({ paymentId: status.paymentId });
        return;
      }
      if (typeof status.amount === "number") setServerAmountPaise(status.amount);
      setServerKeyId(status.keyId);
    });
    return () => {
      isMounted = false;
    };
  }, [orderId, isRazorpayLink]);

  const handlePayNow = async () => {
    if (!isRazorpayLink) {
      setErrorMessage("This payment link is not valid. Please ask the showroom to generate a new one.");
      return;
    }
    if (isLoading || isVerifying) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const ready = await loadRazorpayCheckout();
      const status = serverAmountPaise ? null : await StoreService.getPaymentStatus(orderId);
      if (status?.paid) {
        setIsPaid(true);
        setPaymentDetails({ paymentId: status.paymentId });
        setIsLoading(false);
        return;
      }
      const amountPaise = serverAmountPaise ?? status?.amount;
      const keyId = razorpayKeyId(serverKeyId ?? status?.keyId);
      if (!ready || !keyId || !amountPaise) {
        throw new Error("The payment window could not be opened. Please check your connection and try again.");
      }

      let handled = false;
      openRazorpayCheckout({
        keyId,
        orderId,
        amount: amountPaise,
        currency: "INR",
        description: invoiceNumber ? `Invoice ${invoiceNumber}` : "Showroom bill",
        prefill: { name: customerName === "Valued Patron" ? "" : customerName },
        onSuccess: async (resp) => {
          handled = true;
          setIsVerifying(true);
          // The server checks the signature and the payment before the sale is recorded.
          let result = await StoreService.verifyPayment(resp);
          if (!result.paid && result.status === 0) {
            const again = await StoreService.getPaymentStatus(orderId);
            if (again?.paid) result = { ...result, paid: true, paymentId: again.paymentId };
          }
          if (result.paid) {
            setIsPaid(true);
            setPaymentDetails({ paymentId: result.paymentId || resp.razorpay_payment_id });
          } else if (result.pending) {
            setErrorMessage(result.message || "Your payment is being confirmed by the bank. Please don't pay again.");
          } else {
            setErrorMessage(result.message || "We could not confirm this payment. Please show this screen at the counter.");
          }
          setIsVerifying(false);
          setIsLoading(false);
        },
        onFailure: (resp) => {
          setErrorMessage(describeRazorpayFailure(resp));
        },
        onDismiss: () => {
          if (handled) return;
          setIsLoading(false);
        },
      });
    } catch (err) {
      console.error("Payment initiation error:", err);
      setErrorMessage(err instanceof Error ? err.message : "Could not open the payment window. Please try again.");
      setIsLoading(false);
    }
  };

  const amountDisplay = serverAmountPaise
    ? (serverAmountPaise / 100).toLocaleString("en-IN")
    : amountStr
      ? Number(amountStr).toLocaleString("en-IN")
      : "---";

  return (
    <div className="min-h-screen bg-linear-to-b from-[#F7EBEC] via-[#F4E7E4] to-[#E9C9C3]/45 flex flex-col items-center justify-center p-4 selection:bg-[#8E3D51]/20">
      {/* Container */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden animate-fade-in">
        {/* Header Ribbon */}
        <div className="bg-linear-to-r from-[#783144] via-[#8E3D51] to-[#A34B62] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3 shadow-inner">
              <Store className="h-6 w-6 text-white" />
            </div>
            <span className="text-[11px] uppercase tracking-widest font-extrabold text-amber-200">
              RS Fashions Heritage Showroom
            </span>
            <h1 className="text-xl font-serif font-bold text-white mt-0.5">
              Secure Counter Payment
            </h1>
            <p className="text-xs text-stone-200 font-light mt-1">
              Direct settlement for handcrafted luxury drapes
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* PAID STATE */}
          {isPaid ? (
            <div className="text-center space-y-5 py-4 animate-scale-up">
              <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900">
                  Payment Confirmed!
                </h2>
                <p className="text-xs text-stone-600 mt-1 max-w-xs mx-auto">
                  Thank you, <span className="font-semibold text-stone-800">{customerName}</span>. Your payment has been securely recorded at the showroom counter.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 text-left space-y-2.5">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-200">
                  <span className="text-stone-500">Invoice Ref</span>
                  <span className="font-mono font-bold text-stone-800">{invoiceNumber || orderId.slice(0, 16)}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-200">
                  <span className="text-stone-500">Amount Paid</span>
                  <span className="font-bold text-[#8E3D51] text-sm">₹{amountDisplay}</span>
                </div>
                {paymentDetails?.paymentId && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500">Payment ID</span>
                    <span className="font-mono text-[11px] text-stone-700">{paymentDetails.paymentId}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">Gateway Status</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                    <ShieldCheck className="h-3 w-3" /> VERIFIED PAID
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/"
                  className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold shadow-md transition-all"
                >
                  <span>Explore Online Collections</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            /* UNPAID STATE: PAYMENT SUMMARY */
            <div className="space-y-5">
              {/* Invoice Box */}
              <div className="bg-stone-50/80 border border-stone-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-600">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Receipt className="h-4 w-4 text-stone-400" />
                    <span>Bill Details</span>
                  </div>
                  {invoiceNumber && (
                    <span className="font-mono text-[11px] bg-white border border-stone-200 px-2 py-0.5 rounded font-bold text-stone-700">
                      {invoiceNumber}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500">Billed To:</span>
                    <span className="font-semibold text-stone-800">{customerName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500">Payment Reference:</span>
                    <span className="font-mono text-[11px] text-stone-600">{orderId.slice(0, 18)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200 flex items-baseline justify-between">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Total Amount
                  </span>
                  <span className="text-2xl font-serif font-black text-[#8E3D51]">
                    ₹{amountDisplay}
                  </span>
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {/* Pay Now Button */}
              <button
                type="button"
                onClick={handlePayNow}
                disabled={isLoading || isVerifying || !isRazorpayLink}
                className="w-full h-12 rounded-2xl bg-linear-to-r from-[#783144] via-[#8E3D51] to-[#783144] hover:opacity-95 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#8E3D51]/30 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading || isVerifying ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{isVerifying ? "Verifying Payment..." : "Opening Secure Payment..."}</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Pay ₹{amountDisplay} via UPI / Cards / NetBanking</span>
                  </>
                )}
              </button>

              {/* Security Badges */}
              <div className="flex items-center justify-center gap-4 text-[11px] text-stone-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Secured by Razorpay
                </span>
                <span>&bull;</span>
                <span>Official Showroom POS</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-50 border-t border-stone-100 px-6 py-3 text-center">
          <p className="text-[10px] text-stone-400">
            RS Fashions &bull; {LEGAL_BUSINESS_NAME} (Proprietor: {PROPRIETOR_NAME}) &bull; All Rights Reserved
          </p>
          <p className="mt-1 text-[10px] text-stone-400">
            Support: <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">{SUPPORT_EMAIL}</a> &bull;{" "}
            <a href={`tel:${SUPPORT_PHONE_TEL}`} className="underline">{SUPPORT_PHONE_DISPLAY}</a>
          </p>
          <p className="mt-1 flex flex-wrap justify-center gap-x-2 text-[10px] text-stone-400">
            {POLICY_LINKS.map((link) => (
              <a key={link.path} href={link.path} className="underline hover:text-stone-600">
                {link.label}
              </a>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}
