import React, { useState, useMemo } from "react";
import {
  History,
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  AlertOctagon,
} from "lucide-react";
import type {
  StockMovement,
  DashboardProduct,
} from "../../../types/dashboard";
import { AddMovementModal } from "./AddMovementModal";

interface StockHistoryViewProps {
  history: StockMovement[];
  inventory: DashboardProduct[];
  onAddStockMovement: (movement: StockMovement) => void;
}

export const StockHistoryView: React.FC<StockHistoryViewProps> = ({
  history,
  inventory,
  onAddStockMovement,
}) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredHistory = useMemo(() => {
    return history.filter((m) => {
      if (typeFilter !== "ALL" && m.type !== typeFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return (
          m.productName.toLowerCase().includes(q) ||
          m.sku.toLowerCase().includes(q) ||
          m.referenceNumber.toLowerCase().includes(q) ||
          m.color.toLowerCase().includes(q) ||
          (m.note && m.note.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [history, typeFilter, search]);

  const totalRestocked = history
    .filter((m) => m.type === "RESTOCK")
    .reduce((acc, m) => acc + m.quantity, 0);

  const totalSold = history
    .filter((m) => m.type === "SALE")
    .reduce((acc, m) => acc + Math.abs(m.quantity), 0);

  const totalDamaged = history
    .filter((m) => m.type === "DAMAGE")
    .reduce((acc, m) => acc + Math.abs(m.quantity), 0);

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4A373] mb-1">
            <History size={14} />
            <span>Immutable Audit Trail</span>
          </div>
          <h1 className="text-3xl font-display font-medium text-stone-900 tracking-tight">
            Inventory Stock Shifts
          </h1>
          <p className="text-xs text-stone-500 max-w-xl mt-0.5">
            Trace every saree restock, counter sale, showroom damage, and inventory realignment with timestamped references.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="h-10 px-5 rounded-xl bg-[#2A0E20] hover:bg-[#3d162f] text-amber-100 text-xs font-semibold flex items-center gap-2 shadow-md transition-all self-start md:self-auto"
        >
          <Plus size={16} className="text-[#D4A373]" />
          <span>Record Stock Shift</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Total Restocked Drapes
            </span>
            <div className="text-2xl font-display font-semibold text-emerald-700 mt-1">
              +{totalRestocked}
            </div>
            <span className="text-[11px] text-stone-400">Inward consignments</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shadow-xs">
            <ArrowDownLeft size={20} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Total Counter Sales
            </span>
            <div className="text-2xl font-display font-semibold text-stone-900 mt-1">
              -{totalSold}
            </div>
            <span className="text-[11px] text-stone-400">Outward bills</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-[#D4A373] flex items-center justify-center border border-amber-200/60 shadow-xs">
            <ArrowUpRight size={20} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Damaged / Set Aside
            </span>
            <div className="text-2xl font-display font-semibold text-rose-700 mt-1">
              -{totalDamaged}
            </div>
            <span className="text-[11px] text-stone-400">Quality exclusions</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/60 shadow-xs">
            <AlertOctagon size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU, saree name, or PO#..."
            className="w-full h-10 pl-10 pr-4 text-xs bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#D4A373]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {["ALL", "RESTOCK", "SALE", "DAMAGE", "ADJUSTMENT"].map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                typeFilter === f
                  ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                  : "bg-stone-100/80 text-stone-600 hover:bg-stone-200/80"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-stone-200/80 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/80 border-b border-stone-200/80 text-stone-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Date &amp; Time</th>
                <th className="py-3.5 px-4">SKU / Saree Details</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4 text-right">Shift Qty</th>
                <th className="py-3.5 px-4 text-right">Balance</th>
                <th className="py-3.5 px-4">Reference</th>
                <th className="py-3.5 px-4">Logged By</th>
                <th className="py-3.5 px-4">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/60 bg-white/70">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((m) => {
                  const isRestock = m.type === "RESTOCK";
                  const isSale = m.type === "SALE";
                  const isDamage = m.type === "DAMAGE";

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-amber-50/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px] whitespace-nowrap">
                        {m.date}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900">
                          {m.productName}
                        </div>
                        <div className="font-mono text-[10px] text-stone-500">
                          {m.sku} &bull; <span className="font-sans font-medium">{m.color}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isRestock
                              ? "bg-emerald-100 text-emerald-800"
                              : isSale
                              ? "bg-blue-100 text-blue-800"
                              : isDamage
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            m.quantity > 0
                              ? "text-emerald-700"
                              : "text-rose-700"
                          }
                        >
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-stone-700 whitespace-nowrap">
                        <span className="text-stone-400">{m.previousStock}</span> &rarr;{" "}
                        <span className="font-bold text-stone-900">{m.newStock}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                        {m.referenceNumber}
                      </td>
                      <td className="py-3.5 px-4 text-stone-700 text-xs whitespace-nowrap">
                        {m.performedBy}
                      </td>
                      <td className="py-3.5 px-4 text-stone-500 text-[11px] max-w-xs truncate">
                        {m.note || "-"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    No stock movement events recorded matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddMovementModal
        isOpen={isModalOpen}
        inventory={inventory}
        onClose={() => setIsModalOpen(false)}
        onSave={onAddStockMovement}
      />
    </div>
  );
};
