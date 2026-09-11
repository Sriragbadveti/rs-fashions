import { Router } from "express";
import { supabase, inMemoryStore } from "../config/supabase.js";

const router = Router();

// GET all orders (Admin view: see all existing and new orders)
router.get("/", async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    if (supabase) {
      let query = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(Number(limit));
      if (status && status !== "all") {
        query = query.eq("order_status", status);
      }
      const { data, error } = await query;
      if (error) throw error;
      return res.json({ success: true, count: data.length, data });
    }

    let orders = [...inMemoryStore.orders];
    if (status && status !== "all") {
      orders = orders.filter((o) => o.order_status === status);
    }
    return res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET single order by ID or order_number
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (supabase) {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .or(`id.eq.${id},order_number.eq.${id}`)
        .single();
      if (error) return res.status(404).json({ success: false, message: "Order not found" });
      return res.json({ success: true, data });
    }

    const order = inMemoryStore.orders.find((o) => o.id === id || o.order_number === id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    return res.json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST Create new order
router.post("/", async (req, res) => {
  try {
    const {
      customer_name,
      email,
      phone,
      shipping_address,
      items,
      subtotal,
      shipping_fee = 0,
      discount_amount = 0,
      coupon_code,
      total,
      payment_method = "phonepe",
      payment_status,
      transaction_id,
      payment_details,
      notes,
      session_id,
    } = req.body;

    if (!customer_name || !email || !phone || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: "Missing mandatory order details (customer_name, email, phone, items).",
      });
    }

    const randId = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `RSF-2026-${randId}`;
    const txnId = transaction_id || `MT_RSF_${Date.now()}`;
    const paymentNotes = notes || `Payment: ${payment_method.toUpperCase()} | Txn: ${txnId} | Status: ${payment_status || "paid"}`;

    const newOrder = {
      id: `ord-${Date.now().toString(36)}`,
      order_number: orderNumber,
      customer_name,
      email,
      phone,
      shipping_address: shipping_address || {},
      items,
      subtotal: Number(subtotal) || 0,
      shipping_fee: Number(shipping_fee) || 0,
      discount_amount: Number(discount_amount) || 0,
      coupon_code: coupon_code || null,
      total: Number(total) || (Number(subtotal) + Number(shipping_fee) - Number(discount_amount)),
      payment_method,
      payment_status: payment_status || (payment_method === "cod" ? "pending" : "paid"),
      notes: paymentNotes,
      order_status: "new",
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      let insertedData = null;
      const { data, error } = await supabase.from("orders").insert([newOrder]).select().single();
      
      if (!error && data) {
        insertedData = data;
      } else {
        console.warn("Supabase order insert warning:", error?.message);
        insertedData = newOrder;
      }

      // Deduct stock and release active holds for each purchased product
      for (const item of items) {
        try {
          const { data: prod } = await supabase.from("products").select("stock").eq("id", item.id).single();
          if (prod && prod.stock !== undefined) {
            const nextStock = Math.max(0, (prod.stock || 0) - (Number(item.quantity) || 1));
            await supabase.from("products").update({ stock: nextStock }).eq("id", item.id);
          }
          if (session_id) {
            await supabase.from("inventory_holds").delete().eq("product_id", item.id).eq("session_id", session_id);
          }
        } catch (stockErr) {
          console.warn(`Could not adjust stock for item ${item.id}:`, stockErr.message);
        }
      }

      return res.status(201).json({ success: true, message: "Order placed successfully", data: insertedData });
    }

    // In-memory fallback
    for (const item of items) {
      const p = inMemoryStore.products.find((prod) => prod.id === item.id);
      if (p) {
        p.stock = Math.max(0, (p.stock || 0) - (Number(item.quantity) || 1));
      }
      if (session_id && inMemoryStore.inventoryHolds) {
        inMemoryStore.inventoryHolds = inMemoryStore.inventoryHolds.filter(
          (h) => !(h.product_id === item.id && h.session_id === session_id)
        );
      }
    }

    inMemoryStore.orders.unshift(newOrder);
    return res.status(201).json({ success: true, message: "Order placed successfully", data: newOrder });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH / PUT update order payment status & transaction details
router.patch("/:id/payment", async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status, payment_method, transaction_id, payment_details, notes } = req.body;

    const paymentNotes = notes || `Payment: ${(payment_method || "ONLINE").toUpperCase()} | Txn: ${transaction_id || "N/A"} | Status: ${payment_status || "paid"}`;

    if (supabase) {
      const { data, error } = await supabase
        .from("orders")
        .update({
          payment_status: payment_status || "paid",
          payment_method: payment_method || undefined,
          notes: paymentNotes,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${id},order_number.eq.${id}`)
        .select()
        .single();

      if (error) {
        console.warn("Supabase payment update error:", error.message);
      }
      return res.json({ success: true, message: "Order payment status updated", data: data || { id, payment_status } });
    }

    const order = inMemoryStore.orders.find((o) => o.id === id || o.order_number === id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.payment_status = payment_status || "paid";
    if (payment_method) order.payment_method = payment_method;
    if (transaction_id) order.transaction_id = transaction_id;
    order.notes = paymentNotes;
    order.updated_at = new Date().toISOString();

    return res.json({ success: true, message: "Order payment status updated", data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH / PUT update order status (Admin action)
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status, notes } = req.body;

    const validStatuses = ["new", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(order_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order_status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    if (supabase) {
      const { data, error } = await supabase
        .from("orders")
        .update({ order_status, notes, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return res.json({ success: true, message: `Order status updated to ${order_status}`, data });
    }

    const order = inMemoryStore.orders.find((o) => o.id === id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.order_status = order_status;
    if (notes) order.notes = notes;
    order.updated_at = new Date().toISOString();

    return res.json({ success: true, message: `Order status updated to ${order_status}`, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
