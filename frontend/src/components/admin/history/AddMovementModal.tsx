import React, { useState } from "react";
import { X, History, Check } from "lucide-react";
import type { DashboardProduct, MovementType, StockMovement } from "../../../types/dashboard";

interface AddMovementModalProps {
  isOpen: boolean;
  inventory: DashboardProduct[];
  onClose: () => void;
  onSave: (movement: StockMovement) => void;
}

export const AddMovementModal: React.FC<AddMovementModalProps> = ({
  isOpen,
  inventory,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const allVariants = inventory.flatMap((p) =>
    p.variants.map((v) => ({
      product: p,
      variant: v,
    }))
  );

  const [selectedSku, setSelectedSku] = useState(
    allVariants[0]?.variant.sku || ""
  );
  const [type, setType] = useState<MovementType>("RESTOCK");
  const [qty, setQty] = useState<number>(5);
  const [refNo, setRefNo] = useState("PO-WEAVER-GADWAL");
  const [note, setNote] = useState("Stock movement manual adjustment");

  const selectedItem = allVariants.find((v) => v.variant.sku === selectedSku);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const previousStock = selectedItem.variant.stock;
    const isNegative = type === "DAMAGE" || type === "SALE";
    const delta = isNegative ? -Math.abs(qty) : Math.abs(qty);
    const newStock = Math.max(0, previousStock + delta);

    const movement: StockMovement = {
      id: `mov-${Date.now()}-${selectedItem.variant.colorSlug}`,
      date: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      sku: selectedItem.variant.sku,
      productName: selectedItem.product.name,
      color: selectedItem.variant.color,
      colorSlug: selectedItem.variant.colorSlug,
      type,
      quantity: delta,
      previousStock,
      newStock,
      referenceNumber: refNo.trim() || `REF-${Date.now().toString().slice(-4)}`,
      performedBy: "Sindhu",
      note: note.trim(),
    };

    onSave(movement);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200/70 bg-[#2A0E20] text-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-[#D4A373] flex items-center justify-center border border-amber-400/30">
              <History size={18} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-white">
                Log Stock Movement
              </h3>
              <p className="text-xs text-amber-200/70 font-light">
                Add movement entry to inventory audit ledger
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Select Saree &amp; Variant SKU *
            </label>
            <select
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="w-full h-11 px-3.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-medium text-stone-900"
            >
              {allVariants.map(({ product, variant }) => (
                <option key={variant.sku} value={variant.sku}>
                  {product.name} - {variant.color} ({variant.sku}) &bull; Stock: {variant.stock}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Movement Reason / Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["RESTOCK", "DAMAGE", "SALE", "ADJUSTMENT"] as MovementType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`h-10 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                    type === t
                      ? "bg-[#2A0E20] text-amber-100 shadow-sm border border-[#D4A373]"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200/80"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Pieces Quantity *
            </label>
            <input
              type="number"
              min="1"
              required
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className="w-full h-11 px-3 text-sm font-bold bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Reference Document (PO / Invoice / Challan)
            </label>
            <input
              type="text"
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
              className="w-full h-11 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Audit Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-11 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
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
              <span>Record Audit Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
