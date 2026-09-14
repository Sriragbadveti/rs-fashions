import React, { useState } from "react";
import { Layers, Plus } from "lucide-react";
import type { Category } from "../../../types/dashboard";

interface CategoriesViewProps {
  categories: Category[];
  onAddCategory?: (category: Category) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  onAddCategory,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [hsn, setHsn] = useState("5208");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    if (onAddCategory) {
      onAddCategory({
        id: `c-${Date.now().toString().slice(-4)}`,
        name: name.trim(),
        slug: slug.trim().toUpperCase(),
        hsn: hsn.trim() || "5208",
        nextSequence: 1,
      });
    }

    setName("");
    setSlug("");
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4A373] mb-1">
            <Layers size={14} />
            <span>Tax &amp; Saree Weave Classification</span>
          </div>
          <h1 className="text-3xl font-display font-medium text-stone-900 tracking-tight">
            Weave Categories &amp; HSN Codes
          </h1>
          <p className="text-xs text-stone-500 max-w-xl mt-0.5">
            Configure handloom weave classifications and harmonized system of nomenclature (HSN) codes for GST calculation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="h-10 px-5 rounded-xl bg-[#2A0E20] hover:bg-[#3d162f] text-amber-100 text-xs font-semibold flex items-center gap-2 shadow-md transition-all self-start md:self-auto"
        >
          <Plus size={16} className="text-[#D4A373]" />
          <span>New Weave Category</span>
        </button>
      </div>

      {/* Grid of Categories */}
      {categories.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#D4A373] mx-auto flex items-center justify-center border border-amber-200/60">
            <Layers size={24} />
          </div>
          <h3 className="font-display font-semibold text-lg text-stone-900">
            No Weave Categories Registered
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Add your primary saree weave classifications (e.g., SiCo Gadwal Sarees) with their HSN tax codes.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#2A0E20] hover:bg-[#3d162f] text-xs font-semibold text-amber-100 shadow-md inline-flex items-center gap-2 transition-all"
          >
            <Plus size={14} className="text-[#D4A373]" />
            <span>Create First Category</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-stone-200/80 shadow-sm"
            >
              <div>
                <h4 className="font-display font-semibold text-base text-stone-900">
                  {cat.name}
                </h4>
                <p className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                  <span>SKU Prefix:</span>
                  <span className="font-mono font-bold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded">
                    {cat.slug}
                  </span>
                </p>
              </div>

              <div className="text-right">
                <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-mono text-xs font-bold">
                  HSN {cat.hsn}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-4 select-none"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-stone-200 bg-[#2A0E20] text-amber-100 flex items-center justify-between">
              <h3 className="font-display font-semibold text-base text-white">
                Add Weave Category
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-amber-200/70 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Weave Category Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pure Silk Gadwal"
                  className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-700">
                  SKU Prefix Code *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="PSG"
                  className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-mono uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-700">
                  HSN Tax Code
                </label>
                <input
                  type="text"
                  value={hsn}
                  onChange={(e) => setHsn(e.target.value)}
                  placeholder="5208"
                  className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-mono"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 h-10 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 h-10 rounded-xl bg-[#2A0E20] text-amber-100 text-xs font-semibold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
