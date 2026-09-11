import React, { useState } from "react";
import { X, Sparkles, IndianRupee, Check } from "lucide-react";
import type { Category, DashboardProduct, ColorVariant } from "../../../types/dashboard";
import { ImageUploadInput } from "./ImageUploadInput";
import { VariantShadeManager } from "./VariantShadeManager";

interface EditSareeModalProps {
  isOpen: boolean;
  product: DashboardProduct | null;
  categories: Category[];
  onClose: () => void;
  onSave: (updatedProduct: DashboardProduct) => void;
}

export const EditSareeModal: React.FC<EditSareeModalProps> = ({
  isOpen,
  product,
  categories,
  onClose,
  onSave,
}) => {
  if (!isOpen || !product) return null;

  const [name, setName] = useState(product.name);
  const [categoryId, setCategoryId] = useState(product.categoryId);
  const [purchasePrice, setPurchasePrice] = useState<string>(
    String(product.purchasePrice || 0)
  );
  const [salePrice, setSalePrice] = useState<string>(
    String(product.salePrice || 0)
  );
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(product.tags || []);
  const [imageUrl, setImageUrl] = useState(product.imageUrl || "");
  const [variants, setVariants] = useState<ColorVariant[]>(product.variants || []);

  const handleAddTag = () => {
    const clean = tagInput.trim().toLowerCase().replace(/,/g, "");
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a Saree Design Title.");
      return;
    }
    if (variants.length === 0) {
      alert("Please add at least one color shade variant.");
      return;
    }

    const updatedProduct: DashboardProduct = {
      ...product,
      name: name.trim(),
      categoryId,
      purchasePrice: Math.max(0, Number(purchasePrice) || 0),
      salePrice: Math.max(0, Number(salePrice) || 0),
      tags,
      variants,
      imageUrl: imageUrl || undefined,
    };

    onSave(updatedProduct);
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-4 select-none overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200/70 bg-[#2A0E20] text-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-[#D4A373] flex items-center justify-center border border-amber-400/30">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-white">
                Edit Saree: {product.name}
              </h3>
              <p className="text-xs text-amber-200/70 font-light font-mono">
                SKU: {product.id}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Design Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-7 space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Saree Design Pattern Title *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 px-3.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-semibold text-stone-900"
              />
            </div>

            <div className="sm:col-span-5 space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Weave Category &amp; HSN
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-11 px-3.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-medium text-stone-900"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Purchase Cost Price (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-semibold text-stone-900"
                />
                <IndianRupee
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Showroom Selling Price (₹) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  required
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-bold text-stone-900"
                />
                <IndianRupee
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Image Uploader */}
          <ImageUploadInput
            value={imageUrl}
            onChange={(url) => setImageUrl(url)}
          />

          {/* Variant Shades */}
          <VariantShadeManager
            variants={variants}
            designSlug="DSG"
            serialNumber="001"
            onVariantsChange={(updated) => setVariants(updated)}
          />

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-700">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add new tag..."
                className="flex-1 h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
              >
                Add
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/60 text-stone-800 text-xs font-medium flex items-center gap-1.5"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-stone-400 hover:text-rose-600"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
              <span>Update Saree Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
