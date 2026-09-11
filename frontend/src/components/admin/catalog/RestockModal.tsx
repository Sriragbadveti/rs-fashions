import React, { useState } from "react";
import { X, Package, Check } from "lucide-react";
import type { DashboardProduct, MovementType, StockMovement } from "../../../types/dashboard";

interface RestockModalProps {
  isOpen: boolean;
  inventory: DashboardProduct[];
  onClose: () => void;
  onSaveMovement: (movement: StockMovement) => void;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  inventory,
  onClose,
  onSaveMovement,
}) => {
  if (!isOpen) return null;

  // Flatten all variants with their product info
  const allVariants = inventory.flatMap((p) =>
    p.variants.map((v) => ({
      product: p,
      variant: v,
      isLow: v.stock <= 2,
    }))
  );

  const [selectedSku, setSelectedSku] = useState<string>(
    allVariants.find((v) => v.isLow)?.variant.sku || allVariants[0]?.variant.sku || ""
  );
  const [movementType, setMovementType] = useState<MovementType>("RESTOCK");
  const [changeQty, setChangeQty] = useState<number>(5);
  const [referenceNumber, setReferenceNumber] = useState("PO-GADWAL-RESTOCK");
  const [notes, setNotes] = useState("Direct loom replenishment");

  const selectedItem = allVariants.find((v) => v.variant.sku === selectedSku);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const previousStock = selectedItem.variant.stock;
    const isNegative = movementType === "DAMAGE" || movementType === "SALE";
    const delta = isNegative ? -Math.abs(changeQty) : Math.abs(changeQty);
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
      type: movementType,
      quantity: delta,
      previousStock,
      newStock,
      referenceNumber: referenceNumber.trim() || `REF-${Date.now().toString().slice(-4)}`,
      performedBy: "Store Manager",
      note: notes.trim(),
    };

    onSaveMovement(movement);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200/70 bg-[#2A0E20] text-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-[#D4A373] flex items-center justify-center border border-amber-400/30">
              <Package size={18} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-white">
                Adjust &amp; Restock Inventory
              </h3>
              <p className="text-xs text-amber-200/70 font-light">
                Log stock audit movements directly into ledger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-amber-200/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Saree & Variant Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Select Saree &amp; Color Variant *
            </label>
            <select
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="w-full h-11 px-3.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-medium text-stone-900"
            >
              {allVariants.map(({ product, variant, isLow }) => (
                <option key={variant.sku} value={variant.sku}>
                  {product.name} - {variant.color} ({variant.sku}) &bull; Current: {variant.stock} {isLow ? "[LOW STOCK]" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock info banner */}
          {selectedItem && (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-stone-800">
                  {selectedItem.product.name}
                </span>
                <span className="text-stone-500 block text-[11px]">
                  Shade: {selectedItem.variant.color} &bull; SKU: {selectedItem.variant.sku}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-400 block uppercase font-mono">
                  Current Stock
                </span>
                <span className="font-mono text-base font-bold text-stone-900">
                  {selectedItem.variant.stock} Drapes
                </span>
              </div>
            </div>
          )}

          {/* Movement Type Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["RESTOCK", "DAMAGE", "SALE", "ADJUSTMENT"] as MovementType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMovementType(type)}
                className={`h-10 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                  movementType === type
                    ? "bg-[#2A0E20] text-amber-100 shadow-sm border border-[#D4A373]"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200/80"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Quantity adjustment */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Quantity to {movementType === "DAMAGE" || movementType === "SALE" ? "Deduct" : "Add"} *
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setChangeQty(Math.max(1, changeQty - 1))}
                className="w-11 h-11 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-base flex items-center justify-center transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                required
                value={changeQty}
                onChange={(e) => setChangeQty(Math.max(1, Number(e.target.value) || 1))}
                className="flex-1 h-11 px-3 text-center text-sm font-bold bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
              />
              <button
                type="button"
                onClick={() => setChangeQty(changeQty + 1)}
                className="w-11 h-11 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-base flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Reference & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-stone-700">
                Ref / PO / Invoice Number
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="PO-WEAVER-42"
                className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-stone-700">
                Audit Note
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for adjustment..."
                className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-11 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 h-11 rounded-xl bg-[#2A0E20] text-amber-100 hover:bg-[#3d162f] text-xs font-semibold flex items-center gap-2 shadow-md transition-all"
            >
              <Check size={16} className="text-[#D4A373]" />
              <span>Record Stock Movement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
