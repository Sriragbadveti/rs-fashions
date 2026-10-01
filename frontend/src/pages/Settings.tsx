import React, { useState, useEffect } from "react";
import {
  Store,
  Database,
  Save,
  Upload,
  FileSpreadsheet,
  FileCode,
  FileText,
  FileCheck,
  ReceiptIndianRupee,
  ShieldCheck,
  UserPlus,
  Trash2,
  KeyRound,
  Users,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import type { Device, Product, CompletedSale, StockMovement } from "../types/inventory";
import {
  loadSettings,
  saveSettingsToStorage,
  exportDatabaseBackup,
  exportCategoryPdf,
  type PdfReportCategory,
} from "../types/settings";
import type { ShowroomSettings } from "../types/settings";
import { useModal } from "../context/ModalContext";
import { API_BASE } from "../config/api";
import { adminFetch } from "../utils/adminSession";

interface SettingsProps {
  devices?: Device[];
  onRevokeDevice?: (id: string) => void;
  currentUser?: { name: string; email: string; role: string };
  inventory: Product[];
  salesHistory: CompletedSale[];
  stockHistory: StockMovement[];
  onRestoreInventory?: (importedProducts: Product[]) => void;
}

type SettingsSection = "store" | "billing" | "backup" | "admins";

interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  isPrimary?: boolean;
  createdAt?: string;
  lastLoginAt?: string | null;
  createdBy?: string;
}

function SectionHeader({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3.5 border-b border-stone-200/70 pb-4.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#2A0E20] text-brand-gold shadow-md shadow-[#2A0E20]/15">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-gold">
          {eyebrow}
        </p>
        <h3 className="mt-0.5 font-display text-lg font-medium text-stone-950">
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-stone-500">{description}</p>
      </div>
    </div>
  );
}

export default function SettingsView({
  devices = [],
  currentUser,
  inventory,
  salesHistory,
  stockHistory,
  onRestoreInventory,
}: SettingsProps) {
  const { toast } = useModal();
  const [activeSection, setActiveSection] = useState<SettingsSection>("store");

  const [settings, setSettings] = useState<ShowroomSettings>(loadSettings);

  const [storeName, setStoreName] = useState(settings.storeName);
  const [gstin, setGstin] = useState(settings.gstin);
  const [storeAddress, setStoreAddress] = useState(settings.storeAddress);
  const [storePhone, setStorePhone] = useState(settings.storePhone);
  const [storeEmail, setStoreEmail] = useState(settings.storeEmail || "");
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix);
  const [financialYear] = useState(settings.financialYear);
  const [defaultHsnCode, setDefaultHsnCode] = useState(settings.defaultHsnCode);
  const [weaverPoPrefix] = useState(settings.weaverPoPrefix);
  const [whatsappReceipts] = useState(settings.whatsappReceipts);

  // Admin Team Management State
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminActionError, setAdminActionError] = useState("");

  const loadAdminAccounts = () => {
    setLoadingAdmins(true);
    adminFetch(`${API_BASE}/admin/admins`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data?.admins) {
          setAdminAccounts(json.data.admins);
        }
      })
      .catch((err) => console.warn("Failed to load admins:", err))
      .finally(() => setLoadingAdmins(false));
  };

  useEffect(() => {
    if (activeSection === "admins") {
      loadAdminAccounts();
    }
  }, [activeSection]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminActionError("");

    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword) {
      setAdminActionError("All fields are required.");
      return;
    }
    if (newAdminPassword.length < 6) {
      setAdminActionError("Passkey must be at least 6 characters.");
      return;
    }

    setCreatingAdmin(true);
    try {
      const res = await adminFetch(`${API_BASE}/admin/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAdminName.trim(),
          email: newAdminEmail.trim().toLowerCase(),
          password: newAdminPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Failed to create administrator account.");
      }

      toast("Administrator Created", `Account for ${newAdminEmail} created successfully.`, "success");
      setNewAdminName("");
      setNewAdminEmail("");
      setNewAdminPassword("");
      setIsAddingAdmin(false);
      loadAdminAccounts();
    } catch (err: any) {
      setAdminActionError(err.message || "Failed to create administrator.");
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (id: string, email: string) => {
    if (!window.confirm(`Are you sure you want to remove administrator access for ${email}?`)) {
      return;
    }

    try {
      const res = await adminFetch(`${API_BASE}/admin/admins/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Failed to remove administrator.");
      }

      toast("Administrator Removed", `Access revoked for ${email}.`, "success");
      loadAdminAccounts();
    } catch (err: any) {
      toast("Error", err.message || "Could not remove administrator.", "error");
    }
  };

  useEffect(() => {
    adminFetch(`${API_BASE}/settings`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.settings && Object.keys(json.settings).length > 0) {
          const s = json.settings;
          setSettings((prev) => ({ ...prev, ...s }));
          if (s.storeName) setStoreName(s.storeName);
          if (s.gstin) setGstin(s.gstin);
          if (s.storeAddress) setStoreAddress(s.storeAddress);
          if (s.storePhone) setStorePhone(s.storePhone);
          if (s.storeEmail) setStoreEmail(s.storeEmail);
          if (s.invoicePrefix) setInvoicePrefix(s.invoicePrefix);
          if (s.defaultHsnCode) setDefaultHsnCode(s.defaultHsnCode);
        }
      })
      .catch((err) => console.warn("Load settings warning:", err));
  }, []);

  const persistChanges = (updatedFields: Partial<ShowroomSettings>) => {
    const newSettings = { ...settings, ...updatedFields };
    setSettings(newSettings);
    saveSettingsToStorage(newSettings);

    // Sync with backend API in Supabase
    Object.entries(updatedFields).forEach(([key, value]) => {
      adminFetch(`${API_BASE}/settings/${encodeURIComponent(key)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      }).catch((err) => console.warn("Sync setting error:", err));
    });

    toast("Settings Synchronized", "Showroom configuration updated successfully.", "success");
  };

  function handleSaveShowroom(e: React.FormEvent) {
    e.preventDefault();
    persistChanges({
      storeName,
      gstin,
      storeAddress,
      storePhone,
      storeEmail,
    });
  }

  function handleSaveBilling(e: React.FormEvent) {
    e.preventDefault();
    persistChanges({
      invoicePrefix,
      financialYear,
      defaultHsnCode,
      weaverPoPrefix,
      whatsappReceipts,
    });
  }

  function handleExportData(format: "json" | "csv" | "xml") {
    const result = exportDatabaseBackup(format, inventory, salesHistory, stockHistory, devices);
    if (result.success) {
      toast("Export Complete", result.message, "success");
    } else {
      toast("Export Error", result.message, "error");
    }
  }

  function handleExportCategoryPdf(category: PdfReportCategory) {
    const result = exportCategoryPdf(category, inventory, salesHistory, stockHistory);
    if (result.success) {
      toast("PDF Export Complete", result.message, "success");
    } else {
      toast("Export Error", result.message, "error");
    }
  }

  const navigationItems = [
    {
      id: "store" as const,
      label: "Showroom Identity",
      desc: "GSTIN, Trade Name & Location",
      icon: Store,
    },
    {
      id: "billing" as const,
      label: "Invoicing & Handloom Tax",
      desc: "Sequencing & HSN 5208 rules",
      icon: ReceiptIndianRupee,
    },
    {
      id: "backup" as const,
      label: "Snapshots & Cloud Sync",
      desc: "Multi-format backup & restore",
      icon: Database,
    },
    {
      id: "admins" as const,
      label: "Admin Accounts & Access",
      desc: "Multi-admin management & security",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 font-sans select-none text-stone-800">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-medium text-stone-950 tracking-tight">
            Store &amp; System Configuration
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage showroom identity, statutory invoicing policies, and multi-format ledger snapshots.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 items-start">
        {/* LEFT NAV PANEL */}
        <div className="md:col-span-4 space-y-1.5 md:sticky md:top-4">
          {navigationItems.map((item) => {
            const isActive = activeSection === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`group flex w-full items-center justify-between rounded-2xl p-3 text-left transition-all duration-200 ${
                  isActive
                    ? "bg-[#2A0E20] text-white shadow-md scale-[1.01]"
                    : "glass-panel text-stone-700 hover:bg-white hover:border-brand-gold/40"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`rounded-xl p-2 shrink-0 transition-colors ${
                      isActive
                        ? "bg-white/10 text-brand-gold"
                        : "bg-stone-100 text-stone-600 group-hover:bg-amber-50 group-hover:text-amber-900"
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${isActive ? "text-white" : "text-stone-900"}`}>
                      {item.label}
                    </p>
                    <p className={`text-[10px] truncate ${isActive ? "text-stone-300" : "text-stone-400"}`}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT CONTENT PANEL */}
        <div className="md:col-span-8">
          {/* SHOWROOM IDENTITY */}
          {activeSection === "store" && (
            <form onSubmit={handleSaveShowroom} className="glass-panel rounded-3xl p-6 space-y-4">
              <SectionHeader
                eyebrow="Commercial Registry"
                title="Showroom Legal & Brand Identity"
                description="Information appearing on printed tax invoices and GST filings."
                icon={<Store size={20} />}
              />
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 pt-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-stone-700">Trade &amp; Legal Entity Name</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700">Registered GSTIN</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full h-10 px-3 text-xs font-mono font-bold bg-white border border-stone-200 rounded-xl uppercase focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700">Boutique Phone</label>
                  <input
                    type="text"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-stone-700">Official Contact Email</label>
                  <input
                    type="email"
                    value={storeEmail}
                    onChange={(e) => setStoreEmail(e.target.value)}
                    placeholder="contact@rsfashions.com"
                    className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-stone-700">Showroom Physical Address</label>
                  <textarea
                    rows={2}
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    className="w-full p-3 text-xs bg-white border border-stone-200 rounded-xl resize-none focus:outline-none focus:border-brand-gold leading-relaxed"
                  />
                </div>
              </div>
              <div className="flex justify-end border-t border-stone-200/70 pt-4">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2A0E20] hover:bg-[#3D142E] text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Save size={14} className="text-brand-gold" />
                  <span>Update Showroom Details</span>
                </button>
              </div>
            </form>
          )}

          {/* INVOICING & HANDLOOM TAX */}
          {activeSection === "billing" && (
            <form onSubmit={handleSaveBilling} className="glass-panel rounded-3xl p-6 space-y-4">
              <SectionHeader
                eyebrow="Financial Sequencer"
                title="POS Invoicing & Handloom Tax Rules"
                description="Manage counter numbering formats, statutory HSN codes, and artisan PO prefixes."
                icon={<ReceiptIndianRupee size={20} />}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700">Invoice Series Prefix</label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-mono font-bold bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700">Default Saree HSN Code</label>
                  <input
                    type="text"
                    value={defaultHsnCode}
                    onChange={(e) => setDefaultHsnCode(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-mono bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>
              <div className="flex justify-end border-t border-stone-200/70 pt-4">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2A0E20] hover:bg-[#3D142E] text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Save size={14} className="text-brand-gold" />
                  <span>Save Invoicing Policy</span>
                </button>
              </div>
            </form>
          )}

          {/* SNAPSHOTS & CLOUD SYNC */}
          {activeSection === "backup" && (
            <div className="glass-panel rounded-3xl p-6 space-y-5">
              <SectionHeader
                eyebrow="Ledger Preservation"
                title="Data Snapshot &amp; Multi-Format Export"
                description="Export inventory, sales transactions, and stock history in JSON, CSV, XML, or PDF."
                icon={<Database size={20} />}
              />

              {/* PDF EXPORT SUITE - STRICTLY 4 CANONICAL CATEGORIES */}
              <div className="pt-3 border-t border-stone-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Showroom PDF Reports (Stock &bull; Sales &bull; Customers &bull; Transactions)
                  </h4>
                  <span className="text-[10px] text-stone-400 font-mono">Zero Admin URLs</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleExportCategoryPdf("stock")}
                    className="flex flex-col items-start gap-1 p-3.5 rounded-2xl border border-stone-200/80 bg-white hover:border-[#8E3D51] text-xs font-semibold text-stone-800 transition-all shadow-xs hover:shadow-sm active:scale-95 text-left"
                  >
                    <div className="flex items-center gap-1.5 text-[#8E3D51]">
                      <FileText size={15} />
                      <span className="font-bold">Stock PDF</span>
                    </div>
                    <span className="text-[10.5px] font-normal text-stone-500">Inventory counts, valuations &amp; variants</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportCategoryPdf("sales")}
                    className="flex flex-col items-start gap-1 p-3.5 rounded-2xl border border-stone-200/80 bg-white hover:border-emerald-600 text-xs font-semibold text-stone-800 transition-all shadow-xs hover:shadow-sm active:scale-95 text-left"
                  >
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <FileCheck size={15} />
                      <span className="font-bold">Sales PDF</span>
                    </div>
                    <span className="text-[10.5px] font-normal text-stone-500">Invoices, gross turnover &amp; revenue</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportCategoryPdf("customers")}
                    className="flex flex-col items-start gap-1 p-3.5 rounded-2xl border border-stone-200/80 bg-white hover:border-blue-600 text-xs font-semibold text-stone-800 transition-all shadow-xs hover:shadow-sm active:scale-95 text-left"
                  >
                    <div className="flex items-center gap-1.5 text-blue-700">
                      <FileSpreadsheet size={15} />
                      <span className="font-bold">Customers PDF</span>
                    </div>
                    <span className="text-[10.5px] font-normal text-stone-500">Patron directory, spend &amp; orders</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportCategoryPdf("transactions")}
                    className="flex flex-col items-start gap-1 p-3.5 rounded-2xl border border-stone-200/80 bg-white hover:border-purple-600 text-xs font-semibold text-stone-800 transition-all shadow-xs hover:shadow-sm active:scale-95 text-left"
                  >
                    <div className="flex items-center gap-1.5 text-purple-700">
                      <FileCode size={15} />
                      <span className="font-bold">Transactions PDF</span>
                    </div>
                    <span className="text-[10.5px] font-normal text-stone-500">Payment channels, modes &amp; audit</span>
                  </button>
                </div>
              </div>

              {/* RAW DATA BACKUPS */}
              <div className="pt-3 border-t border-stone-200/70 space-y-3">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Raw Data Backups (JSON / CSV / XML)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleExportData("json")}
                    className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-stone-200/80 bg-white hover:border-brand-gold text-xs font-semibold text-stone-800 transition-all shadow-xs active:scale-95"
                  >
                    <FileCode size={15} className="text-brand-gold" />
                    <span>Full JSON Backup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportData("csv")}
                    className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-stone-200/80 bg-white hover:border-brand-gold text-xs font-semibold text-stone-800 transition-all shadow-xs active:scale-95"
                  >
                    <FileSpreadsheet size={15} className="text-emerald-600" />
                    <span>CSV Spreadsheet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportData("xml")}
                    className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-stone-200/80 bg-white hover:border-brand-gold text-xs font-semibold text-stone-800 transition-all shadow-xs active:scale-95"
                  >
                    <FileText size={15} className="text-blue-600" />
                    <span>XML Ledger</span>
                  </button>
                </div>
              </div>

              {/* RESTORE FROM BACKUP */}
              <div className="pt-3 border-t border-stone-200/70 space-y-3">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Import Backup / Restore Data
                </h4>
                <div className="p-4 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50/50 text-center">
                  <input
                    type="file"
                    accept=".json"
                    id="import-file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const parsed = JSON.parse(event.target?.result as string);
                          if (parsed.inventory && onRestoreInventory) {
                            onRestoreInventory(parsed.inventory);
                            toast("Restore Successful", `Imported ${parsed.inventory.length} products from backup.`, "success");
                          } else {
                            toast("Invalid Format", "Backup file does not contain valid inventory records.", "error");
                          }
                        } catch {
                          toast("Import Failed", "Could not parse uploaded JSON backup file.", "error");
                        }
                      };
                      reader.readAsText(file);
                    }}
                  />
                  <label
                    htmlFor="import-file"
                    className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                  >
                    <Upload size={22} className="text-stone-400" />
                    <span className="text-xs font-semibold text-stone-700">Click to upload JSON backup file</span>
                    <span className="text-[10px] text-stone-400">Restores catalog records and inventory balances</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN TEAM & ACCESS CONTROL */}
          {activeSection === "admins" && (
            <div className="glass-panel rounded-3xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/70 pb-4.5">
                <SectionHeader
                  eyebrow="Access Control"
                  title="Administrator Accounts & Permissions"
                  description="Only explicitly authorized administrators can access this showroom console."
                  icon={<ShieldCheck size={20} />}
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingAdmin(!isAddingAdmin);
                    setAdminActionError("");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2A0E20] hover:bg-[#3D142E] text-amber-100 text-xs font-semibold shadow-xs transition-all active:scale-95 shrink-0 self-start sm:self-auto"
                >
                  <UserPlus size={14} className="text-[#D4A373]" />
                  <span>{isAddingAdmin ? "Cancel" : "Add Administrator"}</span>
                </button>
              </div>

              {/* Add Admin Form */}
              {isAddingAdmin && (
                <form
                  onSubmit={handleCreateAdmin}
                  className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-5 space-y-3.5 animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="flex items-center gap-2">
                    <KeyRound size={16} className="text-[#8E3D51]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                      Register New Administrator
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Srirag Badveti"
                        value={newAdminName}
                        onChange={(e) => setNewAdminName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-stone-200 focus:outline-none focus:border-[#8E3D51]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                        Corporate Email
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. srirag@rsfashions.in"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-stone-200 focus:outline-none focus:border-[#8E3D51]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                        Security Passkey (Min. 6 chars)
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-stone-200 focus:outline-none focus:border-[#8E3D51]"
                        required
                      />
                    </div>
                  </div>

                  {adminActionError && (
                    <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>{adminActionError}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingAdmin(false)}
                      className="px-3.5 py-1.5 text-xs text-stone-600 hover:text-stone-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingAdmin}
                      className="px-4 py-2 rounded-xl bg-[#2A0E20] hover:bg-[#3D142E] text-amber-100 text-xs font-bold shadow-xs flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {creatingAdmin ? (
                        <>
                          <Loader2 size={13} className="animate-spin text-[#D4A373]" />
                          <span>Creating…</span>
                        </>
                      ) : (
                        <span>Save Account</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Admin Accounts List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                  <span>Authorized Accounts ({adminAccounts.length})</span>
                  {loadingAdmins && <Loader2 size={13} className="animate-spin text-stone-400" />}
                </div>

                <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200/80 bg-white/70 overflow-hidden shadow-2xs">
                  {adminAccounts.map((admin) => {
                    const isSelf = currentUser?.email && admin.email.toLowerCase() === currentUser.email.toLowerCase();
                    return (
                      <div
                        key={admin.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/90 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#2A0E20] text-[#D4A373] font-serif font-bold text-sm flex items-center justify-center shrink-0">
                            {admin.name?.charAt(0)?.toUpperCase() || "A"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-stone-900">{admin.name}</h5>
                              {admin.isPrimary ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                                  Primary
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700">
                                  Admin
                                </span>
                              )}
                              {isSelf && (
                                <span className="text-[10px] text-emerald-600 font-semibold">(You)</span>
                              )}
                            </div>
                            <p className="text-xs text-stone-500 font-mono mt-0.5">{admin.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 sm:self-auto text-xs text-stone-500">
                          {admin.lastLoginAt ? (
                            <span className="text-[11px] text-stone-400">
                              Active: {new Date(admin.lastLoginAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                            </span>
                          ) : (
                            <span className="text-[11px] text-stone-400">No logins yet</span>
                          )}

                          {!admin.isPrimary && !isSelf && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                              title="Revoke administrator access"
                              className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
