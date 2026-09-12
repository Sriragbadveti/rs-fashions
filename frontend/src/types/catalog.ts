import {Product, MOCK_DESIGNS, COLOR_CODES} from "../types/inventory";

export const LOW_STOCK_THRESHOLD = 2;

export const COLOR_OPTIONS = COLOR_CODES.map(
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

  return words
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

export function buildSku(
  designSlug: string,
  colorCode: string,
  serialNumber: string
): string {
  return `RSF-${designSlug}-${colorCode}-${serialNumber}`;
}

export function extractSerialFromSku(sku: string): string {
  const match = sku.match(/-(\d{3})$/);
  return match?.[1] || "001";
}

export function getProductSerial(product: Product): string {
  return extractSerialFromSku(product.id);
}

export function getNextDesignSerial(
  designName: string,
  inventory: Product[]
): string {
  if (!designName.trim()) {
    return "001";
  }

  const normalized = normalizeText(designName);
  let highest = 0;

  inventory.forEach((product) => {
    if (normalizeText(product.name) !== normalized) {
      return;
    }

    const productSerial = Number(getProductSerial(product));
    if (Number.isFinite(productSerial)) {
      highest = Math.max(highest, productSerial);
    }

    product.variants.forEach((variant) => {
      const serial = Number(extractSerialFromSku(variant.sku));
      if (Number.isFinite(serial)) {
        highest = Math.max(highest, serial);
      }
    });
  });

  return String(highest + 1).padStart(3, "0");
}

export function calculateInventoryMetrics(inventory: Product[]) {
  let totalStock = 0;
  let inventoryCost = 0;
  let lowStockCount = 0;

  inventory.forEach((product) => {
    product.variants.forEach((variant) => {
      totalStock += variant.stock;
      inventoryCost += variant.stock * product.purchasePrice;

      if (variant.stock <= LOW_STOCK_THRESHOLD) {
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

  return inventory.filter(
    (product) =>
      product.id.toLowerCase().includes(query) ||
      product.name.toLowerCase().includes(query) ||
      product.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      product.variants.some(
        (variant) =>
          variant.color.toLowerCase().includes(query) ||
          variant.colorSlug.toLowerCase().includes(query) ||
          variant.sku.toLowerCase().includes(query)
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