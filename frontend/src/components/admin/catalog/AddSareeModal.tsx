import React, { useState, useMemo } from "react";
import {
  X,
  Sparkles,
  Layers,
  IndianRupee,
  Tag,
  Check,
} from "lucide-react";
import type {
  Category,
  DashboardProduct,
  ColorVariant,
} from "../../../types/dashboard";
import {
  WEAVE_DESIGN_PRESETS,
} from "../../../types/dashboard";
import { DesignInput } from "./DesignInput";
import { ImageUploadInput } from "./ImageUploadInput";
import { VariantShadeManager } from "./VariantShadeManager";

interface AddSareeModalProps {
  isOpen: boolean;
  categories: Category[];
  existingInventory: DashboardProduct[];
  onClose: () => void;
  onSave: (newProduct: DashboardProduct, categoryId: string) => void;
}

export const AddSareeModal: React.FC<AddSareeModalProps> = ({
  isOpen,
  categories,
  existingInventory,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "c1");
  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [salePrice, setSalePrice] = useState<string>("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(["gadwal", "handloom", "sico"]);
  const [imageUrl, setImageUrl] = useState("");

  // Compute design slug
  const designSlug = useMemo(() => {
    if (!name.trim()) return "DSG";
    const found = WEAVE_DESIGN_PRESETS.find(
      (d) => d.name.toLowerCase() === name.toLowerCase().trim()
    );
    if (found) return found.slug;

    const words = name
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);
    if (!words.length) return "CUSTOM";
    if (words.length === 1) return words[0].slice(0, 5).toUpperCase();
    return words
      .map((w) => w[0])
      .join("")
      .slice(0, 6)
      .toUpperCase();
  }, [name]);

  // Compute next serial number for this design
  const serialNumber = useMemo(() => {
    let highest = 0;
    existingInventory.forEach((p) => {
      if (p.name.toLowerCase().trim() === name.toLowerCase().trim()) {
        const match = p.id.match(/-(\d{3})$/);
        if (match) {
          highest = Math.max(highest, parseInt(match[1], 10));
        }
      }
    });
    return String(highest + 1).padStart(3, "0");
  }, [name, existingInventory]);

  // Initial variant
  const [variants, setVariants] = useState<ColorVariant[]>([
    {
      color: "Crimson Red",
      colorSlug: "RD",
      stock: 5,
      sku: `RSF-${designSlug}-RD-${serialNumber}`,
    },
  ]);

  // Update variants SKUs when designSlug changes
  const synchronizedVariants = useMemo(() => {
    return variants.map((v) => ({
      ...v,
      sku: `RSF-${designSlug}-${v.colorSlug}-${serialNumber}`,
    }));
  }, [variants, designSlug, serialNumber]);

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
      alert("Please enter or select a Saree Design Title.");
      return;
    }
    if (synchronizedVariants.length === 0) {
      alert("Please add at least one color shade variant.");
      return;
    }

    const primarySku = synchronizedVariants[0]?.sku || `RSF-${designSlug}-001`;

    const newProduct: DashboardProduct = {
      id: primarySku,
      name: name.trim(),
      categoryId,
      purchasePrice: Math.max(0, Number(purchasePrice) || 0),
      salePrice: Math.max(0, Number(salePrice) || 0),
      tags,
      variants: synchronizedVariants,
      imageUrl: imageUrl || undefined,
    };

    onSave(newProduct, categoryId);
  };

  const designOptionsList = WEAVE_DESIGN_PRESETS.map((d) => d.name);

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
                Catalogue New Gadwal Saree
              </h3>
              <p className="text-xs text-amber-200/70 font-light">
                Add saree specifications, shades, and stock to atelier vault
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
          {/* Section: Design & Weave Category */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-7 space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Saree Design Pattern Title *
              </label>
              <DesignInput
                value={name}
                options={designOptionsList}
                onChange={(val) => setName(val)}
              />
            </div>

            <div className="sm:col-span-5 space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Weave Category &amp; HSN
              </label>
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-11 px-3.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-medium text-stone-900"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (HSN: {c.hsn})
                    </option>
                  ))}
                </select>
                <Layers
                  size={16}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Pricing */}
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
                  placeholder="12000"
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
                  placeholder="18500"
                  className="w-full h-11 pl-9 pr-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-bold text-stone-900"
                />
                <IndianRupee
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Cloudinary Drag & Drop Visual Uploader */}
          <ImageUploadInput
            value={imageUrl}
            onChange={(url) => setImageUrl(url)}
          />

          {/* Section: Color Variants & Stock */}
          <VariantShadeManager
            variants={synchronizedVariants}
            designSlug={designSlug}
            serialNumber={serialNumber}
            onVariantsChange={(updated) => setVariants(updated)}
          />

          {/* Section: Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-700">
              Search &amp; Catalog Tags
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
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
                  placeholder="Type tag & press Enter (e.g., pure-silk, wedding, kanchi-border)..."
                  className="w-full h-10 pl-9 pr-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
                />
                <Tag
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
              </div>
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
              >
                Add Tag
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

          {/* Generated Master SKU preview */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">
                Master Generated SKU
              </span>
              <p className="font-mono text-xs font-bold text-stone-900 mt-0.5">
                {synchronizedVariants[0]?.sku || `RSF-${designSlug}-001`}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-[#2A0E20] text-[#D4A373] text-[10px] font-mono font-bold">
              VAULT-READY
            </span>
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
              <span>Register Saree in Vault</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
