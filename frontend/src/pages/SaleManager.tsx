import { useMemo, useRef, useState } from "react";
import { FiTag, FiPlus, FiTrash2, FiImage, FiX, FiSearch, FiUploadCloud, FiUpload, FiStar } from "react-icons/fi";
import { StoreService } from "../services/supabase";
import type { Product, Category } from "../types/inventory";
import BulkStock from "./BulkStock";
import type { BulkRestockResult } from "../types/bulkstock";
import { useModal } from "../context/ModalContext";
import { variantImgProps } from "../utils/imageVariants";
import { isSpecialOfferProduct } from "../utils/specialOffer";

interface SaleManagerProps {
  inventory: Product[];
  onUpdateProduct: (product: Product) => Promise<boolean> | boolean | void;
  /** Same as Bulk Upload: lets new sarees be added straight from this page. */
  categories?: Category[];
  onBulkRestock?: (newProducts: Product[]) => Promise<BulkRestockResult>;
}

const OFFER_TAGS = ["special_offer", "special_edition", "limited_edition"];

const imagesOf = (p: Product): string[] => {
  const list = Array.isArray((p as any).images) ? ((p as any).images as string[]).filter(Boolean) : [];
  return list.length > 0 ? list : p.imageUrl ? [p.imageUrl] : [];
};
const imageOf = (p: Product) => p.imageUrl || (p as any).images?.[0] || "";
const categoryOf = (p: Product) => (p as any).category || p.categoryId || "SiCo Gadwal Sarees";

/**
 * Special Offers: the sarees listed here are exactly the ones with the "Special Offer" setting on.
 * They show on the storefront's Special Offers page and nowhere else on the website.
 */
export default function SaleManager({ inventory, onUpdateProduct, categories = [], onBulkRestock }: SaleManagerProps) {
  const { toast } = useModal();
  const [searchQuery, setSearchQuery] = useState("");
  const [pickerQuery, setPickerQuery] = useState("");
  const [isAddSareeModalOpen, setIsAddSareeModalOpen] = useState(false);
  const [isNewSareeOpen, setIsNewSareeOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [photoTarget, setPhotoTarget] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // The saree being edited, read fresh from inventory so saved changes show straight away.
  const photoProduct = photoTarget ? inventory.find((p) => p.id === photoTarget.id) || photoTarget : null;

  const savePhotos = async (product: Product, images: string[]) => {
    const ok = await onUpdateProduct({ ...product, images, imageUrl: images[0] || "" } as Product);
    return ok !== false;
  };

  const addPhotos = async (files: FileList | null) => {
    if (!photoProduct || !files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        try {
          const res = await StoreService.uploadImage(file);
          if (res?.success && res.url) uploaded.push(res.url);
          else toast("Picture not uploaded", `${file.name}: ${res?.message || "upload failed"}`, "error");
        } catch (err: any) {
          toast("Picture not uploaded", `${file.name}: ${err?.message || "upload failed"}`, "error");
        }
      }
      if (uploaded.length > 0) {
        const ok = await savePhotos(photoProduct, [...imagesOf(photoProduct), ...uploaded]);
        if (ok) toast("Pictures saved", `${uploaded.length} picture${uploaded.length > 1 ? "s" : ""} added to ${photoProduct.name}.`, "success");
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePhoto = async (idx: number) => {
    if (!photoProduct) return;
    const current = imagesOf(photoProduct);
    if (current.length <= 1) {
      toast("Keep one picture", "A saree needs at least one picture. Add another before removing this one.", "info");
      return;
    }
    await savePhotos(photoProduct, current.filter((_, i) => i !== idx));
  };

  const makeMainPhoto = async (idx: number) => {
    if (!photoProduct || idx === 0) return;
    const current = imagesOf(photoProduct);
    await savePhotos(photoProduct, [current[idx], ...current.filter((_, i) => i !== idx)]);
  };

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
            {onBulkRestock && (
              <button
                type="button"
                onClick={() => setIsNewSareeOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#8E3D51] bg-white hover:bg-[#8E3D51]/5 text-[#8E3D51] text-xs font-semibold transition-all active:scale-95"
              >
                <FiUploadCloud size={14} />
                <span>Add New Sarees</span>
              </button>
            )}
          </div>
        </div>

        {visibleOffers.length === 0 ? (
          <div className="text-center py-12 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            <FiImage size={32} className="mx-auto text-stone-300 mb-2" />
            <p className="text-sm font-semibold text-stone-700">No sarees under Special Offers</p>
            <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
              Click &quot;Add From Inventory&quot; to pick existing sarees, or &quot;Add New Sarees&quot; to add new stock straight
              to the Special Offers page.
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
                  <button
                    type="button"
                    onClick={() => setPhotoTarget(p)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 text-[11px] font-semibold text-stone-700 hover:border-[#8E3D51] hover:text-[#8E3D51] transition-colors"
                  >
                    <FiImage size={12} />
                    <span>Add / Change Pictures ({imagesOf(p).length})</span>
                  </button>
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

      {photoProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-stone-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="min-w-0">
                <h3 className="font-display font-bold text-base text-stone-900">Pictures</h3>
                <p className="text-xs text-stone-500 truncate">{photoProduct.name}</p>
              </div>
              <button type="button" onClick={() => setPhotoTarget(null)} className="text-stone-400 hover:text-stone-600 p-1">
                <FiX size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {imagesOf(photoProduct).map((url, idx) => (
                  <div key={`${url}-${idx}`} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                    <img {...variantImgProps(url, "sm")} alt={`${photoProduct.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-[#8E3D51] text-white text-[9px] font-bold uppercase tracking-wider">
                        Main
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between p-1.5 bg-linear-to-t from-black/60 to-transparent">
                      {idx !== 0 ? (
                        <button type="button" onClick={() => makeMainPhoto(idx)} title="Make main picture" className="p-1 rounded-lg bg-white/90 text-stone-800 hover:bg-white">
                          <FiStar size={12} />
                        </button>
                      ) : <span />}
                      <button type="button" onClick={() => removePhoto(idx)} title="Remove picture" className="p-1 rounded-lg bg-white/90 text-rose-600 hover:bg-white">
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[3/4] rounded-xl border-2 border-dashed border-stone-300 text-stone-500 hover:border-[#8E3D51] hover:text-[#8E3D51] flex flex-col items-center justify-center gap-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50"
                >
                  <FiUpload size={18} />
                  <span>{uploading ? "Uploading..." : "Add pictures"}</span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addPhotos(e.target.files)}
              />
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button type="button" onClick={() => setPhotoTarget(null)} className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {isNewSareeOpen && onBulkRestock && (
        // No backdrop blur here: it would trap Bulk Upload's own pop-ups inside this panel.
        <div className="fixed inset-0 z-60 flex flex-col bg-[#F7F3EE]" role="dialog" aria-modal="true" aria-label="Add new Special Offer sarees">
          <div className="flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <h3 className="font-display font-bold text-base text-stone-900">Add New Special Offer Sarees</h3>
              <p className="text-xs text-stone-500">
                Same as Bulk Upload: new stock is added to inventory and every saree goes straight to the Special Offers page (₹2,500).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsNewSareeOpen(false)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50"
            >
              <FiX size={14} />
              <span>Done</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 sm:p-6">
            <BulkStock inventory={inventory} categories={categories} onBulkRestock={onBulkRestock} forceSpecialOffer />
          </div>
        </div>
      )}

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
