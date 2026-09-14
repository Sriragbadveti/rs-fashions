import { Product, ColorVariant } from "../types/inventory";

export interface LowStockItem {
  product: Product;
  variant: ColorVariant;
  totalProductStock: number;
}

export const SAFETY_STOCK_THRESHOLD = 2;

export function getLowStockVariants(inventory: Product[]): LowStockItem[] {
  const items: LowStockItem[] = [];

  inventory.forEach((product) => {
    product.variants.forEach((variant) => {
      if (variant.stock <= SAFETY_STOCK_THRESHOLD) {
        items.push({
          product,
          variant,
          totalProductStock: product.variants.reduce((sum, v) => sum + v.stock, 0),
        });
      }
    });
  });

  return items;
}

export function generateWeaverWhatsAppPO(
  weaverName: string,
  weaverPhone: string,
  selectedItems: { productName: string; color: string; sku: string; targetQty: number }[]
): string {
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const lines = selectedItems.map(
    (item, idx) =>
      `*${idx + 1}. ${item.productName}* (${item.color})\n   SKU: \`${item.sku}\`\n   Order Qty: *${item.targetQty} Drapes*`
  );

  const message = [
    `🏛️ *RS FASHIONS — MASTER WEAVER INWARD PO* 🏛️`,
    `Jubilee Hills Studio, Hyderabad`,
    `━━━━━━━━━━━━━━━━━━`,
    `*To Master Artisan:* ${weaverName}`,
    `*Date:* ${dateStr}`,
    `*Ref PO Code:* PO-WEAVER-${Date.now().toString().slice(-6)}`,
    `━━━━━━━━━━━━━━━━━━`,
    `*URGENT RESTOCK REQUISITION:*`,
    ...lines,
    `━━━━━━━━━━━━━━━━━━`,
    `Please confirm loom scheduling and dispatch timeline.`,
    `*RS Fashions Procurement Desk*`,
  ].join("\n");

  // Strip all non-numeric characters for valid wa.me parsing (e.g. "+91 98480 12345" -> "919848012345")
  const cleanPhone = weaverPhone.replace(/\D/g, "");

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}