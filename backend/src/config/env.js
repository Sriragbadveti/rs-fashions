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
  SUPABASE_ANON_KEY: cleanEnv(process.env.SUPABASE_ANON_KEY),
  CLIENT_URL: cleanEnv(process.env.CLIENT_URL) || "http://localhost:5173",
  BACKEND_URL: cleanEnv(process.env.BACKEND_URL) || "http://localhost:5001",
  CASHFREE: {
    get APP_ID() {
      return cleanEnv(process.env.CASHFREE_APP_ID || process.env.CASHFREE_CLIENT_ID || process.env.CASHFREE_KEY_ID);
    },
    get SECRET_KEY() {
      return cleanEnv(process.env.CASHFREE_SECRET_KEY || process.env.CASHFREE_CLIENT_SECRET || process.env.CASHFREE_SECRET);
    },
    get isProduction() {
      const key = this.SECRET_KEY;
      const envStr = cleanEnv(process.env.CASHFREE_ENVIRONMENT || process.env.CASHFREE_ENV || "").toUpperCase();
      const appId = this.APP_ID;
      
      if (key.startsWith("cfsk_ma_prod_") || envStr === "PRODUCTION" || envStr === "PROD") {
        return true;
      }
      if (key.startsWith("cfsk_ma_test_") || appId.startsWith("TEST") || envStr === "SANDBOX" || envStr === "TEST") {
        return false;
      }
      return envStr === "PRODUCTION";
    },
    get ENV() {
      return this.isProduction ? "PRODUCTION" : "SANDBOX";
    },
    get API_VERSION() {
      return cleanEnv(process.env.CASHFREE_API_VERSION || "2023-08-01");
    },
    get BASE_URL() {
      return this.isProduction
        ? "https://api.cashfree.com/pg"
        : "https://sandbox.cashfree.com/pg";
    },
  },
};

export function logSafeCashfreeDiagnostics() {
  const rawAppId = process.env.CASHFREE_APP_ID || process.env.CASHFREE_CLIENT_ID || process.env.CASHFREE_KEY_ID || "";
  const rawSecret = process.env.CASHFREE_SECRET_KEY || process.env.CASHFREE_CLIENT_SECRET || process.env.CASHFREE_SECRET || "";
  const cleanAppId = ENV.CASHFREE.APP_ID;
  const cleanSecret = ENV.CASHFREE.SECRET_KEY;

  const mask = (str, start = 4, end = 4) => {
    if (!str) return "NONE";
    if (str.length <= start + end) return "****";
    return `${str.slice(0, start)}****${str.slice(-end)}`;
  };

  console.log("=== [Cashfree Safe Configuration Diagnostics] ===");
  console.log(`- APP_ID present: ${Boolean(cleanAppId) ? "YES" : "NO"} (len: ${cleanAppId.length}, masked: ${mask(cleanAppId, 4, 3)})`);
  console.log(`- SECRET_KEY present: ${Boolean(cleanSecret) ? "YES" : "NO"} (len: ${cleanSecret.length}, masked: ${mask(cleanSecret, 12, 4)})`);
  console.log(`- SECRET_KEY contains newline: ${/[\r\n]|\\n|\\r/.test(rawSecret) ? "YES" : "NO"}`);
  console.log(`- SECRET_KEY contains leading/trailing whitespace: ${/^\s|\s$/.test(rawSecret) ? "YES" : "NO"}`);
  console.log(`- API environment: ${ENV.CASHFREE.ENV}`);
  console.log(`- API endpoint: ${ENV.CASHFREE.BASE_URL}`);
  console.log(`- API version: ${ENV.CASHFREE.API_VERSION}`);
  console.log(`- Cashfree client initialized: ${Boolean(cleanAppId && cleanSecret) ? "YES" : "NO"}`);
  console.log("================================================");
}

export function validateEnv() {
  const missing = [];
  if (!ENV.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!ENV.SUPABASE_SERVICE_ROLE_KEY && !ENV.SUPABASE_ANON_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY");
  
  if (missing.length > 0) {
    console.warn(`[Config Warning] Missing environment variables: ${missing.join(", ")}`);
  }
}
