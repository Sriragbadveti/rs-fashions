import { Router } from "express";
import { supabase, inMemoryStore } from "../config/supabase.js";

const router = Router();

// Helper to generate clean promo code string
function generateCodeString(prefix = "RSF", length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

// GET all coupons (Admin)
router.get("/", async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return res.json({ success: true, count: data.length, data });
    }

    return res.json({ success: true, count: inMemoryStore.coupons.length, data: inMemoryStore.coupons });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST Generate / Create new Promo Code on the backend (Admin)
router.post("/generate", async (req, res) => {
  try {
    const {
      code, // If provided, use it; otherwise auto-generate on backend
      prefix = "HEIRLOOM",
      description,
      discount_type = "percentage", // 'percentage' or 'fixed'
      discount_value,
      min_order_value = 0,
      max_discount_cap,
      max_uses = 100,
      expires_at,
    } = req.body;

    if (!discount_value || Number(discount_value) <= 0) {
      return res.status(400).json({
        success: false,
        message: "discount_value must be a positive number",
      });
    }

    const finalCode = (code ? code.trim().toUpperCase() : generateCodeString(prefix)).replace(/\s+/g, "");

    const newCoupon = {
      id: `coup-${Date.now().toString(36)}`,
      code: finalCode,
      description: description || `${discount_value}${discount_type === "percentage" ? "%" : "₹"} discount promo`,
      discount_type,
      discount_value: Number(discount_value),
      min_order_value: Number(min_order_value) || 0,
      max_discount_cap: max_discount_cap ? Number(max_discount_cap) : null,
      max_uses: Number(max_uses) || 100,
      times_used: 0,
      is_active: true,
      expires_at: expires_at || new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(), // 60 days default
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      const { data, error } = await supabase.from("coupons").insert([newCoupon]).select().single();
      if (error) {
        if (error.code === "23505") {
          return res.status(400).json({ success: false, message: `Coupon code '${finalCode}' already exists.` });
        }
        throw error;
      }
      return res.status(201).json({ success: true, message: `Promo code ${finalCode} generated successfully`, data });
    }

    // Check in-memory duplicates
    const exists = inMemoryStore.coupons.find((c) => c.code.toLowerCase() === finalCode.toLowerCase());
    if (exists) {
      return res.status(400).json({ success: false, message: `Coupon code '${finalCode}' already exists.` });
    }

    inMemoryStore.coupons.unshift(newCoupon);
    return res.status(201).json({ success: true, message: `Promo code ${finalCode} generated successfully`, data: newCoupon });
  } catch (error) {
    console.error("Error generating coupon:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST Validate coupon (Used at checkout)
router.post("/validate", async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }

    const orderSubtotal = Number(subtotal) || 0;
    const cleanCode = code.trim().toUpperCase();

    let coupon = null;
    if (supabase) {
      const { data, error } = await supabase.from("coupons").select("*").eq("code", cleanCode).single();
      if (error || !data) {
        return res.status(404).json({ success: false, message: "Invalid coupon code" });
      }
      coupon = data;
    } else {
      coupon = inMemoryStore.coupons.find((c) => c.code.toUpperCase() === cleanCode);
      if (!coupon) {
        return res.status(404).json({ success: false, message: "Invalid coupon code" });
      }
    }

    if (!coupon.is_active) {
      return res.status(400).json({ success: false, message: "This coupon is no longer active" });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: "This coupon has expired" });
    }

    if (coupon.max_uses && coupon.times_used >= coupon.max_uses) {
      return res.status(400).json({ success: false, message: "This coupon usage limit has been reached" });
    }

    if (coupon.min_order_value && orderSubtotal < coupon.min_order_value) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${coupon.min_order_value.toLocaleString("en-IN")} required for this code.`,
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === "percentage") {
      discount = (orderSubtotal * coupon.discount_value) / 100;
      if (coupon.max_discount_cap && discount > coupon.max_discount_cap) {
        discount = coupon.max_discount_cap;
      }
    } else {
      discount = Math.min(coupon.discount_value, orderSubtotal);
    }

    return res.json({
      success: true,
      message: `Promo code ${coupon.code} applied!`,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        calculated_discount: Math.round(discount),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE / Deactivate coupon (Admin)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (supabase) {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
      return res.json({ success: true, message: "Coupon deleted successfully" });
    }

    const index = inMemoryStore.coupons.findIndex((c) => c.id === id || c.code === id);
    if (index === -1) return res.status(404).json({ success: false, message: "Coupon not found" });

    inMemoryStore.coupons.splice(index, 1);
    return res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
