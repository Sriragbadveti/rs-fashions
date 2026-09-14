import React, { useState, useMemo, useEffect } from "react";
import {
  Truck,
  Search,
  Plus,
  Share2,
  CheckCircle2,
  Clock,
  PackageCheck,
} from "lucide-react";
import type {
  TrackedOrder,
} from "../../../types/dashboard";
import { AddTrackingModal } from "./AddTrackingModal";

interface TrackOrderViewProps {
  orders?: TrackedOrder[];
  onAddTrackedOrder?: (order: TrackedOrder) => void;
}

export const TrackOrderView: React.FC<TrackOrderViewProps> = ({
  orders: initialOrders = [],
  onAddTrackedOrder,
}) => {
  const [orders, setOrders] = useState<TrackedOrder[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<TrackedOrder | null>(
    initialOrders[0] || null
  );

  useEffect(() => {
    setOrders(initialOrders);
    if (!selectedOrder && initialOrders.length > 0) {
      setSelectedOrder(initialOrders[0]);
    } else if (selectedOrder && !initialOrders.some(o => o.id === selectedOrder.id)) {
      setSelectedOrder(initialOrders[0] || null);
    }
  }, [initialOrders]);

  const currency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (directionFilter !== "ALL" && o.direction !== directionFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return (
          o.trackingNumber.toLowerCase().includes(q) ||
          o.title.toLowerCase().includes(q) ||
          o.partyName.toLowerCase().includes(q) ||
          o.partyContact.includes(q) ||
          o.skuList.some((s) => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [orders, directionFilter, search]);

  const handleShareTrackingWhatsApp = (order: TrackedOrder) => {
    const phone = order.partyContact.replace(/[^0-9]/g, "");
    const text = encodeURIComponent(
      `Namaste ${order.partyName},\n\nYour RS Fashions SiCo Gadwal consignment "${order.title}" (Tracking: ${order.trackingNumber}) is currently "${order.currentStage.replace(/_/g, " ")}".\n\nPartner: ${order.courierOrLoomPartner}\nEstimated Delivery: ${order.estimatedCompletion}\n\nTrack your silk saree with RS Fashions!`
    );
    window.open(`https://api.whatsapp.com/send?phone=91${phone}&text=${text}`, "_blank");
  };

  const handleSaveOrder = (newOrder: TrackedOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
    setSelectedOrder(newOrder);
    if (onAddTrackedOrder) {
      onAddTrackedOrder(newOrder);
    }
  };

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4A373] mb-1">
            <Truck size={14} />
            <span>Logistics &amp; Loom Cluster Telemetry</span>
          </div>
          <h1 className="text-3xl font-display font-medium text-stone-900 tracking-tight">
            Order &amp; Loom Dispatch Tracking
          </h1>
          <p className="text-xs text-stone-500 max-w-xl mt-0.5">
            Monitor real-time progress for client courier parcels and inward handloom batches commissioned at Gadwal artisan clusters.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="h-10 px-5 rounded-xl bg-[#2A0E20] hover:bg-[#3d162f] text-amber-100 text-xs font-semibold flex items-center gap-2 shadow-md transition-all self-start md:self-auto"
        >
          <Plus size={16} className="text-[#D4A373]" />
          <span>Register Consignment</span>
        </button>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Orders List */}
        <div className="lg:col-span-6 space-y-4">
          {/* Search & Direction Filters */}
          <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-60">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tracking #, name, SKU..."
                className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#D4A373]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: "ALL", label: "All Jobs" },
                { id: "OUTWARD_CUSTOMER", label: "Customer Couriers" },
                { id: "INWARD_WEAVER", label: "Loom Batches" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setDirectionFilter(filter.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    directionFilter === filter.id
                      ? "bg-[#2A0E20] text-amber-100 shadow-2xs"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders list items */}
          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center glass-panel rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#D4A373] flex items-center justify-center mx-auto">
                  <PackageCheck size={22} />
                </div>
                <h3 className="font-display font-semibold text-stone-800 text-sm">
                  {search ? "No matching consignments found" : "No Active Dispatches or Loom Orders"}
                </h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  {search
                    ? "Try adjusting your tracking number or search query."
                    : "Register your first outward customer courier or inward artisan weaver shipment."}
                </p>
                {!search && (
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="h-9 px-4 rounded-xl bg-[#2A0E20] text-amber-100 text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#3d162f] transition-all"
                  >
                    <Plus size={14} className="text-[#D4A373]" />
                    <span>Register First Consignment</span>
                  </button>
                )}
              </div>
            ) : (
              filteredOrders.map((ord) => {
              const isSelected = selectedOrder?.id === ord.id;
              const isOutward = ord.direction === "OUTWARD_CUSTOMER";
              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-[#D4A373] shadow-md ring-2 ring-[#D4A373]/20"
                      : "bg-white/80 border-stone-200/80 hover:bg-white hover:border-stone-300 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-stone-900">
                          {ord.trackingNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            isOutward
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {isOutward ? "Outward Dispatch" : "Inward Loom"}
                        </span>
                      </div>
                      <h4 className="font-display font-semibold text-sm text-stone-900 mt-1 line-clamp-1">
                        {ord.title}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {ord.partyName} &bull; <span className="font-mono">{ord.partyContact}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-display font-bold text-sm text-stone-900 block">
                        {currency(ord.totalValue)}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {ord.totalPieces} {ord.totalPieces === 1 ? "Piece" : "Pieces"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                    <span className="truncate max-w-xs">{ord.courierOrLoomPartner}</span>
                    <span className="font-semibold text-emerald-700">
                      {ord.currentStage.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>

        {/* Right: Selected Tracking Timeline & Details */}
        <div className="lg:col-span-6 sticky top-6">
          {selectedOrder ? (
            <div className="glass-panel p-6 rounded-3xl space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-stone-200/80">
                <div>
                  <span className="font-mono text-xs font-bold text-[#D4A373] block">
                    {selectedOrder.trackingNumber}
                  </span>
                  <h3 className="font-display font-bold text-lg text-stone-900 mt-0.5">
                    {selectedOrder.title}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Destination: {selectedOrder.location}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleShareTrackingWhatsApp(selectedOrder)}
                  className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Share2 size={13} />
                  <span>WhatsApp</span>
                </button>
              </div>

              {/* Status summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/80 border border-stone-200/80">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 block">
                    Current Stage
                  </span>
                  <p className="font-semibold text-sm text-stone-900 mt-0.5">
                    {selectedOrder.currentStage.replace(/_/g, " ")}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/80 border border-stone-200/80">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 block">
                    Estimated Arrival / Handover
                  </span>
                  <p className="font-semibold text-sm text-emerald-700 mt-0.5">
                    {selectedOrder.estimatedCompletion}
                  </p>
                </div>
              </div>

              {/* Checkpoint Timeline */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                  Consignment Milestones
                </span>

                <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200 pl-8">
                  {selectedOrder.historyTimeline.map((step, idx) => (
                    <div key={idx} className="relative group">
                      <div
                        className={`absolute -left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-white ${
                          step.completed
                            ? "bg-emerald-600 shadow-2xs"
                            : "bg-stone-300 text-stone-500"
                        }`}
                      >
                        {step.completed ? <CheckCircle2 size={14} /> : <Clock size={12} />}
                      </div>

                      <div>
                        <h5
                          className={`font-semibold text-xs ${
                            step.completed ? "text-stone-900" : "text-stone-400"
                          }`}
                        >
                          {step.stageTitle}
                        </h5>
                        <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                          {step.timestamp} &bull; <span className="font-sans">{step.locationOrDetail}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-xs text-stone-700 leading-relaxed">
                  <strong>Notes:</strong> {selectedOrder.notes}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl text-center text-stone-400 text-xs">
              Select an order to view tracking checkpoints.
            </div>
          )}
        </div>
      </div>

      <AddTrackingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveOrder}
      />
    </div>
  );
};
