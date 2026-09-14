import React, { useState, useEffect } from "react";
import {
  FiTag,
  FiStar,
  FiPlus,
  FiTrash2,
  FiImage,
  FiCheck,
  FiX,
  FiSave,
  FiSearch,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import type {
  Product,
  SaleConfig,
  SaleTierOffer,
  SaleProductItem,
} from "../types/inventory";
import { API_BASE } from "../config/api";
import { useModal } from "../context/ModalContext";

interface SaleManagerProps {
  inventory: Product[];
}

const DEFAULT_OFFERS: SaleTierOffer[] = [
  { id: "tier-1", qty: 1, price: 2500, label: "Buy 1 @2500/-", savingsText: "Special Single Drape Offer" },
  { id: "tier-2", qty: 2, price: 4900, label: "Buy 2 @4900/-", savingsText: "Popular Double Drape Combo" },
  { id: "tier-3", qty: 3, price: 4800, label: "Buy 3 @4800/-", savingsText: "Grand Celebration Value" },
];

const PRESET_LOOM_IMAGES = [
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1610030469668-93510cb67655?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=900&auto=format&fit=crop&q=80",
];

export default function SaleManager({ inventory }: SaleManagerProps) {
  const { toast } = useModal();
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddSareeModalOpen, setIsAddSareeModalOpen] = useState(false);
  const [editingImageItem, setEditingImageItem] = useState<SaleProductItem | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState("");

  const [saleConfig, setSaleConfig] = useState<SaleConfig>(() => {
    try {
      const saved = localStorage.getItem("rs_fashions_sale_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          tierOffers: parsed.tierOffers && parsed.tierOffers.length > 0 ? parsed.tierOffers : DEFAULT_OFFERS,
        };
      }
    } catch {}
    return {
      isEnabled: true,
      saleTitle: "For Sale & Exclusive Offers",
      subtitle: "Artisanal handwoven drapes with exclusive multi-piece bundle pricing",
      discountBadge: "Bundle Offers",
      couponCode: "FESTIVEBUNDLE",
      tierOffers: DEFAULT_OFFERS,
      saleItems: [],
      saleProductIds: [],
    };
  });

  // Hydrate sale items from inventory if empty
  useEffect(() => {
    if ((!saleConfig.saleItems || saleConfig.saleItems.length === 0) && inventory.length > 0) {
      const initialItems: SaleProductItem[] = inventory.slice(0, 6).map((p) => {
        const pAny = p as any;
        const currentPrice = p.salePrice || 2500;
        return {
          id: p.id,
          name: p.name,
          imageUrl: p.imageUrl || pAny.images?.[0] || PRESET_LOOM_IMAGES[0],
          originalPrice: pAny.originalPrice || Math.round(currentPrice * 1.3),
          salePrice: currentPrice,
          category: pAny.category || p.categoryId || "SiCo Gadwal Sarees",
          isActive: true,
        };
      });
      setSaleConfig((prev) => ({
        ...prev,
        saleItems: initialItems,
        saleProductIds: initialItems.map((it) => it.id),
      }));
    }
  }, [inventory, saleConfig.saleItems]);

  // Load from backend
  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE}/settings/sale`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const conf = data?.data?.saleConfig || data?.saleConfig;
        if (isMounted && conf) {
          setSaleConfig((prev) => ({
            ...prev,
            ...conf,
            tierOffers: conf.tierOffers && conf.tierOffers.length > 0 ? conf.tierOffers : DEFAULT_OFFERS,
            saleItems: conf.saleItems || prev.saleItems || [],
          }));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Save changes to backend & sync localStorage
  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem("rs_fashions_sale_config", JSON.stringify(saleConfig));
      window.dispatchEvent(new Event("rs_fashions_sale_config_updated"));

      const res = await fetch(`${API_BASE}/settings/sale`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleConfig }),
      });

      if (!res.ok) {
        throw new Error("Failed to save to server");
      }

      toast(
        "Sale Configuration Saved",
        saleConfig.isEnabled
          ? "Sale is live with updated bundle offers and cards."
          : "Sale section is now OFF and hidden from the website.",
        "success"
      );
    } catch (err: any) {
      toast("Saved Locally", "Saved in browser session, backend offline.", "info");
    } finally {
      setSaving(false);
    }
  };

  // Master Toggle change
  const handleToggle = (enabled: boolean) => {
    const updated = { ...saleConfig, isEnabled: enabled };
    setSaleConfig(updated);
    localStorage.setItem("rs_fashions_sale_config", JSON.stringify(updated));
    window.dispatchEvent(new Event("rs_fashions_sale_config_updated"));
    toast(
      enabled ? "Sale Showcase Active" : "Sale Showcase Hidden",
      enabled
        ? "The For Sale section is now visible on the website."
        : "The For Sale section is completely removed from the website layout.",
      enabled ? "success" : "info"
    );
  };

  // Tier Offer changes
  const handleTierOfferChange = (index: number, field: keyof SaleTierOffer, value: any) => {
    const newTiers = [...(saleConfig.tierOffers || DEFAULT_OFFERS)];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setSaleConfig({ ...saleConfig, tierOffers: newTiers });
  };

  const addTierOffer = () => {
    const newTiers = [...(saleConfig.tierOffers || DEFAULT_OFFERS)];
    const nextQty = (newTiers[newTiers.length - 1]?.qty || 3) + 1;
    newTiers.push({
      id: `tier-${Date.now()}`,
      qty: nextQty,
      price: nextQty * 2400,
      label: `Buy ${nextQty} @${nextQty * 2400}/-`,
      savingsText: "Multi-drape discount",
    });
    setSaleConfig({ ...saleConfig, tierOffers: newTiers });
  };

  const removeTierOffer = (index: number) => {
    const newTiers = [...(saleConfig.tierOffers || DEFAULT_OFFERS)];
    newTiers.splice(index, 1);
    setSaleConfig({ ...saleConfig, tierOffers: newTiers });
  };

  // Saree Card image update
  const openImageEditor = (item: SaleProductItem) => {
    setEditingImageItem(item);
    setCustomImageUrl(item.imageUrl);
  };

  const saveItemImage = (newUrl: string) => {
    if (!editingImageItem) return;
    const updatedItems = (saleConfig.saleItems || []).map((it) => {
      if (it.id === editingImageItem.id) {
        return { ...it, imageUrl: newUrl };
      }
      return it;
    });
    setSaleConfig({ ...saleConfig, saleItems: updatedItems });
    setEditingImageItem(null);
    setCustomImageUrl("");
    toast("Image Updated", `Card image for "${editingImageItem.name}" updated.`, "success");
  };

  // Toggle item active state
  const toggleItemActive = (id: string) => {
    const updatedItems = (saleConfig.saleItems || []).map((it) => {
      if (it.id === id) {
        return { ...it, isActive: !it.isActive };
      }
      return it;
    });
    setSaleConfig({ ...saleConfig, saleItems: updatedItems });
  };

  // Add Saree from inventory to sale items
  const addSareeToSale = (prod: Product) => {
    const exists = saleConfig.saleItems?.some((it) => it.id === prod.id);
    if (exists) {
      toast("Already Added", `${prod.name} is already in the sale showcase.`, "info");
      return;
    }
    const pAny = prod as any;
    const currentPrice = prod.salePrice || 2500;
    const newItem: SaleProductItem = {
      id: prod.id,
      name: prod.name,
      imageUrl: prod.imageUrl || pAny.images?.[0] || PRESET_LOOM_IMAGES[0],
      originalPrice: pAny.originalPrice || Math.round(currentPrice * 1.3),
      salePrice: currentPrice,
      category: pAny.category || prod.categoryId || "SiCo Gadwal Sarees",
      isActive: true,
    };
    setSaleConfig({
      ...saleConfig,
      saleItems: [newItem, ...(saleConfig.saleItems || [])],
      saleProductIds: [newItem.id, ...(saleConfig.saleProductIds || [])],
    });
    setIsAddSareeModalOpen(false);
    toast("Saree Added to Sale", `${prod.name} added to sale showcase.`, "success");
  };

  // Remove Saree from sale items
  const removeItemFromSale = (id: string) => {
    const filtered = (saleConfig.saleItems || []).filter((it) => it.id !== id);
    setSaleConfig({
      ...saleConfig,
      saleItems: filtered,
      saleProductIds: filtered.map((it) => it.id),
    });
    toast("Removed", "Item removed from sale showcase.", "info");
  };

  // Filtered sale items for search
  const filteredSaleItems = (saleConfig.saleItems || []).filter((it) =>
    it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (it.category && it.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8E3D51] text-white text-[10.5px] font-bold uppercase tracking-wider">
              <FiTag size={12} />
              <span>Promotions &amp; Offers</span>
            </span>
            <span className="text-xs text-stone-500 font-medium">· Dedicated Admin Module</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Sale &amp; Bundle Offers Manager
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
            Manage your high-conversion tiered bundle offers (Buy 1 @2500/-, Buy 2 @4900/-, Buy 3 @4800/-)
            and customize card images showcase directly on the customer storefront.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2A0E20] hover:bg-[#8E3D51] text-amber-100 hover:text-white font-medium text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <FiSave size={15} />
            <span>{saving ? "Saving Changes..." : "Save All Changes"}</span>
          </button>
        </div>
      </div>

      {/* MASTER TOGGLE CARD */}
      <div
        className={`p-6 rounded-2xl border transition-all shadow-sm ${
          saleConfig.isEnabled
            ? "bg-linear-to-r from-emerald-500/10 via-emerald-50/50 to-white border-emerald-300"
            : "bg-linear-to-r from-rose-500/10 via-rose-50/50 to-white border-rose-200"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  saleConfig.isEnabled ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                }`}
              />
              <h3 className="font-display font-bold text-base text-stone-900">
                Master Sale Showcase Toggle
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  saleConfig.isEnabled
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {saleConfig.isEnabled ? "LIVE ON WEBSITE" : "HIDDEN (ZERO LAYOUT FOOTPRINT)"}
              </span>
            </div>
            <p className="text-xs text-stone-600 max-w-2xl">
              When switched <strong className="text-stone-900">ON</strong>, the sale cards and bundle offer banner appear on the homepage right before trending pieces. When switched <strong className="text-stone-900">OFF</strong>, the entire section completely vanishes with no blank gaps.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={saleConfig.isEnabled}
                onChange={(e) => handleToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600 shadow-inner"></div>
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 1: TIERED BUNDLE PRICING OFFERS (Buy 1 @2500/-, Buy 2 @4900/-, Buy 3 @4800/-) */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-[#8E3D51]">
              <FiStar size={16} />
              <h2 className="font-display font-bold text-base text-stone-900">
                Tiered Bundle Offers Configuration
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Define exact combo prices like <span className="font-semibold text-stone-700">Buy 1 @2500/-</span>, <span className="font-semibold text-stone-700">Buy 2 @4900/-</span>, and <span className="font-semibold text-stone-700">Buy 3 @4800/-</span>.
            </p>
          </div>

          <button
            type="button"
            onClick={addTierOffer}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 text-xs font-semibold transition-all active:scale-95"
          >
            <FiPlus size={14} />
            <span>Add Bundle Tier</span>
          </button>
        </div>

        {/* TIER CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(saleConfig.tierOffers || DEFAULT_OFFERS).map((tier, idx) => (
            <div
              key={tier.id || idx}
              className="p-4 rounded-2xl bg-linear-to-b from-[#FAF7F2] to-white border border-[#D4A373]/40 shadow-sm space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-[#2A0E20] text-amber-100 text-[10px] font-bold uppercase tracking-wider">
                  Tier #{idx + 1}
                </span>
                {(saleConfig.tierOffers || DEFAULT_OFFERS).length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTierOffer(idx)}
                    title="Remove this offer tier"
                    className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                  >
                    <FiTrash2 size={13} />
                  </button>
                )}
              </div>

              {/* Offer Display Label */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Offer Display Label
                </label>
                <input
                  type="text"
                  value={tier.label}
                  onChange={(e) => handleTierOfferChange(idx, "label", e.target.value)}
                  placeholder="e.g. Buy 1 @2500/-"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#8E3D51] bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Quantity */}
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    Drape Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tier.qty}
                    onChange={(e) =>
                      handleTierOfferChange(idx, "qty", parseInt(e.target.value) || 1)
                    }
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-[#8E3D51] bg-white"
                  />
                </div>

                {/* Bundle Price (INR) */}
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    Bundle Price (₹)
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={tier.price}
                    onChange={(e) =>
                      handleTierOfferChange(idx, "price", parseInt(e.target.value) || 0)
                    }
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-[#8E3D51] focus:outline-none focus:border-[#8E3D51] bg-white"
                  />
                </div>
              </div>

              {/* Sub-text / Savings banner */}
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Savings Note / Badge
                </label>
                <input
                  type="text"
                  value={tier.savingsText || ""}
                  onChange={(e) => handleTierOfferChange(idx, "savingsText", e.target.value)}
                  placeholder="e.g. Save ₹200 or Festive Value"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-[11px] text-stone-700 focus:outline-none focus:border-[#8E3D51] bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: SALE TEXT & METADATA */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm space-y-4">
        <h2 className="font-display font-bold text-base text-stone-900 border-b border-stone-100 pb-3">
          Headlines &amp; Storefront Messaging
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Section Title
            </label>
            <input
              type="text"
              value={saleConfig.saleTitle}
              onChange={(e) => setSaleConfig({ ...saleConfig, saleTitle: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-[#8E3D51]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Badge Label
            </label>
            <input
              type="text"
              value={saleConfig.discountBadge}
              onChange={(e) => setSaleConfig({ ...saleConfig, discountBadge: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-[#8E3D51]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Optional Coupon Code
            </label>
            <input
              type="text"
              value={saleConfig.couponCode || ""}
              onChange={(e) => setSaleConfig({ ...saleConfig, couponCode: e.target.value })}
              placeholder="e.g. BUNDLE50"
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-mono font-bold text-[#8E3D51] uppercase focus:outline-none focus:border-[#8E3D51]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Subtitle / Caption
            </label>
            <input
              type="text"
              value={saleConfig.subtitle}
              onChange={(e) => setSaleConfig({ ...saleConfig, subtitle: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-[#8E3D51]"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: SAREE CARDS SHOWCASE (Change Images, Edit Pricing, Reorder) */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-base text-stone-900">
                Saree Showcase Cards
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-xs font-bold">
                {saleConfig.saleItems?.length || 0} Sarees
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Click <span className="font-semibold text-stone-700">Change Image</span> on any card to update its photo with curated loom presets or custom URLs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <FiSearch
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search showcase..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#8E3D51] w-48"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsAddSareeModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2A0E20] hover:bg-[#8E3D51] text-amber-100 text-xs font-medium transition-all active:scale-95"
            >
              <FiPlus size={14} />
              <span>Add From Inventory</span>
            </button>
          </div>
        </div>

        {/* CARDS GRID */}
        {filteredSaleItems.length === 0 ? (
          <div className="text-center py-12 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            <FiImage size={32} className="mx-auto text-stone-300 mb-2" />
            <p className="text-sm font-semibold text-stone-700">No Sarees In Sale Showcase</p>
            <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
              Click &quot;Add From Inventory&quot; to pick sarees to feature under the sale section with customizable images.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredSaleItems.map((item) => {
              const currentSalePrice = item.salePrice || 2500;
              return (
                <div
                  key={item.id}
                  className={`group flex flex-col rounded-2xl border transition-all duration-300 overflow-hidden bg-white ${
                    item.isActive === false
                      ? "opacity-60 border-dashed border-stone-300"
                      : "border-stone-200/90 hover:shadow-lg hover:border-[#D4A373]/60"
                  }`}
                >
                  {/* Image Container with Hover Action */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradient bottom bar */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20 opacity-40 group-hover:opacity-60 transition-opacity" />

                    {/* Top Status & Offer Tag */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                      <span className="px-2 py-0.5 rounded-full bg-[#8E3D51] text-white text-[9.5px] font-bold tracking-wider uppercase shadow-md">
                        {item.customOfferText || "Sale Pick"}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleItemActive(item.id)}
                        className="pointer-events-auto p-1 rounded-lg bg-black/40 text-white hover:bg-black/70 backdrop-blur-sm transition-all"
                        title={item.isActive === false ? "Enable on storefront" : "Disable on storefront"}
                      >
                        {item.isActive === false ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                      </button>
                    </div>

                    {/* Change Image Overlay Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[2px]">
                      <button
                        type="button"
                        onClick={() => openImageEditor(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-stone-900 font-semibold text-xs shadow-md hover:bg-amber-100 transition-all active:scale-95"
                      >
                        <FiImage size={14} className="text-[#8E3D51]" />
                        <span>Change Image</span>
                      </button>
                    </div>
                  </div>

                  {/* Saree Card Meta & Inline Editing */}
                  <div className="p-3.5 flex flex-col flex-1 justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-semibold text-[#8E3D51] uppercase tracking-wider block">
                        {item.category || "SiCo Gadwal Saree"}
                      </span>
                      <h3 className="font-display font-semibold text-xs text-stone-900 truncate mt-0.5">
                        {item.name}
                      </h3>
                    </div>

                    {/* Price & Offer Badging */}
                    <div className="space-y-2 pt-2 border-t border-stone-100">
                      <div className="flex items-center justify-between">
                        <div>
                          {item.originalPrice && item.originalPrice > currentSalePrice && (
                            <span className="text-[11px] text-stone-400 line-through mr-1.5">
                              ₹{item.originalPrice.toLocaleString("en-IN")}
                            </span>
                          )}
                          <span className="text-xs font-bold text-stone-900">
                            ₹{currentSalePrice.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Bundle Ready
                        </span>
                      </div>

                      {/* Offer Tag Input */}
                      <div>
                        <input
                          type="text"
                          value={item.customOfferText || ""}
                          onChange={(e) => {
                            const updated = (saleConfig.saleItems || []).map((it) =>
                              it.id === item.id ? { ...it, customOfferText: e.target.value } : it
                            );
                            setSaleConfig({ ...saleConfig, saleItems: updated });
                          }}
                          placeholder="Tag (e.g. Buy 1 @2500/-)"
                          className="w-full px-2.5 py-1 rounded-lg border border-stone-200 text-[11px] text-stone-700 focus:outline-none focus:border-[#8E3D51]"
                        />
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => openImageEditor(item)}
                        className="text-[11px] text-stone-600 hover:text-[#8E3D51] font-medium flex items-center gap-1"
                      >
                        <FiImage size={12} />
                        <span>Change Image</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => removeItemFromSale(item.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 transition-colors"
                        title="Remove saree from sale"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* IMAGE PICKER & CUSTOM URL MODAL */}
      {editingImageItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-stone-900">
                  Update Saree Card Image
                </h3>
                <p className="text-xs text-stone-500 truncate max-w-xs">
                  {editingImageItem.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingImageItem(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Current Preview */}
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="w-16 h-20 rounded-xl overflow-hidden bg-stone-200 shrink-0 shadow-inner">
                <img
                  src={customImageUrl || editingImageItem.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-stone-400">
                  Current Display Photo
                </span>
                <p className="text-xs font-semibold text-stone-800 truncate">
                  {editingImageItem.name}
                </p>
                <span className="text-[11px] text-emerald-600 font-medium block">
                  High-res ready
                </span>
              </div>
            </div>

            {/* Curated Presets */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-2">
                Choose from Curated Handloom Presets
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_LOOM_IMAGES.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCustomImageUrl(url)}
                    className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all group ${
                      customImageUrl === url ? "border-[#8E3D51] scale-95 ring-2 ring-[#8E3D51]/30" : "border-transparent hover:opacity-80"
                    }`}
                  >
                    <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    {customImageUrl === url && (
                      <div className="absolute inset-0 bg-[#8E3D51]/40 flex items-center justify-center text-white">
                        <FiCheck size={16} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL Input */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Or Paste Any Custom Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="https://images.example.com/saree-red.jpg"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-[#8E3D51]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setEditingImageItem(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveItemImage(customImageUrl || editingImageItem.imageUrl)}
                className="px-5 py-2 rounded-xl bg-[#2A0E20] hover:bg-[#8E3D51] text-amber-100 hover:text-white text-xs font-semibold transition-all shadow-md active:scale-95"
              >
                Apply Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD SAREE MODAL FROM INVENTORY */}
      {isAddSareeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-stone-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-stone-900">
                  Select Saree from Inventory
                </h3>
                <p className="text-xs text-stone-500">
                  Add sarees to the promotional sale showcase cards
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSareeModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <FiX size={16} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {inventory.map((prod) => {
                const isAlreadyInSale = saleConfig.saleItems?.some((it) => it.id === prod.id);
                const pAny = prod as any;
                const prodImg = prod.imageUrl || pAny.images?.[0] || PRESET_LOOM_IMAGES[0];
                return (
                  <div
                    key={prod.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isAlreadyInSale
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-stone-200 bg-white hover:border-[#8E3D51]/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-14 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                        <img
                          src={prodImg}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-semibold text-xs text-stone-900 truncate">
                          {prod.name}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">
                          {pAny.category || prod.categoryId || "SiCo Gadwal Sarees"} · ₹{prod.salePrice || 2500}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => addSareeToSale(prod)}
                      disabled={isAlreadyInSale}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                        isAlreadyInSale
                          ? "bg-emerald-100 text-emerald-800 cursor-default"
                          : "bg-[#2A2421] hover:bg-[#8E3D51] text-white shadow-sm"
                      }`}
                    >
                      {isAlreadyInSale ? "Added" : "Add to Sale"}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAddSareeModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
