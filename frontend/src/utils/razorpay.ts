/**
 * Razorpay Standard Web Checkout helpers. Only the public Key ID is used in the browser; the
 * secret lives on the server and payments are confirmed there (POST /payments/verify-payment).
 */
import { BRAND_NAME } from "../config/business";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayFailure {
  error?: { code?: string; description?: string; reason?: string; metadata?: { order_id?: string; payment_id?: string } };
}

interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", cb: (resp: RazorpayFailure) => void): void;
}

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

let loading: Promise<boolean> | null = null;

/** Loads checkout.js once, on demand. Resolves false if it could not be loaded. */
export function loadRazorpayCheckout(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay) return Promise.resolve(true);
  if (loading) return loading;
  loading = new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve(Boolean((window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay));
    script.onerror = () => {
      loading = null; // allow a retry on the next click
      script.remove();
      resolve(false);
    };
    document.body.appendChild(script);
  });
  return loading;
}

/** Public key: VITE_RAZORPAY_KEY_ID, falling back to the (public) key the server returned. */
export function razorpayKeyId(serverKeyId?: string): string {
  const env = ((import.meta as unknown as { env?: Record<string, string | undefined> }).env) || {};
  return String(env.VITE_RAZORPAY_KEY_ID || serverKeyId || "").trim();
}

export interface OpenCheckoutOptions {
  keyId: string;
  orderId: string;
  amount: number; // paise, as returned by the server
  currency: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (resp: RazorpaySuccess) => void;
  onFailure: (resp: RazorpayFailure) => void;
  onDismiss: () => void;
}

/** Opens the Razorpay modal. Throws if checkout.js is not available. */
export function openRazorpayCheckout(opts: OpenCheckoutOptions): void {
  const Razorpay = (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
  if (!Razorpay) throw new Error("Payment window could not be loaded. Please check your connection and try again.");

  // Only pass prefill values we actually have; never invent customer details.
  const prefill: Record<string, string> = {};
  if (opts.prefill?.name?.trim()) prefill.name = opts.prefill.name.trim();
  if (opts.prefill?.email?.trim()) prefill.email = opts.prefill.email.trim();
  if (opts.prefill?.contact?.trim()) prefill.contact = opts.prefill.contact.trim();

  const rzp = new Razorpay({
    key: opts.keyId,
    amount: opts.amount,
    currency: opts.currency,
    order_id: opts.orderId,
    name: BRAND_NAME,
    description: opts.description,
    prefill,
    theme: { color: "#8E3D51" },
    handler: opts.onSuccess,
    modal: { ondismiss: opts.onDismiss, confirm_close: true },
    retry: { enabled: true },
  });
  rzp.on("payment.failed", opts.onFailure);
  rzp.open();
}

/** Turns Razorpay's failure payload into a short message for the customer. */
export function describeRazorpayFailure(resp: RazorpayFailure): string {
  const d = resp?.error?.description;
  return d && d.length < 160 ? d : "Your payment did not go through. Please try again or use a different payment method.";
}
