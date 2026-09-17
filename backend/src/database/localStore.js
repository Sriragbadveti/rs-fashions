import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");

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
      orderStatus: f.status || o.orderStatus || o.order_status || "processing",
      order_status: f.status || o.order_status || o.orderStatus || "processing",
      awbNumber: f.trackingNumber !== undefined ? f.trackingNumber : (o.awbNumber || o.tracking_number || null),
      tracking_number: f.trackingNumber !== undefined ? f.trackingNumber : (o.tracking_number || o.awbNumber || null),
      carrierPartner: f.carrierPartner || o.carrierPartner || o.carrier_partner || "RS Fashions Express",
      carrier_partner: f.carrierPartner || o.carrier_partner || o.carrierPartner || "RS Fashions Express",
      trackingUrl: f.trackingUrl || o.trackingUrl || null,
      currentStage: f.status || o.currentStage || o.current_stage || "processing",
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
    orders[ordIdx].orderStatus = updated.status || orders[ordIdx].orderStatus || "processing";
    orders[ordIdx].order_status = updated.status || orders[ordIdx].order_status || "processing";
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
export function getReviewsFromStore(productId) {
  const reviews = readJson("reviews.json", [
    {
      id: "rev-1",
      productId: "1",
      productName: "Royal Magenta Gold Zari SiCo Saree",
      reviewerName: "Sowmya Reddy",
      reviewerLocation: "Jubilee Hills, Hyderabad",
      rating: 5,
      title: "Exceptional Drape & Exquisite Zari Work",
      content: "The handloom SiCo blend is so feather-light yet holds a majestic festive flare. The kaddi border glistens without being loud. Truly a generational heirloom.",
      verifiedBuyer: true,
      date: "12 Sep 2026",
      createdAt: "2026-09-12T10:00:00Z"
    },
    {
      id: "rev-2",
      productId: "2",
      productName: "Peacock Blue Dual-Tone SiCo Drape",
      reviewerName: "Dr. Malini Iyer",
      reviewerLocation: "Bengaluru",
      rating: 5,
      title: "Breathable & Authentic Handloom Texture",
      content: "Wore this for my daughter's arangetram. Received countless compliments on the authentic pitloom weave and soft drape. Exceptional quality!",
      verifiedBuyer: true,
      date: "08 Sep 2026",
      createdAt: "2026-09-08T15:30:00Z"
    },
    {
      id: "rev-3",
      productId: "3",
      productName: "Vintage Crimson Zari Butta SiCo",
      reviewerName: "Kavitha Sundaram",
      reviewerLocation: "Chennai",
      rating: 5,
      title: "Generational Heirlooms at Honest Value",
      content: "The saree arrived within 2 days in a gorgeous double-walled presentation box. The unboxing experience was pure luxury.",
      verifiedBuyer: true,
      date: "04 Sep 2026",
      createdAt: "2026-09-04T12:00:00Z"
    }
  ]);

  if (productId) {
    return reviews.filter((r) => String(r.productId) === String(productId));
  }
  return reviews;
}

export function saveReviewToStore(review) {
  const reviews = getReviewsFromStore();
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
