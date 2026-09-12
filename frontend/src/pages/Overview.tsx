import { useMemo, useState } from "react";
import { TrendingUp, Package, Laptop, History, Store, Users, AlertTriangle, ReceiptIndianRupee, Truck, ChevronRight, Check, HelpCircle, PackagePlus } from "lucide-react";
import type { Product, CompletedSale, StockMovement, Device, DashboardTab } from "../types/inventory";

interface OverviewProps {
  salesHistory: CompletedSale[];
  inventory: Product[];
  devices: Device[];
  stockHistory: StockMovement[];
  onNavigateTab: (tab: DashboardTab) => void;
}

const ONBOARDING_STORAGE_KEY = "rs_onboarding_dismissed";

export default function Overview({
  salesHistory,
  inventory,
  devices,
  stockHistory,
  onNavigateTab,
}: OverviewProps) {
  const currency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  // Read saved completion state from sessionStorage so it resets on fresh logins/tabs, or can be toggled
  const [isOnboardingDismissed, setIsOnboardingDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
  });

  const dismissOnboarding = () => {
    sessionStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setIsOnboardingDismissed(true);
  };

  const restoreOnboarding = () => {
    sessionStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setIsOnboardingDismissed(false);
  };

  const totalStock = useMemo(() => {
    return inventory.reduce(
      (acc, p) => acc + p.variants.reduce((s, v) => s + v.stock, 0),
      0
    );
  }, [inventory]);

  const todaySales = useMemo(() => {
    const raw = salesHistory.reduce((acc, s) => acc + s.total, 0);
    return raw > 0 ? raw : 0;
  }, [salesHistory]);

  const lowStockItems = useMemo(() => {
    const list: { name: string; color: string; stock: number; sku: string }[] = [];
    inventory.forEach((p) => {
      p.variants.forEach((v) => {
        if (v.stock <= 2) {
          list.push({
            name: p.name,
            color: v.color,
            stock: v.stock,
            sku: v.sku,
          });
        }
      });
    });
    return list.slice(0, 4);
  }, [inventory]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans select-none pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-display font-medium text-stone-950 tracking-tight">
              Store Operations &amp; Overview
            </h1>
            {isOnboardingDismissed && (
              <button
                type="button"
                onClick={restoreOnboarding}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100/80 hover:bg-amber-200 px-2.5 py-1 rounded-full transition-all"
                title="Show Getting Started Guide"
              >
                <HelpCircle size={12} /> Show Setup Guide
              </button>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time showroom overview, setup milestones, and quick floor shortcuts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={() => onNavigateTab("bulk-stock" as DashboardTab)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-stone-200 hover:border-brand-gold text-stone-800 text-xs font-semibold shadow-sm transition-all"
          >
            <PackagePlus size={15} className="text-brand-gold" />
            <span>Bulk Stock Entry</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("billing")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2A0E20] hover:bg-[#3D142E] text-amber-100 text-xs font-semibold shadow-sm transition-all"
          >
            <ReceiptIndianRupee size={15} className="text-brand-gold" />
            <span>Launch Counter Billing</span>
          </button>
        </div>
      </div>

      {/* ONBOARDING CHECKLIST BANNER */}
      {!isOnboardingDismissed && (
        <div className="glass-panel p-6 rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/50 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#2A0E20] text-[#D4A373] flex items-center justify-center shadow-md shrink-0">
                <Store size={20} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-base text-stone-900">
                  Getting Started with RS Fashions
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Complete these initial showroom configurations to enable automated invoicing &amp; thermal printing.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={dismissOnboarding}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:border-stone-300 transition-all shadow-sm"
              >
                <Check size={13} className="text-emerald-600" />
                <span>Hide Guide</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* STEP 1 */}
            <div
              onClick={() => onNavigateTab("settings")}
              className="p-4 rounded-2xl bg-white/90 border border-stone-200/80 hover:border-brand-gold hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xs font-mono">
                    1
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold uppercase">Settings &rarr;</span>
                </div>
                <h4 className="text-xs font-bold text-stone-900 group-hover:text-brand-plum transition-colors">
                  Fill Showroom Identity &amp; Details
                </h4>
                <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                  Add your legal trade name, contact information, and registered showroom address.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-brand-plum">
                <span>Open Showroom Identity</span>
                <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* STEP 2 */}
            <div
              onClick={() => onNavigateTab("settings")}
              className="p-4 rounded-2xl bg-white/90 border border-stone-200/80 hover:border-brand-gold hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xs font-mono">
                    2
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold uppercase">Hardware &rarr;</span>
                </div>
                <h4 className="text-xs font-bold text-stone-900 group-hover:text-brand-plum transition-colors">
                  Pair Thermal Printer &amp; Peripherals
                </h4>
                <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                  Enable 58mm/80mm receipt printing and wireless barcode wands for fast checkout.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-brand-plum">
                <span>Configure Peripherals</span>
                <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* STEP 3 */}
            <div
              onClick={() => onNavigateTab("bulk-stock" as DashboardTab)}
              className="p-4 rounded-2xl bg-white/90 border border-stone-200/80 hover:border-brand-gold hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xs font-mono">
                    3
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold uppercase">Inventory &rarr;</span>
                </div>
                <h4 className="text-xs font-bold text-stone-900 group-hover:text-brand-plum transition-colors">
                  Stock Initial Gadwal Consignments
                </h4>
                <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                  Use Bulk Stock Entry to upload 50+ saree photos instantly and generate SKUs.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-brand-plum">
                <span>Open Bulk Stock Entry</span>
                <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CORE COUNTER TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[125px]">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
              Today's Gross Sales
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-stone-950">
              {currency(todaySales)}
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold">
              +{salesHistory.length} bills processed today
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[125px]">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
              Showroom Inventory
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-stone-950">
              {totalStock} Drapes
            </div>
            <span className="text-[11px] text-stone-400 font-medium">
              Live in-store stock count
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[125px]">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
              Active Terminals
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Laptop size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-stone-950">
              {devices.length} Online
            </div>
            <span className="text-[11px] text-stone-400 font-medium">
              Hardware tokens verified
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[125px]">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
              Stock Shift Events
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <History size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-stone-950">
              {stockHistory.length} Logs
            </div>
            <span className="text-[11px] text-stone-400 font-medium">
              Audit trail operational
            </span>
          </div>
        </div>
      </div>

      {/* LOWER SPLIT: LOW-STOCK ALERTS & FAST ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* REPLENISHMENT SPOTLIGHT (7 COLUMNS) */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-3xl space-y-3.5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600" />
              <h3 className="font-display font-semibold text-stone-900 text-sm">
                Attention Required: Low Drapery Stock
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("catalog")}
              className="text-xs font-semibold text-brand-plum hover:underline"
            >
              View Catalog &rarr;
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              All drapery stocks are currently well buffered.
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div
                  key={item.sku}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/80 border border-stone-200/80 hover:border-rose-200 transition-all"
                >
                  <div>
                    <p className="text-xs font-bold text-stone-900">{item.name}</p>
                    <p className="text-[10px] text-stone-400 font-mono">
                      Color: {item.color} &bull; {item.sku}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                      {item.stock} drape{item.stock === 1 ? "" : "s"} left
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigateTab("tracking")}
                      className="text-xs text-stone-500 hover:text-stone-900 font-medium"
                    >
                      Track Loom &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COUNTER SHORTCUTS (5 COLUMNS) */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-3xl space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-display font-semibold text-stone-900 text-sm">
                Floor Quick Actions
              </h3>
              <span className="text-[10px] font-mono text-stone-400">Ready</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => onNavigateTab("billing")}
                className="p-3.5 rounded-2xl bg-white border border-stone-200/80 hover:border-brand-gold hover:shadow-sm text-left transition-all"
              >
                <ReceiptIndianRupee size={18} className="text-emerald-700 mb-2" />
                <p className="text-xs font-bold text-stone-900">New Bill</p>
                <p className="text-[10px] text-stone-400">Instant counter checkout</p>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab("bulk-stock" as DashboardTab)}
                className="p-3.5 rounded-2xl bg-white border border-stone-200/80 hover:border-brand-gold hover:shadow-sm text-left transition-all"
              >
                <PackagePlus size={18} className="text-[#D4A373] mb-2" />
                <p className="text-xs font-bold text-stone-900">Bulk Stock</p>
                <p className="text-[10px] text-stone-400">Upload 50+ saree photos</p>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab("crm")}
                className="p-3.5 rounded-2xl bg-white border border-stone-200/80 hover:border-brand-gold hover:shadow-sm text-left transition-all"
              >
                <Users size={18} className="text-purple-700 mb-2" />
                <p className="text-xs font-bold text-stone-900">Client CRM</p>
                <p className="text-[10px] text-stone-400">WhatsApp blessings</p>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab("tracking")}
                className="p-3.5 rounded-2xl bg-white border border-stone-200/80 hover:border-brand-gold hover:shadow-sm text-left transition-all"
              >
                <Truck size={18} className="text-indigo-600 mb-2" />
                <p className="text-xs font-bold text-stone-900">Track Order</p>
                <p className="text-[10px] text-stone-400">Artisan shipments</p>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
            <span>Terminal: Jubilee Hills Main POS</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}