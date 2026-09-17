import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  X,
  Save,
  Search,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Star,
  Tag,
  IndianRupee,
  Layers,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";
import type { Product } from "../types/inventory";
import { useModal } from "../context/ModalContext";

export interface TrendingItem {
  id: string;
  name: string;
  category: string;
  material: string;
  price: number;
  originalPrice: number;
  badge: string;
  rating: number;
  reviewCount: number;
  images: string[];
  description: string;
}

export interface TrendingConfig {
  isEnabled: boolean;
  sectionTitle: string;
  highlightWord: string;
  subtitle: string;
  items: TrendingItem[];
}

export const DEFAULT_TRENDING_ITEMS: TrendingItem[] = [
  {
    id: "midnight-sico-gadwal",
    name: "Midnight Royal SiCo Gadwal",
    category: "SiCo Gadwal Sarees",
    material: "SiCo",
    price: 7999,
    originalPrice: 9999,
    badge: "Trending Now",
    rating: 4.9,
    reviewCount: 64,
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&auto=format&fit=crop&q=80",
    ],
    description: "Deep midnight blue body with contrast scarlet red temple zari border.",
  },
  {
    id: "emerald-sico-gadwal",
    name: "Emerald Gatti Border SiCo Gadwal",
    category: "SiCo Gadwal Sarees",
    material: "SiCo",
    price: 8499,
    originalPrice: 11200,
    badge: "Signature Border",
    rating: 4.8,
    reviewCount: 42,
    images: [
      "https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/w/o/woven-art-silk-saree-in-emerald-green-v1-ssf833_2.jpg",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80",
    ],
    description: "Opulent emerald green SiCo with authentic gatti border and gold buttas.",
  },
  {
    id: "crimson-sico-gadwal",
    name: "Crimson Temple SiCo Gadwal",
    category: "SiCo Gadwal Sarees",
    material: "SiCo",
    price: 6499,
    originalPrice: 8500,
    badge: "Festive Favorite",
    rating: 4.9,
    reviewCount: 57,
    images: [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80",
    ],
    description: "Traditional vermilion crimson red drape featuring authentic kumbha temple edging.",
  },
  {
    id: "ivory-sico-gadwal",
    name: "Ivory Gold SiCo Gadwal",
    category: "SiCo Gadwal Sarees",
    material: "SiCo",
    price: 5899,
    originalPrice: 7800,
    badge: "Most Loved",
    rating: 4.8,
    reviewCount: 38,
    images: [
      "https://images.pexels.com/photos/33328181/pexels-photo-33328181.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://cdn.corenexis.com/f/Gr2AsoVtVeK.png",
    ],
    description: "Sublime ivory SiCo drape with pure woven gold zari border.",
  },
];

export const PRESET_LOOM_IMAGES = [
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1610030469668-93510cb67655?w=900&auto=format&fit=crop&q=80",
  "https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/w/o/woven-art-silk-saree-in-emerald-green-v1-ssf833_2.jpg",
  "https://images.pexels.com/photos/33328181/pexels-photo-33328181.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://cdn.corenexis.com/f/Gr2AsoVtVeK.png",
];

export const BADGE_OPTIONS = [
  "Trending Now",
  "Signature Border",
  "Most Loved",
  "Festive Favorite",
  "Heritage Loom",
  "Vintage Checks",
  "Gatti Border",
  "Limited Weave",
];

interface TrendingManagerProps {
  inventory: Product[];
}

export default function TrendingManager({ inventory }: TrendingManagerProps) {
  const { toast } = useModal();
  const [saving, setSaving] = useState(false);
  const [editingImageItem, setEditingImageItem] = useState<{ id: string; imageIndex: number } | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchInventoryQuery, setSearchInventoryQuery] = useState("");

  const [trendingConfig, setTrendingConfig] = useState<TrendingConfig>(() => {
    try {
      const saved = localStorage.getItem("rs_fashions_trending_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          isEnabled: parsed.isEnabled ?? true,
          sectionTitle: parsed.sectionTitle || "Trending",
          highlightWord: parsed.highlightWord || "Pieces.",
          subtitle:
            parsed.subtitle ||
            "Hand-picked heritage Gadwal drapes celebrated for their timeless interlocked zari weave.",
          items: Array.isArray(parsed.items) && parsed.items.length > 0 ? parsed.items : DEFAULT_TRENDING_ITEMS,
        };
      }
    } catch {}
    return {
      isEnabled: true,
      sectionTitle: "Trending",
      highlightWord: "Pieces.",
      subtitle:
        "Hand-picked heritage Gadwal drapes celebrated for their timeless interlocked zari weave.",
      items: DEFAULT_TRENDING_ITEMS,
    };
  });

  const handleSaveConfig = () => {
    setSaving(true);
    try {
      localStorage.setItem("rs_fashions_trending_config", JSON.stringify(trendingConfig));
      window.dispatchEvent(new Event("trendingConfigChanged"));
      toast?.("Trending pieces saved and updated across storefront!", "success");
    } catch (err) {
      console.warn("Save trending config error:", err);
      toast?.("Failed to save changes. Please try again.", "error");
    } finally {
      setTimeout(() => setSaving(false), 400);
    }
  };

  const handleToggleMaster = () => {
    const updated = { ...trendingConfig, isEnabled: !trendingConfig.isEnabled };
    setTrendingConfig(updated);
    try {
      localStorage.setItem("rs_fashions_trending_config", JSON.stringify(updated));
      window.dispatchEvent(new Event("trendingConfigChanged"));
    } catch {}
    toast?.(
      updated.isEnabled
        ? "Trending Pieces is now VISIBLE on homepage."
        : "Trending Pieces is now HIDDEN from homepage.",
      "info"
    );
  };

  const handleUpdateItemField = (id: string, field: keyof TrendingItem, value: any) => {
    setTrendingConfig((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const handleApplyImage = (newUrl: string) => {
    if (!editingImageItem || !newUrl.trim()) return;
    setTrendingConfig((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === editingImageItem.id) {
          const imgs = [...(item.images || [])];
          imgs[editingImageItem.imageIndex] = newUrl.trim();
          return { ...item, images: imgs };
        }
        return item;
      }),
    }));
    setEditingImageItem(null);
    setCustomImageUrl("");
    toast?.("Image updated. Click 'Save Changes' to publish.", "success");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) handleApplyImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= trendingConfig.items.length) return;
    const newItems = [...trendingConfig.items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);
    setTrendingConfig((prev) => ({ ...prev, items: newItems }));
  };

  const handleDeleteItem = (id: string) => {
    setTrendingConfig((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
    toast?.("Item removed from trending list.", "info");
  };

  const handleAddFromInventory = (product: Product) => {
    if (trendingConfig.items.some((it) => it.id === product.id)) {
      toast?.("This saree is already in your trending curation.", "warning");
      return;
    }

    const newItem: TrendingItem = {
      id: product.id,
      name: product.name,
      category: "SiCo Gadwal Sarees",
      material: "SiCo",
      price: product.salePrice || 7999,
      originalPrice: Math.round((product.salePrice || 7999) * 1.25),
      badge: "Trending Now",
      rating: 4.9,
      reviewCount: 36,
      images: [
        product.imageUrl || PRESET_LOOM_IMAGES[0],
        product.imageUrl || PRESET_LOOM_IMAGES[1],
      ],
      description: "Authentic SiCo Gadwal drape with pure handloom zari border.",
    };

    setTrendingConfig((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setIsAddModalOpen(false);
    toast?.(`Added "${product.name}" to trending curation.`, "success");
  };

  const filteredInventory = inventory.filter((p) =>
    p.name.toLowerCase().includes(searchInventoryQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchInventoryQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 select-none font-sans max-w-7xl mx-auto pb-16">
      {/* =========================================================================
          PAGE HEADER & MASTER CONTROLS
      ========================================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 border border-amber-200/60 mb-2">
            <Sparkles size={13} className="text-[#D4A373]" />
            <span>Storefront Merchandising</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Trending Pieces Manager
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-xl">
            Curate signature SiCo Gadwal drapes highlighted on the storefront homepage. Customize images, badges, titles, and live prices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Master Visibility Switch */}
          <button
            type="button"
            onClick={handleToggleMaster}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
              trendingConfig.isEnabled
                ? "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                : "bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100"
            }`}
          >
            {trendingConfig.isEnabled ? (
              <>
                <Eye size={15} className="text-emerald-600" />
                <span>Trending: Visible on Website</span>
              </>
            ) : (
              <>
                <EyeOff size={15} className="text-rose-600" />
                <span>Trending: Hidden from Website</span>
              </>
            )}
          </button>

          {/* Add Saree */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 px-4 py-2.5 text-xs font-bold text-stone-800 shadow-xs transition-all"
          >
            <Plus size={14} />
            <span>Add Saree</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#2A0E20] hover:bg-[#3D142E] active:scale-95 text-amber-100 px-5 py-2.5 text-xs font-bold shadow-md transition-all disabled:opacity-50"
          >
            <Save size={14} className="text-amber-300" />
            <span>{saving ? "Publishing…" : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION TITLES & HEADINGS CONFIGURATION
      ========================================================================== */}
      <div className="glass-panel rounded-3xl p-6 border border-stone-200/80 bg-white/70 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <Layers size={16} className="text-[#8E3D51]" />
          <span>Homepage Section Header Details</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
              Main Title
            </label>
            <input
              type="text"
              value={trendingConfig.sectionTitle}
              onChange={(e) => setTrendingConfig({ ...trendingConfig, sectionTitle: e.target.value })}
              placeholder="Trending"
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs text-stone-800 focus:border-[#8E3D51] outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
              Highlighted Word (Italicized)
            </label>
            <input
              type="text"
              value={trendingConfig.highlightWord}
              onChange={(e) => setTrendingConfig({ ...trendingConfig, highlightWord: e.target.value })}
              placeholder="Pieces."
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs text-stone-800 focus:border-[#8E3D51] outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
              Section Subtitle
            </label>
            <input
              type="text"
              value={trendingConfig.subtitle}
              onChange={(e) => setTrendingConfig({ ...trendingConfig, subtitle: e.target.value })}
              placeholder="Hand-picked heritage Gadwal drapes..."
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs text-stone-800 focus:border-[#8E3D51] outline-none"
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          TRENDING CARDS LIST & LIVE CURATION
      ========================================================================== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Sparkles size={16} className="text-[#8E3D51]" />
            <span>Curated Showcase Cards ({trendingConfig.items.length} Drapes)</span>
          </h2>
          <span className="text-xs text-stone-400">Strictly SiCo Gadwal Sarees</span>
        </div>

        {trendingConfig.items.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border border-dashed border-stone-300 bg-white/50">
            <Sparkles size={32} className="mx-auto text-stone-300 mb-3" />
            <h3 className="text-sm font-bold text-stone-800">No trending sarees curated</h3>
            <p className="text-xs text-stone-400 mt-1 mb-4">Add sarees to showcase them in the homepage trending grid.</p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="rounded-xl bg-[#2A0E20] px-4 py-2 text-xs font-bold text-amber-100"
            >
              Add First Saree
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {trendingConfig.items.map((item, index) => {
              const primaryImage = item.images?.[0] || PRESET_LOOM_IMAGES[0];
              const hoverImage = item.images?.[1] || primaryImage;

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5"
                >
                  {/* Left: Dual Image Preview & Change Controls */}
                  <div className="flex flex-col items-center gap-3 shrink-0">
                    <div className="relative h-44 w-36 overflow-hidden rounded-2xl bg-stone-100 border border-stone-200 shadow-inner group">
                      <img
                        src={primaryImage}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute top-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[8px] font-bold text-white uppercase tracking-wider">
                        Cover
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingImageItem({ id: item.id, imageIndex: 0 })}
                        className="flex items-center gap-1 text-[10px] font-semibold text-stone-600 hover:text-[#8E3D51] bg-stone-50 hover:bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200 transition-colors"
                      >
                        <ImageIcon size={11} />
                        <span>Change Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingImageItem({ id: item.id, imageIndex: 1 })}
                        className="flex items-center gap-1 text-[10px] font-semibold text-stone-600 hover:text-[#8E3D51] bg-stone-50 hover:bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200 transition-colors"
                        title="Alternate image on mouse hover"
                      >
                        <ImageIcon size={11} />
                        <span>Hover Photo</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Editable Fields */}
                  <div className="flex-1 flex flex-col justify-between space-y-3 min-w-0">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono text-stone-400 truncate">
                          SKU: {item.id}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMove(index, "up")}
                            disabled={index === 0}
                            title="Move Up"
                            className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 rounded"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(index, "down")}
                            disabled={index === trendingConfig.items.length - 1}
                            title="Move Down"
                            className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 rounded"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            title="Remove from Trending"
                            className="p-1 text-rose-400 hover:text-rose-600 rounded ml-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-stone-400 mb-0.5">
                            Saree Name
                          </label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItemField(item.id, "name", e.target.value)}
                            className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-semibold text-stone-900 focus:border-[#8E3D51] outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold uppercase text-stone-400 mb-0.5">
                              Price (₹)
                            </label>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => handleUpdateItemField(item.id, "price", Number(e.target.value) || 0)}
                              className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs text-stone-800 outline-none focus:border-[#8E3D51]"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase text-stone-400 mb-0.5">
                              Original Price (₹)
                            </label>
                            <input
                              type="number"
                              value={item.originalPrice}
                              onChange={(e) => handleUpdateItemField(item.id, "originalPrice", Number(e.target.value) || 0)}
                              className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs text-stone-500 line-through outline-none focus:border-[#8E3D51]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold uppercase text-stone-400 mb-0.5">
                              Display Badge
                            </label>
                            <select
                              value={item.badge}
                              onChange={(e) => handleUpdateItemField(item.id, "badge", e.target.value)}
                              className="w-full rounded-lg border border-stone-200 px-2 py-1.5 text-xs text-stone-800 outline-none bg-white focus:border-[#8E3D51]"
                            >
                              {BADGE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase text-stone-400 mb-0.5">
                              Category
                            </label>
                            <div className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs text-stone-600 font-medium">
                              SiCo Gadwal Sarees
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold uppercase text-stone-400 mb-0.5">
                            Brief Description
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateItemField(item.id, "description", e.target.value)}
                            placeholder="Fine SiCo body with zari border..."
                            className="w-full rounded-lg border border-stone-200 px-2.5 py-1 text-xs text-stone-600 outline-none focus:border-[#8E3D51]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          IMAGE CHOOSER MODAL
      ========================================================================== */}
      {editingImageItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className="text-[#8E3D51]" />
                <h3 className="text-sm font-bold text-stone-900">
                  Update {editingImageItem.imageIndex === 0 ? "Cover" : "Hover"} Photo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingImageItem(null);
                  setCustomImageUrl("");
                }}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X size={16} />
              </button>
            </div>

            {/* Direct URL Input */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Paste Image Web Address (URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  className="flex-1 rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-stone-800 outline-none focus:border-[#8E3D51]"
                />
                <button
                  type="button"
                  onClick={() => handleApplyImage(customImageUrl)}
                  disabled={!customImageUrl.trim()}
                  className="rounded-xl bg-[#2A0E20] px-4 py-2 text-xs font-bold text-amber-100 disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* File Upload Option */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Or Upload from Computer
              </label>
              <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/60 p-4 hover:bg-stone-50 cursor-pointer transition-colors">
                <UploadCloud size={24} className="text-stone-400 mb-1" />
                <span className="text-xs font-semibold text-stone-700">Click to browse image file</span>
                <span className="text-[10px] text-stone-400">JPG, PNG, or WebP up to 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Preset Photography */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                Or Select from Curated Loom Gallery
              </label>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                {PRESET_LOOM_IMAGES.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyImage(img)}
                    className="relative aspect-square overflow-hidden rounded-xl border border-stone-200 hover:border-[#8E3D51] hover:ring-2 hover:ring-[#8E3D51]/20 transition-all group"
                  >
                    <img src={img} alt="Loom Preset" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD SAREE FROM INVENTORY MODAL
      ========================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-[#8E3D51]" />
                <h3 className="text-base font-bold text-stone-900">
                  Select Saree from Catalogue
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-3 text-stone-400" />
              <input
                type="text"
                value={searchInventoryQuery}
                onChange={(e) => setSearchInventoryQuery(e.target.value)}
                placeholder="Search by drape name or SKU..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 outline-none focus:border-[#8E3D51]"
              />
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {filteredInventory.length === 0 ? (
                <p className="text-center py-8 text-xs text-stone-400">No matching sarees found.</p>
              ) : (
                filteredInventory.map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-stone-100 bg-stone-50 hover:bg-amber-50/40 hover:border-amber-200 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="h-12 w-12 rounded-xl object-cover border border-stone-200 shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-stone-200 flex items-center justify-center text-stone-400 shrink-0">
                          <Layers size={18} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-stone-900 truncate">{prod.name}</h4>
                        <p className="text-[10px] text-stone-400 font-mono">{prod.id}</p>
                        <p className="text-xs font-semibold text-[#8E3D51] mt-0.5">
                          ₹{prod.salePrice?.toLocaleString("en-IN") || "0"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddFromInventory(prod)}
                      className="shrink-0 flex items-center gap-1 rounded-xl bg-[#2A0E20] hover:bg-[#3D142E] text-amber-100 px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs"
                    >
                      <Plus size={13} />
                      <span>Select</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
