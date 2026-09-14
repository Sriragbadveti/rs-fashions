import { useMemo, useState } from "react";
import {
  TrendingUp,
  Package,
  Laptop,
  History,
  Store,
  Users,
  AlertTriangle,
  ReceiptIndianRupee,
  Truck,
  ChevronRight,
  Check,
  HelpCircle,
  PackagePlus,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
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
      (acc, p) => acc + (p.variants || []).reduce((s, v) => s + (v.stock || 0), 0),
      0
    );
  }, [inventory]);

  const todaySales = useMemo(() => {
    return salesHistory.reduce((acc, s) => acc + (s.total || 0), 0);
  }, [salesHistory]);

  const lowStockItems = useMemo(() => {
    const list: { name: string; color: string; stock: number; sku: string }[] = [];
    inventory.forEach((p) => {
      (p.variants || []).forEach((v) => {
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
    <div className="space-y-7 max-w-7xl mx-auto font-sans select-none pb-16">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-stone-200/50 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            {isOnboardingDismissed && (
              <button
                type="button"
                onClick={restoreOnboarding}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100/90 hover:bg-amber-200/90 px-2.5 py-0.5 rounded-full border border-amber-300/60 transition-all active:scale-95 shadow-2xs"
                title="Show Setup Guide"
              >
                <HelpCircle size={11} />
                <span>Show Setup Guide</span>
              </button>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-stone-950 tracking-tight mt-1">
            Operations &amp; Floor Overview
          </h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            Real-time showroom telemetry, sales summaries, and quick floor operations.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => onNavigateTab("bulk-stock" as DashboardTab)}
            className="group flex h-10 items-center gap-2 px-4 rounded-xl bg-white/80 hover:bg-white border border-stone-200/80 hover:border-[#D4A373] text-stone-800 text-xs font-semibold shadow-2xs transition-all active:scale-95"
          >
            <PackagePlus size={15} className="text-[#D4A373] transition-transform duration-200 group-hover:scale-110" />
            <span>Bulk Stock Entry</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("billing")}
            className="group flex h-10 items-center gap-2 px-5 rounded-xl bg-[#2A0E20] hover:bg-[#3D142E] text-amber-100 text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <ReceiptIndianRupee size={15} className="text-[#D4A373] transition-transform duration-200 group-hover:scale-110" />
            <span>Launch Billing Counter</span>
            <ArrowUpRight size={13} className="text-amber-200/70 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>

      {/* ONBOARDING CHECKLIST BANNER */}
      {!isOnboardingDismissed && (
        <div className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 p-6 shadow-[0_8px_30px_rgba(212,163,115,0.08)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#2A0E20] text-[#D4A373] flex items-center justify-center shadow-xs shrink-0">
                <Store size={22} />
              </div>
              <div>
                <h2 className="font-serif text-base sm:text-lg font-bold text-stone-900 leading-snug">
                  Showroom Setup Milestones
                </h2>
                <p className="text-xs text-stone-600 font-light mt-0.5">
                  Complete these initial showroom configurations to enable automated billing &amp; thermal receipt printing.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={dismissOnboarding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:border-stone-300 transition-all shadow-2xs self-start sm:self-auto"
            >
              <Check size={13} className="text-emerald-600" />
              <span>Dismiss Guide</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* STEP 1 */}
            <div
              onClick={() => onNavigateTab("settings")}
              className="group p-4 rounded-2xl bg-white/90 border border-stone-200/80 hover:border-[#D4A373] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center font-bold text-xs font-mono">
                    1
                  </span>
                  <span className="text-[10px] text-[#8E3D51] font-bold uppercase tracking-wider group-hover:underline">
                    Settings &rarr;
                  </span>
                </div>
                <h3 className="text-xs font-bold text-stone-900 group-hover:text-[#8E3D51] transition-colors">
                  Showroom Identity &amp; Taxes
                </h3>
                <p className="text-[11px] text-stone-500 font-light mt-1 leading-relaxed">
                  Enter legal trade name, phone numbers, and physical showroom address for invoices.
                </p>
              </div>
              <div className="mt-3.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] font-semibold text-[#8E3D51]">
                <span>Configure Identity</span>
                <ChevronRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>

            {/* STEP 2 */}
            <div
              onClick={() => onNavigateTab("settings")}
              className="group p-4 rounded-2xl bg-white/90 border border-stone-200/80 hover:border-[#D4A373] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center font-bold text-xs font-mono">
                    2
                  </span>
                  <span className="text-[10px] text-[#8E3D51] font-bold uppercase tracking-wider group-hover:underline">
                    Hardware &rarr;
                  </span>
                </div>
                <h3 className="text-xs font-bold text-stone-900 group-hover:text-[#8E3D51] transition-colors">
                  Printers &amp; POS Peripherals
                </h3>
                <p className="text-[11px] text-stone-500 font-light mt-1 leading-relaxed">
                  Pair 58mm/80mm thermal receipt printers and barcode wands for fast checkout.
                </p>
              </div>
              <div className="mt-3.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] font-semibold text-[#8E3D51]">
                <span>Pair Devices</span>
                <ChevronRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>

            {/* STEP 3 */}
            <div
              onClick={() => onNavigateTab("bulk-stock" as DashboardTab)}
              className="group p-4 rounded-2xl bg-white/90 border border-stone-200/80 hover:border-[#D4A373] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center font-bold text-xs font-mono">
                    3
                  </span>
                  <span className="text-[10px] text-[#8E3D51] font-bold uppercase tracking-wider group-hover:underline">
                    Stock &rarr;
                  </span>
                </div>
                <h3 className="text-xs font-bold text-stone-900 group-hover:text-[#8E3D51] transition-colors">
                  Stock Gadwal Consignments
                </h3>
                <p className="text-[11px] text-stone-500 font-light mt-1 leading-relaxed">
                  Upload multiple saree photos at once, assign color codes, and generate SKUs instantly.
                </p>
              </div>
              <div className="mt-3.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] font-semibold text-[#8E3D51]">
                <span>Begin Consignment Intake</span>
                <ChevronRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CORE COUNTER METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Sales */}
        <div className="rounded-3xl border border-white/80 bg-white/70 backdrop-blur-xl p-5 shadow-[0_6px_25px_rgba(42,14,32,0.03)] flex flex-col justify-between min-h-[135px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
              Today's Gross Sales
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-2xs">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-stone-950 tracking-tight">
              {currency(todaySales)}
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              +{salesHistory.length} bills processed today
            </p>
          </div>
        </div>

        {/* Metric 2: Stock */}
        <div className="rounded-3xl border border-white/80 bg-white/70 backdrop-blur-xl p-5 shadow-[0_6px_25px_rgba(42,14,32,0.03)] flex flex-col justify-between min-h-[135px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
              Live Showroom Stock
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shadow-2xs">
              <Package size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-stone-950 tracking-tight">
              {totalStock} <span className="text-base font-sans font-normal text-stone-500">Drapes</span>
            </div>
            <p className="text-[11px] text-stone-400 font-medium mt-0.5">
              Across all registered color variants
            </p>
          </div>
        </div>

        {/* Metric 3: Terminals */}
        <div className="rounded-3xl border border-white/80 bg-white/70 backdrop-blur-xl p-5 shadow-[0_6px_25px_rgba(42,14,32,0.03)] flex flex-col justify-between min-h-[135px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
              Active POS Terminals
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shadow-2xs">
              <Laptop size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-stone-950 tracking-tight">
              {devices.length} <span className="text-base font-sans font-normal text-stone-500">Online</span>
            </div>
            <p className="text-[11px] text-stone-400 font-medium mt-0.5">
              Secure hardware tokens verified
            </p>
          </div>
        </div>

        {/* Metric 4: Stock Movement Logs */}
        <div className="rounded-3xl border border-white/80 bg-white/70 backdrop-blur-xl p-5 shadow-[0_6px_25px_rgba(42,14,32,0.03)] flex flex-col justify-between min-h-[135px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
              Movement Audit Logs
            </span>
            <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shadow-2xs">
              <History size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-stone-950 tracking-tight">
              {stockHistory.length} <span className="text-base font-sans font-normal text-stone-500">Logs</span>
            </div>
            <p className="text-[11px] text-stone-400 font-medium mt-0.5">
              Consignment &amp; sale audit trail active
            </p>
          </div>
        </div>
      </div>

      {/* LOWER SPLIT: LOW STOCK SPOTLIGHT & QUICK FLOOR ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* REPLENISHMENT SPOTLIGHT (7 COLUMNS) */}
        <div className="lg:col-span-7 rounded-3xl border border-white/80 bg-white/70 backdrop-blur-xl p-6 shadow-[0_6px_25px_rgba(42,14,32,0.03)] space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200/50 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle size={15} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-sm">
                  Low Stock Attention Items
                </h3>
                <p className="text-[10.5px] text-stone-400">Shades with 2 or fewer drapes remaining</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("catalog")}
              className="text-xs font-semibold text-[#8E3D51] hover:underline"
            >
              View Inventory &rarr;
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400 font-light">
              All drapery stocks are currently well stocked.
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockItems.map((item) => (
                <div
                  key={item.sku}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/90 border border-stone-200/80 hover:border-rose-200 transition-all"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-stone-400 font-mono truncate mt-0.5">
                      Shade: <span className="font-semibold text-stone-700">{item.color}</span> &bull; {item.sku}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200/70">
                      {item.stock} {item.stock === 1 ? "drape" : "drapes"} left
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigateTab("tracking")}
                      className="text-xs font-semibold text-stone-500 hover:text-[#8E3D51] transition-colors"
                    >
                      Track &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QUICK FLOOR ACTIONS (5 COLUMNS) */}
        <div className="lg:col-span-5 rounded-3xl border border-white/80 bg-white/70 backdrop-blur-xl p-6 shadow-[0_6px_25px_rgba(42,14,32,0.03)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-stone-200/50 pb-3.5">
              <h3 className="font-serif font-bold text-stone-900 text-sm">
                Floor Quick Actions
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 font-semibold">
                Ready
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => onNavigateTab("billing")}
                className="p-4 rounded-2xl bg-white border border-stone-200/80 hover:border-[#D4A373] hover:shadow-xs text-left transition-all group"
              >
                <ReceiptIndianRupee size={18} className="text-emerald-700 mb-2 transition-transform duration-200 group-hover:scale-110" />
                <p className="text-xs font-bold text-stone-900">New Bill</p>
                <p className="text-[10px] text-stone-400 mt-0.5">Quick counter checkout</p>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab("bulk-stock" as DashboardTab)}
                className="p-4 rounded-2xl bg-white border border-stone-200/80 hover:border-[#D4A373] hover:shadow-xs text-left transition-all group"
              >
                <PackagePlus size={18} className="text-[#D4A373] mb-2 transition-transform duration-200 group-hover:scale-110" />
                <p className="text-xs font-bold text-stone-900">Bulk Stock</p>
                <p className="text-[10px] text-stone-400 mt-0.5">Upload 50+ saree photos</p>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab("crm")}
                className="p-4 rounded-2xl bg-white border border-stone-200/80 hover:border-[#D4A373] hover:shadow-xs text-left transition-all group"
              >
                <Users size={18} className="text-purple-700 mb-2 transition-transform duration-200 group-hover:scale-110" />
                <p className="text-xs font-bold text-stone-900">Patron CRM</p>
                <p className="text-[10px] text-stone-400 mt-0.5">Client profiles &amp; history</p>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab("tracking")}
                className="p-4 rounded-2xl bg-white border border-stone-200/80 hover:border-[#D4A373] hover:shadow-xs text-left transition-all group"
              >
                <Truck size={18} className="text-indigo-600 mb-2 transition-transform duration-200 group-hover:scale-110" />
                <p className="text-xs font-bold text-stone-900">Track Orders</p>
                <p className="text-[10px] text-stone-400 mt-0.5">Shipments &amp; AWB updates</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}