import {
  LayoutDashboard,
  ShoppingBag,
  History,
  Layers,
  ReceiptIndianRupee,
  ScrollText,
  BarChart2,
  Users,
  Settings,
  Truck,
  Sparkles,
  LogOut,
} from "lucide-react";
import type { DashboardTab, UserSession } from "../../../types/dashboard";

interface AdminSidebarProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  user: UserSession;
  onLogout: () => void;
}

export function AdminSidebar({
  activeTab,
  setActiveTab,
  user,
  onLogout,
}: AdminSidebarProps) {
  return (
    <aside className="w-64 h-full glass-panel border-r border-white/60 flex flex-col justify-between p-4 z-20 overflow-y-auto shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-4 mb-3 border-b border-stone-200/50">
          <div className="w-9 h-9 rounded-xl bg-[#2A0E20] flex items-center justify-center text-[#D4A373] shadow-md shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="font-display font-semibold text-stone-900 leading-none">
              RS Fashions
            </h2>
            <span className="text-[11px] text-stone-500 font-light tracking-wide">
              SiCo Gadwal Sarees
            </span>
          </div>
        </div>

        <nav className="space-y-1">
          {/* 1. OVERVIEW */}
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "overview"
                ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
            }`}
          >
            <LayoutDashboard
              size={16}
              className={activeTab === "overview" ? "text-[#D4A373]" : "text-stone-400"}
            />
            <span>Overview</span>
          </button>

          {/* SECTION: INVENTORY */}
          <div className="pt-3 pb-1 px-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Inventory
            </span>
          </div>

          {/* 2. SAREE CATALOG */}
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "catalog"
                ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
            }`}
          >
            <ShoppingBag
              size={16}
              className={activeTab === "catalog" ? "text-[#D4A373]" : "text-stone-400"}
            />
            <span>Saree Catalog</span>
          </button>

          {/* 3. STOCK MOVEMENTS */}
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "history"
                ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
            }`}
          >
            <History
              size={16}
              className={activeTab === "history" ? "text-[#D4A373]" : "text-stone-400"}
            />
            <span>Stock History</span>
          </button>

          {/* 4. WEAVES & HSN */}
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "categories"
                ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
            }`}
          >
            <Layers
              size={16}
              className={activeTab === "categories" ? "text-[#D4A373]" : "text-stone-400"}
            />
            <span>Weaves &amp; HSN</span>
          </button>

          {/* SECTION: SALES & BILLING */}
          <div className="pt-3 pb-1 px-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Point of Sale
            </span>
          </div>

          {/* 5. COUNTER BILLING */}
          <button
            type="button"
            onClick={() => setActiveTab("billing")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "billing"
                ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
            }`}
          >
            <ReceiptIndianRupee
              size={16}
              className={activeTab === "billing" ? "text-[#D4A373]" : "text-stone-400"}
            />
            <span>Counter Billing</span>
          </button>

          {/* 6. TRANSACTION HISTORY */}
          <button
            type="button"
            onClick={() => setActiveTab("sales-ledger")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "sales-ledger"
                ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
            }`}
          >
            <ScrollText
              size={16}
              className={activeTab === "sales-ledger" ? "text-[#D4A373]" : "text-stone-400"}
            />
            <span>Transaction History</span>
          </button>

          {/* SECTION: BUSINESS INTELLIGENCE */}
          <div className="pt-3 pb-1 px-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Intelligence
            </span>
          </div>

          {/* 7. STORE ANALYTICS */}
          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "analytics"
                ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
            }`}
          >
            <BarChart2
              size={16}
              className={activeTab === "analytics" ? "text-[#D4A373]" : "text-stone-400"}
            />
            <span>Store Analytics</span>
          </button>

          {/* 8. CLIENT CRM */}
          <button
            type="button"
            onClick={() => setActiveTab("crm")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "crm"
                ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
            }`}
          >
            <Users
              size={16}
              className={activeTab === "crm" ? "text-[#D4A373]" : "text-stone-400"}
            />
            <span>Client CRM</span>
          </button>

          {/* SECTION: OPERATIONS & CONFIG */}
          <div className="pt-3 pb-1 px-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Operations
            </span>
          </div>

          {/* 9. ORDER & LOOM TRACKING */}
          <button
            type="button"
            onClick={() => setActiveTab("tracking")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "tracking"
                ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
            }`}
          >
            <Truck
              size={16}
              className={activeTab === "tracking" ? "text-[#D4A373]" : "text-stone-400"}
            />
            <span>Tracking</span>
          </button>

          {/* 10. SETTINGS */}
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "settings"
                ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
            }`}
          >
            <Settings
              size={16}
              className={activeTab === "settings" ? "text-[#D4A373]" : "text-stone-400"}
            />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* User Card & Logout Button */}
      <div className="pt-3 border-t border-stone-200/60 mt-4">
        <div className="flex items-center justify-between p-2 rounded-xl bg-stone-100/70 border border-stone-200/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#38152B] text-amber-200 flex items-center justify-center font-display font-medium text-xs shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-stone-800 truncate">{user.name}</p>
              <p className="text-[10px] text-stone-500 truncate">{user.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Logout session"
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
