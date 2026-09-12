import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";

/**
 * Controller: CRM Customer Profiles & Loyalty
 */

// 1. GET ALL CUSTOMERS
export async function getCustomers(req, res) {
  try {
    if (!supabase) return successResponse(res, { customers: [] });

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const customers = (data || []).map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email || undefined,
      city: c.city || "Hyderabad",
      tier: c.tier || "Heritage Club",
      totalSpent: Number(c.total_spent) || 0,
      ordersCount: Number(c.orders_count) || 0,
      birthday: c.birthday || undefined,
      anniversary: c.anniversary || undefined,
      preferredWeave: c.preferred_weave || undefined,
      notes: c.notes || undefined,
      gstin: c.gstin || undefined,
    }));

    return successResponse(res, { customers }, "Customers retrieved successfully");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

// 2. CREATE CUSTOMER
export async function createCustomer(req, res) {
  try {
    const {
      id,
      name,
      phone,
      email,
      city = "Hyderabad",
      tier = "Heritage Club",
      totalSpent = 0,
      ordersCount = 0,
      birthday,
      anniversary,
      preferredWeave,
      notes,
      gstin,
    } = req.body;

    if (!name || !phone) {
      return errorResponse(res, "Customer name and phone number are required", 400);
    }

    const customerId = id || `cust-${Date.now().toString(36)}`;

    if (supabase) {
      const { data, error } = await supabase.from("customers").upsert({
        id: customerId,
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : null,
        city: city.trim(),
        tier,
        total_spent: Number(totalSpent) || 0,
        orders_count: Number(ordersCount) || 0,
        birthday: birthday || null,
        anniversary: anniversary || null,
        preferred_weave: preferredWeave || null,
        notes: notes || null,
        gstin: gstin ? gstin.trim() : null,
        updated_at: new Date().toISOString(),
      }).select().single();

      if (error) throw error;
      return successResponse(res, { customer: data }, "Customer profile created successfully", 201);
    }

    return successResponse(res, { customer: req.body }, "Customer created locally", 201);
  } catch (err) {
    console.error("Create customer error:", err);
    return errorResponse(res, err.message, 500);
  }
}

// 3. UPDATE CUSTOMER
export async function updateCustomer(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      city,
      tier,
      totalSpent,
      ordersCount,
      birthday,
      anniversary,
      preferredWeave,
      notes,
      gstin,
    } = req.body;

    if (supabase) {
      const updates = { updated_at: new Date().toISOString() };
      if (name) updates.name = name.trim();
      if (phone) updates.phone = phone.trim();
      if (email !== undefined) updates.email = email ? email.trim() : null;
      if (city) updates.city = city.trim();
      if (tier) updates.tier = tier;
      if (totalSpent !== undefined) updates.total_spent = Number(totalSpent);
      if (ordersCount !== undefined) updates.orders_count = Number(ordersCount);
      if (birthday !== undefined) updates.birthday = birthday || null;
      if (anniversary !== undefined) updates.anniversary = anniversary || null;
      if (preferredWeave !== undefined) updates.preferred_weave = preferredWeave || null;
      if (notes !== undefined) updates.notes = notes || null;
      if (gstin !== undefined) updates.gstin = gstin ? gstin.trim() : null;

      const { data, error } = await supabase
        .from("customers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return successResponse(res, { customer: data }, "Customer updated successfully");
    }

    return successResponse(res, { customer: req.body }, "Customer updated locally");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

// 4. DELETE CUSTOMER
export async function deleteCustomer(req, res) {
  try {
    const { id } = req.params;
    if (supabase) {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    }
    return successResponse(res, { id }, "Customer removed successfully");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}
