import { Bell, RefreshCw } from "lucide-react";
import type { DashboardTab } from "../../../types/dashboard";

interface AdminHeaderProps {
  activeTab: DashboardTab;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function AdminHeader({
  activeTab,
  onRefresh,
  isLoading,
}: AdminHeaderProps) {
  const tabTitles: Record<DashboardTab, string> = {
    overview: "Store Operations Overview",
    catalog: "Saree Catalog Vault",
    history: "Stock History Audit Trail",
    categories: "Weave Categories & HSN Tax",
    billing: "Counter Point-of-Sale",
    "sales-ledger": "Transaction History Ledger",
    analytics: "Store Analytics & Intelligence",
    crm: "Client & Patrons CRM",
    tracking: "Loom & Courier Tracking",
    "bulk-stock": "Bulk Stock Entry",
    "low-stock": "Low-Stock & Weaver POs",
    sale: "Sale & Promotional Offers",
    trending: "Trending Pieces Curation",
    settings: "Store & Terminal Settings",
  };

  return (
    <header className="h-16 px-8 flex items-center justify-between border-b border-white/50 glass-card shrink-0 select-none">
      <div className="flex items-center gap-2 text-xs text-stone-500">
        <span className="font-semibold text-stone-800">RS Fashions POS</span>
        <span>&bull;</span>
        <span className="capitalize text-stone-600 font-medium">
          {tabTitles[activeTab] || activeTab}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh Store Data"
            className="p-2 text-stone-600 hover:text-stone-900 glass-card rounded-xl transition-all"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-[#D4A373]" : ""} />
          </button>
        )}

        <div className="flex items-center gap-2 text-xs text-stone-600 font-medium bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Cloud Sync Active</span>
        </div>

        <button
          type="button"
          title="Notifications"
          className="p-2 text-stone-600 hover:text-stone-900 glass-card rounded-xl transition-all"
        >
          <Bell size={16} />
        </button>
      </div>
    </header>
  );
}
