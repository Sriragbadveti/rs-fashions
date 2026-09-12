import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env.js";

let adminClient = null;
let publicClient = null;

if (ENV.SUPABASE_URL && (ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_ANON_KEY)) {
  const masterKey = ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_ANON_KEY;
  adminClient = createClient(ENV.SUPABASE_URL, masterKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  if (ENV.SUPABASE_ANON_KEY) {
    publicClient = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
    });
  }
} else {
  console.warn("[Supabase] Configuration missing URL or Keys. Database operations will run in memory fallback.");
}

export const supabase = adminClient;
export const publicSupabase = publicClient || adminClient;

/**
 * Checks connection health with Supabase.
 */
export async function checkDatabaseConnection() {
  if (!supabase) {
    return { connected: false, message: "Supabase client not initialized" };
  }
  try {
    const { data, error } = await supabase.from("products").select("id").limit(1);
    if (error) throw error;
    return { connected: true, message: "Supabase connected successfully", dataCount: data?.length ?? 0 };
  } catch (err) {
    return { connected: false, message: err.message || "Failed to query database" };
  }
}
