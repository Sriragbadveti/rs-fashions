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
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { Product, Category, ColorDefinition } from "../types/inventory";
import { MOCK_DESIGNS, COLOR_CODES, CANONICAL_SAREE_CATEGORIES } from "../types/inventory";
import { generateColorSlug, normalizeText, formatColorName, PENDING_SKU_LABEL } from "../types/catalog";
import { sound } from "../types/soundEngine";
import { StoreService } from "../services/supabase";
import {
  IMAGE_ACCEPT_ATTR,
  isSupportedImageFile,
  handleSareeImageError,
} from "../utils/imageConverter";
import { groupPhotos } from "../utils/groupPhotos";
import { getDesignDescription } from "../types/designDescriptions";
import type { BulkRestockResult } from "../types/bulkstock";
import {
  BorderColorInput,
  getRegisteredBorderColors,
  saveBorderColorToRegistry,
} from "../components/admin/BorderColorInput";

interface BulkStockProps {
  inventory: Product[];
  categories: Category[];
  /** Resolves with the products the backend actually stored. */
  onBulkRestock: (newProducts: Product[]) => Promise<BulkRestockResult>;
}

type OrderMode = "single" | "dual";

interface BulkRow {
  id: string;
  color1: string;
  color2: string;
  qty: number;
  imageUrl?: string;
  uploadStatus?: "idle" | "uploading" | "done" | "error";
  uploadProgress?: number;
  file?: File;
  /** Per-row border override. Empty = use the batch border details. */
  borderColor?: string;
  /** Last save error for this row (kept so the admin can retry). */
  saveError?: string;
  /** Additional photos for this row's product only (the primary photo stays in imageUrl). */
  extraImages?: ExtraImage[];
  /** Enables the Buy 1/2/3 bundle offers for this row's saree. */
  specialOffer?: boolean;
}

interface ExtraImage {
  id: string;
  /** Local preview while uploading; the storage URL once uploaded. */
  url: string;
  status: "uploading" | "done" | "error";
  file?: File;
  error?: string;
}

function cleanPriceInput(val: string): string {
  if (!val) return "";
  return val.replace(/^0+(?=\d)/, "");
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
  allowClear?: boolean;
  onRegisterCustom?: (customValue: string) => Promise<string | void> | string | void;
  customActionLabel?: string;
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
  allowClear = false,
  onRegisterCustom,
  customActionLabel = "Register Color",
}: PremiumDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected =
    options.find((option) => normalizeText(option.value) === normalizeText(value)) ||
    (value ? { value, label: value, description: `Code: ${generateColorSlug(value)}`, code: generateColorSlug(value) } : undefined);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return options;

    return options.filter((option) =>
      [option.label, option.description, option.code]
        .filter(Boolean)
        .some((text) => text!.toLowerCase().includes(query))
    );
  }, [options, search]);

  const hasCustom = Boolean(
    allowCustom &&
    search.trim() &&
    !options.some(
      (opt) =>
        normalizeText(opt.label) === normalizeText(search) ||
        normalizeText(opt.value) === normalizeText(search)
    )
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

  const handleRegisterCustom = async () => {
    const rawVal = search.trim();
    if (!rawVal) {
      searchRef.current?.focus();
      return;
    }
    sound.playClick();
    const formatted = formatColorName(rawVal);
    setOpen(false);
    setSearch("");
    if (onRegisterCustom) {
      const registeredName = await onRegisterCustom(formatted);
      onChange(typeof registeredName === "string" && registeredName ? registeredName : formatted);
    } else {
      onChange(formatted);
    }
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
          <span className={`block truncate text-xs ${value ? "font-semibold text-stone-900" : "font-normal text-stone-400"}`}>
            {selected?.label || placeholder}
          </span>
          {selected?.description && value && (
            <span className="block truncate text-[9.5px] text-stone-400 font-light">
              {selected.description}
            </span>
          )}
        </span>

        {value && allowClear && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              onChange("");
              setSearch("");
            }}
            title="Clear selection"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X size={12} />
          </span>
        )}

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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (hasCustom) {
                        handleRegisterCustom();
                      } else if (filteredOptions.length === 1) {
                        handleSelect(filteredOptions[0]);
                      }
                    }
                  }}
                  placeholder={allowCustom ? `Search or type new color to register...` : `Search ${label.toLowerCase()}...`}
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
            {allowClear && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onChange("");
                  setOpen(false);
                  setSearch("");
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors duration-150 border-b border-stone-100 mb-1 ${
                  !value
                    ? "bg-[#2A0E20] text-amber-100 font-bold"
                    : "text-stone-500 hover:bg-stone-50 font-medium"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded border border-dashed border-stone-300 text-[10px]">/</span>
                  <span className="italic">None (Optional)</span>
                </div>
                {!value && <Check size={12} className="ml-3 shrink-0 text-[#8E3D51]" />}
              </button>
            )}
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
                onClick={handleRegisterCustom}
                className="mt-1 flex w-full items-center justify-between gap-2.5 rounded-xl bg-[#2A0E20] px-3 py-2.5 text-left text-amber-100 shadow-xs transition-all hover:bg-[#3D142E] active:scale-[0.99]"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/15 text-amber-300">
                    <Plus size={13} />
                  </span>
                  <div className="min-w-0">
                    <span className="block truncate text-xs font-bold text-amber-100">
                      + {customActionLabel} &ldquo;{formatColorName(search)}&rdquo;
                    </span>
                    <span className="block truncate text-[9.5px] text-amber-200/75">
                      Save new color to palette &amp; backend
                    </span>
                  </div>
                </div>
                <span className="shrink-0 rounded bg-white/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-200">
                  {generateColorSlug(search.trim())}
                </span>
              </button>
            )}
          </div>

          {options.length > 0 && (
            <div className="flex items-center justify-between gap-2 border-t border-stone-100 bg-stone-50/70 px-3 py-1.5">
              <span className="text-[9px] font-mono text-stone-400">
                Showing {filteredOptions.length} of {options.length} options
              </span>

              {allowCustom && (
                <button
                  type="button"
                  onClick={() => {
                    if (hasCustom) {
                      handleRegisterCustom();
                    } else {
                      sound.playClick();
                      if (search.trim()) setSearch("");
                      searchRef.current?.focus();
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-amber-100/80 px-2 py-0.5 text-[10px] font-bold text-[#2A0E20] border border-amber-300/70 transition-colors hover:bg-amber-200/80"
                >
                  <Plus size={11} />
                  <span>{customActionLabel}</span>
                </button>
              )}
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

  const [colorPalette, setColorPalette] = useState<ColorDefinition[]>(() => [
    ...COLOR_CODES,
  ]);

  useEffect(() => {
    let mounted = true;
    StoreService.getColors().then((colors) => {
      if (mounted && Array.isArray(colors)) {
        setColorPalette([...colors]);
      }
    });

    const handleColorsUpdated = () => {
      setColorPalette([...COLOR_CODES]);
    };
    window.addEventListener("rs_colors_updated", handleColorsUpdated);
    return () => {
      mounted = false;
      window.removeEventListener("rs_colors_updated", handleColorsUpdated);
    };
  }, []);

  const handleRegisterColor = async (newColorName: string): Promise<string> => {
    const registered = await StoreService.registerColor(newColorName);
    setColorPalette([...COLOR_CODES]);
    return registered.name;
  };

  const [selectedDesignSlug, setSelectedDesignSlug] = useState(
    MOCK_DESIGNS[0]?.slug || ""
  );

  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [salePrice, setSalePrice] = useState<string>("");

  const [bulkRows, setBulkRows] = useState<BulkRow[]>([
    {
      id: "row-1",
      color1: "",
      color2: "",
      qty: 5,
      imageUrl: "",
      uploadStatus: "idle",
      uploadProgress: 0,
    },
  ]);

  // Track active object URLs for cleanup on unmount to prevent browser memory leaks
  const createdObjectUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      createdObjectUrls.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
      createdObjectUrls.current.clear();
    };
  }, []);

  const [applyQty, setApplyQty] = useState<number>(5);
  // Border details entered once for the whole consignment (single and dual tone alike).
  const [batchBorderColor, setBatchBorderColor] = useState("");
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitError, setCommitError] = useState("");
  // Read on every render: the registry is a small localStorage list that BorderColorInput updates.
  const registeredBorderColors = getRegisteredBorderColors();
  const [successBatch, setSuccessBatch] = useState<{
    isOpen: boolean;
    designName: string;
    totalPieces: number;
    variantsCount: number;
    categoryName: string;
    skus: string[];
  } | null>(null);

  const designOptions: DropdownOption[] = useMemo(
    () => [
      { value: "CHECKS", label: "Checks", code: "CHECKS" },
      { value: "EQUAL-BORDERS", label: "Equal Borders", code: "EQUAL-BORDERS" },
      { value: "KANCHI-BIG-BORDERS", label: "Kanchi Big Borders", code: "KANCHI-BIG-BORDERS" },
      { value: "GAP-BORDER", label: "Gap Border", code: "GAP-BORDER" },
      { value: "MAA-INTI-BANGARAM", label: "Maa Inti Bangaram", code: "MAA-INTI-BANGARAM" },
    ],
    []
  );

  const categoryOptions: DropdownOption[] = useMemo(() => [
    {
      value: "cat_sico_gadwal",
      label: "SiCo Gadwal",
      code: "5208",
      description: "HSN: 5208 · Handloom Pure SiCo Gadwal Standard",
    },
  ], []);

  const [selectedCategoryId, setSelectedCategoryId] = useState("cat_sico_gadwal");

  const colorOptions: DropdownOption[] = useMemo(
    () => [
      {
        value: "",
        label: "None (Optional)",
        description: "No specific shade specified",
        code: "OPT",
      },
      ...colorPalette.map((color) => ({
        value: color.name,
        label: color.name,
        description: `Code: ${color.code}`,
        code: color.code,
      })),
    ],
    [colorPalette]
  );

  const selectedDesign = useMemo(
    () => MOCK_DESIGNS.find((d) => d.slug === selectedDesignSlug),
    [selectedDesignSlug]
  );

  const colorCodeFor = (name: string) => {
    if (!name || !name.trim()) return "STANDARD";
    const obj = colorPalette.find((c) => normalizeText(c.name) === normalizeText(name));
    return obj ? obj.code : generateColorSlug(name);
  };

  const uploadingRowCount = bulkRows.filter(
    (r) => r.uploadStatus === "uploading" || (r.extraImages || []).some((img) => img.status === "uploading")
  ).length;
  const failedUploadRowCount = bulkRows.filter(
    (r) => r.uploadStatus === "error" || (r.extraImages || []).some((img) => img.status === "error")
  ).length;

  const totalPieces = useMemo(
    () => bulkRows.reduce((sum, row) => sum + Math.max(0, row.qty), 0),
    [bulkRows]
  );

  const imageCount = useMemo(
    () => bulkRows.filter((row) => row.imageUrl && row.uploadStatus !== "error" && !row.imageUrl.startsWith("blob:")).length,
    [bulkRows]
  );

  const addRow = () => {
    sound.playClick();
    setBulkRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random()}`,
        color1: "",
        color2: "",
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
        // Additional photos belong to one product only; a duplicated row starts without them.
        extraImages: [],
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
    value: string | number | boolean | undefined
  ) => {
    setBulkRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const patchExtra = (rowId: string, imgId: string, patch: Partial<ExtraImage>) => {
    setBulkRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? { ...row, extraImages: (row.extraImages || []).map((img) => (img.id === imgId ? { ...img, ...patch } : img)) }
          : row
      )
    );
  };

  const uploadExtraImage = async (rowId: string, img: ExtraImage) => {
    if (!img.file) return;
    patchExtra(rowId, img.id, { status: "uploading", error: undefined });
    try {
      const res = await StoreService.uploadImageBinary(img.file);
      if (res.success && res.url) {
        patchExtra(rowId, img.id, { status: "done", url: res.url });
      } else {
        patchExtra(rowId, img.id, { status: "error", error: res.message || "Upload failed" });
      }
    } catch (err: any) {
      patchExtra(rowId, img.id, { status: "error", error: err?.message || "Upload failed" });
    }
  };

  // "Add More Images": extra photos attach only to the row (product) they were added to.
  const handleAddExtraImages = (rowId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => isSupportedImageFile(f));
    e.target.value = "";
    if (files.length === 0) return;
    sound.playClick();
    const items: ExtraImage[] = files.map((file, i) => {
      const url = URL.createObjectURL(file);
      createdObjectUrls.current.add(url);
      return { id: `extra-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`, url, status: "uploading", file };
    });
    setBulkRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, extraImages: [...(row.extraImages || []), ...items] } : row))
    );
    // Two uploads at a time per batch of added photos.
    let next = 0;
    const worker = async () => {
      while (next < items.length) await uploadExtraImage(rowId, items[next++]);
    };
    worker();
    worker();
  };

  const removeExtraImage = (rowId: string, imgId: string) => {
    setBulkRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, extraImages: (row.extraImages || []).filter((img) => img.id !== imgId) } : row
      )
    );
  };

  // Promote an uploaded extra photo to primary; the old primary becomes an extra photo.
  const makeExtraPrimary = (rowId: string, imgId: string) => {
    setBulkRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const target = (row.extraImages || []).find((img) => img.id === imgId && img.status === "done");
        if (!target) return row;
        const rest = (row.extraImages || []).filter((img) => img.id !== imgId);
        const oldPrimary: ExtraImage[] =
          row.imageUrl && row.uploadStatus !== "error" && row.uploadStatus !== "uploading" && !row.imageUrl.startsWith("blob:")
            ? [{ id: `extra-${Date.now()}-old`, url: row.imageUrl, status: "done" }]
            : [];
        return { ...row, imageUrl: target.url, uploadStatus: "done", uploadProgress: 100, extraImages: [...oldPrimary, ...rest] };
      })
    );
  };

  // Removing the primary photo promotes the first uploaded extra photo, if any.
  const removePrimaryImage = (rowId: string) => {
    setBulkRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId || row.uploadStatus === "uploading") return row;
        const promote = (row.extraImages || []).find((img) => img.status === "done");
        if (promote) {
          return {
            ...row,
            imageUrl: promote.url,
            uploadStatus: "done",
            file: undefined,
            extraImages: (row.extraImages || []).filter((img) => img.id !== promote.id),
          };
        }
        return { ...row, imageUrl: "", uploadStatus: "idle", uploadProgress: 0, file: undefined };
      })
    );
  };

  const handleSingleImageUpload = async (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !isSupportedImageFile(file)) return;

    sound.playClick();
    // Immediate local object URL preview - 0ms UI blocking
    const objUrl = URL.createObjectURL(file);
    createdObjectUrls.current.add(objUrl);
    updateRow(id, "imageUrl", objUrl);
    updateRow(id, "uploadStatus", "uploading");
    updateRow(id, "uploadProgress", 15);
    updateRow(id, "file", file as any);

    try {
      const uploadRes = await StoreService.uploadImageBinary(file, undefined, (pct) => {
        updateRow(id, "uploadProgress", pct);
      });
      if (uploadRes.success && uploadRes.url) {
        updateRow(id, "imageUrl", uploadRes.url);
        updateRow(id, "uploadStatus", "done");
        updateRow(id, "uploadProgress", 100);
        // Revoke temporary local URL once remote cloud CDN is active
        try {
          URL.revokeObjectURL(objUrl);
          createdObjectUrls.current.delete(objUrl);
        } catch {}
      } else {
        updateRow(id, "uploadStatus", "error");
      }
    } catch (err) {
      console.warn("Single image upload notice:", err);
      updateRow(id, "uploadStatus", "error");
    }
  };

  const handleRetryRowUpload = async (rowId: string) => {
    const row = bulkRows.find((r) => r.id === rowId);
    if (!row || !row.file) return;

    sound.playClick();
    updateRow(rowId, "uploadStatus", "uploading");
    updateRow(rowId, "uploadProgress", 15);

    try {
      const uploadRes = await StoreService.uploadImageBinary(row.file, undefined, (pct) => {
        updateRow(rowId, "uploadProgress", pct);
      });
      if (uploadRes.success && uploadRes.url) {
        updateRow(rowId, "imageUrl", uploadRes.url);
        updateRow(rowId, "uploadStatus", "done");
        updateRow(rowId, "uploadProgress", 100);
      } else {
        updateRow(rowId, "uploadStatus", "error");
      }
    } catch {
      updateRow(rowId, "uploadStatus", "error");
    }
  };

  const handleBulkImagesUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files).filter((f) => isSupportedImageFile(f));
    e.target.value = "";
    if (fileList.length === 0) return;

    sound.playGunReload();

    const palette = colorPalette.length > 0 ? colorPalette : COLOR_CODES;
    const newRows: BulkRow[] = [];
    type UploadTask = { rowId: string; file: File; extraId?: string };
    const uploadTasks: UploadTask[] = [];
    const PHOTOS_PER_SAREE = 2;

    // 1. Photos are grouped in the order selected, two per saree: photos 1+2 -> saree 1,
    // 3+4 -> saree 2, ... A final odd photo becomes its own saree. The first photo of each
    // pair is the primary one (changeable per saree below).
    groupPhotos(fileList, PHOTOS_PER_SAREE).forEach((group, index) => {
      const rowId = `bulk-row-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`;
      const previews = group.map((file) => {
        const url = URL.createObjectURL(file);
        createdObjectUrls.current.add(url);
        return url;
      });
      const extras: ExtraImage[] = group.slice(1).map((file, k) => ({
        id: `extra-${Date.now()}-${index}-${k}-${Math.random().toString(36).slice(2, 7)}`,
        url: previews[k + 1],
        status: "uploading" as const,
        file,
      }));

      newRows.push({
        id: rowId,
        color1: palette[index % palette.length]?.name || "",
        color2: palette[(index + 1) % palette.length]?.name || "",
        qty: 5,
        imageUrl: previews[0],
        uploadStatus: "uploading",
        uploadProgress: 10,
        file: group[0],
        extraImages: extras,
      });
      uploadTasks.push({ rowId, file: group[0] });
      extras.forEach((x) => uploadTasks.push({ rowId, file: x.file!, extraId: x.id }));
    });

    // Single non-blocking state update: all rows appear instantly
    setBulkRows((prev) => {
      if (prev.length === 1 && !prev[0].imageUrl && prev[0].qty === 5) {
        return newRows;
      }
      return [...prev, ...newRows];
    });

    // 2. Controlled concurrency upload queue (concurrency = 2) in background
    let taskIdx = 0;
    const concurrency = 2;

    const runWorker = async () => {
      while (taskIdx < uploadTasks.length) {
        const current = uploadTasks[taskIdx++];
        if (current.extraId) {
          await uploadExtraImage(current.rowId, { id: current.extraId, url: "", status: "uploading", file: current.file });
          continue;
        }
        try {
          updateRow(current.rowId, "uploadProgress", 25);
          let uploadRes = await StoreService.uploadImageBinary(current.file, undefined, (pct) => {
            updateRow(current.rowId, "uploadProgress", pct);
          });
          if (!(uploadRes.success && uploadRes.url)) {
            uploadRes = await StoreService.uploadImageBinary(current.file); // one retry
          }
          if (uploadRes.success && uploadRes.url) {
            updateRow(current.rowId, "imageUrl", uploadRes.url);
            updateRow(current.rowId, "uploadStatus", "done");
            updateRow(current.rowId, "uploadProgress", 100);
          } else {
            updateRow(current.rowId, "uploadStatus", "error");
          }
        } catch {
          updateRow(current.rowId, "uploadStatus", "error");
        }
      }
    };

    const workerCount = Math.min(concurrency, uploadTasks.length);
    for (let c = 0; c < workerCount; c++) {
      runWorker();
    }
  };

  const allSpecialOffer = bulkRows.length > 0 && bulkRows.every((r) => r.specialOffer);
  const toggleSpecialOfferForAll = () => {
    sound.playClick();
    setBulkRows((prev) => prev.map((r) => ({ ...r, specialOffer: !allSpecialOffer })));
  };

  const applyQuantityToAll = () => {
    const safeQty = Math.max(1, Number(applyQty) || 1);
    sound.playClick();
    setBulkRows((prev) => prev.map((row) => ({ ...row, qty: safeQty })));
  };

  const handleCommitBulkStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCommitting) return;
    setCommitError("");

    const designObj = MOCK_DESIGNS.find((d) => d.slug === selectedDesignSlug);
    if (!designObj || !selectedCategoryId) return;

    const validRows = bulkRows.filter((row) => row.qty > 0);
    if (validRows.length === 0) return;

    if (uploadingRowCount > 0) {
      setCommitError(`Please wait: ${uploadingRowCount} photo${uploadingRowCount !== 1 ? "s are" : " is"} still uploading.`);
      return;
    }
    if (failedUploadRowCount > 0) {
      const proceed = window.confirm(
        `${failedUploadRowCount} row${failedUploadRowCount !== 1 ? "s have" : " has"} a photo that failed to upload. Those rows will be saved WITHOUT a photo.\n\nPress Cancel to retry the photos first.`
      );
      if (!proceed) return;
    }

    const batchBorder = batchBorderColor.trim();
    if (batchBorder) saveBorderColorToRegistry(batchBorder);

    // No IDs/SKUs are generated here: the backend allocates RS SKUs and reports results per
    // clientRef (the row ID), so each row can be matched to its saved SKU or its error.
    const newProducts: (Product & { clientRef: string })[] = validRows.map((row) => {
      const color1Name = (row.color1 || "").trim() || "Standard";
      const color2Name = orderMode === "dual" ? (row.color2 || "").trim() : "";

      const finalColorName = color2Name
        ? `${color1Name} / ${color2Name}`
        : color1Name;

      const finalColorSlug = color2Name
        ? `${colorCodeFor(color1Name)}-${colorCodeFor(color2Name)}`
        : colorCodeFor(color1Name);

      // Only a confirmed storage URL is saved; blob: previews are local to this browser.
      const storedImage =
        row.imageUrl && row.uploadStatus !== "error" && !row.imageUrl.startsWith("blob:")
          ? row.imageUrl
          : undefined;
      // Primary first, then this row's own uploaded extra photos (never another row's).
      const extraUrls = (row.extraImages || [])
        .filter((img) => img.status === "done" && /^https?:\/\//.test(img.url))
        .map((img) => img.url);
      const allImages = Array.from(new Set([storedImage, ...extraUrls].filter(Boolean) as string[]));

      const rowBorder = (row.borderColor || "").trim();
      if (rowBorder) saveBorderColorToRegistry(rowBorder);
      const borderColor = rowBorder || batchBorder;

      const categoryName = "SiCo Gadwal Sarees";

      return {
        id: "",
        clientRef: row.id,
        name: designObj.name,
        categoryId: "cat_sico_gadwal",
        category: categoryName,
        purchasePrice: purchasePrice ? Number(purchasePrice) : 0,
        salePrice: salePrice ? Number(salePrice) : 0,
        tags: [
          "bulk-restock",
          orderMode === "dual" ? "dual-tone" : "single-tone",
          ...(row.specialOffer ? ["special_offer"] : []),
        ],
        isSpecialOffer: Boolean(row.specialOffer),
        description: getDesignDescription(selectedDesignSlug) || undefined,
        imageUrl: allImages[0],
        images: allImages.length > 0 ? allImages : undefined,
        ...(borderColor ? { borderColor } : {}),
        variants: [
          {
            color: finalColorName,
            colorSlug: finalColorSlug,
            stock: row.qty,
            sku: "",
            imageUrl: allImages[0],
          },
        ],
      };
    });

    setIsCommitting(true);
    let result: BulkRestockResult;
    try {
      result = await onBulkRestock(newProducts);
    } catch (err: any) {
      result = {
        inserted: [],
        failed: newProducts.map((p) => ({ clientRef: p.clientRef, error: err?.message || "Save failed" })),
      };
    } finally {
      setIsCommitting(false);
    }

    const skuByRowId = new Map(result.inserted.map((x) => [x.clientRef, x.id]));
    const savedRowIds = new Set(skuByRowId.keys());
    const failedByRowId = new Map(result.failed.map((f) => [String(f.clientRef ?? ""), f.error]));

    // Keep only the rows that were not stored, annotated with the reason, so they can be retried.
    setBulkRows((prev) => {
      const remaining = prev
        .filter((row) => !savedRowIds.has(row.id))
        .map((row) => (failedByRowId.has(row.id) ? { ...row, saveError: failedByRowId.get(row.id) } : row));
      return remaining.length > 0
        ? remaining
        : [{ id: `bulk-row-${Date.now()}-0`, color1: "", color2: "", qty: 5 }];
    });

    if (result.failed.length > 0) {
      setCommitError(
        `${savedRowIds.size} of ${newProducts.length} sarees saved. ${result.failed.length} failed and are still listed below for retry: ` +
          Array.from(new Set(result.failed.map((f) => f.error))).join("; ")
      );
    }

    if (savedRowIds.size === 0) {
      sound.playClick();
      return;
    }

    sound.playNotification();
    const catObj = categoryOptions.find((c) => c.value === selectedCategoryId);
    const savedRows = validRows.filter((r) => savedRowIds.has(r.id));
    setSuccessBatch({
      isOpen: true,
      designName: designObj.name,
      totalPieces: savedRows.reduce((sum, r) => sum + r.qty, 0),
      variantsCount: savedRows.length,
      categoryName: catObj?.label || "SiCo Gadwal",
      skus: validRows.filter((r) => savedRowIds.has(r.id)).map((r) => skuByRowId.get(r.id)!),
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
                placeholder="e.g. 1445"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(cleanPriceInput(e.target.value))}
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
                placeholder="e.g. 1850"
                value={salePrice}
                onChange={(e) => setSalePrice(cleanPriceInput(e.target.value))}
                className="h-11 w-full rounded-2xl border border-stone-200/80 bg-white/90 pl-8 pr-3 text-xs font-semibold text-stone-900 outline-none transition-all focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/10"
              />
            </div>
          </div>

          {/* BORDER DETAILS — entered once, applied to every row (single & dual tone) */}
          <div className="md:col-span-2 xl:col-start-3">
            <label className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
              <span>Border Colour &amp; Zari Details</span>
              <span className="text-[9px] font-normal normal-case tracking-normal text-stone-400">
                Applies to all {orderMode === "dual" ? "dual" : "single"} tone rows &bull; override per row below
              </span>
            </label>
            <BorderColorInput
              value={batchBorderColor}
              onChange={setBatchBorderColor}
              placeholder="Border shade for this consignment (e.g. Royal Gold Zari)..."
            />
          </div>
        </div>

        {/* MULTI-PHOTO DROPZONE */}
        <div className="px-6 pb-6">
          <div className="group relative overflow-hidden rounded-3xl border-2 border-dashed border-amber-300/80 bg-linear-to-br from-amber-50/50 via-white to-amber-50/20 p-7 text-center transition-all hover:border-amber-400 hover:bg-amber-50/40">
            <input
              type="file"
              multiple
              accept={IMAGE_ACCEPT_ATTR}
              onChange={handleBulkImagesUpload}
              className="absolute inset-0 z-10 cursor-pointer opacity-0"
              title="Upload multiple saree photos (JPG, PNG, WebP, HEIC)"
            />
            <div className="pointer-events-none mx-auto flex max-w-md flex-col items-center">
              <div className="mb-3 flex h-13 w-13 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 shadow-xs transition-transform duration-300 group-hover:scale-105 border border-amber-200/80">
                <ImagePlus size={24} className="text-amber-950" />
              </div>
              <h3 className="font-serif text-sm font-bold text-stone-900">
                Drop Multiple Drape Photos to Auto-Index
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-stone-500 font-light">
                Drop your saree photographs (JPG, PNG, WebP, or HEIC) here in order. Every 2 photos become one saree (photos 1+2, 3+4, ...); an odd last photo becomes its own saree. You can add more photos or change the primary photo per saree below.
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
                onClick={toggleSpecialOfferForAll}
                title="Enable or disable the Special Offer for every row"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50 px-3 text-xs font-semibold text-amber-900 shadow-2xs transition-all hover:bg-amber-100 active:scale-95"
              >
                <Sparkles size={13} className="text-amber-700" />
                <span>{allSpecialOffer ? "Special Offer: Off for All" : "Special Offer: On for All"}</span>
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

        <datalist id="bulk-border-colors">
          {registeredBorderColors.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        {/* VARIATION ITEM ROWS */}
        <div className="space-y-3 px-6 pb-6">
          {bulkRows.map((row, index) => {
            const autoSku = PENDING_SKU_LABEL;

            return (
              <div
                key={row.id}
                className="group relative flex flex-col gap-3.5 rounded-2xl border border-stone-200/80 bg-white/80 p-3.5 shadow-2xs transition-all duration-200 hover:border-[#D4A373]/60 hover:bg-white hover:shadow-xs md:flex-row md:flex-wrap md:items-center"
              >
                {row.saveError && (
                  <div className="absolute -top-2 left-3 z-10 max-w-[90%] truncate rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[9.5px] font-semibold text-rose-700" title={row.saveError}>
                    Not saved: {row.saveError}
                  </div>
                )}

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
                        onError={(e) => {
                          handleSareeImageError(e, row.imageUrl, (recovered) => {
                            updateRow(row.id, "imageUrl", recovered);
                          });
                        }}
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

                  {/* Status Overlay: Uploading Progress Ring / Spinner */}
                  {row.uploadStatus === "uploading" && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[1px] text-white">
                      <Loader2 size={16} className="animate-spin text-[#D4A373]" />
                      <span className="text-[9px] font-mono mt-0.5">{row.uploadProgress || 10}%</span>
                    </div>
                  )}

                  {/* Status Overlay: Done Badge */}
                  {row.uploadStatus === "done" && (
                    <div className="absolute top-1 right-1 z-10 rounded-full bg-emerald-600/90 p-0.5 text-white shadow-xs">
                      <Check size={9} strokeWidth={3} />
                    </div>
                  )}

                  {/* Status Overlay: Error Badge & Retry Button */}
                  {row.uploadStatus === "error" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleRetryRowUpload(row.id);
                      }}
                      title="Upload failed. Click to retry upload"
                      className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-rose-950/70 p-1 text-white transition hover:bg-rose-900/80"
                    >
                      <AlertCircle size={14} className="text-rose-300" />
                      <span className="text-[8px] font-bold uppercase tracking-wide flex items-center gap-0.5 mt-0.5 text-rose-200">
                        <RefreshCw size={8} /> Retry
                      </span>
                    </button>
                  )}

                  <input
                    type="file"
                    accept={IMAGE_ACCEPT_ATTR}
                    onChange={(e) => handleSingleImageUpload(row.id, e)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    title="Upload or change drape photograph (JPG, PNG, WebP, HEIC)"
                  />
                </div>

                {/* Dropdowns & SKU */}
                <div className={`grid flex-1 grid-cols-1 gap-2.5 sm:grid-cols-2 ${orderMode === "dual" ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
                  <PremiumDropdown
                    label="Primary Body Shade (Optional)"
                    value={row.color1}
                    options={colorOptions}
                    placeholder="Select shade (optional)..."
                    onChange={(value) => updateRow(row.id, "color1", value)}
                    allowCustom={true}
                    allowClear={true}
                    onRegisterCustom={handleRegisterColor}
                    customActionLabel="Register Color"
                  />

                  {orderMode === "dual" ? (
                    <PremiumDropdown
                      label="Second Tone / Contrast Shade (Optional)"
                      value={row.color2}
                      options={colorOptions}
                      placeholder="Select contrast (optional)..."
                      onChange={(value) => updateRow(row.id, "color2", value)}
                      allowCustom={true}
                      allowClear={true}
                      onRegisterCustom={handleRegisterColor}
                      customActionLabel="Register Color"
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

                  <div className="flex flex-col">
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
                      Border (this row)
                    </label>
                    <input
                      type="text"
                      list="bulk-border-colors"
                      value={row.borderColor || ""}
                      onChange={(e) => updateRow(row.id, "borderColor", e.target.value)}
                      placeholder={batchBorderColor.trim() ? `Batch: ${batchBorderColor.trim()}` : "Same as batch (none)"}
                      title="Leave empty to use the batch border details"
                      className={`h-11 w-full rounded-2xl border px-3.5 text-xs font-semibold text-stone-900 outline-none transition-all placeholder:font-normal placeholder:text-stone-400 focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/10 ${
                        (row.borderColor || "").trim() ? "border-amber-300 bg-amber-50/40" : "border-stone-200/80 bg-white/90"
                      }`}
                    />
                  </div>

                  {orderMode === "dual" && (
                    <div className="flex flex-col">
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

                {/* Per-product photo gallery: primary + "Add More Images" (this product only) */}
                <div className="w-full md:basis-full border-t border-stone-100 pt-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
                      Photos for row #{index + 1} ({(row.imageUrl ? 1 : 0) + (row.extraImages || []).length})
                    </span>
                    <label
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold border ${row.specialOffer ? "bg-[#8E3D51] text-white border-[#8E3D51]" : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"}`}
                      title="Enables Buy 1 @ ₹2,500 / Buy 2 @ ₹4,900 / Buy 3 @ ₹4,800 for this saree"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(row.specialOffer)}
                        onChange={(e) => updateRow(row.id, "specialOffer", e.target.checked)}
                        className="h-3 w-3 accent-[#8E3D51]"
                        data-testid={`special-offer-${index}`}
                      />
                      <Sparkles size={12} />
                      <span>Special Offer</span>
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-900 border border-amber-200/70 hover:bg-amber-100">
                      <ImagePlus size={12} />
                      <span>Add More Images</span>
                      <input
                        type="file"
                        multiple
                        accept={IMAGE_ACCEPT_ATTR}
                        onChange={(e) => handleAddExtraImages(row.id, e)}
                        className="hidden"
                        data-testid={`add-more-images-${index}`}
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {row.imageUrl && (
                      <div className="relative h-16 w-16 overflow-hidden rounded-xl border-2 border-[#D4A373] bg-stone-50" title="Primary photo">
                        <img src={row.imageUrl} alt="Primary" className="h-full w-full object-cover" />
                        <span className="absolute bottom-0 left-0 right-0 bg-[#2A0E20]/80 text-center text-[8px] font-bold uppercase text-amber-100">Primary</span>
                        {row.uploadStatus !== "uploading" && (
                          <button
                            type="button"
                            onClick={() => removePrimaryImage(row.id)}
                            title="Remove primary photo (the next uploaded photo becomes primary)"
                            className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-rose-600"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    )}
                    {(row.extraImages || []).map((img) => (
                      <div key={img.id} className={`relative h-16 w-16 overflow-hidden rounded-xl border bg-stone-50 ${img.status === "error" ? "border-rose-300" : "border-stone-200"}`}>
                        <img src={img.url} alt="Additional" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
                        {img.status === "uploading" && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                            <Loader2 size={14} className="animate-spin text-[#D4A373]" />
                          </div>
                        )}
                        {img.status === "error" && (
                          <button
                            type="button"
                            onClick={() => uploadExtraImage(row.id, img)}
                            title={`Upload failed: ${img.error || "unknown error"}. Click to retry.`}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/70 text-[8px] font-bold uppercase text-rose-100"
                          >
                            <AlertCircle size={12} className="text-rose-300" />
                            <span className="mt-0.5 flex items-center gap-0.5"><RefreshCw size={8} /> Retry</span>
                          </button>
                        )}
                        {img.status === "done" && (
                          <button
                            type="button"
                            onClick={() => makeExtraPrimary(row.id, img.id)}
                            title="Make this the primary photo"
                            className="absolute bottom-0 left-0 right-0 bg-black/55 text-center text-[8px] font-bold uppercase text-white hover:bg-[#2A0E20]"
                          >
                            Set primary
                          </button>
                        )}
                        {img.status !== "uploading" && (
                          <button
                            type="button"
                            onClick={() => removeExtraImage(row.id, img.id)}
                            title="Remove this photo"
                            className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-rose-600"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    ))}
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
                ₹{((Number(salePrice) || 0) * totalPieces).toLocaleString("en-IN")}
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
                isCommitting ||
                uploadingRowCount > 0 ||
                !selectedDesignSlug ||
                !selectedCategoryId ||
                bulkRows.length === 0 ||
                totalPieces <= 0
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2A0E20] px-7 py-3 text-xs font-bold text-amber-100 shadow-xs transition-all hover:bg-[#3D142E] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              {isCommitting || uploadingRowCount > 0 ? (
                <Loader2 size={14} className="animate-spin text-[#D4A373]" />
              ) : (
                <Check size={14} className="text-[#D4A373]" />
              )}
              <span>
                {isCommitting
                  ? "Saving to database..."
                  : uploadingRowCount > 0
                    ? `Waiting for ${uploadingRowCount} photo${uploadingRowCount !== 1 ? "s" : ""}...`
                    : "Commit Consignment to Inventory"}
              </span>
            </button>
          </div>

          {commitError && (
            <div className="mt-3 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-600" />
              <p className="break-words">{commitError}</p>
            </div>
          )}
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

              {successBatch.skus.length > 0 && (
                <div className="mt-3 rounded-2xl border border-stone-200/80 bg-stone-50/60 p-3 text-left">
                  <span className="text-[9px] font-bold uppercase text-stone-400">Assigned SKUs</span>
                  <p className="mt-1 break-words font-mono text-[11px] font-bold text-[#8E3D51]">
                    {successBatch.skus.join(", ")}
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setBulkRows([
                      {
                        id: `bulk-row-${Date.now()}-0`,
                        color1: "",
                        color2: "",
                        qty: 5,
                      },
                    ]);
                    setBatchBorderColor("");
                    setCommitError("");
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