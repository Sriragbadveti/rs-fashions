import dotenv from "dotenv";

dotenv.config();


function cleanEnv(val) {
  if (val === undefined || val === null) return "";
  return String(val)
    .trim()
    .replace(/^["'`]|["'`]$/g, "")
    .replace(/\\r|\\n|\\t/g, "")
    .replace(/[\r\n\t]/g, "")
    .trim();
}

export const ENV = {
  PORT: process.env.PORT || 5001,
  NODE_ENV: process.env.NODE_ENV || "development",
  SUPABASE_URL: cleanEnv(process.env.SUPABASE_URL),
  SUPABASE_SERVICE_ROLE_KEY: cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY),
  CLIENT_URL: (() => {
    const val = cleanEnv(process.env.CLIENT_URL).replace(/\/+$/, "");
    if (val && !val.includes("vercel.app") && !val.includes("localhost")) {
      return val;
    }
    if ((process.env.NODE_ENV || "").toLowerCase() === "production") {
      return "https://www.rsfashions25.com";
    }
    return val || "http://localhost:5173";
  })(),
  BACKEND_URL: cleanEnv(process.env.BACKEND_URL) || "http://localhost:5001",
  // Razorpay (Standard Checkout). The secrets stay on the server: only KEY_ID is ever sent to a browser.
  RAZORPAY: {
    get KEY_ID() {
      return cleanEnv(process.env.RAZORPAY_KEY_ID);
    },
    get KEY_SECRET() {
      return cleanEnv(process.env.RAZORPAY_KEY_SECRET);
    },
    /** Set in Razorpay Dashboard > Webhooks; different from KEY_SECRET. */
    get WEBHOOK_SECRET() {
      return cleanEnv(process.env.RAZORPAY_WEBHOOK_SECRET);
    },
    get isConfigured() {
      return Boolean(this.KEY_ID && this.KEY_SECRET);
    },
    get isTestMode() {
      return this.KEY_ID.startsWith("rzp_test_");
    },
  },
};

export function validateEnv() {
  const missing = [];
  if (!ENV.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!ENV.SUPABASE_SERVICE_ROLE_KEY && !ENV.SUPABASE_ANON_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY");
  
  if (missing.length > 0) {
    console.warn(`[Config Warning] Missing environment variables: ${missing.join(", ")}`);
  }
}
