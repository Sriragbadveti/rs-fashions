import { useMemo, useState } from "react";
import { FiTag, FiPlus, FiTrash2, FiImage, FiX, FiSearch } from "react-icons/fi";
import type { Product } from "../types/inventory";
import { useModal } from "../context/ModalContext";
import { variantImgProps } from "../utils/imageVariants";
import { isSpecialOfferProduct } from "../utils/specialOffer";

interface SaleManagerProps {
  inventory: Product[];
  onUpdateProduct: (product: Product) => Promise<boolean> | boolean | void;
}

const OFFER_TAGS = ["special_offer", "special_edition", "limited_edition"];

const imageOf = (p: Product) => p.imageUrl || (p as any).images?.[0] || "";
const categoryOf = (p: Product) => (p as any).category || p.categoryId || "SiCo Gadwal Sarees";

/**
 * Special Offers: the sarees listed here are exactly the ones with the "Special Offer" setting on.
 * They show on the storefront's Special Offers page and nowhere else on the website.
 */
export default function SaleManager({ inventory, onUpdateProduct }: SaleManagerProps) {
  const { toast } = useModal();
  const [searchQuery, setSearchQuery] = useState("");
  const [pickerQuery, setPickerQuery] = useState("");
  const [isAddSareeModalOpen, setIsAddSareeModalOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const offerProducts = useMemo(() => inventory.filter((p) => isSpecialOfferProduct(p as any)), [inventory]);

  const visibleOffers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return offerProducts;
    return offerProducts.filter(
      (p) => (p.name || "").toLowerCase().includes(q) || String(categoryOf(p)).toLowerCase().includes(q)
    );
  }, [offerProducts, searchQuery]);

  const pickable = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter(
      (p) => (p.name || "").toLowerCase().includes(q) || String(p.id || "").toLowerCase().includes(q)
    );
  }, [inventory, pickerQuery]);

  const setOffer = async (product: Product, on: boolean) => {
    setBusyId(product.id);
    try {
      const tags = (Array.isArray((product as any).tags) ? (product as any).tags : []).filter(
        (t: string) => !OFFER_TAGS.includes(String(t).toLowerCase())
      );
      if (on) tags.push("special_offer");
      const ok = await onUpdateProduct({
        ...product,
        tags,
        isSpecialOffer: on,
        isSpecialEdition: false,
        isLimitedEdition: false,
      } as Product);
      if (ok !== false) {
        toast(
          on ? "Added to Special Offers" : "Removed from Special Offers",
          on
            ? `${product.name} now shows only on the Special Offers page.`
            : `${product.name} is back in the regular collection.`,
          on ? "success" : "info"
        );
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      <div className="border-b border-stone-200/80 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8E3D51] text-white text-[10.5px] font-bold uppercase tracking-wider">
            <FiTag size={12} />
            <span>Promotions &amp; Offers</span>
          </span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">Special Offers</h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
          Every saree added here costs ₹2,500 and appears only on the Special Offers page of the website — not in the shop,
          search, or anywhere else.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-base text-stone-900">Special Offer Sarees</h2>
            <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-xs font-bold">
              {offerProducts.length} Sarees
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search offers..."
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

        {visibleOffers.length === 0 ? (
          <div className="text-center py-12 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            <FiImage size={32} className="mx-auto text-stone-300 mb-2" />
            <p className="text-sm font-semibold text-stone-700">No sarees under Special Offers</p>
            <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
              Click &quot;Add From Inventory&quot; to pick the sarees that should appear on the Special Offers page.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {visibleOffers.map((p) => (
              <div key={p.id} className="flex flex-col rounded-2xl border border-stone-200/90 overflow-hidden bg-white">
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
                  {imageOf(p) && (
                    <img {...variantImgProps(imageOf(p), "sm")} alt={p.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-3.5 space-y-2">
                  <span className="text-[10px] font-semibold text-[#8E3D51] uppercase tracking-wider block">
                    {categoryOf(p)}
                  </span>
                  <h3 className="font-display font-semibold text-xs text-stone-900 truncate">{p.name}</h3>
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <span className="text-xs font-bold text-stone-900">₹2,500</span>
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => setOffer(p, false)}
                      className="text-stone-400 hover:text-rose-600 p-1 transition-colors disabled:opacity-40"
                      title="Remove from Special Offers"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAddSareeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-stone-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-stone-900">Select Saree from Inventory</h3>
                <p className="text-xs text-stone-500">Added sarees move to the Special Offers page</p>
              </div>
              <button type="button" onClick={() => setIsAddSareeModalOpen(false)} className="text-stone-400 hover:text-stone-600 p-1">
                <FiX size={16} />
              </button>
            </div>

            <input
              type="text"
              value={pickerQuery}
              onChange={(e) => setPickerQuery(e.target.value)}
              placeholder="Search sarees..."
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#8E3D51]"
            />

            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {pickable.map((prod) => {
                const added = isSpecialOfferProduct(prod as any);
                return (
                  <div
                    key={prod.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      added ? "border-emerald-200 bg-emerald-50/50" : "border-stone-200 bg-white hover:border-[#8E3D51]/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-14 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                        {imageOf(prod) && (
                          <img {...variantImgProps(imageOf(prod), "sm")} alt={prod.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-semibold text-xs text-stone-900 truncate">{prod.name}</p>
                        <p className="text-[11px] text-stone-500 truncate">
                          {categoryOf(prod)} · ₹{prod.salePrice || 0}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOffer(prod, true)}
                      disabled={added || busyId === prod.id}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                        added ? "bg-emerald-100 text-emerald-800 cursor-default" : "bg-[#2A2421] hover:bg-[#8E3D51] text-white shadow-sm"
                      }`}
                    >
                      {added ? "Added" : "Add to Offers"}
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
