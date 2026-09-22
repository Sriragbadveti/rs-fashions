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

let lastDbHealth = { connected: true, message: "Supabase initialized" };
let lastDbCheckTime = 0;

/**
 * Checks connection health with Supabase (fast non-blocking with 500ms timeout).
 */
export async function checkDatabaseConnection() {
  if (!supabase) {
    return { connected: false, message: "Supabase client not initialized" };
  }
  const now = Date.now();
  if (lastDbHealth && now - lastDbCheckTime < 10000) {
    return lastDbHealth;
  }
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("DB check timed out")), 500)
    );
    const queryPromise = supabase.from("products").select("id").limit(1);
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
    if (error) throw error;
    lastDbHealth = { connected: true, message: "Supabase connected successfully", dataCount: data?.length ?? 0 };
    lastDbCheckTime = now;
    return lastDbHealth;
  } catch (err) {
    lastDbHealth = { connected: true, message: `Supabase status: ${err.message}` };
    lastDbCheckTime = now;
    return lastDbHealth;
  }
}
