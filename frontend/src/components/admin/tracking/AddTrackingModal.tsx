import React, { useState } from "react";
import { X, Truck, Check } from "lucide-react";
import type { TrackedOrder, OrderDirection } from "../../../types/dashboard";

interface AddTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: TrackedOrder) => void;
}

export const AddTrackingModal: React.FC<AddTrackingModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [direction, setDirection] = useState<OrderDirection>("OUTWARD_CUSTOMER");
  const [title, setTitle] = useState("");
  const [partyName, setPartyName] = useState("");
  const [partyContact, setPartyContact] = useState("");
  const [location, setLocation] = useState("Hyderabad");
  const [skuList, setSkuList] = useState("RSF-VC-RD-001");
  const [totalPieces, setTotalPieces] = useState<number>(1);
  const [totalValue, setTotalValue] = useState<number>(18500);
  const [courierOrLoomPartner, setCourierOrLoomPartner] = useState("Blue Dart Express");
  const [estimatedCompletion, setEstimatedCompletion] = useState("Within 48 Hours");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !partyName.trim()) {
      alert("Please enter parcel title and recipient / weaver party name.");
      return;
    }

    const trackingNumber =
      direction === "OUTWARD_CUSTOMER"
        ? `AWB-BD-${Date.now().toString().slice(-6)}`
        : `LOOM-GDW-BATCH-${Date.now().toString().slice(-4)}`;

    const newOrder: TrackedOrder = {
      id: `ord-${Date.now().toString().slice(-4)}`,
      trackingNumber,
      direction,
      title: title.trim(),
      partyName: partyName.trim(),
      partyContact: partyContact.trim(),
      location: location.trim(),
      skuList: skuList.split(",").map((s) => s.trim()).filter(Boolean),
      totalPieces: Math.max(1, Number(totalPieces) || 1),
      totalValue: Math.max(0, Number(totalValue) || 0),
      courierOrLoomPartner: courierOrLoomPartner.trim(),
      currentStage: direction === "OUTWARD_CUSTOMER" ? "ORDER_PACKED" : "LOOM_COMMISSIONED",
      estimatedCompletion: estimatedCompletion.trim(),
      lastUpdate: "Order registered in tracking ledger",
      notes: notes.trim() || undefined,
      historyTimeline: [
        {
          stageTitle: direction === "OUTWARD_CUSTOMER" ? "Order Packaged & QC Inspected" : "Loom Commissioned",
          timestamp: new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
          locationOrDetail: "Hyderabad Telengana",
          completed: true,
        },
        {
          stageTitle: direction === "OUTWARD_CUSTOMER" ? "Handed over to Courier Agent" : "Weaving in Progress",
          timestamp: "Pending",
          locationOrDetail: courierOrLoomPartner,
          completed: false,
        },
      ],
    };

    onSave(newOrder);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-4 select-none overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200/70 bg-[#2A0E20] text-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-[#D4A373] flex items-center justify-center border border-amber-400/30">
              <Truck size={18} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-white">
                Register Dispatch / Loom Consignment
              </h3>
              <p className="text-xs text-amber-200/70 font-light">
                Create new tracking workflow for courier delivery or handloom batch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-amber-200/70 hover:text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Direction toggle */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Consignment Tracking Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection("OUTWARD_CUSTOMER")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  direction === "OUTWARD_CUSTOMER"
                    ? "border-[#2A0E20] bg-[#2A0E20] text-amber-100 shadow-sm"
                    : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                }`}
              >
                <span className="block text-xs font-bold">Outward Customer Courier</span>
                <span className="text-[10px] opacity-75">Blue Dart / DTDC Express</span>
              </button>

              <button
                type="button"
                onClick={() => setDirection("INWARD_WEAVER")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  direction === "INWARD_WEAVER"
                    ? "border-[#2A0E20] bg-[#2A0E20] text-amber-100 shadow-sm"
                    : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                }`}
              >
                <span className="block text-xs font-bold">Inward Loom Cluster Job</span>
                <span className="text-[10px] opacity-75">Gadwal Master Artisan Batch</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-stone-700">
              Consignment Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bridal Gadwal Silk Parcel or Pure Zari Ma Inti Bangaram Batch #12"
              className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                Party / Patron / Weaver Name *
              </label>
              <input
                type="text"
                required
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder="Smt. Shailaja Reddy or Master Weaver Narayana"
                className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                Contact Phone
              </label>
              <input
                type="tel"
                value={partyContact}
                onChange={(e) => setPartyContact(e.target.value)}
                placeholder="9849012345"
                className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                Destination / Workshop Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Banjara Hills, Hyderabad"
                className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                Courier / Loom Partner
              </label>
              <input
                type="text"
                value={courierOrLoomPartner}
                onChange={(e) => setCourierOrLoomPartner(e.target.value)}
                placeholder="Blue Dart Air Express"
                className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                Total Pieces
              </label>
              <input
                type="number"
                min="1"
                value={totalPieces}
                onChange={(e) => setTotalPieces(Math.max(1, Number(e.target.value) || 1))}
                className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                Consignment Value (₹)
              </label>
              <input
                type="number"
                min="0"
                value={totalValue}
                onChange={(e) => setTotalValue(Math.max(0, Number(e.target.value) || 0))}
                className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                Saree SKUs (Comma-separated)
              </label>
              <input
                type="text"
                value={skuList}
                onChange={(e) => setSkuList(e.target.value)}
                placeholder="RSF-VC-RD-001, RSF-MIB3B-MG-001"
                className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                Estimated Delivery / Loom Finish
              </label>
              <input
                type="text"
                value={estimatedCompletion}
                onChange={(e) => setEstimatedCompletion(e.target.value)}
                placeholder="Within 48 Hours"
                className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-stone-700">
              Special Handling &amp; Security Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Signature required, pure zari inspection..."
              className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-11 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 h-11 rounded-xl bg-[#2A0E20] text-amber-100 hover:bg-[#3d162f] text-xs font-semibold flex items-center gap-2 shadow-md"
            >
              <Check size={16} className="text-[#D4A373]" />
              <span>Register Tracking Job</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
