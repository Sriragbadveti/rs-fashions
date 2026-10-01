import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = process.env.RS_LOCAL_DATA_DIR || path.join(__dirname, "data");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson(file, defaultVal = []) {
  ensureDir();
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) {
    return defaultVal;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[LocalStore] Error reading ${file}:`, err.message);
    return defaultVal;
  }
}

function writeJson(file, data) {
  ensureDir();
  const filePath = path.join(DATA_DIR, file);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error(`[LocalStore] Error writing ${file}:`, err.message);
  }
}

// ==========================================
// ORDERS
// ==========================================
export function saveOrderToStore(order) {
  const orders = readJson("orders.json", []);
  const invoiceNum = order.invoiceNumber || order.invoice_number || order.orderNumber || order.order_number || order.id;
  const existingIdx = orders.findIndex(
    (o) => (o.invoiceNumber || o.invoice_number || o.id) === invoiceNum
  );

  const cleanOrder = {
    ...order,
    invoiceNumber: invoiceNum,
    invoice_number: invoiceNum,
    orderNumber: order.orderNumber || order.order_number || invoiceNum,
    order_number: order.order_number || order.orderNumber || invoiceNum,
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    orders[existingIdx] = { ...orders[existingIdx], ...cleanOrder };
  } else {
    orders.unshift(cleanOrder);
  }
  writeJson("orders.json", orders);
  return cleanOrder;
}

export function getNextSequentialInvoiceNumberFromStore() {
  const orders = readJson("orders.json", []);
  let maxNumber = 0;
  for (const o of orders) {
    const inv = o.invoice_number || o.invoiceNumber || o.order_number || o.orderNumber;
    if (inv && /^\d+$/.test(String(inv).trim())) {
      const val = parseInt(String(inv).trim(), 10);
      if (!isNaN(val) && val > maxNumber) maxNumber = val;
    }
  }
  return String(maxNumber + 1).padStart(3, "0");
}


export function getOrdersFromStore(phone, email) {
  const orders = readJson("orders.json", []);
  const fulfillments = readJson("fulfillments.json", {});

  const cleanPhone = phone ? String(phone).replace(/\D/g, "").slice(-10) : null;
  const cleanEmail = email ? String(email).trim().toLowerCase() : null;

  const matched = orders.filter((o) => {
    const oPhone = String(o.phone || o.customerPhone || o.customer_phone || "").replace(/\D/g, "").slice(-10);
    const oEmail = String(o.email || o.customerEmail || o.customer_email || "").trim().toLowerCase();
    const phoneMatch = cleanPhone && oPhone && (oPhone.includes(cleanPhone) || cleanPhone.includes(oPhone));
    const emailMatch = cleanEmail && oEmail && oEmail === cleanEmail;
    return phoneMatch || emailMatch;
  });

  // Attach fulfillment data
  return matched.map((o) => {
    const inv = o.invoiceNumber || o.invoice_number || o.id;
    const f = fulfillments[inv] || {};
    return {
      ...o,
      orderStatus: f.status || o.orderStatus || o.order_status || "ordered",
      order_status: f.status || o.order_status || o.orderStatus || "ordered",
      awbNumber: f.trackingNumber !== undefined ? f.trackingNumber : (o.awbNumber || o.tracking_number || null),
      tracking_number: f.trackingNumber !== undefined ? f.trackingNumber : (o.tracking_number || o.awbNumber || null),
      carrierPartner: f.carrierPartner || o.carrierPartner || o.carrier_partner || "RS Fashions Express",
      carrier_partner: f.carrierPartner || o.carrier_partner || o.carrierPartner || "RS Fashions Express",
      trackingUrl: f.trackingUrl || o.trackingUrl || null,
      currentStage: f.status || o.currentStage || o.current_stage || "ordered",
    };
  });
}

// ==========================================
// FULFILLMENTS
// ==========================================
export function saveFulfillmentToStore(invoiceNumber, fulfillment) {
  const fulfillments = readJson("fulfillments.json", {});
  const existing = fulfillments[invoiceNumber] || {};
  const updated = {
    ...existing,
    ...fulfillment,
    invoiceNumber,
    updatedAt: new Date().toISOString(),
  };
  fulfillments[invoiceNumber] = updated;
  writeJson("fulfillments.json", fulfillments);

  // Also update corresponding order in orders.json if it exists
  const orders = readJson("orders.json", []);
  const ordIdx = orders.findIndex(
    (o) => (o.invoiceNumber || o.invoice_number || o.id) === invoiceNumber
  );
  if (ordIdx >= 0) {
    orders[ordIdx].orderStatus = updated.status || orders[ordIdx].orderStatus || "ordered";
    orders[ordIdx].order_status = updated.status || orders[ordIdx].order_status || "ordered";
    orders[ordIdx].awbNumber = updated.trackingNumber || orders[ordIdx].awbNumber || null;
    orders[ordIdx].carrierPartner = updated.carrierPartner || orders[ordIdx].carrierPartner || "RS Fashions Express";
    orders[ordIdx].trackingUrl = updated.trackingUrl || orders[ordIdx].trackingUrl || null;
    orders[ordIdx].notes = `Fulfillment: [${updated.carrierPartner || 'Express'}] AWB: ${updated.trackingNumber || 'Pending'}`;
    writeJson("orders.json", orders);
  }

  return updated;
}

export function getFulfillmentFromStore(invoiceNumber) {
  const fulfillments = readJson("fulfillments.json", {});
  return fulfillments[invoiceNumber] || null;
}

// ==========================================
// REVIEWS
// ==========================================
export function getReviewsFromStore(productId, approvedOnly = false) {
  const reviews = readJson("reviews.json", []);
  let filtered = reviews;

  if (productId) {
    filtered = filtered.filter((r) => String(r.productId) === String(productId));
  }
  if (approvedOnly) {
    filtered = filtered.filter((r) => r.approved !== false);
  }
  return filtered;
}

export function saveReviewToStore(review) {
  const reviews = readJson("reviews.json", []);
  const newReview = {
    ...review,
    id: review.id || `rev-${Date.now().toString(36)}`,
    createdAt: review.createdAt || new Date().toISOString(),
    date: review.date || new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }),
    verifiedBuyer: review.verifiedBuyer !== false,
    approved: review.approved !== false,
  };

  const existingIdx = reviews.findIndex((r) => r.id === newReview.id);
  if (existingIdx >= 0) {
    reviews[existingIdx] = newReview;
  } else {
    reviews.unshift(newReview);
  }
  writeJson("reviews.json", reviews);
  return newReview;
}

export function deleteReviewFromStore(id) {
  const reviews = getReviewsFromStore();
  const filtered = reviews.filter((r) => r.id !== id);
  writeJson("reviews.json", filtered);
  return true;
}

// ==========================================
// PAYMENT ATTEMPTS & IDEMPOTENCY
// ==========================================
export function getPaymentHistory(orderKey) {
  const attempts = readJson("payment_attempts.json", {});
  return attempts[orderKey] || null;
}

export function savePaymentAttempt(orderKey, attemptRecord) {
  const attempts = readJson("payment_attempts.json", {});
  const existing = attempts[orderKey] || {
    orderKey,
    attempts: [],
    currentStatus: "CREATED",
    updatedAt: new Date().toISOString(),
  };

  const attemptIdx = existing.attempts.findIndex(
    (a) => a.cfOrderId === attemptRecord.cfOrderId
  );

  if (attemptIdx >= 0) {
    existing.attempts[attemptIdx] = {
      ...existing.attempts[attemptIdx],
      ...attemptRecord,
      updatedAt: new Date().toISOString(),
    };
  } else {
    existing.attempts.push({
      ...attemptRecord,
      createdAt: attemptRecord.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  existing.currentStatus = attemptRecord.status || existing.currentStatus;
  existing.updatedAt = new Date().toISOString();
  attempts[orderKey] = existing;
  writeJson("payment_attempts.json", attempts);
  return existing;
}

export function updatePaymentAttemptStatus(cfOrderId, status, metadata = {}) {
  const attempts = readJson("payment_attempts.json", {});
  for (const key of Object.keys(attempts)) {
    const record = attempts[key];
    const attempt = record.attempts?.find((a) => a.cfOrderId === cfOrderId);
    if (attempt) {
      // Valid state transitions: CREATED -> PENDING -> PAID / FAILED / EXPIRED / CANCELLED
      // Terminal state check: if already PAID, do not revert to earlier state!
      if (attempt.status === "PAID" && status !== "PAID") {
        return record;
      }
      attempt.status = status;
      attempt.updatedAt = new Date().toISOString();
      if (metadata.paymentId) attempt.paymentId = metadata.paymentId;
      if (metadata.paymentDetails) attempt.paymentDetails = metadata.paymentDetails;
      record.currentStatus = status;
      record.updatedAt = new Date().toISOString();
      writeJson("payment_attempts.json", attempts);
      return record;
    }
  }
  return null;
}

export function findOrderFromStore(orderIdOrNumber) {
  if (!orderIdOrNumber) return null;
  const orders = readJson("orders.json", []);
  const clean = String(orderIdOrNumber).trim();
  return orders.find(
    (o) =>
      o.id === clean ||
      o.orderNumber === clean ||
      o.order_number === clean ||
      o.invoiceNumber === clean ||
      o.invoice_number === clean
  ) || null;
}

export function markOrderPaidInStore(orderIdOrNumber, paymentDetails = {}) {
  const orders = readJson("orders.json", []);
  const clean = String(orderIdOrNumber).trim();
  const ordIdx = orders.findIndex(
    (o) =>
      o.id === clean ||
      o.orderNumber === clean ||
      o.order_number === clean ||
      o.invoiceNumber === clean ||
      o.invoice_number === clean
  );

  if (ordIdx >= 0) {
    orders[ordIdx].paymentStatus = "paid";
    orders[ordIdx].payment_status = "paid";
    orders[ordIdx].paymentMethod = "cashfree";
    orders[ordIdx].payment_method = "cashfree";
    orders[ordIdx].paymentDetails = paymentDetails;
    orders[ordIdx].updatedAt = new Date().toISOString();
    writeJson("orders.json", orders);
    return orders[ordIdx];
  }
  return null;
}

// ==========================================
// WEBHOOK EVENT DEDUPLICATION (IDEMPOTENCY)
// ==========================================
export function isWebhookEventProcessed(eventId) {
  if (!eventId) return false;
  const events = readJson("webhook_events.json", {});
  return Boolean(events[eventId]);
}

export function recordWebhookEvent(eventId, details = {}) {
  if (!eventId) return;
  const events = readJson("webhook_events.json", {});
  events[eventId] = {
    eventId,
    processedAt: new Date().toISOString(),
    ...details,
  };
  writeJson("webhook_events.json", events);
}

// ==========================================
// SAREE CATALOG & INVENTORY PERSISTENCE
// ==========================================
export function getProductsFromStore() {
  return readJson("products.json", []);
}

export function saveProductToStore(product) {
  const products = getProductsFromStore();
  const existingIdx = products.findIndex((p) => p.id === product.id);

  const cleanProduct = {
    ...product,
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    products[existingIdx] = { ...products[existingIdx], ...cleanProduct };
  } else {
    products.unshift(cleanProduct);
  }

  writeJson("products.json", products);
  return cleanProduct;
}

export function deleteProductFromStore(id) {
  const products = getProductsFromStore();
  const filtered = products.filter((p) => p.id !== id);
  writeJson("products.json", filtered);
  return true;
}

// ==========================================
// COLOR PALETTE PERSISTENCE
// ==========================================
export const DEFAULT_COLOR_PALETTE = [
  { name: "Violet", code: "VLT" },
  { name: "Indigo", code: "IND" },
  { name: "Blue", code: "BLU" },
  { name: "Green", code: "GRN" },
  { name: "Yellow", code: "YEL" },
  { name: "Orange", code: "ORG" },
  { name: "Red", code: "RED" },
];

export function formatColorTitle(raw) {
  const trimmed = String(raw || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return trimmed
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

export function generateColorCode(colorName, existingColors = []) {
  const cleaned = String(colorName || "")
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (!cleaned.length) return "CLR";

  let baseCode = "";
  if (cleaned.length === 1) {
    baseCode = cleaned[0].slice(0, 3).toUpperCase();
  } else {
    baseCode = cleaned
      .map((w) => w.charAt(0))
      .join("")
      .slice(0, 3)
      .toUpperCase();
  }

  if (baseCode.length < 2 && cleaned[0].length >= 2) {
    baseCode = cleaned[0].slice(0, 2).toUpperCase();
  }

  const usedCodes = new Set(
    (existingColors || []).map((c) => String(c.code || "").trim().toUpperCase())
  );

  if (!usedCodes.has(baseCode)) return baseCode;

  // Try alternative 3-letter combinations from the name
  const lettersOnly = cleaned.join("").toUpperCase();
  if (lettersOnly.length >= 3) {
    const alt1 = lettersOnly.slice(0, 3);
    if (!usedCodes.has(alt1)) return alt1;
    const alt2 = (lettersOnly[0] + lettersOnly[1] + lettersOnly[lettersOnly.length - 1]).toUpperCase();
    if (!usedCodes.has(alt2)) return alt2;
  }

  let counter = 2;
  while (usedCodes.has(`${baseCode}${counter}`)) {
    counter++;
  }
  return `${baseCode}${counter}`;
}

export function getColorsFromStore() {
  const stored = readJson("colors.json", []);
  const merged = [...DEFAULT_COLOR_PALETTE];
  const seen = new Set(merged.map((c) => c.name.trim().toLowerCase()));

  if (Array.isArray(stored)) {
    for (const item of stored) {
      if (!item || !item.name) continue;
      const norm = String(item.name).trim().toLowerCase();
      if (!norm || norm === "standard" || seen.has(norm)) continue;
      seen.add(norm);
      merged.push({
        name: formatColorTitle(item.name),
        code: String(item.code || generateColorCode(item.name, merged))
          .trim()
          .toUpperCase(),
      });
    }
  }

  return merged;
}

export function saveColorToStore(colorInput) {
  const current = getColorsFromStore();
  const rawName = typeof colorInput === "string" ? colorInput : colorInput?.name;
  const formattedName = formatColorTitle(rawName);
  if (!formattedName || formattedName.toLowerCase() === "standard") {
    return { color: null, colors: current };
  }

  const norm = formattedName.toLowerCase();
  const existing = current.find((c) => c.name.trim().toLowerCase() === norm);
  if (existing) {
    writeJson("colors.json", current);
    return { color: existing, colors: current };
  }

  const rawCode = typeof colorInput === "object" && colorInput?.code ? String(colorInput.code).trim().toUpperCase() : "";
  const code = rawCode || generateColorCode(formattedName, current);
  const newColor = { name: formattedName, code };

  const updated = [...current, newColor];
  writeJson("colors.json", updated);
  return { color: newColor, colors: updated };
}

export function saveColorsToStore(colorList = []) {
  let current = getColorsFromStore();
  for (const item of colorList) {
    const res = saveColorToStore(item);
    current = res.colors;
  }
  writeJson("colors.json", current);
  return current;
}
