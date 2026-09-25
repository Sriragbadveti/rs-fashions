import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Package,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Image as ImageIcon,
  Upload,
  ShieldCheck,
  ChevronDown,
  Search,
  Copy,
  Minus,
  X,
  Layers,
  Boxes,
  ImagePlus,
  CheckCircle2,
  ArrowRight,
  Info,
} from "lucide-react";
import type { Product, Category } from "../types/inventory";
import { MOCK_DESIGNS, COLOR_CODES } from "../types/inventory";
import { generateColorSlug, normalizeText } from "../types/catalog";
import { sound } from "../types/soundEngine";
import { StoreService } from "../services/supabase";

interface BulkStockProps {
  inventory: Product[];
  categories: Category[];
  onBulkRestock: (newProducts: Product[]) => void;
}

type OrderMode = "single" | "dual";

interface BulkRow {
  id: string;
  color1: string;
  color2: string;
  qty: number;
  imageUrl?: string;
}

type DropdownOption = {
  value: string;
  label: string;
  description?: string;
  code?: string;
  swatch?: string;
};

interface PremiumDropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  allowCustom?: boolean;
}

function PremiumDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Select...",
  searchable = true,
  disabled = false,
  className = "",
  allowCustom = false,
}: PremiumDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected =
    options.find((option) => normalizeText(option.value) === normalizeText(value)) ||
    (value ? { value, label: value, description: "Custom Hue", code: generateColorSlug(value) } : undefined);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return options;

    return options.filter((option) =>
      [option.label, option.description, option.code]
        .filter(Boolean)
        .some((text) => text!.toLowerCase().includes(query))
    );
  }, [options, search]);

  const hasCustom =
    allowCustom &&
    search.trim() &&
    !options.some(
      (opt) =>
        normalizeText(opt.label) === normalizeText(search) ||
        normalizeText(opt.value) === normalizeText(search)
    );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (open && searchable) {
      requestAnimationFrame(() => {
        searchRef.current?.focus();
      });
    }
  }, [open, searchable]);

  const handleSelect = (option: DropdownOption) => {
    sound.playClick();
    onChange(option.value);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={wrapperRef} className={`relative flex flex-col ${className}`}>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
        {label}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          sound.playClick();
          setOpen((prev) => !prev);
        }}
        className={`group flex h-11 w-full items-center gap-2.5 rounded-2xl border bg-white/90 px-3.5 text-left shadow-2xs backdrop-blur-md transition-all duration-200 ${open
            ? "border-[#D4A373] ring-4 ring-[#D4A373]/15 shadow-sm"
            : "border-stone-200/80 hover:border-stone-300 hover:bg-white"
          } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        {selected?.swatch && (
          <span
            className="h-4 w-4 shrink-0 rounded-md border border-black/10 shadow-2xs"
            style={{ backgroundColor: selected.swatch }}
          />
        )}

        <span className="min-w-0 flex-1 truncate">
          <span className="block truncate text-xs font-semibold text-stone-900">
            {selected?.label || placeholder}
          </span>
          {selected?.description && (
            <span className="block truncate text-[9.5px] text-stone-400 font-light">
              {selected.description}
            </span>
          )}
        </span>

        {selected?.code && (
          <span className="hidden shrink-0 rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#8E3D51] sm:inline-block">
            {selected.code}
          </span>
        )}

        <ChevronDown
          size={14}
          className={`shrink-0 text-stone-400 transition-transform duration-200 ${open ? "rotate-180 text-stone-700" : ""
            }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-stone-200/90 bg-white/95 shadow-xl backdrop-blur-xl animate-in fade-in duration-150">
          {searchable && (
            <div className="border-b border-stone-100 bg-stone-50/70 p-2">
              <div className="flex items-center gap-2 rounded-xl border border-stone-200/80 bg-white px-3 py-1">
                <Search size={13} className="shrink-0 text-stone-400" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={allowCustom ? `Search or type custom ${label.toLowerCase()}...` : `Search ${label.toLowerCase()}...`}
                  className="h-7 min-w-0 flex-1 bg-transparent text-xs text-stone-800 outline-none placeholder:text-stone-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="rounded-md p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto p-1.5 [scrollbar-width:thin]">
            {filteredOptions.length === 0 && !hasCustom ? (
              <div className="px-4 py-6 text-center">
                <Search size={16} className="mx-auto mb-1.5 text-stone-300" />
                <p className="text-xs font-semibold text-stone-600">No match found</p>
                <p className="mt-0.5 text-[10px] text-stone-400 font-light">Try another search keyword</p>
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = normalizeText(option.value) === normalizeText(value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors ${isSelected
                        ? "bg-[#2A0E20] text-amber-100"
                        : "text-stone-700 hover:bg-stone-50 font-medium"
                      }`}
                  >
                    {option.swatch && (
                      <span
                        className="h-4 w-4 shrink-0 rounded-md border border-black/10 shadow-2xs"
                        style={{ backgroundColor: option.swatch }}
                      />
                    )}

                    <div className="min-w-0 flex-1 truncate">
                      <span
                        className={`block truncate text-xs font-semibold ${isSelected ? "text-amber-100 font-bold" : "text-stone-800"
                          }`}
                      >
                        {option.label}
                      </span>
                      {option.description && (
                        <span
                          className={`block truncate text-[9.5px] ${isSelected ? "text-amber-100/70" : "text-stone-400"
                            }`}
                        >
                          {option.description}
                        </span>
                      )}
                    </div>

                    {option.code && (
                      <span
                        className={`hidden shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold sm:inline-block ${isSelected
                            ? "bg-white/15 text-amber-200"
                            : "bg-stone-100 text-[#8E3D51]"
                          }`}
                      >
                        {option.code}
                      </span>
                    )}

                    {isSelected && (
                      <Check size={13} className="shrink-0 text-amber-300" />
                    )}
                  </button>
                );
              })
            )}

            {hasCustom && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  const customVal = search.trim();
                  onChange(customVal);
                  setOpen(false);
                  setSearch("");
                }}
                className="mt-1 flex w-full items-center gap-2 rounded-xl bg-amber-50/80 p-2.5 text-left transition-colors hover:bg-amber-100 border border-amber-200/60"
              >
                <Plus size={13} className="shrink-0 text-[#2A0E20]" />
                <span className="truncate text-xs font-bold text-[#2A0E20]">
                  Use Custom Hue "{search.trim()}"
                </span>
              </button>
            )}
          </div>

          {options.length > 0 && (
            <div className="border-t border-stone-100 bg-stone-50/70 px-3 py-1.5">
              <span className="text-[9px] font-mono text-stone-400">
                Showing {filteredOptions.length} of {options.length} options
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BulkStock({
  inventory,
  categories,
  onBulkRestock,
}: BulkStockProps) {
  const [orderMode, setOrderMode] = useState<OrderMode>("single");

  const [selectedDesignSlug, setSelectedDesignSlug] = useState(
    MOCK_DESIGNS[0]?.slug || ""
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState("c1");

  const [purchasePrice, setPurchasePrice] = useState<number>();
  const [salePrice, setSalePrice] = useState<number>();

  const [bulkRows, setBulkRows] = useState<BulkRow[]>([
    {
      id: "row-1",
      color1: COLOR_CODES[0]?.name || "",
      color2: COLOR_CODES[1]?.name || "",
      qty: 5,
      imageUrl: "",
    },
  ]);

  const [applyQty, setApplyQty] = useState<number>(5);
  const [successBatch, setSuccessBatch] = useState<{
    isOpen: boolean;
    designName: string;
    totalPieces: number;
    variantsCount: number;
    categoryName: string;
    skus: string[];
  } | null>(null);

  const designOptions: DropdownOption[] = useMemo(
    () =>
      MOCK_DESIGNS.map((design) => ({
        value: design.slug,
        label: design.name,
        code: design.slug,
      })),
    []
  );

  const categoryOptions: DropdownOption[] = useMemo(
    () => [
      {
        value: "c1",
        label: "SiCo Gadwal Sarees",
        code: "5208",
        description: "HSN: 5208 · Exclusive SiCo Gadwal Handloom Weave",
      },
    ],
    []
  );

  const colorOptions: DropdownOption[] = useMemo(
    () =>
      COLOR_CODES.map((color) => ({
        value: color.name,
        label: color.name,
        description: `Code: ${color.code}`,
        code: color.code,
      })),
    []
  );

  const selectedDesign = useMemo(
    () => MOCK_DESIGNS.find((d) => d.slug === selectedDesignSlug),
    [selectedDesignSlug]
  );

  const totalPieces = useMemo(
    () => bulkRows.reduce((sum, row) => sum + Math.max(0, row.qty), 0),
    [bulkRows]
  );

  const imageCount = useMemo(
    () => bulkRows.filter((row) => row.imageUrl).length,
    [bulkRows]
  );

  const addRow = () => {
    sound.playClick();
    setBulkRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random()}`,
        color1: COLOR_CODES[0]?.name || "",
        color2: COLOR_CODES[1]?.name || "",
        qty: 5,
        imageUrl: "",
      },
    ]);
  };

  const duplicateRow = (row: BulkRow) => {
    sound.playClick();
    setBulkRows((prev) => [
      ...prev,
      {
        ...row,
        id: `duplicate-${Date.now()}-${Math.random()}`,
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (bulkRows.length === 1) return;
    sound.playClick();
    setBulkRows((prev) => prev.filter((row) => row.id !== id));
  };

  const updateRow = (
    id: string,
    field: keyof BulkRow,
    value: string | number
  ) => {
    setBulkRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleSingleImageUpload = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      sound.playClick();
      const dataUrl = reader.result as string;
      updateRow(id, "imageUrl", dataUrl);

      try {
        const uploadRes = await StoreService.uploadImage(dataUrl);
        if (uploadRes.success && uploadRes.url) {
          updateRow(id, "imageUrl", uploadRes.url);
        }
      } catch (err) {
        console.warn("Bulk image upload notice:", err);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleBulkImagesUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    sound.playGunReload();
    const fileList = Array.from(files);

    fileList.forEach((file, index) => {
      const reader = new FileReader();

      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        const rowId = `bulk-row-${Date.now()}-${index}`;

        setBulkRows((prev) => {
          const newRow: BulkRow = {
            id: rowId,
            color1: COLOR_CODES[index % COLOR_CODES.length]?.name || "",
            color2: COLOR_CODES[(index + 1) % COLOR_CODES.length]?.name || "",
            qty: 5,
            imageUrl: dataUrl,
          };

          if (prev.length === 1 && !prev[0].imageUrl && prev[0].qty === 5) {
            return [newRow];
          }

          return [...prev, newRow];
        });

        try {
          const uploadRes = await StoreService.uploadImage(dataUrl);
          if (uploadRes.success && uploadRes.url) {
            updateRow(rowId, "imageUrl", uploadRes.url);
          }
        } catch (err) {
          console.warn("Bulk image batch sync notice:", err);
        }
      };

      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const applyQuantityToAll = () => {
    const safeQty = Math.max(1, Number(applyQty) || 1);
    sound.playClick();
    setBulkRows((prev) => prev.map((row) => ({ ...row, qty: safeQty })));
  };

  const handleCommitBulkStock = (e: React.FormEvent) => {
    e.preventDefault();

    const designObj = MOCK_DESIGNS.find((d) => d.slug === selectedDesignSlug);
    if (!designObj || !selectedCategoryId) return;

    const validRows = bulkRows.filter((row) => row.qty > 0);
    if (validRows.length === 0) return;

    const newProducts: Product[] = validRows.map((row, idx) => {
      const color1Name = (row.color1 || "").trim() || "Standard";
      const color1Obj = COLOR_CODES.find((c) => normalizeText(c.name) === normalizeText(color1Name));
      const color1Code = color1Obj ? color1Obj.code : generateColorSlug(color1Name);

      const color2Name = orderMode === "dual" ? (row.color2 || "").trim() : "";
      const color2Obj = color2Name
        ? COLOR_CODES.find((c) => normalizeText(c.name) === normalizeText(color2Name))
        : null;
      const color2Code = color2Name ? (color2Obj ? color2Obj.code : generateColorSlug(color2Name)) : null;

      const finalColorName = color2Name
        ? `${color1Name} / ${color2Name}`
        : color1Name;

      const finalColorSlug = color2Code
        ? `${color1Code}-${color2Code}`
        : color1Code;

      const serialNum = String(inventory.length + idx + 1).padStart(3, "0");
      const sku = `RSF-${designObj.slug}-${finalColorSlug}-${serialNum}`;

      return {
        id: sku,
        name: designObj.name,
        categoryId: selectedCategoryId,
        purchasePrice: purchasePrice ?? 0,
        salePrice: salePrice ?? 0,
        tags: [
          "bulk-restock",
          orderMode === "dual" ? "dual-tone" : "single-tone",
        ],
        imageUrl: row.imageUrl || undefined,
        variants: [
          {
            color: finalColorName,
            colorSlug: finalColorSlug,
            stock: row.qty,
            sku: sku,
          },
        ],
      };
    });

    onBulkRestock(newProducts);
    sound.playNotification();

    const catObj = categories.find((c) => c.id === selectedCategoryId);
    setSuccessBatch({
      isOpen: true,
      designName: designObj.name,
      totalPieces: validRows.reduce((sum, r) => sum + r.qty, 0),
      variantsCount: validRows.length,
      categoryName: catObj?.name || "SiCo Gadwal Sarees",
      skus: newProducts.map((p) => p.id),
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-16 font-sans select-none">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between border-b border-stone-200/50 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight text-stone-950 mt-1">
            Bulk Consignment Intake
          </h1>
          <p className="mt-1 text-xs text-stone-500 font-light">
            Batch import saree photographs, configure color contrasts, and auto-generate unique inventory SKUs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white/70 px-4 py-2 text-xs text-stone-700 shadow-2xs backdrop-blur-md">
          <Boxes size={15} className="text-[#8E3D51]" />
          <span>
            Current Catalog: <strong>{inventory.length} designs active</strong>
          </span>
        </div>
      </div>

      {/* TONE ARCHITECTURE MODE SWITCH */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setOrderMode("single");
          }}
          className={`group relative flex items-center gap-4 rounded-3xl border p-5 text-left transition-all duration-300 ${orderMode === "single"
              ? "border-[#2A0E20] bg-[#2A0E20] text-amber-100 shadow-[0_8px_25px_rgba(42,14,32,0.18)]"
              : "border-white/80 bg-white/70 text-stone-800 backdrop-blur-xl hover:border-stone-300 hover:bg-white shadow-2xs"
            }`}
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 shadow-2xs ${orderMode === "single"
                ? "bg-white/10 text-amber-300"
                : "bg-amber-50 text-amber-800"
              }`}
          >
            <Package size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold tracking-wide uppercase">Single Tone Shade</h2>
              {orderMode === "single" && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                  <Check size={11} className="text-amber-300" />
                </span>
              )}
            </div>
            <p
              className={`mt-0.5 text-[11px] font-light leading-relaxed ${orderMode === "single" ? "text-amber-100/70" : "text-stone-500"
                }`}
            >
              Solid monochromatic bodies and matching borders
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setOrderMode("dual");
          }}
          className={`group relative flex items-center gap-4 rounded-3xl border p-5 text-left transition-all duration-300 ${orderMode === "dual"
              ? "border-[#2A0E20] bg-[#2A0E20] text-amber-100 shadow-[0_8px_25px_rgba(42,14,32,0.18)]"
              : "border-white/80 bg-white/70 text-stone-800 backdrop-blur-xl hover:border-stone-300 hover:bg-white shadow-2xs"
            }`}
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 shadow-2xs ${orderMode === "dual"
                ? "bg-white/10 text-amber-300"
                : "bg-purple-50 text-purple-700"
              }`}
          >
            <Sparkles size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold tracking-wide uppercase">Dual Tone / Contrast Border</h2>
              {orderMode === "dual" && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                  <Check size={11} className="text-amber-300" />
                </span>
              )}
            </div>
            <p
              className={`mt-0.5 text-[11px] font-light leading-relaxed ${orderMode === "dual" ? "text-amber-100/70" : "text-stone-500"
                }`}
            >
              Contrast kuttu borders, zari pallus, and dual temple drapes
            </p>
          </div>
        </button>
      </div>

      {/* MAIN CONSIGNMENT FORM PANEL */}
      <form
        onSubmit={handleCommitBulkStock}
        className="rounded-3xl border border-white/80 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgba(42,14,32,0.03)] overflow-hidden"
      >
        {/* PANEL HEADER */}
        <div className="flex flex-col gap-3 border-b border-stone-200/50 px-6 py-4.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-base font-bold text-stone-900">
              Master Consignment Information
            </h2>
            <p className="mt-0.5 text-[11px] text-stone-500 font-light">
              Attributes configured here propagate across all imported saree variations.
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 font-mono text-[10px] font-bold text-[#8E3D51] border border-stone-200/80 shadow-2xs">
            <span>{bulkRows.length} shade rows pending</span>
          </div>
        </div>

        {/* MASTER INPUT CONTROLS */}
        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          <PremiumDropdown
            label="Gadwal Motif / Pattern"
            value={selectedDesignSlug}
            options={designOptions}
            onChange={setSelectedDesignSlug}
          />

          <PremiumDropdown
            label="Weave Standard"
            value={selectedCategoryId}
            options={categoryOptions}
            onChange={setSelectedCategoryId}
          />

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
              Weaver Loom Cost (₹)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                ₹
              </span>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={purchasePrice ?? ""}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                className="h-11 w-full rounded-2xl border border-stone-200/80 bg-white/90 pl-8 pr-3 text-xs font-semibold text-stone-900 outline-none transition-all focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
              Showroom Selling Price (₹)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                ₹
              </span>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={salePrice ?? ""}
                onChange={(e) => setSalePrice(Number(e.target.value))}
                className="h-11 w-full rounded-2xl border border-stone-200/80 bg-white/90 pl-8 pr-3 text-xs font-semibold text-stone-900 outline-none transition-all focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/10"
              />
            </div>
          </div>
        </div>

        {/* MULTI-PHOTO DROPZONE */}
        <div className="px-6 pb-6">
          <div className="group relative overflow-hidden rounded-3xl border-2 border-dashed border-amber-300/80 bg-linear-to-br from-amber-50/50 via-white to-amber-50/20 p-7 text-center transition-all hover:border-amber-400 hover:bg-amber-50/40">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleBulkImagesUpload}
              className="absolute inset-0 z-10 cursor-pointer opacity-0"
              title="Upload multiple saree photos"
            />
            <div className="pointer-events-none mx-auto flex max-w-md flex-col items-center">
              <div className="mb-3 flex h-13 w-13 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 shadow-xs transition-transform duration-300 group-hover:scale-105 border border-amber-200/80">
                <ImagePlus size={24} className="text-amber-950" />
              </div>
              <h3 className="font-serif text-sm font-bold text-stone-900">
                Drop Multiple Drape Photos to Auto-Index
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-stone-500 font-light">
                Drag and drop 5 to 50 saree photographs here at once. Each image automatically creates an individual variant entry ready for instant SKU assignment.
              </p>
              <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-[#2A0E20] px-4 py-1.5 text-[9.5px] font-bold uppercase tracking-wider text-amber-100 shadow-xs">
                <Upload size={12} className="text-amber-300" />
                <span>Select Multiple Files</span>
              </div>
            </div>
          </div>
        </div>

        {/* VARIATIONS MANAGEMENT TOOLBAR */}
        <div className="border-t border-stone-200/50 px-6 pt-5">
          <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-sm font-bold text-stone-900">
                  {orderMode === "dual"
                    ? "Dual Tone Contrast Variations"
                    : "Single Shade Body Variations"}
                </h3>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 font-mono text-[9px] font-bold text-stone-600">
                  {bulkRows.length} Items
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-stone-400 font-light">
                Verify border drapes, inspect thumbnails, and fine-tune piece quantities.
              </p>
            </div>

            {/* QUICK QUANTITY SYNC CONTROLS */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-9 items-center overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-2xs">
                <button
                  type="button"
                  onClick={() => setApplyQty((prev) => Math.max(1, prev - 1))}
                  className="flex h-full w-8 items-center justify-center text-stone-400 hover:bg-stone-50 hover:text-stone-700"
                  title="Decrease"
                >
                  <Minus size={12} />
                </button>
                <input
                  type="number"
                  min={1}
                  value={applyQty}
                  onChange={(e) => setApplyQty(Math.max(1, Number(e.target.value)))}
                  className="h-full w-12 border-x border-stone-100 bg-transparent text-center font-mono text-xs font-bold text-stone-800 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setApplyQty((prev) => prev + 1)}
                  className="flex h-full w-8 items-center justify-center text-stone-400 hover:bg-stone-50 hover:text-stone-700"
                  title="Increase"
                >
                  <Plus size={12} />
                </button>
              </div>

              <button
                type="button"
                onClick={applyQuantityToAll}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-stone-200/80 bg-white px-3 text-xs font-semibold text-stone-700 shadow-2xs transition-all hover:bg-stone-50 active:scale-95"
              >
                <Boxes size={13} className="text-stone-400" />
                <span>Apply to All</span>
              </button>

              <button
                type="button"
                onClick={addRow}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-50 px-3.5 text-xs font-bold text-amber-900 border border-amber-200/70 shadow-2xs transition-all hover:bg-amber-100 active:scale-95"
              >
                <Plus size={13} />
                <span>Add Row</span>
              </button>
            </div>
          </div>
        </div>

        {/* VARIATION ITEM ROWS */}
        <div className="space-y-3 px-6 pb-6">
          {bulkRows.map((row, index) => {
            const primaryName = (row.color1 || "").trim() || "Standard";
            const primaryObj = COLOR_CODES.find((c) => normalizeText(c.name) === normalizeText(primaryName));
            const primaryCode = primaryObj ? primaryObj.code : generateColorSlug(primaryName);

            const secondaryName = orderMode === "dual" ? (row.color2 || "").trim() : "";
            const secondaryObj = secondaryName
              ? COLOR_CODES.find((c) => normalizeText(c.name) === normalizeText(secondaryName))
              : null;
            const secondaryCode = secondaryName ? (secondaryObj ? secondaryObj.code : generateColorSlug(secondaryName)) : null;

            const autoSku = `RSF-${selectedDesignSlug}-${secondaryCode
                ? `${primaryCode}-${secondaryCode}`
                : primaryCode
              }-${String(inventory.length + index + 1).padStart(3, "0")}`;

            return (
              <div
                key={row.id}
                className="group relative flex flex-col gap-3.5 rounded-2xl border border-stone-200/80 bg-white/80 p-3.5 shadow-2xs transition-all duration-200 hover:border-[#D4A373]/60 hover:bg-white hover:shadow-xs md:flex-row md:items-center"
              >
                {/* Index Pill */}
                <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 font-mono text-[10px] font-bold text-stone-400 lg:flex">
                  #{index + 1}
                </div>

                {/* Saree Photo Thumbnail Preview */}
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-50 shadow-2xs cursor-pointer group/img">
                  {row.imageUrl ? (
                    <>
                      <img
                        src={row.imageUrl}
                        alt={`${row.color1} drape`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/img:opacity-100">
                        <ImageIcon size={14} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center p-1 text-center text-stone-300">
                      <ImageIcon size={16} />
                      <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-stone-400">
                        Photo
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleSingleImageUpload(row.id, e)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    title="Upload or change drape photograph"
                  />
                </div>

                {/* Dropdowns & SKU */}
                <div className="grid flex-1 grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  <PremiumDropdown
                    label="Primary Body Shade"
                    value={row.color1}
                    options={colorOptions}
                    onChange={(value) => updateRow(row.id, "color1", value)}
                    allowCustom={false}
                  />

                  {orderMode === "dual" ? (
                    <PremiumDropdown
                      label="Border / Zari Shade"
                      value={row.color2}
                      options={colorOptions}
                      onChange={(value) => updateRow(row.id, "color2", value)}
                      allowCustom={false}
                    />
                  ) : (
                    <div className="flex flex-col">
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
                        Generated Drape SKU
                      </label>
                      <div className="flex h-11 items-center rounded-2xl border border-stone-200/80 bg-stone-50/80 px-3.5 font-mono text-[10.5px] font-bold text-stone-800">
                        <span className="truncate">{autoSku}</span>
                      </div>
                    </div>
                  )}

                  {orderMode === "dual" && (
                    <div className="flex flex-col sm:col-span-2 xl:col-span-1">
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
                        Generated Drape SKU
                      </label>
                      <div className="flex h-11 items-center rounded-2xl border border-stone-200/80 bg-stone-50/80 px-3.5 font-mono text-[10.5px] font-bold text-stone-800">
                        <span className="truncate">{autoSku}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stock Quantity Controls */}
                <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:justify-center">
                  <div className="flex flex-col">
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
                      Floor Pieces
                    </label>
                    <div className="flex h-11 w-28 items-center overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-2xs">
                      <button
                        type="button"
                        onClick={() =>
                          updateRow(row.id, "qty", Math.max(1, row.qty - 1))
                        }
                        className="flex h-full w-8 items-center justify-center text-stone-400 hover:bg-stone-50 hover:text-stone-700"
                      >
                        <Minus size={12} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={row.qty}
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            "qty",
                            Math.max(1, Number(e.target.value))
                          )
                        }
                        className="h-full w-12 border-x border-stone-100 bg-transparent text-center font-mono text-xs font-bold text-stone-800 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateRow(row.id, "qty", row.qty + 1)}
                        className="flex h-full w-8 items-center justify-center text-stone-400 hover:bg-stone-50 hover:text-stone-700"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Actions (Duplicate & Delete) */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => duplicateRow(row)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                      title="Duplicate this shade row"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={bulkRows.length === 1}
                      onClick={() => removeRow(row.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 transition-colors"
                      title="Delete this row"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* SUMMARY DASH & COMMIT BUTTON */}
        <div className="border-t border-stone-200/60 bg-linear-to-t from-stone-50/90 to-stone-50/40 p-6">
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <div className="rounded-2xl border border-stone-200/80 bg-white/90 p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-stone-400">
                <Layers size={13} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Shade Variants
                </span>
              </div>
              <p className="mt-1 text-xl font-serif font-bold text-stone-900">
                {bulkRows.length}
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200/80 bg-white/90 p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-stone-400">
                <Boxes size={13} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Total Drapes
                </span>
              </div>
              <p className="mt-1 text-xl font-serif font-bold text-stone-900">
                {totalPieces}
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200/80 bg-white/90 p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-stone-400">
                <ImageIcon size={13} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Photos Loaded
                </span>
              </div>
              <p className="mt-1 text-xl font-serif font-bold text-stone-900">
                {imageCount}{" "}
                <span className="text-xs font-normal text-stone-400 font-sans">
                  / {bulkRows.length}
                </span>
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200/80 bg-white/90 p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-stone-400">
                <Package size={13} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Est. Batch Value
                </span>
              </div>
              <p className="mt-1 text-xl font-serif font-bold text-stone-900">
                ₹{((salePrice || 0) * totalPieces).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-center justify-between gap-4 border-t border-stone-200/60 pt-4 sm:flex-row">
            <div className="flex items-center gap-2 text-xs text-stone-500 font-light">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <p>
                Ready to commit <strong>{totalPieces} drapes</strong> under pattern{" "}
                <strong className="text-stone-800">{selectedDesign?.name || "Selected Gadwal"}</strong>
              </p>
            </div>

            <button
              type="submit"
              disabled={
                !selectedDesignSlug ||
                !selectedCategoryId ||
                bulkRows.length === 0 ||
                totalPieces <= 0
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2A0E20] px-7 py-3 text-xs font-bold text-amber-100 shadow-xs transition-all hover:bg-[#3D142E] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              <Check size={14} className="text-[#D4A373]" />
              <span>Commit Consignment to Inventory</span>
            </button>
          </div>
        </div>
      </form>

      {/* CONFIRMATION SUCCESS MODAL */}
      {successBatch?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/80 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-7">
            <button
              type="button"
              onClick={() => setSuccessBatch(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-2xs">
                <CheckCircle2 size={28} />
              </div>

              <div className="mt-3.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E3D51]">
                  Loom Consignment Confirmed
                </span>
                <h3 className="mt-1 font-serif text-xl font-bold text-stone-900">
                  Batch Recorded Successfully
                </h3>
                <p className="mx-auto mt-1 max-w-xs text-xs text-stone-500 font-light leading-relaxed">
                  All shade variations and pieces have been indexed into the central catalog and audit registry.
                </p>
              </div>

              <div className="mt-4.5 grid grid-cols-3 gap-2 text-left">
                <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-3">
                  <span className="text-[9px] font-bold uppercase text-stone-400">Total Drapes</span>
                  <p className="mt-0.5 text-base font-serif font-bold text-stone-900">
                    {successBatch.totalPieces}
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-3">
                  <span className="text-[9px] font-bold uppercase text-stone-400">Shade Hues</span>
                  <p className="mt-0.5 text-base font-serif font-bold text-stone-900">
                    {successBatch.variantsCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-3">
                  <span className="text-[9px] font-bold uppercase text-stone-400">Pattern</span>
                  <p className="mt-0.5 truncate text-xs font-serif font-bold text-stone-900">
                    {successBatch.designName}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setBulkRows([
                      {
                        id: `bulk-row-${Date.now()}-0`,
                        color1: COLOR_CODES[0]?.name || "",
                        color2: COLOR_CODES[1]?.name || "",
                        qty: 5,
                      },
                    ]);
                    setSuccessBatch(null);
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  <Plus size={13} />
                  <span>Next Batch</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSuccessBatch(null)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#2A0E20] py-2.5 text-xs font-bold text-amber-100 shadow-xs hover:bg-[#3D142E] transition-colors"
                >
                  <Check size={13} className="text-[#D4A373]" />
                  <span>Done</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}