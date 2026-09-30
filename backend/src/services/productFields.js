import { writeWithOptionalColumns } from "./optionalColumns.js";

/**
 * Shared product field helpers used by catalog, bootstrap and bulk-intake
 * so every read/write path treats border data the same way.
 */

/**
 * Normalizes an incoming border value from a request body.
 *   undefined        -> undefined (field not sent: leave the stored value untouched)
 *   null / "" / "  " -> null      (explicitly cleared)
 *   "Royal Gold"     -> "Royal Gold"
 */
export function normalizeBorderInput(body = {}) {
  const hasCamel = Object.prototype.hasOwnProperty.call(body, "borderColor");
  const hasSnake = Object.prototype.hasOwnProperty.call(body, "border_color");
  if (!hasCamel && !hasSnake) return undefined;

  const raw = hasCamel ? body.borderColor : body.border_color;
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  const trimmed = String(raw).trim();
  return trimmed ? trimmed.slice(0, 120) : null;
}

/**
 * Resolves the border color to expose to clients for a stored product row.
 * Explicit border data always wins. Legacy dual-tone rows (created before the
 * dedicated border field was written) stored the contrast shade as "Body / Border"
 * in their color names, so that is used only as a read-time fallback.
 */
export function resolveBorderColor(row = {}, colorList = []) {
  const explicit = row.border_color ?? row.borderColor;
  if (typeof explicit === "string" && explicit.trim()) return explicit.trim();

  const dual = (Array.isArray(colorList) ? colorList : []).find(
    (c) => typeof c === "string" && c.includes("/")
  );
  const derived = dual ? dual.split("/")[1]?.trim() : "";
  return derived || undefined;
}

/**
 * Normalizes an incoming purchase (loom) cost. undefined when the field was not sent.
 */
export function normalizePurchasePriceInput(body = {}) {
  if (!Object.prototype.hasOwnProperty.call(body, "purchasePrice") || body.purchasePrice === undefined) {
    return undefined;
  }
  return Math.max(0, Number(body.purchasePrice) || 0);
}

// Columns that are newer than the original schema.sql. If a deployment has not run the
// migration yet, writes are retried without them instead of failing the whole save.
const OPTIONAL_PRODUCT_COLUMNS = ["border_color", "purchase_price"];

/**
 * Runs a products-table write built by `buildQuery(row)`, tolerating missing optional columns.
 * Returns { data, error, warnings }.
 */
export function writeProductRow(row, buildQuery) {
  return writeWithOptionalColumns("products", row, buildQuery, OPTIONAL_PRODUCT_COLUMNS);
}
