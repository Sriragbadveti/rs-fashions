import React, { useState, useMemo } from "react";
import {
  ScrollText,
  Search,
  Printer,
  FileText,
  IndianRupee,
} from "lucide-react";
import type { CompletedSale } from "../../../types/dashboard";
import { InvoiceModal } from "../billing/InvoiceModal";

interface TransactionHistoryViewProps {
  salesHistory: CompletedSale[];
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({
  salesHistory,
}) => {
  const [search, setSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState<CompletedSale | null>(null);

  const currency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  const filteredSales = useMemo(() => {
    return salesHistory.filter((s) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        s.invoiceNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.customerPhone.includes(q) ||
        s.items.some((it) => it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q))
      );
    });
  }, [salesHistory, search]);

  const totalRevenue = salesHistory.reduce((acc, s) => acc + s.total, 0);
  const totalBills = salesHistory.length;

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4A373] mb-1">
            <ScrollText size={14} />
            <span>Sales &amp; Financial Ledger</span>
          </div>
          <h1 className="text-3xl font-display font-medium text-stone-900 tracking-tight">
            Transaction &amp; Invoice History
          </h1>
          <p className="text-xs text-stone-500 max-w-xl mt-0.5">
            Access previous customer bills, reprint official GST tax invoices, check payment method distributions and audit records.
          </p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Total Invoiced Revenue
            </span>
            <div className="text-2xl font-display font-semibold text-stone-900 mt-1">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">
              Across all counter sessions
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
            <IndianRupee size={20} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Bills Processed
            </span>
            <div className="text-2xl font-display font-semibold text-stone-900 mt-1">
              {totalBills}
            </div>
            <span className="text-[11px] text-stone-400">Total completed sales</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-[#D4A373] flex items-center justify-center border border-amber-200/60">
            <ScrollText size={20} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Average Order Value (AOV)
            </span>
            <div className="text-2xl font-display font-semibold text-stone-900 mt-1">
              ₹{totalBills > 0 ? Math.round(totalRevenue / totalBills).toLocaleString("en-IN") : "0"}
            </div>
            <span className="text-[11px] text-stone-400">Per customer invoice</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/60">
            <FileText size={20} />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice #, patron name, or phone..."
            className="w-full h-10 pl-10 pr-4 text-xs bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#D4A373]"
          />
        </div>
      </div>

      {/* Transaction Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-stone-200/80 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/80 border-b border-stone-200/80 text-stone-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Date &amp; Time</th>
                <th className="py-3.5 px-4">Patron Details</th>
                <th className="py-3.5 px-4">Items Billed</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4 text-right">Net Total</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/60 bg-white/70">
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <tr
                    key={sale.invoiceNumber}
                    className="hover:bg-amber-50/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900 whitespace-nowrap">
                      #{sale.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px] whitespace-nowrap">
                      {sale.date}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-900">{sale.customerName}</div>
                      <div className="font-mono text-[10px] text-stone-500">{sale.customerPhone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-stone-800 font-medium">
                        {sale.items.length} {sale.items.length === 1 ? "Drape" : "Drapes"}
                      </div>
                      <div className="text-[10px] text-stone-400 truncate max-w-xs">
                        {sale.items.map((i) => `${i.name} (${i.color})`).join(", ")}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full bg-stone-100 font-mono font-bold text-[10px] text-stone-800 uppercase tracking-wider">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-display font-bold text-sm text-[#2A0E20] whitespace-nowrap">
                      {currency(sale.total)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedSale(sale)}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-[#2A0E20] hover:text-amber-100 text-stone-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Printer size={12} />
                        <span>View Invoice</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    No sales transaction records found. Complete a bill at the counter to view entries here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InvoiceModal
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
      />
    </div>
  );
};
