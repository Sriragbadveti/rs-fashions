import dotenv from "dotenv";

dotenv.config();

function cleanEnv(val) {
  if (val === undefined || val === null) return "";
  return String(val)
    .trim()
    .replace(/^["']|["']$/g, "")
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
    APP_ID: cleanEnv(process.env.CASHFREE_APP_ID || process.env.CASHFREE_CLIENT_ID),
    SECRET_KEY: cleanEnv(process.env.CASHFREE_SECRET_KEY),
    get isProduction() {
      const key = cleanEnv(process.env.CASHFREE_SECRET_KEY);
      const envStr = cleanEnv(process.env.CASHFREE_ENVIRONMENT || process.env.CASHFREE_ENV || "").toUpperCase();
      const appId = cleanEnv(process.env.CASHFREE_APP_ID || process.env.CASHFREE_CLIENT_ID);
      
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

export function validateEnv() {
  const missing = [];
  if (!ENV.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!ENV.SUPABASE_SERVICE_ROLE_KEY && !ENV.SUPABASE_ANON_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY");
  
  if (missing.length > 0) {
    console.warn(`[Config Warning] Missing environment variables: ${missing.join(", ")}`);
  }
}
