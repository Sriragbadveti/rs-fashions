import { supabase, checkDatabaseConnection } from "../config/supabase.js";

async function verifyDatabase() {
  console.log("==========================================");
  console.log("   RS Fashions Supabase Health Check      ");
  console.log("==========================================");

  const conn = await checkDatabaseConnection();
  console.log(`Connection Status: ${conn.connected ? "CONNECTED" : "FAILED"}`);
  console.log(`Details: ${conn.message}\n`);

  if (!conn.connected) {
    console.error("Please verify your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  const tables = [
    "categories",
    "products",
    "stock_movements",
    "orders",
    "customers",
    "tracked_orders",
    "coupons",
    "settings",
  ];

  console.log("Verifying Tables:");
  for (const table of tables) {
    try {
      const { data, count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error) {
        console.log(`  [-] ${table.padEnd(20)}: MISSING / ERROR (${error.message})`);
      } else {
        console.log(`  [+] ${table.padEnd(20)}: OK (Rows: ${count ?? 0})`);
      }
    } catch (err) {
      console.log(`  [-] ${table.padEnd(20)}: EXCEPTION (${err.message})`);
    }
  }

  console.log("\nDatabase verification complete.");
}

verifyDatabase();
