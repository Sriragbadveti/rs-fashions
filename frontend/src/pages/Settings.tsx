import React, { useState, useEffect } from "react";
import {
  Monitor,
  Tablet,
  Trash2,
  Store,
  Lock,
  Check,
  HardDrive,
  Copy,
  Database,
  Bell,
  KeyRound,
  Users,
  Printer,
  Save,
  Shield,
  Layers,
  Palette,
  Upload,
  FileSpreadsheet,
  FileCode,
  FileText,
  FileCheck,
  ReceiptIndianRupee,
} from "lucide-react";
import type { Device, Product, CompletedSale, StockMovement } from "../types/inventory";
import {
  loadSettings,
  saveSettingsToStorage,
  fetchRealClientIP,
  exportDatabaseBackup,
  applyTheme,
} from "../types/settings";
import type { ShowroomSettings, AppTheme } from "../types/settings";
import { useModal } from "../context/ModalContext";

interface SettingsProps {
  devices: Device[];
  onRevokeDevice: (id: string) => void;
  currentUser: { name: string; email: string; role: string };
  inventory: Product[];
  salesHistory: CompletedSale[];
  stockHistory: StockMovement[];
  onRestoreInventory?: (importedProducts: Product[]) => void;
}

type SettingsSection =
  | "devices"
  | "store"
  | "billing"
  | "security"
  | "users"
  | "backup"
  | "notifications"
  | "preferences"
  | "integrations"
  | "themes";

type ToggleProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
};

function LuxuryToggle({ checked, onChange, label, description, icon }: ToggleProps) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200/80 bg-white/80 p-3.5 transition-all duration-200 hover:border-brand-gold/50 hover:bg-white cursor-pointer select-none"
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-brand-gold border border-amber-200/60 shadow-sm">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-stone-900">{label}</p>
          {description && (
            <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">
              {description}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={(e) => {
          e.stopPropagation();
          onChange(!checked);
        }}
        className={`relative inline-flex h-6 w-11 shrink-0 p-0.5 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-gold/30 ${
          checked ? "bg-[#2A0E20]" : "bg-stone-300"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
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
  devices,
  onRevokeDevice,
  currentUser,
  inventory,
  salesHistory,
  stockHistory,
  onRestoreInventory,
}: SettingsProps) {
  const { confirm, toast } = useModal();
  const [activeSection, setActiveSection] = useState<SettingsSection>("devices");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [realIp, setRealIp] = useState<string>("Detecting IP...");

  const [settings, setSettings] = useState<ShowroomSettings>(loadSettings);

  const [storeName, setStoreName] = useState(settings.storeName);
  const [gstin, setGstin] = useState(settings.gstin);
  const [storeAddress, setStoreAddress] = useState(settings.storeAddress);
  const [storePhone, setStorePhone] = useState(settings.storePhone);
  const [storeEmail] = useState(settings.storeEmail);
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix);
  const [financialYear] = useState(settings.financialYear);
  const [defaultHsnCode, setDefaultHsnCode] = useState(settings.defaultHsnCode);
  const [weaverPoPrefix] = useState(settings.weaverPoPrefix);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(settings.twoFactorEnabled);
  const [lowStockAlerts, setLowStockAlerts] = useState(settings.lowStockAlerts);
  const [whatsappReceipts] = useState(settings.whatsappReceipts);
  const [thermalPrinter, setThermalPrinter] = useState(settings.thermalPrinter);
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>(settings.theme);

  const [users] = useState([
    {
      id: "usr-01",
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      status: "Active",
    },
    {
      id: "usr-02",
      name: "Counter Specialist",
      email: "billing@rsfashions.in",
      role: "Admin",
      status: "Active",
    },
  ]);

  useEffect(() => {
    fetchRealClientIP().then((ip) => setRealIp(ip));
    applyTheme(settings.theme);

    fetch("http://localhost:5001/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.settings && Object.keys(json.settings).length > 0) {
          const s = json.settings;
          setSettings((prev) => ({ ...prev, ...s }));
          if (s.storeName) setStoreName(s.storeName);
          if (s.gstin) setGstin(s.gstin);
          if (s.storeAddress) setStoreAddress(s.storeAddress);
          if (s.storePhone) setStorePhone(s.storePhone);
          if (s.invoicePrefix) setInvoicePrefix(s.invoicePrefix);
          if (s.defaultHsnCode) setDefaultHsnCode(s.defaultHsnCode);
          if (s.twoFactorEnabled !== undefined) setTwoFactorEnabled(Boolean(s.twoFactorEnabled));
          if (s.lowStockAlerts !== undefined) setLowStockAlerts(Boolean(s.lowStockAlerts));
          if (s.thermalPrinter !== undefined) setThermalPrinter(Boolean(s.thermalPrinter));
          if (s.theme) {
            setSelectedTheme(s.theme);
            applyTheme(s.theme);
          }
        }
      })
      .catch((err) => console.warn("Load settings warning:", err));
  }, [settings.theme]);

  const persistChanges = (updatedFields: Partial<ShowroomSettings>) => {
    const newSettings = { ...settings, ...updatedFields };
    setSettings(newSettings);
    saveSettingsToStorage(newSettings);
    applyTheme(newSettings.theme);

    // Sync with backend API in Supabase
    Object.entries(updatedFields).forEach(([key, value]) => {
      fetch(`http://localhost:5001/api/settings/${encodeURIComponent(key)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      }).catch((err) => console.warn("Sync setting error:", err));
    });

    toast("Settings Synchronized", "Showroom configuration updated successfully.", "success");
  };

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1800);
      toast("Copied to Clipboard", text, "info");
    });
  }

  async function handleRevokeTerminal(deviceId: string, deviceName: string) {
    const ok = await confirm({
      title: "Revoke Terminal Access?",
      message: `Are you sure you want to disconnect "${deviceName}"? It will be signed out immediately.`,
      confirmText: "Revoke Device",
      destructive: true,
    });
    if (ok) {
      onRevokeDevice(deviceId);
      toast("Terminal Revoked", `${deviceName} has been disconnected.`, "warning");
    }
  }

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

  const navigationItems = [
    { id: "devices" as const, label: "Authorized Terminals", desc: "POS, Surface & Mobile units", icon: Monitor, badge: devices.length },
    { id: "store" as const, label: "Showroom Identity", desc: "GSTIN, Trade Name & Location", icon: Store },
    { id: "billing" as const, label: "Invoicing & Handloom Tax", desc: "Sequencing & HSN 5208 rules", icon: ReceiptIndianRupee },
    { id: "security" as const, label: "Security & Vault Access", desc: "Lockouts & token controls", icon: Lock },
    { id: "users" as const, label: "Staff & User Roles", desc: "Admin permission model", icon: Users },
    { id: "themes" as const, label: "App Themes & Styling", desc: "Dark mode, peach & jade palettes", icon: Palette },
    { id: "backup" as const, label: "Snapshots & Cloud Sync", desc: "Multi-format backup & restore", icon: Database },
    { id: "notifications" as const, label: "Alerts & Milestones", desc: "Weaver & patron reminders", icon: Bell },
    { id: "integrations" as const, label: "Hardware & Peripherals", desc: "Thermal printers & scanners", icon: HardDrive },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 font-sans select-none text-stone-800">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-medium text-stone-950 tracking-tight">
            Store &amp; System Configuration
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage showroom identity, hardware terminals, security policies, and theme styling.
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
                    <p className="truncate text-xs font-semibold leading-tight">
                      {item.label}
                    </p>
                    <p
                      className={`mt-0.5 truncate text-[10px] ${
                        isActive ? "text-stone-300" : "text-stone-400"
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold ${
                      isActive
                        ? "bg-[#D4A373] text-[#2A0E20]"
                        : "bg-stone-200 text-stone-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* RIGHT CONTENT PANEL */}
        <div className="md:col-span-8">
          {/* TERMINALS */}
          {activeSection === "devices" && (
            <div className="space-y-4">
              <div className="glass-panel rounded-3xl p-6 space-y-4">
                <SectionHeader
                  eyebrow="Terminal Hardware Guard"
                  title="Authorized Showroom Terminals"
                  description="POS machines, inventory tablets, and mobile counters registered to this showroom."
                  icon={<Monitor size={20} />}
                />
                <div className="space-y-2.5 pt-1">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className={`rounded-2xl border p-4 transition-all ${
                        device.isCurrentDevice
                          ? "border-[#D4A373]/60 bg-amber-50/30 ring-1 ring-[#D4A373]/30"
                          : "border-stone-200/80 bg-white/70 hover:border-stone-300 hover:bg-white"
                      }`}
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`rounded-xl p-2.5 shrink-0 ${
                              device.isCurrentDevice
                                ? "bg-[#2A0E20] text-brand-gold"
                                : "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {device.platform === "windows" ? (
                              <Monitor size={18} />
                            ) : (
                              <Tablet size={18} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-semibold text-stone-900 truncate">
                                {device.name}
                              </h4>
                              {device.isCurrentDevice && (
                                <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.2 text-[9px] font-bold text-emerald-800 uppercase">
                                  Current Counter
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-[10px] text-stone-500 font-mono">
                              <span>IP: {device.isCurrentDevice ? realIp : device.ipAddress || "192.168.1.108"}</span>
                              <span>&bull;</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(device.uuid, device.id)}
                                className="flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5 hover:bg-stone-200 text-stone-700"
                              >
                                <span>{device.uuid}</span>
                                {copiedId === device.id ? (
                                  <Check size={10} className="text-emerald-600" />
                                ) : (
                                  <Copy size={10} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {!device.isCurrentDevice && (
                          <button
                            type="button"
                            onClick={() => handleRevokeTerminal(device.id, device.name)}
                            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 self-start sm:self-auto transition-colors"
                          >
                            <Trash2 size={13} />
                            <span>Revoke Access</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STORE IDENTITY */}
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

          {/* BILLING */}
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

          {/* SECURITY */}
          {activeSection === "security" && (
            <div className="glass-panel rounded-3xl p-6 space-y-4">
              <SectionHeader
                eyebrow="Access Protection"
                title="Counter Security &amp; Terminal Lockout"
                description="Prevent unauthorized terminal usage when billing counters are unattended."
                icon={<Shield size={20} />}
              />
              <div className="space-y-2.5 pt-2">
                <LuxuryToggle
                  checked={twoFactorEnabled}
                  onChange={(val) => {
                    setTwoFactorEnabled(val);
                    persistChanges({ twoFactorEnabled: val });
                  }}
                  label="Two-Factor Owner Authentication"
                  description="Require cryptographic token verification for superadmin role."
                  icon={<KeyRound size={16} />}
                />
              </div>
            </div>
          )}

          {/* STAFF & ROLES */}
          {activeSection === "users" && (
            <div className="space-y-4">
              <div className="glass-panel rounded-3xl p-6 space-y-4">
                <SectionHeader
                  eyebrow="Staff Authorization"
                  title="Showroom Staff &amp; Administrator Accounts"
                  description="Assign operator privileges for sales, catalogue editing, and stock inward."
                  icon={<Users size={20} />}
                />
                <div className="space-y-2.5 pt-1">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-stone-200/80 bg-white/80"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#2A0E20] text-amber-200 flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-stone-900">{u.name}</p>
                          <p className="text-[10px] text-stone-500">{u.email}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 uppercase">
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* THEMES & STYLING */}
          {activeSection === "themes" && (
            <div className="glass-panel rounded-3xl p-6 space-y-5">
              <SectionHeader
                eyebrow="Visual Customization"
                title="App Theme & Color Palettes"
                description="Switch between luxury light, dark midnight, warm peach, or emerald jade aesthetics."
                icon={<Palette size={20} />}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {[
                  { id: "light-luxury" as AppTheme, name: "Ivory Luxury (Default)", color: "bg-[#F6F4EE] border-stone-300 text-stone-900" },
                  { id: "dark-midnight" as AppTheme, name: "Midnight Dark Mode", color: "bg-[#0F0B10] border-purple-900 text-amber-100" },
                  { id: "peach-blush" as AppTheme, name: "Blush Peach Silk", color: "bg-[#FFF1EC] border-orange-200 text-orange-950" },
                  { id: "emerald-jade" as AppTheme, name: "Gadwal Jade Emerald", color: "bg-[#DCFCE7] border-emerald-300 text-emerald-950" },
                  { id: "royal-sapphire" as AppTheme, name: "Royal Sapphire Blue", color: "bg-[#DBEAFE] border-blue-300 text-blue-950" },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => {
                      setSelectedTheme(th.id);
                      persistChanges({ theme: th.id });
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      selectedTheme === th.id
                        ? "border-[#2A0E20] ring-2 ring-[#2A0E20]/20 shadow-md font-bold"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl border shadow-sm ${th.color}`} />
                      <span className="text-xs text-stone-900">{th.name}</span>
                    </div>
                    {selectedTheme === th.id && <Check size={16} className="text-[#2A0E20]" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SNAPSHOTS & BACKUP / EXPORTS */}
          {activeSection === "backup" && (
            <div className="glass-panel rounded-3xl p-6 space-y-5">
              <SectionHeader
                eyebrow="Ledger Preservation"
                title="Data Snapshot &amp; Multi-Format Export"
                description="Export inventory, sales transactions, and stock history in JSON, CSV, XML, or PDF."
                icon={<Database size={20} />}
              />

              <div className="pt-3 border-t border-stone-200/70 space-y-3">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Export Showroom Data (Includes Sales &amp; Stock Ledgers)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => exportDatabaseBackup("json", inventory, salesHistory, stockHistory, devices)}
                    className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-stone-200/80 bg-white hover:border-brand-gold text-xs font-semibold text-stone-800 transition-all shadow-sm"
                  >
                    <FileCode size={15} className="text-brand-gold" />
                    <span>Export Full JSON Backup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportDatabaseBackup("csv", inventory, salesHistory, stockHistory, devices)}
                    className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-stone-200/80 bg-white hover:border-brand-gold text-xs font-semibold text-stone-800 transition-all shadow-sm"
                  >
                    <FileSpreadsheet size={15} className="text-emerald-600" />
                    <span>Export CSV (Inventory + Sales)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportDatabaseBackup("xml", inventory, salesHistory, stockHistory, devices)}
                    className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-stone-200/80 bg-white hover:border-brand-gold text-xs font-semibold text-stone-800 transition-all shadow-sm"
                  >
                    <FileText size={15} className="text-blue-600" />
                    <span>Export XML Ledger</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportDatabaseBackup("pdf", inventory, salesHistory, stockHistory, devices)}
                    className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-stone-200/80 bg-white hover:border-brand-gold text-xs font-semibold text-stone-800 transition-all shadow-sm"
                  >
                    <FileCheck size={15} className="text-rose-600" />
                    <span>Export Transactions as PDF</span>
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

          {/* NOTIFICATIONS */}
          {activeSection === "notifications" && (
            <div className="glass-panel rounded-3xl p-6 space-y-4">
              <SectionHeader
                eyebrow="Real-Time Alerts"
                title="Counter &amp; Restock Notifications"
                description="Events triggering audible chimes and visual warnings on the POS terminal."
                icon={<Bell size={20} />}
              />
              <div className="space-y-2.5 pt-2">
                <LuxuryToggle
                  checked={lowStockAlerts}
                  onChange={(val) => {
                    setLowStockAlerts(val);
                    persistChanges({ lowStockAlerts: val });
                  }}
                  label="Low Saree Stock Warnings"
                  description="Alerts counter staff when a design variant drops below 2 drapes."
                  icon={<Layers size={16} />}
                />
              </div>
            </div>
          )}

          {/* HARDWARE */}
          {activeSection === "integrations" && (
            <div className="glass-panel rounded-3xl p-6 space-y-4">
              <SectionHeader
                eyebrow="Counter Peripherals"
                title="Hardware &amp; Receipt Printers"
                description="Thermal printers, USB barcode scanners, and counter hardware."
                icon={<HardDrive size={20} />}
              />
              <div className="space-y-2.5 pt-2">
                <LuxuryToggle
                  checked={thermalPrinter}
                  onChange={(val) => {
                    setThermalPrinter(val);
                    persistChanges({ thermalPrinter: val });
                  }}
                  label="Thermal Slip Printer (58mm / 80mm)"
                  description="Enables instant thermal docket printing upon invoice generation."
                  icon={<Printer size={16} />}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}