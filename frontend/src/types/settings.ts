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
export function exportDatabaseBackup(
  format: "json" | "csv" | "xml" | "pdf",
  inventory: Product[],
  salesHistory: CompletedSale[],
  stockHistory: StockMovement[],
  devices: Device[]
) {
  const timestamp = new Date().toISOString().slice(0, 10);
  const settings = loadSettings();

  if (format === "json") {
    const data = {
      exportedAt: new Date().toISOString(),
      store: settings,
      inventory,
      salesHistory,
      stockHistory,
      devices,
    };
    downloadFile(JSON.stringify(data, null, 2), `RSFashions_Complete_Backup_${timestamp}.json`, "application/json");
  } else if (format === "csv") {
    let csv = "--- INVENTORY CATALOG ---\nSKU,Product Name,Category,Purchase Price,Sale Price,Total Stock\n";
    inventory.forEach((p) => {
      const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
      csv += `"${p.id}","${p.name}","${p.categoryId}",${p.purchasePrice},${p.salePrice},${totalStock}\n`;
    });

    csv += "\n\n--- TRANSACTION HISTORY ---\nInvoice No,Date,Customer Name,Phone,Billing Type,Total,Payment Mode\n";
    salesHistory.forEach((s) => {
      const bType = (s.billingType ?? "retail").toUpperCase();
      csv += `"${s.invoiceNumber}","${s.date}","${s.customerName}","${s.customerPhone}","${bType}",${s.total},"${s.paymentMethod}"\n`;
    });

    csv += "\n\n--- STOCK HISTORY AUDIT TRAIL ---\nDate,SKU,Product Name,Color,Type,Quantity,Reference\n";
    stockHistory.forEach((sh) => {
      csv += `"${sh.date}","${sh.sku}","${sh.productName}","${sh.color}","${sh.type}",${sh.quantity},"${sh.referenceNumber}"\n`;
    });

    downloadFile(csv, `RSFashions_Ledger_Export_${timestamp}.csv`, "text/csv");
  } else if (format === "xml") {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<RSFashionsShowroom>\n`;
    xml += `  <StoreName>${settings.storeName}</StoreName>\n`;
    
    xml += `  <Inventory>\n`;
    inventory.forEach((p) => {
      xml += `    <Product id="${p.id}"><Name>${p.name}</Name><Price>${p.salePrice}</Price></Product>\n`;
    });
    xml += `  </Inventory>\n`;

    xml += `  <SalesHistory>\n`;
    salesHistory.forEach((s) => {
      xml += `    <Sale invoice="${s.invoiceNumber}"><Customer>${s.customerName}</Customer><Total>${s.total}</Total></Sale>\n`;
    });
    xml += `  </SalesHistory>\n`;

    xml += `</RSFashionsShowroom>`;
    downloadFile(xml, `RSFashions_Export_${timestamp}.xml`, "application/xml");
  } else if (format === "pdf") {
    const salesRows = salesHistory
      .map(
        (s) => `
        <tr>
          <td>${s.invoiceNumber}</td>
          <td>${s.date}</td>
          <td>${s.customerName}</td>
          <td>${(s.billingType ?? "retail").toUpperCase()}</td>
          <td style="text-align: right;">₹${s.total.toLocaleString("en-IN")}</td>
        </tr>
      `
      )
      .join("");

    const pdfHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>RS_Fashions_Transaction_Ledger_${timestamp}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
            h1 { font-size: 20px; color: #2A0E20; margin-bottom: 2px; }
            p { font-size: 11px; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #2A0E20; color: #FFF; }
          </style>
        </head>
        <body>
          <h1>${settings.storeName} - Transaction Ledger</h1>
          <p>Generated on ${new Date().toLocaleString("en-IN")} | GSTIN: ${settings.gstin}</p>
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Type</th>
                <th style="text-align: right;">Total (INR)</th>
              </tr>
            </thead>
            <tbody>
              ${salesRows || '<tr><td colspan="5" style="text-align:center;">No transactions recorded</td></tr>'}
            </tbody>
          </table>
          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `;

    const printWin = window.open("", "_blank", "width=800,height=600");
    if (printWin) {
      printWin.document.open();
      printWin.document.write(pdfHtml);
      printWin.document.close();
    }
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