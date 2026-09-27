import { useState, useEffect } from "react";
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
  storeName: "RS Fashions",
  gstin: "36AAAAA0000A1Z5",
  storeAddress: "Plot No. 42, Jubilee Hills Road No. 36, Hyderabad, Telangana 500033",
  storePhone: "+91 98765 43210",
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

const SETTINGS_STORAGE_KEY = "rs_fashions_showroom_settings";

export function loadSettings(): ShowroomSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
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

export function useShowroomSettings() {
  const [settings, setSettings] = useState<ShowroomSettings>(loadSettings);

  useEffect(() => {
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
      const salesRows = salesHistory
        .map(
          (s) => `
          <tr>
            <td>${s.invoiceNumber || "-"}</td>
            <td>${s.date ? new Date(s.date).toLocaleDateString("en-IN") : "-"}</td>
            <td>${s.customerName || "Counter Patron"}</td>
            <td>${((s.billingType || (s as any).billing_type) ?? "retail").toUpperCase()}</td>
            <td>${(s.paymentMethod || "").toUpperCase()}</td>
            <td style="text-align: right; font-weight: bold;">₹${(s.total || 0).toLocaleString("en-IN")}</td>
          </tr>
        `
        )
        .join("");

      const totalRevenue = salesHistory.reduce((sum, s) => sum + (s.total || 0), 0);

      const pdfHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>RS_Fashions_Transaction_Ledger_${timestamp}</title>
    <style>
      @page { size: A4 landscape; margin: 15mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 24px; color: #1c1917; background: #FFF; }
      .header { border-bottom: 2px solid #2A0E20; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
      h1 { font-size: 22px; color: #2A0E20; margin: 0; font-family: serif; }
      .subtitle { font-size: 11px; color: #78716c; margin-top: 4px; }
      .summary-box { background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 12px 16px; margin-bottom: 18px; font-size: 12px; display: flex; gap: 24px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
      th, td { border: 1px solid #e7e5e4; padding: 8px 10px; text-align: left; }
      th { background: #2A0E20; color: #FFF; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
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
        <h1>${settings.storeName || "RS Fashions"} &bull; Official Sales Ledger</h1>
        <div class="subtitle">GSTIN: ${settings.gstin || "Unregistered"} | Phone: ${settings.storePhone || "Not Configured"}</div>
      </div>
      <div style="text-align: right; font-size: 11px; color: #57534e;">
        <strong>Export Date:</strong> ${new Date().toLocaleDateString("en-IN")}<br/>
        <strong>Total Invoices:</strong> ${salesHistory.length}
      </div>
    </div>

    <div class="summary-box">
      <div><strong>Total Turnover:</strong> ₹${totalRevenue.toLocaleString("en-IN")}</div>
      <div><strong>Active Catalog Styles:</strong> ${inventory.length}</div>
      <div><strong>Snapshot Mode:</strong> Statutory Audit Ledger</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Invoice #</th>
          <th>Date</th>
          <th>Customer</th>
          <th>Billing Mode</th>
          <th>Payment Mode</th>
          <th style="text-align: right;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${salesRows || '<tr><td colspan="6" style="text-align:center; padding: 20px;">No sales transactions recorded yet</td></tr>'}
        <tr class="total-row">
          <td colspan="5" style="text-align: right;">GRAND TOTAL TURNOVER:</td>
          <td style="text-align: right; color: #2A0E20;">₹${totalRevenue.toLocaleString("en-IN")}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      Generated automatically by RS Fashions Showroom Core &bull; Authentic Gadwal Handlooms &bull; Confidential Business Record
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
        return { success: true, message: "PDF print preview launched. Save as PDF from your browser dialog." };
      } else {
        // Direct download of print-ready HTML document when popup blocker is active
        downloadFile(pdfHtml, `RSFashions_Transaction_Ledger_${timestamp}.html`, "text/html;charset=utf-8");
        return { success: true, message: "Ledger HTML document downloaded. Open and press Print / Save as PDF." };
      }
    }
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to export data snapshot." };
  }

  return { success: false, message: "Unsupported export format" };
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