import { useState, useEffect } from "react";
import { API_BASE } from "../config/api";
import { adminFetch } from "../utils/adminSession";
import { Device, Product, CompletedSale, StockMovement } from "../types/inventory";

export type AppTheme = "light-luxury" | "dark-midnight" | "peach-blush" | "emerald-jade" | "royal-sapphire";

export interface ShowroomSettings {
  storeName: string;
  gstin: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  invoicePrefix: string;
  financialYear: string;
  defaultHsnCode: string;
  autoLockMins: string;
  weaverPoPrefix: string;
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  failedLoginProtection: boolean;
  deviceApprovalRequired: boolean;
  offlineVaultMode: boolean;
  lowStockAlerts: boolean;
  birthdayAlerts: boolean;
  salesAlerts: boolean;
  whatsappReceipts: boolean;
  autoBackup: boolean;
  thermalPrinter: boolean;
  barcodeScanner: boolean;
  theme: AppTheme;
}

export const DEFAULT_SETTINGS: ShowroomSettings = {
  storeName: "Fashions",
  gstin: "36AAAAA0000A1Z5",
  storeAddress: "Gadwal, Telangana 509125",
  storePhone: "7842070881",
  storeEmail: "concierge@rsfashions.in",
  invoicePrefix: "RSF/",
  financialYear: "2026-27",
  defaultHsnCode: "5208",
  autoLockMins: "15",
  weaverPoPrefix: "PO-WEAVER-",
  twoFactorEnabled: true,
  loginAlerts: true,
  failedLoginProtection: true,
  deviceApprovalRequired: true,
  offlineVaultMode: true,
  lowStockAlerts: true,
  birthdayAlerts: true,
  salesAlerts: true,
  whatsappReceipts: true,
  autoBackup: true,
  thermalPrinter: true,
  barcodeScanner: true,
  theme: "light-luxury",
};

const LEGACY_PLACEHOLDERS = {
  address: ["Hyderabad, Telangana 500033", "Plot No. 42, Jubilee Hills Road No. 36, Hyderabad, Telangana 500033"],
  phone: ["+91 98765 43210", "9876543210"],
};

const SETTINGS_STORAGE_KEY = "rs_fashions_showroom_settings";

export function loadSettings(): ShowroomSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      const merged = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      // Values that were only the old placeholder defaults are replaced by the current ones.
      if (LEGACY_PLACEHOLDERS.address.includes(merged.storeAddress)) merged.storeAddress = DEFAULT_SETTINGS.storeAddress;
      if (LEGACY_PLACEHOLDERS.phone.includes(merged.storePhone)) merged.storePhone = DEFAULT_SETTINGS.storePhone;
      return merged;
    }
  } catch (e) {
    console.error("Failed to load settings", e);
  }
  return DEFAULT_SETTINGS;
}

export function getShowroomSettings(): ShowroomSettings {
  return loadSettings();
}

export function saveSettingsToStorage(settings: ShowroomSettings) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  applyTheme(settings.theme);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("rs_showroom_settings_changed", { detail: settings }));
  }
}

/**
 * Pulls the admin's saved showroom details (Settings > Systems & Storage) from the server so every
 * invoice on every device shows the latest ones. Invoices read these live, so past and future
 * invoices update together. Silent when not signed in as admin or offline.
 */
let lastSettingsSync = 0;
export async function syncSettingsFromServer(force = false) {
  if (typeof window === "undefined") return;
  if (!force && Date.now() - lastSettingsSync < 30_000) return;
  lastSettingsSync = Date.now();
  try {
    const res = await adminFetch(`${API_BASE}/settings`);
    if (!res.ok) return;
    const server = (await res.json())?.settings;
    if (!server || typeof server !== "object") return;
    const current = loadSettings();
    const next: ShowroomSettings = { ...current };
    for (const key of Object.keys(DEFAULT_SETTINGS) as Array<keyof ShowroomSettings>) {
      if (server[key] !== undefined && server[key] !== null && server[key] !== "") (next as any)[key] = server[key];
    }
    if (JSON.stringify(next) !== JSON.stringify(current)) saveSettingsToStorage(next);
  } catch {}
}

export function useShowroomSettings() {
  const [settings, setSettings] = useState<ShowroomSettings>(loadSettings);

  useEffect(() => {
    syncSettingsFromServer();
    const handleUpdate = () => {
      setSettings(loadSettings());
    };
    window.addEventListener("rs_showroom_settings_changed", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("rs_showroom_settings_changed", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return settings;
}

export function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  root.classList.remove("theme-dark", "theme-peach", "theme-emerald", "theme-sapphire");

  if (theme === "dark-midnight") {
    root.classList.add("theme-dark");
  } else if (theme === "peach-blush") {
    root.classList.add("theme-peach");
  } else if (theme === "emerald-jade") {
    root.classList.add("theme-emerald");
  } else if (theme === "royal-sapphire") {
    root.classList.add("theme-sapphire");
  }
}

// Fetch Real Local IP via WebRTC STUN handshake
export async function fetchRealClientIP(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pc.createDataChannel("");
      pc.createOffer().then((offer) => pc.setLocalDescription(offer));
      pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate || !ice.candidate.candidate) return;
        const result = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate);
        if (result && result[1]) {
          resolve(result[1]);
          pc.close();
        }
      };
      setTimeout(() => resolve("192.168.1.101"), 1200);
    } catch {
      resolve("192.168.1.101");
    }
  });
}

// Comprehensive Export Engine (JSON, CSV, XML, PDF)
// Comprehensive Export Engine (JSON, CSV, XML, PDF)
export function exportDatabaseBackup(
  format: "json" | "csv" | "xml" | "pdf",
  inventory: Product[],
  salesHistory: CompletedSale[],
  stockHistory: StockMovement[],
  devices: Device[] = []
): { success: boolean; message: string } {
  const timestamp = new Date().toISOString().slice(0, 10);
  const settings = loadSettings();

  try {
    if (format === "json") {
      const data = {
        exportedAt: new Date().toISOString(),
        store: settings,
        inventory,
        salesHistory,
        stockHistory,
        devices,
      };
      downloadFile(JSON.stringify(data, null, 2), `RSFashions_Complete_Backup_${timestamp}.json`, "application/json;charset=utf-8");
      return { success: true, message: `Full JSON backup exported (${inventory.length} products, ${salesHistory.length} sales).` };
    } else if (format === "csv") {
      let csv = "--- INVENTORY CATALOG ---\nSKU,Product Name,Category,Purchase Price,Sale Price,Total Stock\n";
      inventory.forEach((p) => {
        const totalStock = p.variants?.reduce((s, v) => s + (v.stock || 0), 0) ?? 0;
        csv += `"${p.id}","${p.name.replace(/"/g, '""')}","${p.categoryId || ""}",${p.purchasePrice || 0},${p.salePrice || 0},${totalStock}\n`;
      });

      csv += "\n\n--- TRANSACTION HISTORY ---\nInvoice No,Date,Customer Name,Phone,Billing Type,Total,Payment Mode\n";
      salesHistory.forEach((s) => {
        const bType = ((s.billingType || (s as any).billing_type) ?? "retail").toUpperCase();
        csv += `"${s.invoiceNumber || ""}","${s.date || ""}","${(s.customerName || "").replace(/"/g, '""')}","${s.customerPhone || ""}","${bType}",${s.total || 0},"${s.paymentMethod || ""}"\n`;
      });

      csv += "\n\n--- STOCK HISTORY AUDIT TRAIL ---\nDate,SKU,Product Name,Color,Type,Quantity,Reference\n";
      stockHistory.forEach((sh) => {
        csv += `"${sh.date || ""}","${sh.sku || ""}","${(sh.productName || "").replace(/"/g, '""')}","${sh.color || ""}","${sh.type || ""}",${sh.quantity || 0},"${sh.referenceNumber || ""}"\n`;
      });

      downloadFile("\uFEFF" + csv, `RSFashions_Ledger_Export_${timestamp}.csv`, "text/csv;charset=utf-8");
      return { success: true, message: "CSV spreadsheet ledger exported successfully." };
    } else if (format === "xml") {
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<RSFashionsShowroom>\n`;
      xml += `  <ExportedAt>${new Date().toISOString()}</ExportedAt>\n`;
      xml += `  <StoreName>${settings.storeName || "RS Fashions"}</StoreName>\n`;
      xml += `  <GSTIN>${settings.gstin || ""}</GSTIN>\n`;
      
      xml += `  <Inventory total="${inventory.length}">\n`;
      inventory.forEach((p) => {
        const stock = p.variants?.reduce((s, v) => s + (v.stock || 0), 0) ?? 0;
        xml += `    <Product id="${p.id}">\n      <Name><![CDATA[${p.name}]]></Name>\n      <SalePrice>${p.salePrice || 0}</SalePrice>\n      <Stock>${stock}</Stock>\n    </Product>\n`;
      });
      xml += `  </Inventory>\n`;

      xml += `  <SalesHistory total="${salesHistory.length}">\n`;
      salesHistory.forEach((s) => {
        xml += `    <Sale invoice="${s.invoiceNumber || ""}">\n      <Customer><![CDATA[${s.customerName || ""}]]></Customer>\n      <Date>${s.date || ""}</Date>\n      <Total>${s.total || 0}</Total>\n      <PaymentMode>${s.paymentMethod || ""}</PaymentMode>\n    </Sale>\n`;
      });
      xml += `  </SalesHistory>\n`;

      xml += `</RSFashionsShowroom>`;
      downloadFile(xml, `RSFashions_Export_${timestamp}.xml`, "application/xml;charset=utf-8");
      return { success: true, message: "XML structured ledger exported successfully." };
    } else if (format === "pdf") {
      return exportCategoryPdf("transactions", inventory, salesHistory, stockHistory);
    }
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to export data snapshot." };
  }

  return { success: false, message: "Unsupported export format" };
}

export type PdfReportCategory = "stock" | "sales" | "customers" | "transactions";

export function stripAdminUrls(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/https?:\/\/[^\s/]+(\/[a-z0-9_-]*admin[a-z0-9_-]*[^\s]*)/gi, "")
    .replace(/\/admin[a-z0-9/_-]*/gi, "")
    .replace(/[a-z0-9/_-]*control-center[a-z0-9/_-]*/gi, "")
    .replace(/[a-z0-9/_-]*secret-vault[a-z0-9/_-]*/gi, "")
    .replace(/https?:\/\/[^\s]+/gi, (url) => (url.toLowerCase().includes("admin") ? "" : url));
}

export function exportCategoryPdf(
  category: PdfReportCategory,
  inventory: Product[] = [],
  salesHistory: CompletedSale[] = [],
  stockHistory: StockMovement[] = [],
  customersList: any[] = []
): { success: boolean; message: string } {
  const timestamp = new Date().toISOString().slice(0, 10);
  const settings = loadSettings();
  const storeName = stripAdminUrls(settings.storeName || "RS Fashions");
  const storePhone = stripAdminUrls(settings.storePhone || "");
  const gstin = stripAdminUrls(settings.gstin || "");

  try {
    let title = "";
    let summaryHtml = "";
    let tableHeadersHtml = "";
    let tableRowsHtml = "";

    if (category === "stock") {
      title = `${storeName} • Showroom Stock & Inventory Ledger`;
      const totalUnits = (inventory as any[]).reduce((sum: number, p: any) => {
        const vStock = p.variants?.reduce((s: number, v: any) => s + (v.stock || 0), 0) ?? 0;
        return sum + (p.stock ?? vStock);
      }, 0);
      const totalAssetValue = (inventory as any[]).reduce((sum: number, p: any) => {
        const vStock = p.variants?.reduce((s: number, v: any) => s + (v.stock || 0), 0) ?? 0;
        const count = p.stock ?? vStock;
        return sum + (count * (p.salePrice || p.price || 0));
      }, 0);

      summaryHtml = `
        <div><strong>Catalog Styles:</strong> ${inventory.length}</div>
        <div><strong>Total Stock Pieces:</strong> ${totalUnits.toLocaleString("en-IN")} pcs</div>
        <div><strong>Total Inventory Value:</strong> ₹${totalAssetValue.toLocaleString("en-IN")}</div>
        <div><strong>Category:</strong> Saree Stock Audit</div>
      `;

      tableHeadersHtml = `
        <tr>
          <th>SKU</th>
          <th>Saree Design / Name</th>
          <th>Category</th>
          <th style="text-align: right;">Sale Price</th>
          <th style="text-align: right;">Stock Count</th>
          <th>Colors / Shades</th>
          <th>Status</th>
        </tr>
      `;

      tableRowsHtml = (inventory as any[])
        .map((p: any) => {
          const vStock = p.variants?.reduce((s: number, v: any) => s + (v.stock || 0), 0) ?? (p.stock || 0);
          const shades = p.variants && p.variants.length > 0
            ? p.variants.map((v: any) => v.color).filter(Boolean).join(", ")
            : (Array.isArray(p.colors) ? p.colors.join(", ") : "Standard");
          const status = vStock === 0 ? "Out of Stock" : vStock <= 2 ? "Low Stock" : "In Stock";
          return `
            <tr>
              <td><strong>${stripAdminUrls(p.sku || p.id)}</strong></td>
              <td>${stripAdminUrls(p.name)}</td>
              <td>${stripAdminUrls(p.category || p.categoryId || "SiCo Gadwal Sarees")}</td>
              <td style="text-align: right;">₹${(p.salePrice || p.price || 0).toLocaleString("en-IN")}</td>
              <td style="text-align: right; font-weight: bold;">${vStock}</td>
              <td style="font-size: 10px;">${stripAdminUrls(shades)}</td>
              <td>${status}</td>
            </tr>
          `;
        })
        .join("");
    } else if (category === "sales") {
      title = `${storeName} • Official Sales & Revenue Ledger`;
      const totalRevenue = salesHistory.reduce((sum, s) => sum + (s.total || 0), 0);
      const avgOrder = salesHistory.length > 0 ? Math.round(totalRevenue / salesHistory.length) : 0;

      summaryHtml = `
        <div><strong>Total Completed Invoices:</strong> ${salesHistory.length}</div>
        <div><strong>Gross Sales Turnover:</strong> ₹${totalRevenue.toLocaleString("en-IN")}</div>
        <div><strong>Average Order Value:</strong> ₹${avgOrder.toLocaleString("en-IN")}</div>
        <div><strong>Report Type:</strong> Statutory Sales Audit</div>
      `;

      tableHeadersHtml = `
        <tr>
          <th>Invoice #</th>
          <th>Date</th>
          <th>Customer Name</th>
          <th>Phone</th>
          <th>Billing Mode</th>
          <th>Payment Mode</th>
          <th style="text-align: right;">Total Amount</th>
        </tr>
      `;

      tableRowsHtml = salesHistory
        .map((s) => `
          <tr>
            <td><strong>${stripAdminUrls(s.invoiceNumber || "-")}</strong></td>
            <td>${s.date ? new Date(s.date).toLocaleDateString("en-IN") : "-"}</td>
            <td>${stripAdminUrls(s.customerName || "Showroom Walk-in")}</td>
            <td>${stripAdminUrls(s.customerPhone || "-")}</td>
            <td>${((s.billingType || (s as any).billing_type) ?? "retail").toUpperCase()}</td>
            <td>${stripAdminUrls((s.paymentMethod || "").toUpperCase())}</td>
            <td style="text-align: right; font-weight: bold;">₹${(s.total || 0).toLocaleString("en-IN")}</td>
          </tr>
        `)
        .join("") + `
          <tr class="total-row">
            <td colspan="6" style="text-align: right;">GRAND TOTAL TURNOVER:</td>
            <td style="text-align: right; color: #2A0E20;">₹${totalRevenue.toLocaleString("en-IN")}</td>
          </tr>
        `;
    } else if (category === "customers") {
      title = `${storeName} • Customer CRM Patron Directory`;

      // Build customer aggregation if customersList is empty
      let effectiveCustomers = customersList;
      if (!Array.isArray(effectiveCustomers) || effectiveCustomers.length === 0) {
        const cMap = new Map<string, any>();
        salesHistory.forEach((s) => {
          const phone = (s.customerPhone || "").trim();
          const name = (s.customerName || "").trim() || "Valued Patron";
          const key = phone || name;
          if (!key) return;
          if (!cMap.has(key)) {
            cMap.set(key, {
              name,
              phone: phone || "Not Provided",
              ordersCount: 0,
              totalSpend: 0,
              lastOrderDate: s.date,
            });
          }
          const c = cMap.get(key);
          c.ordersCount += 1;
          c.totalSpend += (s.total || 0);
        });
        effectiveCustomers = Array.from(cMap.values());
      }

      const totalPatrons = effectiveCustomers.length;
      const totalSpendAll = effectiveCustomers.reduce((sum, c) => sum + (Number(c.totalSpend || c.total_spend) || 0), 0);

      summaryHtml = `
        <div><strong>Registered Patrons:</strong> ${totalPatrons}</div>
        <div><strong>Cumulative Customer Spend:</strong> ₹${totalSpendAll.toLocaleString("en-IN")}</div>
        <div><strong>Report Type:</strong> Customer Relationship Ledger</div>
      `;

      tableHeadersHtml = `
        <tr>
          <th>Customer Name</th>
          <th>Phone Number</th>
          <th>Email / Notes</th>
          <th style="text-align: center;">Total Orders</th>
          <th style="text-align: right;">Lifetime Value</th>
          <th>Last Transaction</th>
        </tr>
      `;

      tableRowsHtml = effectiveCustomers
        .map((c) => `
          <tr>
            <td><strong>${stripAdminUrls(c.name || c.customer_name || "Customer")}</strong></td>
            <td>${stripAdminUrls(c.phone || c.customer_phone || "-")}</td>
            <td>${stripAdminUrls(c.email || c.notes || "-")}</td>
            <td style="text-align: center;">${c.ordersCount || c.order_count || c.total_orders || 1}</td>
            <td style="text-align: right; font-weight: bold;">₹${(Number(c.totalSpend || c.total_spend) || 0).toLocaleString("en-IN")}</td>
            <td>${c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString("en-IN") : "-"}</td>
          </tr>
        `)
        .join("");
    } else {
      // category === "transactions"
      title = `${storeName} • Payment & Settlement Ledger`;
      const totalRevenue = salesHistory.reduce((sum, s) => sum + (s.total || 0), 0);

      summaryHtml = `
        <div><strong>Total Invoices:</strong> ${salesHistory.length}</div>
        <div><strong>Recorded Payment Inflow:</strong> ₹${totalRevenue.toLocaleString("en-IN")}</div>
        <div><strong>Report Type:</strong> Payment Settlements &amp; Transactions</div>
      `;

      tableHeadersHtml = `
        <tr>
          <th>Invoice #</th>
          <th>Date</th>
          <th>Customer</th>
          <th>Billing Mode</th>
          <th>Payment Mode</th>
          <th style="text-align: right;">Amount (INR)</th>
        </tr>
      `;

      tableRowsHtml = salesHistory
        .map((s) => `
          <tr>
            <td><strong>${stripAdminUrls(s.invoiceNumber || "-")}</strong></td>
            <td>${s.date ? new Date(s.date).toLocaleDateString("en-IN") : "-"}</td>
            <td>${stripAdminUrls(s.customerName || "Counter Patron")}</td>
            <td>${((s.billingType || (s as any).billing_type) ?? "retail").toUpperCase()}</td>
            <td>${stripAdminUrls((s.paymentMethod || "").toUpperCase())}</td>
            <td style="text-align: right; font-weight: bold;">₹${(s.total || 0).toLocaleString("en-IN")}</td>
          </tr>
        `)
        .join("") + `
          <tr class="total-row">
            <td colspan="5" style="text-align: right;">TOTAL SETTLED VOLUME:</td>
            <td style="text-align: right; color: #2A0E20;">₹${totalRevenue.toLocaleString("en-IN")}</td>
          </tr>
        `;
    }

    const pdfHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${category.toUpperCase()}_REPORT_${timestamp}</title>
    <style>
      @page { size: A4 landscape; margin: 12mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 20px; color: #1c1917; background: #FFF; line-height: 1.4; }
      .header { border-bottom: 2px solid #2A0E20; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
      h1 { font-size: 20px; color: #2A0E20; margin: 0; font-family: Georgia, serif; font-weight: normal; }
      .subtitle { font-size: 11px; color: #78716c; margin-top: 4px; }
      .summary-box { background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; display: flex; flex-wrap: wrap; gap: 24px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
      th, td { border: 1px solid #e7e5e4; padding: 7px 9px; text-align: left; }
      th { background: #2A0E20; color: #FFF; font-weight: 600; text-transform: uppercase; font-size: 9.5px; letter-spacing: 0.05em; }
      tr:nth-child(even) { background: #fdfbf7; }
      .total-row { background: #f5f5f4 !important; font-weight: bold; }
      .footer { margin-top: 24px; font-size: 10px; color: #a8a29e; text-align: center; border-top: 1px solid #e7e5e4; padding-top: 10px; }
      @media print {
        body { padding: 0; }
        .no-print { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1>${title}</h1>
        <div class="subtitle">GSTIN: ${gstin || "Unregistered"} | Phone: ${storePhone || "Not Configured"}</div>
      </div>
      <div style="text-align: right; font-size: 11px; color: #57534e;">
        <strong>Export Date:</strong> ${new Date().toLocaleDateString("en-IN")}<br/>
        <strong>Category:</strong> ${category.toUpperCase()} REPORT
      </div>
    </div>

    <div class="summary-box">
      ${summaryHtml}
    </div>

    <table>
      <thead>
        ${tableHeadersHtml}
      </thead>
      <tbody>
        ${tableRowsHtml || '<tr><td colspan="7" style="text-align:center; padding: 20px;">No records available for this category</td></tr>'}
      </tbody>
    </table>

    <div class="footer">
      Generated automatically by ${storeName} Showroom Core &bull; Authentic Gadwal Handlooms &bull; Confidential Business Record
    </div>

    <script>
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 200);
      };
    </script>
  </body>
</html>`;

    const printWin = window.open("", "_blank", "width=960,height=720");
    if (printWin) {
      printWin.document.open();
      printWin.document.write(pdfHtml);
      printWin.document.close();
      return { success: true, message: `${category.toUpperCase()} PDF preview launched. Save as PDF from print dialog.` };
    } else {
      downloadFile(pdfHtml, `RSFashions_${category}_Report_${timestamp}.html`, "text/html;charset=utf-8");
      return { success: true, message: `${category.toUpperCase()} report HTML downloaded. Open and press Print / Save as PDF.` };
    }
  } catch (err: any) {
    return { success: false, message: err.message || `Failed to export ${category} report.` };
  }
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Runtime fallback exports for browser ESM compatibility
export const ShowroomSettings: any = undefined;
export const AppTheme: any = undefined;