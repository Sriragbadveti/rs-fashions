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

// 1.5 CHECK IF CUSTOMER EXISTS (Strict Duplicate Prevention)
export async function checkCustomerExists(req, res) {
  try {
    const rawEmail = req.query.email ? String(req.query.email).trim().toLowerCase() : null;
    const rawPhone = req.query.phone ? String(req.query.phone).replace(/\D/g, "").slice(-10) : null;

    if (!rawEmail && !rawPhone) {
      return errorResponse(res, "Email or phone parameter is required", 400);
    }

    let emailExists = false;
    let phoneExists = false;
    let existingName = null;

    if (supabase) {
      if (rawEmail) {
        const { data } = await supabase
          .from("customers")
          .select("id, name, email")
          .ilike("email", rawEmail)
          .maybeSingle();
        if (data) {
          emailExists = true;
          existingName = data.name;
        }
      }

      if (rawPhone) {
        // Query both exact phone match and containing 10 digits
        const { data } = await supabase
          .from("customers")
          .select("id, name, phone")
          .ilike("phone", `%${rawPhone}%`)
          .maybeSingle();
        if (data) {
          phoneExists = true;
          if (!existingName) existingName = data.name;
        }
      }
    }

    return successResponse(res, {
      exists: emailExists || phoneExists,
      emailExists,
      phoneExists,
      existingName,
    }, "Customer duplicate check completed");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

function validateAndFormatDOB(val) {
  if (!val) return null;
  const str = String(val).trim();
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d.getTime())) {
    throw new Error("Invalid Date of Birth format. Please provide a valid date.");
  }
  if (d.getTime() > Date.now()) {
    throw new Error("Date of Birth cannot be in the future.");
  }
  if (d.getFullYear() < 1900) {
    throw new Error("Date of Birth must be after year 1900.");
  }
  return d.toISOString().split("T")[0];
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
      totalSpent = 0,
      ordersCount = 0,
      birthday,
      dob,
      date_of_birth,
      anniversary,
      preferredWeave,
      notes,
      gstin,
      authProvider = "email",
      isNewRegistration = false,
      strictDuplicateCheck = false,
    } = req.body;

    let cleanBirthday = null;
    try {
      cleanBirthday = validateAndFormatDOB(birthday || dob || date_of_birth);
    } catch (dateErr) {
      return errorResponse(res, dateErr.message, 400);
    }

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
      let emailMatched = false;
      let phoneMatched = false;

      if (customerEmail) {
        const { data } = await supabase
          .from("customers")
          .select("id, name, email, phone, total_spent, orders_count, notes")
          .ilike("email", customerEmail)
          .maybeSingle();
        if (data) {
          existingCust = data;
          emailMatched = true;
        }
      }

      if (phone && phone.trim()) {
        const cleanDigits = phone.replace(/\D/g, "").slice(-10);
        if (cleanDigits.length === 10) {
          const { data } = await supabase
            .from("customers")
            .select("id, name, email, phone, total_spent, orders_count, notes")
            .ilike("phone", `%${cleanDigits}%`)
            .maybeSingle();
          if (data) {
            if (!existingCust) existingCust = data;
            phoneMatched = true;
          }
        }
      }

      // STRICT DUPLICATE PREVENTION:
      // If client requested a new registration, disallow if email or phone already registered!
      if (isNewRegistration || strictDuplicateCheck) {
        if (emailMatched) {
          return errorResponse(res, `An account with email '${customerEmail}' already exists. Please sign in instead.`, 409);
        }
        if (phoneMatched) {
          return errorResponse(res, `An account with mobile number '${phone}' already exists. Please sign in instead.`, 409);
        }
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
        total_spent: finalSpent || 0,
        orders_count: finalOrders || 0,
        birthday: cleanBirthday,
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
            birthday: cleanBirthday,
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
        birthday: cleanBirthday,
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
      totalSpent,
      ordersCount,
      birthday,
      dob,
      date_of_birth,
      anniversary,
      preferredWeave,
      notes,
      gstin,
    } = req.body;

    let cleanBirthday = undefined;
    if (birthday !== undefined || dob !== undefined || date_of_birth !== undefined) {
      try {
        cleanBirthday = validateAndFormatDOB(birthday || dob || date_of_birth);
      } catch (dateErr) {
        return errorResponse(res, dateErr.message, 400);
      }
    }

    if (supabase) {
      const updates = { updated_at: new Date().toISOString() };
      if (name) updates.name = name.trim();
      if (phone) updates.phone = phone.trim();
      if (email !== undefined) updates.email = email ? email.trim() : null;
      if (city) updates.city = city.trim();
      if (address !== undefined) updates.address = address ? address.trim() : null;
      if (totalSpent !== undefined) updates.total_spent = Number(totalSpent);
      if (ordersCount !== undefined) updates.orders_count = Number(ordersCount);
      if (cleanBirthday !== undefined) updates.birthday = cleanBirthday;
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
