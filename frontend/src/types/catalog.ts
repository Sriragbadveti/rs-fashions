import { Product, MOCK_DESIGNS, COLOR_CODES, LEGACY_COLOR_CODES, VIBGYOR_COLORS, type ColorDefinition } from "../types/inventory";

// A saree only counts as a "low stock warning" when none is left (0 available).
export const LOW_STOCK_THRESHOLD = 0;

export const CUSTOM_COLORS_STORAGE_KEY = "rs_fashions_custom_colors";

export const COLOR_OPTIONS: string[] = COLOR_CODES.map(
  (colorDefinition) => colorDefinition.name
);

export const CurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
});

export function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

export function formatColorName(raw: string): string {
  const trimmed = String(raw || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return trimmed
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

export function isVibgyorColor(value: string): boolean {
  if (!value || !value.trim()) return false;
  return (
    VIBGYOR_COLORS.some((c) => normalizeText(c) === normalizeText(value)) ||
    COLOR_CODES.some((c) => normalizeText(c.name) === normalizeText(value)) ||
    Boolean(value.trim())
  );
}

export function createDesignSlug(name: string): string {
  const knownDesign = MOCK_DESIGNS.find(
    (design) => normalizeText(design.name) === normalizeText(name)
  );

  if (knownDesign) {
    return knownDesign.slug;
  }

  const cleaned = name
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (!cleaned.length) {
    return "CUSTOM";
  }

  if (cleaned.length === 1) {
    return cleaned[0]
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6);
  }

  return cleaned
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 6);
}

export function generateColorSlug(color: string): string {
  const knownColor = COLOR_CODES.find(
    (colorDefinition) => normalizeText(colorDefinition.name) === normalizeText(color)
  ) || LEGACY_COLOR_CODES.find(
    (colorDefinition) => normalizeText(colorDefinition.name) === normalizeText(color)
  );

  if (knownColor) {
    return knownColor.code;
  }

  const words = color
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return "CLR";
  }

  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }

  return words
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

export function syncColorsToRuntime(
  incomingColors: ColorDefinition[],
  emitEvent = true
): ColorDefinition[] {
  if (!Array.isArray(incomingColors)) return COLOR_CODES;

  let changed = false;
  for (const item of incomingColors) {
    if (!item || !item.name) continue;
    const formattedName = formatColorName(item.name);
    if (!formattedName || normalizeText(formattedName) === "standard") continue;

    const exists = COLOR_CODES.some(
      (c) => normalizeText(c.name) === normalizeText(formattedName)
    );
    if (!exists) {
      const code = (item.code || generateColorSlug(formattedName)).trim().toUpperCase();
      COLOR_CODES.push({ name: formattedName, code });
      if (!COLOR_OPTIONS.some((o) => normalizeText(o) === normalizeText(formattedName))) {
        COLOR_OPTIONS.push(formattedName);
      }
      changed = true;
    }
  }

  if (changed && typeof window !== "undefined") {
    try {
      localStorage.setItem(CUSTOM_COLORS_STORAGE_KEY, JSON.stringify(COLOR_CODES));
    } catch {
      // ignore storage errors
    }
    if (emitEvent) {
      window.dispatchEvent(
        new CustomEvent("rs_colors_updated", { detail: [...COLOR_CODES] })
      );
    }
  }

  return [...COLOR_CODES];
}

export function registerColorInCatalog(
  rawName: string,
  customCode?: string
): ColorDefinition {
  const formattedName = formatColorName(rawName);
  const existing = COLOR_CODES.find(
    (c) => normalizeText(c.name) === normalizeText(formattedName)
  );
  if (existing) {
    return existing;
  }

  let baseCode = (customCode || generateColorSlug(formattedName)).trim().toUpperCase();
  const usedCodes = new Set(COLOR_CODES.map((c) => c.code.toUpperCase()));
  if (usedCodes.has(baseCode)) {
    const lettersOnly = formattedName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (lettersOnly.length >= 3 && !usedCodes.has(lettersOnly.slice(0, 3))) {
      baseCode = lettersOnly.slice(0, 3);
    } else {
      let counter = 2;
      while (usedCodes.has(`${baseCode}${counter}`)) {
        counter++;
      }
      baseCode = `${baseCode}${counter}`;
    }
  }

  const newColor: ColorDefinition = { name: formattedName, code: baseCode };
  COLOR_CODES.push(newColor);
  if (!COLOR_OPTIONS.some((o) => normalizeText(o) === normalizeText(formattedName))) {
    COLOR_OPTIONS.push(formattedName);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CUSTOM_COLORS_STORAGE_KEY, JSON.stringify(COLOR_CODES));
    } catch {
      // ignore
    }
    window.dispatchEvent(
      new CustomEvent("rs_colors_updated", { detail: [...COLOR_CODES] })
    );
  }

  return newColor;
}

// Hydrate any locally saved custom colors on module load
if (typeof window !== "undefined") {
  try {
    const savedColors = localStorage.getItem(CUSTOM_COLORS_STORAGE_KEY);
    if (savedColors) {
      const parsed = JSON.parse(savedColors);
      if (Array.isArray(parsed)) {
        syncColorsToRuntime(parsed, false);
      }
    }
  } catch {
    // ignore
  }
}

/**
 * SKUs have the form "RS" + exactly four digits (RS0001–RS9999). They are allocated by the
 * backend when a product or shade is saved; the browser never generates them.
 */
export const SKU_PATTERN = /^RS\d{4}$/;

/** Shown wherever a SKU will only exist after the product is saved. */
export const PENDING_SKU_LABEL = "Assigned on save";

export function isValidSku(value: string | null | undefined): boolean {
  return typeof value === "string" && SKU_PATTERN.test(value) && value !== "RS0000";
}

export function calculateInventoryMetrics(inventory: Product[]) {
  let totalStock = 0;
  let inventoryCost = 0;
  let lowStockCount = 0;

  (inventory || []).forEach((product) => {
    (product.variants || []).forEach((variant) => {
      totalStock += variant.stock || 0;
      inventoryCost += (variant.stock || 0) * (product.purchasePrice || 0);

      if ((variant.stock || 0) <= LOW_STOCK_THRESHOLD) {
        lowStockCount++;
      }
    });
  });

  return {
    totalStock,
    inventoryCost,
    lowStockCount,
  };
}

export function filterInventory(inventory: Product[], rawQuery: string): Product[] {
  const query = rawQuery.toLowerCase().trim();
  if (!query) {
    return inventory;
  }

  return (inventory || []).filter(
    (product) =>
      (product.id || "").toLowerCase().includes(query) ||
      (product.name || "").toLowerCase().includes(query) ||
      (product.tags || []).some((tag) => (tag || "").toLowerCase().includes(query)) ||
      (product.variants || []).some(
        (variant) =>
          (variant.color || "").toLowerCase().includes(query) ||
          (variant.colorSlug || "").toLowerCase().includes(query) ||
          (variant.sku || "").toLowerCase().includes(query)
      )
  );
}

export function getAvailableDesignOptions(inventory: Product[]): string[] {
  const names = new Set<string>();

  MOCK_DESIGNS.forEach((design) => names.add(design.name));
  inventory.forEach((product) => {
    if (product.name) names.add(product.name);
  });

  return Array.from(names);
}