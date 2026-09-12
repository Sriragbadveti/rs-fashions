// src/pages/BulkStock.tsx

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
} from "lucide-react";
import type { Product, Category } from "../types/inventory";
import { MOCK_DESIGNS, COLOR_CODES } from "../types/inventory";
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
}: PremiumDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return options;

    return options.filter((option) =>
      [
        option.label,
        option.description,
        option.code,
      ]
        .filter(Boolean)
        .some((text) => text!.toLowerCase().includes(query))
    );
  }, [options, search]);

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
    <div ref={wrapperRef} className={`relative ${className}`}>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-stone-500">
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
        className={`
          group flex w-full items-center gap-3 rounded-xl border
          bg-white px-3 py-2.5 text-left transition-all duration-200
          ${
            open
              ? "border-brand-gold ring-2 ring-amber-100 shadow-sm"
              : "border-stone-200 hover:border-stone-300 hover:shadow-sm"
          }
          ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
        `}
      >
        {selected?.swatch && (
          <span
            className="h-7 w-7 shrink-0 rounded-lg border border-black/10 shadow-inner"
            style={{ backgroundColor: selected.swatch }}
          />
        )}

        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-stone-800">
            {selected?.label || placeholder}
          </span>

          {selected?.description && (
            <span className="mt-0.5 block truncate text-[10px] text-stone-400">
              {selected.description}
            </span>
          )}
        </span>

        {selected?.code && (
          <span className="hidden rounded-md bg-stone-100 px-1.5 py-1 font-mono text-[9px] font-bold text-stone-500 sm:inline-flex">
            {selected.code}
          </span>
        )}

        <ChevronDown
          size={15}
          className={`shrink-0 text-stone-400 transition-transform duration-200 ${
            open ? "rotate-180 text-stone-700" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_18px_50px_rgba(42,14,32,0.15)]">
          {searchable && (
            <div className="border-b border-stone-100 bg-stone-50/80 p-2">
              <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3">
                <Search size={14} className="shrink-0 text-stone-400" />

                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${label.toLowerCase()}...`}
                  className="h-9 min-w-0 flex-1 bg-transparent text-xs text-stone-800 outline-none placeholder:text-stone-400"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto p-1.5">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Search size={18} className="mx-auto mb-2 text-stone-300" />
                <p className="text-xs font-semibold text-stone-600">
                  Nothing found
                </p>
                <p className="mt-1 text-[10px] text-stone-400">
                  Try another search term.
                </p>
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`
                      flex w-full items-center gap-3 rounded-xl px-3 py-2.5
                      text-left transition-colors
                      ${
                        isSelected
                          ? "bg-[#2A0E20] text-amber-100"
                          : "text-stone-700 hover:bg-stone-50"
                      }
                    `}
                  >
                    {option.swatch && (
                      <span
                        className="h-7 w-7 shrink-0 rounded-lg border border-black/10 shadow-inner"
                        style={{ backgroundColor: option.swatch }}
                      />
                    )}

                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-xs font-semibold ${
                          isSelected ? "text-amber-100" : "text-stone-800"
                        }`}
                      >
                        {option.label}
                      </span>

                      {option.description && (
                        <span
                          className={`mt-0.5 block truncate text-[10px] ${
                            isSelected
                              ? "text-amber-100/60"
                              : "text-stone-400"
                          }`}
                        >
                          {option.description}
                        </span>
                      )}
                    </span>

                    {option.code && (
                      <span
                        className={`hidden rounded-md px-1.5 py-1 font-mono text-[9px] font-bold sm:inline-flex ${
                          isSelected
                            ? "bg-white/10 text-amber-100/80"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {option.code}
                      </span>
                    )}

                    {isSelected && (
                      <Check size={14} className="shrink-0 text-brand-gold" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {options.length > 0 && (
            <div className="border-t border-stone-100 bg-stone-50/70 px-3 py-2">
              <span className="text-[9px] font-medium text-stone-400">
                {filteredOptions.length} of {options.length} options
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

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categories[0]?.id || "c1"
  );

  const [purchasePrice, setPurchasePrice] = useState<number>(12000);
  const [salePrice, setSalePrice] = useState<number>(18500);

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
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.name,
        code: category.hsn,
      })),
    [categories]
  );

  const colorOptions: DropdownOption[] = useMemo(
    () =>
      COLOR_CODES.map((color) => ({
        value: color.name,
        label: color.name,
        description: `Shade code • ${color.code}`,
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
      prev.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
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
        console.warn("Bulk upload image notice:", err);
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
            color1:
              COLOR_CODES[index % COLOR_CODES.length]?.name || "",
            color2:
              COLOR_CODES[(index + 1) % COLOR_CODES.length]?.name || "",
            qty: 5,
            imageUrl: dataUrl,
          };

          if (
            prev.length === 1 &&
            !prev[0].imageUrl &&
            prev[0].qty === 5
          ) {
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
          console.warn("Bulk images upload notice:", err);
        }
      };

      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const applyQuantityToAll = () => {
    const safeQty = Math.max(1, Number(applyQty) || 1);

    sound.playClick();

    setBulkRows((prev) =>
      prev.map((row) => ({
        ...row,
        qty: safeQty,
      }))
    );
  };

  const handleCommitBulkStock = (e: React.FormEvent) => {
    e.preventDefault();

    const designObj = MOCK_DESIGNS.find(
      (d) => d.slug === selectedDesignSlug
    );

    if (!designObj) return;

    if (!selectedCategoryId) return;

    const validRows = bulkRows.filter((row) => row.qty > 0);

    if (validRows.length === 0) return;

    const newProducts: Product[] = validRows.map((row, idx) => {
      const color1Def =
        COLOR_CODES.find((c) => c.name === row.color1) ||
        COLOR_CODES[0];

      const color2Def =
        orderMode === "dual"
          ? COLOR_CODES.find((c) => c.name === row.color2) ||
            COLOR_CODES[1]
          : null;

      const finalColorName = color2Def
        ? `${color1Def.name} / ${color2Def.name}`
        : color1Def.name;

      const finalColorSlug = color2Def
        ? `${color1Def.code}-${color2Def.code}`
        : color1Def.code;

      const serialNum = String(
        inventory.length + idx + 1
      ).padStart(3, "0");

      const sku = `RSF-${designObj.slug}-${finalColorSlug}-${serialNum}`;

      return {
        id: sku,
        name: designObj.name,
        categoryId: selectedCategoryId,
        purchasePrice,
        salePrice,
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
    <div className="mx-auto max-w-7xl space-y-6 pb-12 font-sans select-none">
      {/* ================================================================
          HEADER
      ================================================================ */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="font-display text-3xl font-medium tracking-tight text-stone-950 sm:text-4xl">
              Bulk Stock Entry
            </h1>

            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-stone-500">
              Add multiple saree variations, upload shade photos in bulk,
              generate SKUs automatically and push the complete batch into
              inventory.
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================
          ORDER MODE
      ================================================================ */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setOrderMode("single");
          }}
          className={`
            group relative overflow-hidden rounded-2xl border p-4 text-left
            transition-all duration-200
            ${
              orderMode === "single"
                ? "border-[#2A0E20] bg-[#2A0E20] shadow-lg shadow-[#2A0E20]/10"
                : "border-stone-200 bg-white hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md"
            }
          `}
        >
          {orderMode === "single" && (
            <div className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
              <Check size={11} className="text-brand-gold" />
            </div>
          )}

          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                orderMode === "single"
                  ? "bg-white/10 text-brand-gold"
                  : "bg-amber-50 text-brand-gold"
              }`}
            >
              <Package size={20} />
            </div>

            <div>
              <h3
                className={`text-xs font-bold ${
                  orderMode === "single"
                    ? "text-amber-100"
                    : "text-stone-800"
                }`}
              >
                Single Color
              </h3>

              <p
                className={`mt-0.5 text-[10px] ${
                  orderMode === "single"
                    ? "text-amber-100/60"
                    : "text-stone-400"
                }`}
              >
                Uniform single-shade saree batches
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setOrderMode("dual");
          }}
          className={`
            group relative overflow-hidden rounded-2xl border p-4 text-left
            transition-all duration-200
            ${
              orderMode === "dual"
                ? "border-[#2A0E20] bg-[#2A0E20] shadow-lg shadow-[#2A0E20]/10"
                : "border-stone-200 bg-white hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md"
            }
          `}
        >
          {orderMode === "dual" && (
            <div className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
              <Check size={11} className="text-brand-gold" />
            </div>
          )}

          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                orderMode === "dual"
                  ? "bg-white/10 text-brand-gold"
                  : "bg-purple-50 text-purple-700"
              }`}
            >
              <Sparkles size={20} />
            </div>

            <div>
              <h3
                className={`text-xs font-bold ${
                  orderMode === "dual"
                    ? "text-amber-100"
                    : "text-stone-800"
                }`}
              >
                Dual Tone
              </h3>

              <p
                className={`mt-0.5 text-[10px] ${
                  orderMode === "dual"
                    ? "text-amber-100/60"
                    : "text-stone-400"
                }`}
              >
                Contrast and dual-shade combinations
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* ================================================================
          MAIN FORM
      ================================================================ */}
      <form
        onSubmit={handleCommitBulkStock}
        className="overflow-visible rounded-3xl border border-stone-200/80 bg-white shadow-sm"
      >
        {/* FORM HEADER */}
        <div className="border-b border-stone-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-sm font-bold text-stone-900">
                Batch Configuration
              </h2>

              <p className="mt-0.5 text-[10px] text-stone-400">
                Set the common details once. They will be applied to every
                shade variation below.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2">
              <Boxes size={14} className="text-stone-400" />

              <span className="text-[10px] font-semibold text-stone-500">
                {bulkRows.length} variants ready
              </span>
            </div>
          </div>
        </div>

        {/* BATCH CONFIGURATION */}
        <div className="grid grid-cols-1 gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-4">
          <PremiumDropdown
            label="Saree Design Pattern"
            value={selectedDesignSlug}
            options={designOptions}
            onChange={setSelectedDesignSlug}
          />

          <PremiumDropdown
            label="Category"
            value={selectedCategoryId}
            options={categoryOptions}
            onChange={setSelectedCategoryId}
          />

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-stone-500">
              Unit Purchase Price
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">
                ₹
              </span>

              <input
                type="number"
                min={0}
                value={purchasePrice}
                onChange={(e) =>
                  setPurchasePrice(Number(e.target.value))
                }
                className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-7 pr-3 text-xs font-semibold text-stone-800 outline-none transition-all placeholder:text-stone-300 hover:border-stone-300 focus:border-brand-gold focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-stone-500">
              Unit Selling Price
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">
                ₹
              </span>

              <input
                type="number"
                min={0}
                value={salePrice}
                onChange={(e) =>
                  setSalePrice(Number(e.target.value))
                }
                className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-7 pr-3 text-xs font-semibold text-stone-800 outline-none transition-all placeholder:text-stone-300 hover:border-stone-300 focus:border-brand-gold focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>
        </div>

        {/* ================================================================
            BULK IMAGE UPLOAD
        ================================================================ */}
        <div className="px-5 sm:px-6">
          <div className="group relative overflow-hidden rounded-2xl border border-dashed border-amber-300 bg-gradient-to-br from-amber-50/70 to-white p-7 text-center transition-all duration-200 hover:border-amber-400 hover:shadow-sm">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleBulkImagesUpload}
              className="absolute inset-0 z-10 cursor-pointer opacity-0"
              title="Upload multiple saree images"
            />

            <div className="pointer-events-none mx-auto flex max-w-lg flex-col items-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-brand-gold shadow-sm transition-transform duration-300 group-hover:scale-105">
                <ImagePlus size={21} />
              </div>

              <h3 className="text-xs font-bold text-stone-900">
                Add Multiple Saree Photos
              </h3>

              <p className="mt-1 max-w-md text-[10px] leading-relaxed text-stone-500">
                Select several images at once. Each image automatically
                becomes a shade card that you can configure below.
              </p>

              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2A0E20] px-3 py-1.5 text-[9px] font-bold text-amber-100">
                  <Upload size={11} className="text-brand-gold" />
                  Batch Import
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================
            VARIATION HEADER
        ================================================================ */}
        <div className="px-5 pt-6 sm:px-6">
          <div className="flex flex-col gap-4 border-b border-stone-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-stone-700">
                  {orderMode === "dual"
                    ? "Dual Tone Shade Cards"
                    : "Shade Cards & Quantities"}
                </h2>

                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-bold text-stone-500">
                  {bulkRows.length}
                </span>
              </div>

              <p className="mt-1 text-[10px] text-stone-400">
                Configure colors, photos and stock quantity for each
                variation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* APPLY QUANTITY */}
              <div className="flex items-center overflow-hidden rounded-xl border border-stone-200 bg-white">
                <button
                  type="button"
                  onClick={() =>
                    setApplyQty((prev) => Math.max(1, prev - 1))
                  }
                  className="flex h-9 w-8 items-center justify-center text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-700"
                  title="Decrease quantity"
                >
                  <Minus size={13} />
                </button>

                <input
                  type="number"
                  min={1}
                  value={applyQty}
                  onChange={(e) =>
                    setApplyQty(Math.max(1, Number(e.target.value)))
                  }
                  className="h-9 w-12 border-x border-stone-100 bg-transparent text-center text-[10px] font-bold text-stone-700 outline-none"
                  title="Quantity to apply"
                />

                <button
                  type="button"
                  onClick={() => setApplyQty((prev) => prev + 1)}
                  className="flex h-9 w-8 items-center justify-center text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-700"
                  title="Increase quantity"
                >
                  <Plus size={13} />
                </button>
              </div>

              <button
                type="button"
                onClick={applyQuantityToAll}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 text-[10px] font-bold text-stone-600 transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-95"
              >
                <Boxes size={13} />
                Apply to all
              </button>

              <button
                type="button"
                onClick={addRow}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-50 px-3.5 text-[10px] font-bold text-amber-900 transition-all hover:bg-amber-100 active:scale-95"
              >
                <Plus size={13} />
                Add Shade
              </button>
            </div>
          </div>
        </div>

        {/* ================================================================
            VARIATION CARDS (EXTENDING NATURALLY WITHOUT INNER SCROLLBAR)
        ================================================================ */}
        <div className="space-y-3 px-5 py-5 sm:px-6">
          {bulkRows.map((row, index) => {
            const primaryDef =
              COLOR_CODES.find((c) => c.name === row.color1) ||
              COLOR_CODES[0];

            const secondaryDef =
              orderMode === "dual"
                ? COLOR_CODES.find((c) => c.name === row.color2) ||
                  COLOR_CODES[1]
                : null;

            const autoSku = `RSF-${selectedDesignSlug}-${
              secondaryDef
                ? `${primaryDef.code}-${secondaryDef.code}`
                : primaryDef.code
            }-${String(inventory.length + index + 1).padStart(3, "0")}`;

            return (
              <div
                key={row.id}
                className="group rounded-2xl border border-stone-200 bg-stone-50/50 p-3 transition-all duration-200 hover:border-stone-300 hover:bg-white hover:shadow-sm sm:p-4"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                  {/* INDEX */}
                  <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 font-mono text-[10px] font-bold text-stone-400 xl:flex">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  {/* IMAGE */}
                  <div className="flex items-center gap-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                      {row.imageUrl ? (
                        <>
                          <img
                            src={row.imageUrl}
                            alt={`${row.color1} shade preview`}
                            className="h-full w-full object-cover"
                          />

                          <div className="absolute inset-0 flex items-center justify-center bg-[#2A0E20]/0 opacity-0 transition-all group-hover:bg-[#2A0E20]/20 group-hover:opacity-100">
                            <ImageIcon
                              size={16}
                              className="text-white drop-shadow"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-stone-400">
                          <ImageIcon
                            size={17}
                            className="mb-1 text-stone-300"
                          />
                          <span className="text-[8px] font-semibold">
                            Add Photo
                          </span>
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleSingleImageUpload(row.id, e)
                        }
                        className="absolute inset-0 cursor-pointer opacity-0"
                        title="Add or replace photo"
                      />
                    </div>

                    <div className="xl:hidden">
                      <span className="mb-1 block font-mono text-[9px] font-bold text-stone-400">
                        VARIANT #{index + 1}
                      </span>

                      <span className="block max-w-[190px] truncate font-mono text-[9px] font-bold text-stone-500">
                        {autoSku}
                      </span>
                    </div>
                  </div>

                  {/* COLORS */}
                  <div
                    className={`grid flex-1 grid-cols-1 gap-3 ${
                      orderMode === "dual"
                        ? "md:grid-cols-2"
                        : "md:grid-cols-2"
                    }`}
                  >
                    <PremiumDropdown
                      label="Primary Shade"
                      value={row.color1}
                      options={colorOptions}
                      onChange={(value) =>
                        updateRow(row.id, "color1", value)
                      }
                    />

                    {orderMode === "dual" ? (
                      <PremiumDropdown
                        label="Pattu / Border Shade"
                        value={row.color2}
                        options={colorOptions}
                        onChange={(value) =>
                          updateRow(row.id, "color2", value)
                        }
                      />
                    ) : (
                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-stone-400">
                          Auto-Generated SKU
                        </label>

                        <div className="flex h-[43px] items-center rounded-xl border border-stone-200 bg-stone-100 px-3">
                          <span className="truncate font-mono text-[9px] font-bold text-stone-600">
                            {autoSku}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DUAL SKU */}
                  {orderMode === "dual" && (
                    <div className="w-full xl:w-52">
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-stone-400">
                        Auto-Generated SKU
                      </label>

                      <div className="flex h-[43px] items-center rounded-xl border border-stone-200 bg-stone-100 px-3">
                        <span className="truncate font-mono text-[9px] font-bold text-stone-600">
                          {autoSku}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* QUANTITY */}
                  <div className="w-full xl:w-28">
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-stone-500">
                      Quantity
                    </label>

                    <div className="flex h-[43px] overflow-hidden rounded-xl border border-stone-200 bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          updateRow(
                            row.id,
                            "qty",
                            Math.max(1, row.qty - 1)
                          )
                        }
                        className="flex w-8 items-center justify-center text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-700"
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
                        className="min-w-0 flex-1 border-x border-stone-100 bg-transparent text-center text-xs font-bold text-stone-800 outline-none"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          updateRow(row.id, "qty", row.qty + 1)
                        }
                        className="flex w-8 items-center justify-center text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-700"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex items-center justify-end gap-1 xl:pt-4">
                    <button
                      type="button"
                      onClick={() => duplicateRow(row)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 transition-all hover:bg-stone-100 hover:text-stone-700"
                      title="Duplicate shade card"
                    >
                      <Copy size={14} />
                    </button>

                    <button
                      type="button"
                      disabled={bulkRows.length === 1}
                      onClick={() => removeRow(row.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 transition-all hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-20"
                      title="Remove shade card"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================================================================
            BATCH SUMMARY + COMMIT
        ================================================================ */}
        <div className="border-t border-stone-100 bg-stone-50/60 px-5 py-5 sm:px-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-stone-200 bg-white p-3">
              <div className="mb-1 flex items-center gap-1.5">
                <Layers size={12} className="text-stone-400" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                  Variants
                </span>
              </div>

              <p className="text-sm font-bold text-stone-900">
                {bulkRows.length}
              </p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-3">
              <div className="mb-1 flex items-center gap-1.5">
                <Boxes size={12} className="text-stone-400" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                  Pieces
                </span>
              </div>

              <p className="text-sm font-bold text-stone-900">
                {totalPieces}
              </p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-3">
              <div className="mb-1 flex items-center gap-1.5">
                <ImageIcon size={12} className="text-stone-400" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                  Photos
                </span>
              </div>

              <p className="text-sm font-bold text-stone-900">
                {imageCount}
                <span className="ml-1 text-[9px] font-medium text-stone-400">
                  / {bulkRows.length}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-4 border-t border-stone-200 pt-4 sm:flex-row">
            <div className="flex items-start gap-2">
              <ShieldCheck
                size={15}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <div>
                <p className="text-[10px] font-bold text-stone-700">
                  Ready to add to inventory
                </p>

                <p className="mt-0.5 text-[9px] text-stone-400">
                  {totalPieces} pieces across {bulkRows.length} shade
                  variants
                  {selectedDesign
                    ? ` • ${selectedDesign.name}`
                    : ""}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                !selectedDesignSlug ||
                !selectedCategoryId ||
                bulkRows.length === 0 ||
                totalPieces <= 0
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2A0E20] px-6 py-3 text-xs font-bold text-amber-100 shadow-md transition-all hover:bg-[#3D142E] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              <Check size={15} className="text-brand-gold" />
              Save Bulk Stock to Inventory
            </button>
          </div>
        </div>
      </form>

      {/* ================================================================
          SUCCESS MODAL DIALOG
      ================================================================ */}
      {successBatch?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-stone-200">
            <button
              type="button"
              onClick={() => setSuccessBatch(null)}
              className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs">
                <CheckCircle2 size={32} />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A373]">
                  Loom Batch Committed
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-stone-900 mt-1">
                  Bulk Stock Added Successfully!
                </h3>
                <p className="text-xs text-stone-500 mt-1.5 max-w-sm mx-auto">
                  The shade variations and lot pieces have been registered into the inventory vault and audit trail.
                </p>
              </div>

              {/* Batch Summary Cards */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                <div className="rounded-2xl border border-stone-100 bg-stone-50/80 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Pieces</p>
                  <p className="text-lg font-bold text-stone-900 mt-0.5">{successBatch.totalPieces}</p>
                </div>
                <div className="rounded-2xl border border-stone-100 bg-stone-50/80 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Variations</p>
                  <p className="text-lg font-bold text-stone-900 mt-0.5">{successBatch.variantsCount}</p>
                </div>
                <div className="rounded-2xl border border-stone-100 bg-stone-50/80 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Pattern</p>
                  <p className="text-xs font-bold text-stone-900 mt-1 truncate">{successBatch.designName}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-4 border-t border-stone-100">
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
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Add Another Batch</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSuccessBatch(null)}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#2A0E20] hover:bg-[#3D142E] text-amber-100 text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check size={14} className="text-[#D4A373]" />
                  <span>Done / Close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}