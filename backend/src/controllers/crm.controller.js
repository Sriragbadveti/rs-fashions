import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { invalidateBootstrapCache } from "./bootstrap.controller.js";
import { writeWithOptionalColumns } from "../services/optionalColumns.js";

// customers.address is used by the admin CRM but was never added to schema.sql; tolerate its
// absence until the migration runs instead of failing (and silently losing) every save.
const OPTIONAL_CUSTOMER_COLUMNS = ["address"];

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

    const customers = (data || []).map((c) => {
      const isFakePhone = c.phone && (c.phone.startsWith("G-") || c.phone.startsWith("C-"));
      return {
        id: c.id,
        name: c.name,
        phone: isFakePhone ? undefined : c.phone,
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
      };
    });

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

/**
 * Normalizes a birthday / anniversary to YYYY-MM-DD. Greetings only use the month and day,
 * and admins often pick the day in the current year when the year is unknown, so dates up to
 * the end of the current year are accepted; anything unparsable or before 1900 is rejected.
 */
function validateCelebrationDate(val, label = "Date of Birth") {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  if (!str) return null;
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const d = isoMatch
    ? new Date(Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])))
    : new Date(str);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid ${label} format. Please provide a valid date.`);
  }
  if (d.getUTCFullYear() < 1900) {
    throw new Error(`${label} must be after year 1900.`);
  }
  if (d.getUTCFullYear() > new Date().getUTCFullYear()) {
    throw new Error(`${label} cannot be in a future year.`);
  }
  return d.toISOString().split("T")[0];
}

function validateAndFormatDOB(val) {
  return validateCelebrationDate(val, "Date of Birth");
}

export function sanitizeCustomerPhone(phone) {
  if (!phone || typeof phone !== "string") return null;
  const p = phone.trim();
  if (p.startsWith("G-") || p.startsWith("C-")) return null;
  const digits = p.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return p || null;
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
    let cleanAnniversary = null;
    try {
      cleanBirthday = validateAndFormatDOB(birthday || dob || date_of_birth);
      cleanAnniversary = validateCelebrationDate(anniversary, "Anniversary date");
    } catch (dateErr) {
      return errorResponse(res, dateErr.message, 400);
    }

    const customerName = (name || (email ? email.split("@")[0] : "Valued Patron")).trim();
    const customerEmail = email ? email.trim().toLowerCase() : null;
    
    // Do not generate fake G- or C- placeholders
    let customerPhone = sanitizeCustomerPhone(phone);

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
          .select("id, name, email, phone, total_spent, orders_count, notes, birthday, anniversary")
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
            .select("id, name, email, phone, total_spent, orders_count, notes, birthday, anniversary")
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

      // Preserve existing valid phone if new one was not provided
      if (!customerPhone && existingCust?.phone && !existingCust.phone.startsWith("G-") && !existingCust.phone.startsWith("C-")) {
        customerPhone = existingCust.phone;
      }

      const finalId = existingCust?.id || customerId;
      const finalSpent = existingCust ? Number(existingCust.total_spent) : Number(totalSpent);
      const finalOrders = existingCust ? Number(existingCust.orders_count) : Number(ordersCount);
      const finalBirthday = cleanBirthday || existingCust?.birthday || null;
      const finalAnniversary = cleanAnniversary || existingCust?.anniversary || null;

      const { data, error, warnings } = await writeWithOptionalColumns("customers", {
        id: finalId,
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        city: city ? city.trim() : "Hyderabad",
        address: address ? address.trim() : (city ? `${city.trim()}, Telangana` : "Hyderabad, Telangana"),
        total_spent: finalSpent || 0,
        orders_count: finalOrders || 0,
        birthday: finalBirthday,
        anniversary: finalAnniversary,
        preferred_weave: preferredWeave || null,
        notes: customerNotes,
        gstin: gstin ? gstin.trim() : null,
        updated_at: new Date().toISOString(),
      }, (row) => supabase.from("customers").upsert(row).select().single(), OPTIONAL_CUSTOMER_COLUMNS);

      invalidateBootstrapCache();

      if (error) {
        // Never report a customer as saved when the database rejected it.
        console.error("Supabase upsert customer error:", error.message);
        return errorResponse(res, "Customer could not be saved. Please try again.", 500);
      }

      return successResponse(res, {
        customer: {
          ...data,
          authProvider,
          joinedAt: data?.created_at || new Date().toISOString(),
        },
        warnings,
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
        anniversary: cleanAnniversary,
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
    let cleanAnniversary = undefined;
    try {
      if (birthday !== undefined || dob !== undefined || date_of_birth !== undefined) {
        cleanBirthday = validateAndFormatDOB(birthday || dob || date_of_birth);
      }
      if (anniversary !== undefined) {
        cleanAnniversary = validateCelebrationDate(anniversary, "Anniversary date");
      }
    } catch (dateErr) {
      return errorResponse(res, dateErr.message, 400);
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
      if (cleanAnniversary !== undefined) updates.anniversary = cleanAnniversary;
      if (preferredWeave !== undefined) updates.preferred_weave = preferredWeave || null;
      if (notes !== undefined) updates.notes = notes || null;
      if (gstin !== undefined) updates.gstin = gstin ? gstin.trim() : null;

      const { data, error, warnings } = await writeWithOptionalColumns(
        "customers",
        updates,
        (row) => supabase.from("customers").update(row).eq("id", id).select().single(),
        OPTIONAL_CUSTOMER_COLUMNS
      );

      invalidateBootstrapCache();
      if (error) {
        if (error.code === "PGRST116") return errorResponse(res, `Customer ${id} not found`, 404);
        throw error;
      }
      return successResponse(res, { customer: data, warnings }, "Customer updated successfully");
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
