import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5001,
  NODE_ENV: process.env.NODE_ENV || "development",
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  BACKEND_URL: process.env.BACKEND_URL || "http://localhost:5001",
  CASHFREE: {
    APP_ID: process.env.CASHFREE_APP_ID || process.env.CASHFREE_CLIENT_ID || "",
    SECRET_KEY: process.env.CASHFREE_SECRET_KEY || "",
    ENV: (process.env.CASHFREE_ENVIRONMENT || process.env.CASHFREE_ENV || "SANDBOX").toUpperCase(),
    API_VERSION: process.env.CASHFREE_API_VERSION || "2023-08-01",
    get BASE_URL() {
      return (process.env.CASHFREE_ENVIRONMENT || process.env.CASHFREE_ENV || "SANDBOX").toUpperCase() === "PRODUCTION"
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
