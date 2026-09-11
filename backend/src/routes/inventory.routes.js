import { Router } from "express";
import { supabase, inMemoryStore } from "../config/supabase.js";

const router = Router();

// In-memory fallback holds store
if (!inMemoryStore.inventoryHolds) {
  inMemoryStore.inventoryHolds = [];
}

// Clean up expired in-memory holds helper
function cleanExpiredMemoryHolds() {
  const now = new Date();
  if (inMemoryStore.inventoryHolds) {
    inMemoryStore.inventoryHolds = inMemoryStore.inventoryHolds.filter(
      (h) => new Date(h.expires_at) > now
    );
  }
}

// Helpers to manage inventory holds across Supabase / In-Memory
async function getProductStock(productId) {
  if (supabase) {
    const { data: product } = await supabase
      .from("products")
      .select("id, name, stock")
      .eq("id", productId)
      .single();
    if (product) return product.stock;
  }
  const p = inMemoryStore.products.find((prod) => prod.id === productId);
  return p ? p.stock : 10;
}

async function fetchActiveHolds(productId) {
  const now = new Date();
  // 1. Try Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("inventory_holds")
        .select("*")
        .eq("product_id", productId)
        .gt("expires_at", now.toISOString());
      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch {
      // Fallback
    }
  }

  // 2. Fallback to inMemoryStore
  cleanExpiredMemoryHolds();
  return inMemoryStore.inventoryHolds.filter(
    (h) => h.product_id === productId && new Date(h.expires_at) > now
  );
}

// 1. POST /api/inventory/hold — Initiate or refresh a 10-minute temporary stock hold
router.post("/hold", async (req, res) => {
  try {
    const { productId, sessionId, quantity = 1, durationMinutes = 10 } = req.body;

    if (!productId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: "productId and sessionId are required to reserve stock.",
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000).toISOString();
    const stock = await getProductStock(productId);
    const activeHolds = await fetchActiveHolds(productId);

    // Filter holds made by OTHER sessions
    const otherHolds = activeHolds.filter((h) => h.session_id !== sessionId);
    const reservedByOthers = otherHolds.reduce((sum, h) => sum + (h.quantity || 1), 0);
    const availableForYou = stock - reservedByOthers;

    if (availableForYou < quantity) {
      const nextExpiry = otherHolds.length ? new Date(otherHolds[0].expires_at) : null;
      const remainingSeconds = nextExpiry
        ? Math.max(0, Math.round((nextExpiry.getTime() - now.getTime()) / 1000))
        : durationMinutes * 60;

      return res.status(409).json({
        success: false,
        locked: true,
        availableStock: Math.max(0, availableForYou),
        remainingSeconds,
        message: `This piece is currently reserved in another customer's cart. It will release in ${Math.ceil(
          remainingSeconds / 60
        )} minutes if not paid.`,
      });
    }

    // Attempt Supabase insert/upsert
    let supabaseSaved = false;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("inventory_holds")
          .upsert(
            {
              product_id: productId,
              session_id: sessionId,
              quantity: Number(quantity),
              expires_at: expiresAt,
            },
            { onConflict: "product_id,session_id" }
          )
          .select()
          .single();

        if (!error && data) {
          supabaseSaved = true;
        }
      } catch {
        supabaseSaved = false;
      }
    }

    // Always mirror to in-memory store
    cleanExpiredMemoryHolds();
    inMemoryStore.inventoryHolds = inMemoryStore.inventoryHolds.filter(
      (h) => !(h.product_id === productId && h.session_id === sessionId)
    );
    const holdObj = {
      id: `hold-${Date.now().toString(36)}`,
      product_id: productId,
      session_id: sessionId,
      quantity: Number(quantity),
      expires_at: expiresAt,
      created_at: now.toISOString(),
    };
    inMemoryStore.inventoryHolds.push(holdObj);

    return res.json({
      success: true,
      message: `Reserved for ${durationMinutes} minutes.`,
      hold: holdObj,
      expiresAt,
      remainingSeconds: durationMinutes * 60,
    });
  } catch (error) {
    console.error("Error in /api/inventory/hold:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 2. POST /api/inventory/release — Release a hold voluntarily (e.g. cart clear / navigation)
router.post("/release", async (req, res) => {
  try {
    const { productId, sessionId } = req.body;

    if (supabase) {
      try {
        await supabase
          .from("inventory_holds")
          .delete()
          .eq("product_id", productId)
          .eq("session_id", sessionId);
      } catch {
        // ignore
      }
    }

    cleanExpiredMemoryHolds();
    inMemoryStore.inventoryHolds = (inMemoryStore.inventoryHolds || []).filter(
      (h) => !(h.product_id === productId && h.session_id === sessionId)
    );

    return res.json({ success: true, message: "Inventory hold released." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 3. GET /api/inventory/status/:productId — Check real-time lock/reservation status for a piece
router.get("/status/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { sessionId } = req.query;
    const now = new Date();

    const stock = await getProductStock(productId);
    const activeHolds = await fetchActiveHolds(productId);

    const userHold = activeHolds.find((h) => h.session_id === sessionId);
    const otherHolds = activeHolds.filter((h) => h.session_id !== sessionId);
    const reservedByOthers = otherHolds.reduce((sum, h) => sum + (h.quantity || 1), 0);
    const availableStock = Math.max(0, stock - reservedByOthers);

    let remainingLockSeconds = 0;
    if (userHold) {
      remainingLockSeconds = Math.max(0, Math.round((new Date(userHold.expires_at).getTime() - now.getTime()) / 1000));
    } else if (otherHolds.length > 0) {
      remainingLockSeconds = Math.max(0, Math.round((new Date(otherHolds[0].expires_at).getTime() - now.getTime()) / 1000));
    }

    return res.json({
      success: true,
      productId,
      stock,
      availableStock,
      isHeldByYou: Boolean(userHold),
      isHeldByOther: otherHolds.length > 0 && availableStock === 0,
      remainingLockSeconds,
      expiresAt: userHold?.expires_at || otherHolds[0]?.expires_at || null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
