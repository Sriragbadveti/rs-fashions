import React, { useState } from "react";
import { Plus, Trash2, Palette } from "lucide-react";
import type { ColorVariant } from "../../../types/dashboard";
import { ColorInput } from "./ColorInput";

interface VariantShadeManagerProps {
  variants: ColorVariant[];
  designSlug: string;
  serialNumber: string;
  onVariantsChange: (variants: ColorVariant[]) => void;
}

export const VariantShadeManager: React.FC<VariantShadeManagerProps> = ({
  variants,
  designSlug,
  serialNumber,
  onVariantsChange,
}) => {
  const [selectedColor, setSelectedColor] = useState("");
  const [stockQty, setStockQty] = useState<number>(1);

  const handleAddVariant = () => {
    if (!selectedColor.trim()) return;

    // Generate color slug
    const words = selectedColor
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);
    const colorSlug = words
      .map((w) => w.charAt(0))
      .join("")
      .slice(0, 3)
      .toUpperCase() || "CLR";

    // Check if already exists
    if (variants.some((v) => v.color.toLowerCase() === selectedColor.toLowerCase())) {
      alert("This color variant already exists for this design.");
      return;
    }

    const sku = `RSF-${designSlug || "DSG"}-${colorSlug}-${serialNumber || "001"}`;

    const newVariant: ColorVariant = {
      color: selectedColor,
      colorSlug,
      stock: Math.max(0, Number(stockQty) || 0),
      sku,
    };

    onVariantsChange([...variants, newVariant]);
    setSelectedColor("");
    setStockQty(1);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      alert("At least one color variant is required.");
      return;
    }
    const updated = variants.filter((_, i) => i !== index);
    onVariantsChange(updated);
  };

  const handleUpdateStock = (index: number, newStock: number) => {
    const updated = variants.map((v, i) =>
      i === index ? { ...v, stock: Math.max(0, newStock) } : v
    );
    onVariantsChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-stone-700">
          Color Shades &amp; Variant Stocks
        </label>
        <span className="text-[11px] text-stone-500 font-mono">
          {variants.length} {variants.length === 1 ? "shade" : "shades"} &bull;{" "}
          {variants.reduce((acc, v) => acc + v.stock, 0)} total drapes
        </span>
      </div>

      {/* Add Variant Bar */}
      <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <div className="sm:col-span-7">
            <ColorInput
              value={selectedColor}
              onChange={(c) => setSelectedColor(c)}
            />
          </div>
          <div className="sm:col-span-3">
            <input
              type="number"
              min="0"
              value={stockQty}
              onChange={(e) => setStockQty(Math.max(0, Number(e.target.value) || 0))}
              placeholder="Initial Stock"
              className="w-full h-11 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] text-stone-900 font-semibold text-center"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={handleAddVariant}
              disabled={!selectedColor.trim()}
              className="w-full h-11 rounded-xl bg-[#2A0E20] text-amber-100 flex items-center justify-center gap-1 text-xs font-medium hover:bg-[#3d162f] disabled:opacity-50 disabled:pointer-events-none shadow-sm transition-all"
            >
              <Plus size={16} />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Existing Variants List */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {variants.map((v, index) => (
          <div
            key={v.sku || index}
            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-stone-200/70 shadow-2xs hover:border-stone-300 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-6 h-6 rounded-lg bg-amber-50 text-[#D4A373] flex items-center justify-center border border-amber-200/50 shrink-0">
                <Palette size={13} />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-800">
                    {v.color}
                  </span>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                    {v.colorSlug}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-stone-400 truncate">
                  SKU: {v.sku}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                <button
                  type="button"
                  onClick={() => handleUpdateStock(index, v.stock - 1)}
                  className="px-2 py-1 text-xs text-stone-500 hover:bg-stone-200 transition-colors font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  value={v.stock}
                  onChange={(e) =>
                    handleUpdateStock(index, Math.max(0, Number(e.target.value) || 0))
                  }
                  className="w-12 text-center text-xs font-bold bg-white h-7 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateStock(index, v.stock + 1)}
                  className="px-2 py-1 text-xs text-stone-500 hover:bg-stone-200 transition-colors font-bold"
                >
                  +
                </button>
              </div>

              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveVariant(index)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
