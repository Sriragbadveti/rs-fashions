import React, { useState } from "react";
import {
  Monitor,
  Store,
  Receipt,
  Lock,
  Check,
  Trash2,
  CreditCard,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";
import type { Device, UserSession } from "../../../types/dashboard";

interface SettingsViewProps {
  devices: Device[];
  onRevokeDevice: (id: string) => void;
  currentUser: UserSession;
}

type SettingsSection =
  | "devices"
  | "store"
  | "gateways"
  | "billing"
  | "security"
  | "users";

export const SettingsView: React.FC<SettingsViewProps> = ({
  devices,
  onRevokeDevice,
  currentUser,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>("gateways");
  const [savedBanner, setSavedBanner] = useState(false);

  // Store config
  const [storeName, setStoreName] = useState("RS Fashions");
  const [gstin, setGstin] = useState("36AAAAA0000A1Z5");
  const [storeAddress, setStoreAddress] = useState(
    "Plot No. 42, Jubilee Hills Road No. 36, Hyderabad, Telangana 500033"
  );
  const [storePhone, setStorePhone] = useState("+91 98765 43210");
  const [storeEmail, setStoreEmail] = useState("concierge@rsfashions.in");

  // Payment Gateways
  const [phonePeMerchantId, setPhonePeMerchantId] = useState("M234BFDRI0N1I_2609102233");
  const [phonePeSecret, setPhonePeSecret] = useState("NWY5NWQ4YzktZjQ0YS00MTMxLTg3ZTMtNmI3MTU2NzkwNzhl");
  const [razorpayKey, setRazorpayKey] = useState("rzp_test_TaPipYug8QFFpU");
  const [razorpaySecret, setRazorpaySecret] = useState("HQc35ZDRxjhdp9xrPqHEnayn");
  const [cloudinaryCloud, setCloudinaryCloud] = useState("rsfashions");
  const [cloudinaryPreset, setCloudinaryPreset] = useState("saree_vault_uploads");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4A373] mb-1">
            <Store size={14} />
            <span>Store Configuration &amp; Hardware</span>
          </div>
          <h1 className="text-3xl font-display font-medium text-stone-900 tracking-tight">
            Atelier Settings
          </h1>
          <p className="text-xs text-stone-500 max-w-xl mt-0.5">
            Configure PhonePe &amp; Razorpay payment gateways, Cloudinary storage, active POS hardware terminals, and GST parameters.
          </p>
        </div>

        {savedBanner && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-300 animate-in fade-in">
            <CheckCircle2 size={14} />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      {/* Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3 overflow-x-auto">
        {[
          { id: "gateways", label: "Payment Gateways & Cloud", icon: CreditCard },
          { id: "store", label: "Showroom Details", icon: Store },
          { id: "devices", label: "POS Hardware & Terminals", icon: Monitor },
          { id: "billing", label: "GST & Invoicing", icon: Receipt },
          { id: "security", label: "Security & Access", icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as SettingsSection)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                  : "bg-white/80 hover:bg-white text-stone-600 border border-stone-200/80"
              }`}
            >
              <Icon size={14} className={isActive ? "text-[#D4A373]" : "text-stone-400"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSave} className="glass-panel p-6 rounded-3xl space-y-6">
        {/* TAB 1: Payment Gateways & Cloud */}
        {activeSection === "gateways" && (
          <div className="space-y-5">
            <div>
              <h3 className="font-display font-semibold text-base text-stone-900">
                Payment Gateways &amp; Cloud Storage
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Manage test mode credentials for PhonePe, Razorpay, and Cloudinary Drag &amp; Drop media uploads.
              </p>
            </div>

            {/* PhonePe Config */}
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
                    Pe
                  </div>
                  <h4 className="font-bold text-xs text-purple-950">
                    PhonePe Payment Gateway (Test Mode)
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-purple-200/70 text-purple-900 font-mono text-[10px] font-bold">
                  ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-purple-900">
                    Merchant / Client ID
                  </label>
                  <input
                    type="text"
                    value={phonePeMerchantId}
                    onChange={(e) => setPhonePeMerchantId(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-purple-200 rounded-xl focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-purple-900">
                    Client Secret Key
                  </label>
                  <input
                    type="password"
                    value={phonePeSecret}
                    onChange={(e) => setPhonePeSecret(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-purple-200 rounded-xl focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Razorpay Config */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    Rzp
                  </div>
                  <h4 className="font-bold text-xs text-blue-950">
                    Razorpay Payment Gateway (Test Mode)
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-blue-200/70 text-blue-900 font-mono text-[10px] font-bold">
                  ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-blue-900">
                    Key ID
                  </label>
                  <input
                    type="text"
                    value={razorpayKey}
                    onChange={(e) => setRazorpayKey(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-blue-900">
                    Key Secret
                  </label>
                  <input
                    type="password"
                    value={razorpaySecret}
                    onChange={(e) => setRazorpaySecret(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Cloudinary Config */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#D4A373] text-stone-950 font-bold flex items-center justify-center text-xs">
                    <UploadCloud size={14} />
                  </div>
                  <h4 className="font-bold text-xs text-amber-950">
                    Cloudinary Drag &amp; Drop Image Host
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-amber-200/70 text-amber-950 font-mono text-[10px] font-bold">
                  AUTO-SYNC
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-stone-700">
                    Cloud Name
                  </label>
                  <input
                    type="text"
                    value={cloudinaryCloud}
                    onChange={(e) => setCloudinaryCloud(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-stone-700">
                    Upload Preset (Unsigned)
                  </label>
                  <input
                    type="text"
                    value={cloudinaryPreset}
                    onChange={(e) => setCloudinaryPreset(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Showroom Details */}
        {activeSection === "store" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display font-semibold text-base text-stone-900">
                Flagship Atelier Profile
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Official business details printed on customer GST tax invoices.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Legal Business Name
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-700">
                  GSTIN Registration Number
                </label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                Atelier Showroom Address
              </label>
              <textarea
                rows={2}
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className="w-full p-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Store Contact Number
                </label>
                <input
                  type="tel"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Official Email
                </label>
                <input
                  type="email"
                  value={storeEmail}
                  onChange={(e) => setStoreEmail(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: POS Hardware & Devices */}
        {activeSection === "devices" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display font-semibold text-base text-stone-900">
                Registered Terminals &amp; Counter Hardware
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Windows 11 and tablet POS instances synced with this inventory instance.
              </p>
            </div>

            <div className="space-y-3">
              {devices.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-2xl bg-white border border-stone-200/80 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                      <Monitor size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-xs text-stone-900">
                          {d.name}
                        </h4>
                        {d.isCurrentDevice && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                            THIS DEVICE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                        UUID: {d.uuid} &bull; IP: {d.ipAddress || "192.168.1.101"}
                      </p>
                    </div>
                  </div>

                  {!d.isCurrentDevice && (
                    <button
                      type="button"
                      onClick={() => onRevokeDevice(d.id)}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      <span>Revoke</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: GST & Billing */}
        {activeSection === "billing" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display font-semibold text-base text-stone-900">
                GST Tax Slabs &amp; Counter Rules
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Indian Handloom Saree GST slabs: 5% up to ₹1,000 and 12% above ₹1,000.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] font-bold uppercase text-stone-500 block">
                  Default Textile HSN Code
                </span>
                <span className="font-mono text-base font-bold text-stone-900 mt-1 block">
                  5208 (Woven Fabrics of Silk &amp; Cotton)
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] font-bold uppercase text-stone-500 block">
                  Invoice Number Prefix
                </span>
                <span className="font-mono text-base font-bold text-stone-900 mt-1 block">
                  INV- / RSF-
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Security */}
        {activeSection === "security" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display font-semibold text-base text-stone-900">
                Atelier Security &amp; Access Control
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Session controls, multi-factor verification, and audit trail encryption.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 text-xs text-emerald-950 flex items-center justify-between">
              <div>
                <span className="font-bold block">Current Active Session</span>
                <span className="text-stone-600 font-mono text-[11px]">
                  {currentUser.name} ({currentUser.email}) &bull; Role: {currentUser.role}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-mono text-[10px] font-bold">
                AUTHENTICATED
              </span>
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="pt-4 border-t border-stone-200 flex justify-end">
          <button
            type="submit"
            className="px-6 h-11 rounded-xl bg-[#2A0E20] text-amber-100 hover:bg-[#3d162f] text-xs font-semibold flex items-center gap-2 shadow-md transition-all"
          >
            <Check size={16} className="text-[#D4A373]" />
            <span>Save Settings &amp; Gateway Keys</span>
          </button>
        </div>
      </form>
    </div>
  );
};
