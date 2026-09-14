import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { invalidateBootstrapCache } from "./bootstrap.controller.js";

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
      address: c.address || (c.city ? `${c.city}, Telangana` : "Hyderabad, Telangana"),
      tier: c.tier || "Heritage Club",
      totalSpent: Number(c.total_spent) || 0,
      ordersCount: Number(c.orders_count) || 0,
      birthday: c.birthday || undefined,
      anniversary: c.anniversary || undefined,
      preferredWeave: c.preferred_weave || undefined,
      notes: c.notes || undefined,
      gstin: c.gstin || undefined,
      authProvider: (c.notes && c.notes.toLowerCase().includes("google")) ? "google" : "email",
      joinedAt: c.created_at || c.updated_at || new Date().toISOString(),
    }));

    return successResponse(res, { customers }, "Customers retrieved successfully");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

// 2. CREATE / SYNC CUSTOMER (Email or Google Signup)
export async function createCustomer(req, res) {
  try {
    const {
      id,
      name,
      phone,
      email,
      city = "Hyderabad",
      address,
      tier = "Heritage Club",
      totalSpent = 0,
      ordersCount = 0,
      birthday,
      anniversary,
      preferredWeave,
      notes,
      gstin,
      authProvider = "email",
    } = req.body;

    const customerName = (name || (email ? email.split("@")[0] : "Valued Patron")).trim();
    const customerEmail = email ? email.trim().toLowerCase() : null;
    
    // Generate phone fallback if user registered with Google without phone number
    const customerPhone = phone && phone.trim() 
      ? phone.trim() 
      : (customerEmail ? `G-${customerEmail.replace(/[^a-z0-9]/g, "").slice(0, 15)}` : `C-${Date.now()}`);

    const customerNotes = notes || (authProvider === "google" ? "Registered via Google Auth" : "Registered via Web Admin Account");
    const customerId = id || `cust-${Date.now().toString(36)}`;

    if (supabase) {
      // Check if user already exists by email or phone
      let existingCust = null;
      if (customerEmail) {
        const { data } = await supabase
          .from("customers")
          .select("id, total_spent, orders_count, notes")
          .eq("email", customerEmail)
          .maybeSingle();
        if (data) existingCust = data;
      }

      if (!existingCust && phone) {
        const { data } = await supabase
          .from("customers")
          .select("id, total_spent, orders_count, notes")
          .eq("phone", customerPhone)
          .maybeSingle();
        if (data) existingCust = data;
      }

      const finalId = existingCust?.id || customerId;
      const finalSpent = existingCust ? Number(existingCust.total_spent) : Number(totalSpent);
      const finalOrders = existingCust ? Number(existingCust.orders_count) : Number(ordersCount);

      const { data, error } = await supabase.from("customers").upsert({
        id: finalId,
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        city: city ? city.trim() : "Hyderabad",
        address: address ? address.trim() : (city ? `${city.trim()}, Telangana` : "Hyderabad, Telangana"),
        tier,
        total_spent: finalSpent || 0,
        orders_count: finalOrders || 0,
        birthday: birthday || null,
        anniversary: anniversary || null,
        preferred_weave: preferredWeave || null,
        notes: customerNotes,
        gstin: gstin ? gstin.trim() : null,
        updated_at: new Date().toISOString(),
      }).select().single();

      invalidateBootstrapCache();

      if (error) {
        console.warn("Supabase upsert customer warning:", error.message);
        // Fall back gracefully so registration succeeds
        return successResponse(res, {
          customer: {
            id: finalId,
            name: customerName,
            phone: customerPhone,
            email: customerEmail,
            city,
            address: address || (city ? `${city}, Telangana` : "Hyderabad, Telangana"),
            tier,
            notes: customerNotes,
            authProvider,
            joinedAt: new Date().toISOString(),
          }
        }, "Customer registered", 201);
      }

      return successResponse(res, { 
        customer: {
          ...data,
          authProvider,
          joinedAt: data?.created_at || new Date().toISOString(),
        } 
      }, "Customer profile created successfully", 201);
    }

    invalidateBootstrapCache();
    return successResponse(res, { 
      customer: {
        id: customerId,
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        city,
        address: address || (city ? `${city}, Telangana` : "Hyderabad, Telangana"),
        tier,
        notes: customerNotes,
        authProvider,
        joinedAt: new Date().toISOString(),
      }
    }, "Customer created locally", 201);
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
      address,
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
      if (address !== undefined) updates.address = address ? address.trim() : null;
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

      invalidateBootstrapCache();
      if (error) throw error;
      return successResponse(res, { customer: data }, "Customer updated successfully");
    }

    invalidateBootstrapCache();
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
    invalidateBootstrapCache();
    return successResponse(res, { id }, "Customer removed successfully");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}
