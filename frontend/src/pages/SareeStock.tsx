import {
  useState,
  useMemo,
  useEffect,
  useRef,
  type FormEvent,
} from "react";
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  X,
  IndianRupee,
  Package,
  AlertTriangle,
  Check,
  Palette,
  ChevronDown,
  Box,
  Wand2,
  Image as ImageIcon,
  Link2,
  Loader2,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";
import { StoreService } from "../services/storeService";
import type { Product, Category, ColorVariant } from "../types/inventory";
import {
  LOW_STOCK_THRESHOLD,
  COLOR_OPTIONS,
  CurrencyFormatter,
  normalizeText,
  createDesignSlug,
  generateColorSlug,
  buildSku,
  getProductSerial,
  getNextDesignSerial,
  calculateInventoryMetrics,
  filterInventory,
  getAvailableDesignOptions,
} from "../types/catalog";

interface CatalogProps {
  inventory: Product[];
  categories: Category[];
  onAddProduct: (newProduct: Product, categoryId: string) => void;
  onUpdateProduct: (updatedProduct: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onOpenHistory?: () => void;
}

// ============================================================
// SUB-COMPONENT: DESIGN SELECTION
// ============================================================
function DesignInput({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    const query = value.trim().toLowerCase();

    if (!query) return options;

    return options.filter((design) =>
      design.toLowerCase().includes(query)
    );
  }, [options, value]);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);

    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const designSlug = value.trim() ? createDesignSlug(value) : "";

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-stone-500">
        <Wand2 size={12} className="shrink-0" />
        <span>Design Title / Saree Pattern</span>
      </label>

      <div
        className={`
          relative flex h-11 w-full items-center
          rounded-2xl border bg-white
          transition-all duration-200
          ${isOpen
            ? "border-[#D4A373] ring-4 ring-[#D4A373]/10 shadow-md"
            : "border-stone-200 hover:border-stone-300"
          }
        `}
      >
        <input
          type="text"
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          placeholder="Select or type a saree design..."
          className="
            h-full w-full
            rounded-2xl
            bg-transparent
            px-4 pr-12
            text-sm font-semibold
            text-stone-900
            outline-none
            placeholder:text-stone-400
          "
        />

        <button
          type="button"
          aria-label="Toggle design list"
          onClick={() => setIsOpen((prev) => !prev)}
          className="
            absolute right-2
            flex h-8 w-8
            items-center justify-center
            rounded-xl
            text-stone-400
            transition-all duration-200
            hover:bg-stone-100
            hover:text-stone-700
            active:scale-90
          "
        >
          <ChevronDown
            size={15}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""
              }`}
          />
        </button>
      </div>

      {designSlug && (
        <div className="mt-1.5 flex min-h-4 items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
            Design Code
          </span>

          <span className="rounded-md bg-stone-100 px-2 py-0.5 font-mono text-[9px] font-bold text-stone-800">
            {designSlug}
          </span>
        </div>
      )}

      {isOpen && (
        <div
          className="
            absolute left-0 right-0 top-full z-[120]
            mt-2
            overflow-hidden
            rounded-2xl
            border border-stone-200
            bg-white
            p-1.5
            shadow-[0_20px_50px_rgba(28,18,24,0.15)]
            ring-1 ring-black/[0.03]
          "
        >
          <div className="border-b border-stone-100 px-3 py-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-stone-400">
              Existing Designs
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.map((design) => {
              const isSelected =
                normalizeText(value) === normalizeText(design);

              return (
                <button
                  key={design}
                  type="button"
                  onClick={() => {
                    onChange(design);
                    setIsOpen(false);
                  }}
                  className={`
                    flex w-full items-center justify-between
                    rounded-xl
                    px-3 py-2.5
                    text-left
                    transition-all duration-150
                    ${isSelected
                      ? "bg-amber-50 text-[#2A0E20]"
                      : "text-stone-700 hover:bg-stone-50"
                    }
                  `}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {design}
                    </p>

                    <p className="font-mono text-[9px] text-stone-400">
                      {createDesignSlug(design)}
                    </p>
                  </div>

                  {isSelected && (
                    <Check
                      size={14}
                      className="ml-3 shrink-0 text-[#2A0E20]"
                    />
                  )}
                </button>
              );
            })}

            {value.trim() &&
              !options.some(
                (d) =>
                  normalizeText(d) === normalizeText(value)
              ) && (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="
                    mt-1 flex w-full items-center gap-2.5
                    rounded-xl
                    bg-amber-50/60
                    p-2.5
                    text-left
                    transition-colors
                    hover:bg-amber-50
                  "
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2A0E20] text-amber-100">
                    <Plus size={13} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#2A0E20]">
                      Use "{value}"
                    </p>

                    <p className="text-[9px] text-stone-400">
                      Create as a new saree design
                    </p>
                  </div>
                </button>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: COLOR DROPDOWN INPUT
// ============================================================
function ColorInput({
  value,
  onChange,
  placeholder = "Select or type color...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [dropdownStyle, setDropdownStyle] =
    useState<React.CSSProperties>({});

  const filteredColors = useMemo(() => {
    const query = value.trim().toLowerCase();

    if (!query) return COLOR_OPTIONS;

    return COLOR_OPTIONS.filter((color) =>
      color.toLowerCase().includes(query)
    );
  }, [value]);

  const updateDropdownPosition = () => {
    if (!inputRef.current) return;

    const rect = inputRef.current.getBoundingClientRect();

    const dropdownHeight = 280;
    const spaceBelow = window.innerHeight - rect.bottom;

    const shouldOpenAbove =
      spaceBelow < dropdownHeight &&
      rect.top > spaceBelow;

    setDropdownStyle({
      position: "fixed",
      top: shouldOpenAbove
        ? rect.top - dropdownHeight - 8
        : rect.bottom + 8,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    updateDropdownPosition();

    const handleUpdate = () => updateDropdownPosition();

    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);

    return () =>
      document.removeEventListener("mousedown", handleOutside);
  }, []);

  const openDropdown = () => {
    setIsOpen(true);

    requestAnimationFrame(() => {
      updateDropdownPosition();
    });
  };

  const hasCustomColor =
    value.trim() &&
    !COLOR_OPTIONS.some(
      (c) =>
        normalizeText(c) === normalizeText(value)
    );

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`
          relative flex h-11 w-full items-center
          rounded-2xl border bg-white
          transition-all duration-200
          ${isOpen
            ? "border-[#D4A373] ring-4 ring-[#D4A373]/10 shadow-md"
            : "border-stone-200 hover:border-stone-300"
          }
        `}
      >
        <Palette
          size={15}
          className="
            pointer-events-none
            absolute left-4
            text-stone-400
            transition-colors
          "
        />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onFocus={openDropdown}
          onChange={(event) => {
            onChange(event.target.value);
            openDropdown();
          }}
          placeholder={placeholder}
          className="
            h-full w-full
            rounded-2xl
            bg-transparent
            py-3 pl-10 pr-10
            text-sm font-medium
            text-stone-900
            outline-none
            placeholder:text-stone-400
          "
        />

        <button
          type="button"
          aria-label="Toggle color list"
          onClick={() =>
            isOpen
              ? setIsOpen(false)
              : openDropdown()
          }
          className="
            absolute right-2
            flex h-8 w-8
            items-center justify-center
            rounded-xl
            text-stone-400
            transition-all duration-200
            hover:bg-stone-100
            hover:text-stone-700
            active:scale-90
          "
        >
          <ChevronDown
            size={15}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""
              }`}
          />
        </button>
      </div>

      {isOpen && (
        <div
          style={dropdownStyle}
          className="
            overflow-hidden
            rounded-2xl
            border border-stone-200
            bg-white
            shadow-[0_20px_50px_rgba(28,18,24,0.15)]
            ring-1 ring-black/[0.04]
          "
        >
          <div className="flex items-center justify-between border-b border-stone-100 px-3.5 py-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
              Select Hue
            </span>

            <span className="rounded-full bg-stone-50 px-2 py-0.5 text-[9px] font-semibold text-stone-400">
              {filteredColors.length}
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto p-1.5">
            {filteredColors.map((color) => {
              const selected =
                normalizeText(value) ===
                normalizeText(color);

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    onChange(color);
                    setIsOpen(false);
                  }}
                  className={`
                    flex w-full items-center justify-between
                    rounded-xl
                    px-3 py-2
                    text-left text-xs
                    transition-colors duration-150
                    ${selected
                      ? "bg-amber-50 font-bold text-[#2A0E20]"
                      : "text-stone-700 hover:bg-stone-50"
                    }
                  `}
                >
                  <span className="truncate">
                    {color}
                  </span>

                  {selected && (
                    <Check
                      size={12}
                      className="ml-3 shrink-0 text-[#2A0E20]"
                    />
                  )}
                </button>
              );
            })}

            {hasCustomColor && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="
                  mt-1 flex w-full
                  items-center gap-2
                  rounded-xl
                  bg-amber-50/50
                  p-2
                  text-left
                  transition-colors
                  hover:bg-amber-50
                "
              >
                <Plus
                  size={13}
                  className="shrink-0 text-[#2A0E20]"
                />

                <span className="truncate text-xs font-semibold text-[#2A0E20]">
                  Use "{value}"
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: IMAGE UPLOADER
// ============================================================
function ImageUploadInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(20);

    const reader = new FileReader();

    reader.onload = async () => {
      if (typeof reader.result === "string") {
        const dataUrl = reader.result;
        try {
          setUploadProgress(50);
          const res = await StoreService.uploadImage(dataUrl, (pct) => setUploadProgress(pct));
          if (res && res.success && res.url) {
            onChange(res.url);
          } else {
            onChange(dataUrl);
          }
        } catch (err) {
          console.warn("Upload service error, fallback to local data URL:", err);
          onChange(dataUrl);
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }
      }
    };

    reader.readAsDataURL(file);
  }

  const isUploadedImage = value.startsWith("data:");
  const isCloudImage = value.includes("supabase.co") || value.startsWith("http");

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-stone-500">
          <ImageIcon size={12} className="shrink-0" />
          <span>Product Preview Image</span>
        </label>
        {isCloudImage && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            <CheckCircle2 size={11} />
            Supabase Vault
          </span>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`
          flex min-h-[150px]
          cursor-pointer
          flex-col
          items-center
          justify-center
          gap-2
          rounded-2xl
          border-2 border-dashed
          p-5
          text-center
          transition-all duration-200
          ${isDragging
            ? "border-[#D4A373] bg-amber-50/30 shadow-sm"
            : "border-stone-200 bg-stone-50/40 hover:border-stone-300 hover:bg-stone-50/70"
          }
        `}
      >
        {isUploading ? (
          <div className="space-y-2.5 py-3 w-full max-w-xs">
            <div className="flex items-center justify-center gap-2 text-stone-800 text-xs font-semibold">
              <Loader2 size={16} className="animate-spin text-[#D4A373]" />
              <span>Uploading Saree Visual to Cloud...</span>
            </div>
            <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mx-auto">
              <div
                className="bg-gradient-to-r from-[#D4A373] to-[#2A0E20] h-full rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-[11px] text-stone-500 font-mono block">
              {uploadProgress}%
            </span>
          </div>
        ) : value ? (
          <div className="relative group">
            <img
              src={value}
              alt="Preview"
              loading="lazy"
              decoding="async"
              className="
                h-28 w-28
                rounded-xl
                object-cover
                shadow-sm
                transition-transform duration-200
                group-hover:scale-[1.02]
              "
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-[11px] font-medium">
              Change Visual
            </div>
          </div>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm text-[#D4A373]">
              <UploadCloud size={20} />
            </div>

            <p className="text-xs font-semibold text-stone-600">
              Drag &amp; drop saree photo here
            </p>

            <p className="text-[10px] text-stone-400">
              or click to browse from device (JPG, PNG, WebP)
            </p>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            handleFile(e.target.files?.[0])
          }
        />
      </div>

      {uploadError && (
        <p className="text-[11px] text-rose-600 font-medium">{uploadError}</p>
      )}

      <div className="flex items-center gap-2">
        <Link2
          size={13}
          className="shrink-0 text-stone-400"
        />

        <input
          type="text"
          placeholder="...or paste a direct web image link"
          value={isUploadedImage ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          className="
            h-9 min-w-0 flex-1
            rounded-xl
            border border-stone-200
            bg-white
            px-3
            text-xs
            text-stone-900
            outline-none
            transition-all
            focus:border-[#D4A373]
            focus:ring-2
            focus:ring-[#D4A373]/10
          "
        />

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="
              shrink-0
              rounded-lg
              px-2 py-1
              text-[11px]
              font-semibold
              text-rose-500
              transition-colors
              hover:bg-rose-50
              hover:text-rose-600
            "
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: VARIANT SHADE MANAGER
// ============================================================
function VariantShadeManager({
  variants,
  designSlug,
  serialNumber,
  onRemove,
  onAdd,
}: {
  variants: ColorVariant[];
  designSlug: string;
  serialNumber: string;
  onRemove: (idx: number) => void;
  onAdd: (variant: ColorVariant) => void;
}) {
  const [newColor, setNewColor] = useState("");
  const [newStock, setNewStock] = useState("");

  const previewColorSlug = newColor.trim()
    ? generateColorSlug(newColor)
    : "";

  void previewColorSlug;

  function handleAdd() {
    const colorName = newColor.trim();

    if (!colorName || !designSlug || !serialNumber)
      return;

    const alreadyExists = variants.some(
      (v) =>
        normalizeText(v.color) ===
        normalizeText(colorName)
    );

    if (alreadyExists) {
      alert(
        "This color has already been registered on this drape."
      );
      return;
    }

    const colorSlug = generateColorSlug(colorName);

    const codeUsed = variants.some(
      (v) => v.colorSlug === colorSlug
    );

    if (codeUsed) {
      alert(
        `The color code "${colorSlug}" is already assigned to another shade.`
      );
      return;
    }

    const sku = buildSku(
      designSlug,
      colorSlug,
      serialNumber
    );

    onAdd({
      color: colorName,
      colorSlug,
      stock:
        newStock.trim() === ""
          ? 0
          : Math.max(0, Number(newStock)),
      sku,
    });

    setNewColor("");
    setNewStock("");
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-stone-100 bg-stone-50/50 px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2A0E20] text-[#D4A373]">
            <Palette size={16} />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-xs font-bold text-stone-900">
              Color Shades &amp; In-Store Stock
            </h3>

            <p className="text-[10px] text-stone-400">
              SKUs generated per hue code
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-semibold text-stone-600">
          {variants.length}{" "}
          {variants.length === 1 ? "Hue" : "Hues"}
        </span>
      </div>

      {/* Variant List */}
      <div className="space-y-2 bg-stone-50/30 p-4">
        {variants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-7 text-center">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100">
              <Palette
                size={20}
                className="text-stone-300"
              />
            </div>

            <p className="text-xs font-semibold text-stone-500">
              No color variants added yet
            </p>
          </div>
        ) : (
          <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
            {variants.map((v, idx) => (
              <div
                key={v.sku}
                className="
                  flex min-w-0
                  items-center justify-between
                  gap-3
                  rounded-xl
                  border border-stone-200
                  bg-white
                  p-2.5
                  transition-all duration-150
                  hover:border-stone-300
                  hover:shadow-sm
                "
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 font-mono text-[10px] font-bold text-stone-800">
                    {v.colorSlug}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-stone-900">
                      {v.color}
                    </p>

                    <p className="truncate font-mono text-[9px] text-stone-400">
                      {v.sku}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="whitespace-nowrap rounded-md bg-stone-50 px-2 py-1 text-xs font-bold text-stone-800">
                    {v.stock} in stock
                  </span>

                  <button
                    type="button"
                    aria-label={`Remove ${v.color}`}
                    onClick={() => onRemove(idx)}
                    className="
                      flex h-7 w-7
                      items-center justify-center
                      rounded-lg
                      text-stone-400
                      transition-all duration-150
                      hover:bg-rose-50
                      hover:text-rose-600
                      active:scale-90
                    "
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Variant */}
      <div className="border-t border-stone-100 bg-white p-3">
        <div className="grid grid-cols-12 items-center gap-2">
          <div className="col-span-12 sm:col-span-7">
            <ColorInput
              value={newColor}
              onChange={setNewColor}
              placeholder="Pick next shade..."
            />
          </div>

          <input
            type="number"
            min="0"
            placeholder="Qty"
            value={newStock}
            onChange={(e) =>
              setNewStock(e.target.value)
            }
            className="
              col-span-5
              h-11
              rounded-xl
              border border-stone-200
              px-2
              text-center
              text-xs
              outline-none
              transition-all
              focus:border-[#D4A373]
              focus:ring-2
              focus:ring-[#D4A373]/10
              sm:col-span-2
            "
          />

          <button
            type="button"
            onClick={handleAdd}
            disabled={
              !newColor.trim() || !designSlug
            }
            className="
              col-span-7
              flex h-11
              items-center
              justify-center
              gap-1.5
              rounded-xl
              bg-[#2A0E20]
              text-xs
              font-semibold
              text-amber-100
              shadow-sm
              transition-all duration-200
              hover:-translate-y-0.5
              hover:bg-[#3D142E]
              hover:shadow-md
              active:translate-y-0
              active:scale-[0.98]
              disabled:cursor-not-allowed
              disabled:opacity-40
              disabled:hover:translate-y-0
              sm:col-span-3
            "
          >
            <Plus size={13} />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: PRODUCT CARD
// ============================================================
function ProductCard({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const totalStock = product.variants.reduce(
    (sum, v) => sum + v.stock,
    0
  );

  const isLowStock =
    totalStock <= LOW_STOCK_THRESHOLD;

  return (
    <div
      className="
        group
        flex min-w-0
        flex-col
        overflow-hidden
        rounded-3xl
        border border-stone-200/80
        bg-white
        shadow-sm
        transition-all duration-300
        hover:-translate-y-1
        hover:border-stone-300
        hover:shadow-lg
      "
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-stone-50">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="
              h-full w-full
              object-cover
              transition-transform
              duration-500
              ease-out
              group-hover:scale-105
            "
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package
              size={36}
              className="text-stone-200"
            />
          </div>
        )}

        {/* Actions */}
        <div
          className="
            absolute right-2.5 top-2.5
            flex gap-1.5
            opacity-0
            translate-y-1
            transition-all duration-200
            group-hover:translate-y-0
            group-hover:opacity-100
          "
        >
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit product"
            className="
              flex h-8 w-8
              items-center justify-center
              rounded-xl
              border border-white/70
              bg-white/95
              text-stone-700
              shadow-sm
              backdrop-blur
              transition-all duration-150
              hover:-translate-y-0.5
              hover:text-[#2A0E20]
              hover:shadow-md
              active:scale-90
            "
          >
            <Edit3 size={13} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete product"
            className="
              flex h-8 w-8
              items-center justify-center
              rounded-xl
              border border-white/70
              bg-white/95
              text-stone-700
              shadow-sm
              backdrop-blur
              transition-all duration-150
              hover:-translate-y-0.5
              hover:text-rose-600
              hover:shadow-md
              active:scale-90
            "
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Low Stock */}
        {isLowStock && (
          <span
            className="
              absolute left-2.5 top-2.5
              rounded-md
              bg-rose-600
              px-2 py-1
              text-[9px]
              font-bold
              uppercase
              tracking-wide
              text-white
              shadow-sm
            "
          >
            Low Stock
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="flex min-h-[145px] flex-1 flex-col p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-stone-950">
            {product.name}
          </p>

          <p className="mt-0.5 truncate font-mono text-[9px] text-stone-400">
            {product.id}
          </p>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <p className="truncate text-base font-bold text-stone-950">
            {CurrencyFormatter.format(
              product.salePrice
            )}
          </p>

          <span
            className={`
              shrink-0
              rounded-lg
              px-2 py-1
              text-[10px]
              font-bold
              ${isLowStock
                ? "bg-rose-50 text-rose-700"
                : "bg-stone-50 text-stone-700"
              }
            `}
          >
            {totalStock} in stock
          </span>
        </div>

        <div className="mt-auto flex min-h-[24px] flex-wrap gap-1 pt-3">
          {product.variants.map((v) => (
            <span
              key={v.sku}
              className="
                rounded-md
                border border-stone-200
                bg-stone-50
                px-1.5 py-0.5
                font-mono
                text-[9px]
                font-bold
                text-stone-700
              "
            >
              {v.colorSlug}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: LOW STOCK AUDIT MODAL
// ============================================================
function LowStockModal({
  isOpen,
  onClose,
  inventory,
  onUpdateProduct,
}: {
  isOpen: boolean;
  onClose: () => void;
  inventory: Product[];
  onUpdateProduct: (updatedProduct: Product) => void;
}) {
  const [editedStock, setEditedStock] =
    useState<Record<string, string>>({});

  const lowStockRows = useMemo(() => {
    const rows: {
      product: Product;
      variant: ColorVariant;
    }[] = [];

    inventory.forEach((p) => {
      p.variants.forEach((v) => {
        if (v.stock <= LOW_STOCK_THRESHOLD) {
          rows.push({
            product: p,
            variant: v,
          });
        }
      });
    });

    return rows;
  }, [inventory]);

  if (!isOpen) return null;

  function handleSaveRow(
    product: Product,
    variantSku: string
  ) {
    const newVal = editedStock[variantSku];

    if (
      newVal === undefined ||
      newVal.trim() === ""
    ) {
      return;
    }

    const parsed = Math.max(0, Number(newVal));

    const updatedVariants = product.variants.map(
      (v) =>
        v.sku === variantSku
          ? { ...v, stock: parsed }
          : v
    );

    onUpdateProduct({
      ...product,
      variants: updatedVariants,
    });

    setEditedStock((prev) => {
      const next = { ...prev };
      delete next[variantSku];
      return next;
    });
  }

  return (
    <div
      className="
        fixed inset-0 z-[60]
        flex items-center justify-center
        bg-stone-950/40
        p-4
        backdrop-blur-sm
      "
      onClick={onClose}
    >
      <div
        className="
          flex
          max-h-[85vh]
          w-full
          max-w-xl
          flex-col
          overflow-hidden
          rounded-[26px]
          border border-white/60
          bg-white
          shadow-[0_30px_80px_rgba(28,18,24,0.22)]
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-stone-100 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-50">
              <AlertTriangle
                size={18}
                className="text-rose-600"
              />
            </div>

            <h2 className="truncate text-sm font-bold text-stone-900">
              Low Stock Review
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="
              flex h-8 w-8
              shrink-0
              items-center justify-center
              rounded-xl
              text-stone-400
              transition-all
              hover:bg-stone-100
              hover:text-stone-700
              active:scale-90
            "
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-4 sm:p-5">
          {lowStockRows.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center text-center">
              <p className="text-xs font-medium text-stone-500">
                All drapery stocks are currently healthy.
              </p>
            </div>
          ) : (
            lowStockRows.map(
              ({ product, variant }) => (
                <div
                  key={variant.sku}
                  className="
                    flex
                    flex-col
                    gap-3
                    rounded-xl
                    border border-stone-200
                    p-3
                    transition-all
                    hover:border-stone-300
                    hover:shadow-sm
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-stone-900">
                      {product.name}
                    </p>

                    <p className="truncate font-mono text-[9px] text-stone-400">
                      {variant.sku}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                    <span className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-600">
                      {variant.stock} left
                    </span>

                    <input
                      type="number"
                      min="0"
                      placeholder="New"
                      value={
                        editedStock[
                        variant.sku
                        ] ?? ""
                      }
                      onChange={(e) =>
                        setEditedStock({
                          ...editedStock,
                          [variant.sku]:
                            e.target.value,
                        })
                      }
                      className="
                        h-8
                        w-16
                        rounded-lg
                        border border-stone-200
                        px-1
                        text-center
                        text-xs
                        outline-none
                        transition-all
                        focus:border-[#D4A373]
                        focus:ring-2
                        focus:ring-[#D4A373]/10
                      "
                    />

                    <button
                      type="button"
                      onClick={() =>
                        handleSaveRow(
                          product,
                          variant.sku
                        )
                      }
                      disabled={
                        !editedStock[
                          variant.sku
                        ]?.trim()
                      }
                      className="
                        flex h-8
                        items-center
                        justify-center
                        rounded-lg
                        bg-[#2A0E20]
                        px-2.5
                        text-xs
                        font-semibold
                        text-amber-100
                        transition-all
                        hover:bg-[#3D142E]
                        active:scale-95
                        disabled:cursor-not-allowed
                        disabled:opacity-30
                      "
                    >
                      Set
                    </button>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ROOT COMPONENT: CATALOG
// ============================================================
export default function Catalog({
  inventory,
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}: CatalogProps) {
  const [searchQuery, setSearchQuery] =
    useState("");

  const [isLowStockModalOpen, setIsLowStockModalOpen] =
    useState(false);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingProductId, setEditingProductId] =
    useState<string | null>(null);

  // Form State
  const [formName, setFormName] =
    useState("");

  const [formCategory, setFormCategory] =
    useState("");

  const [formPurchasePrice, setFormPurchasePrice] =
    useState("");

  const [formSalePrice, setFormSalePrice] =
    useState("");

  const [formTags, setFormTags] =
    useState("");

  const [formVariants, setFormVariants] =
    useState<ColorVariant[]>([]);

  const [formSerialNumber, setFormSerialNumber] =
    useState("001");

  const [primaryColor, setPrimaryColor] =
    useState("");

  const [primaryStock, setPrimaryStock] =
    useState("");

  const [formImageUrl, setFormImageUrl] =
    useState("");

  const searchInputRef =
    useRef<HTMLInputElement>(null);

  const designOptions = useMemo(
    () => getAvailableDesignOptions(inventory),
    [inventory]
  );

  const metrics = useMemo(
    () => calculateInventoryMetrics(inventory),
    [inventory]
  );

  const filteredProducts = useMemo(
    () =>
      filterInventory(
        inventory,
        searchQuery
      ),
    [inventory, searchQuery]
  );

  const activeDesignSlug = formName.trim()
    ? createDesignSlug(formName.trim())
    : "";

  const firstColorCode =
    formVariants[0]?.colorSlug ||
    (primaryColor.trim()
      ? generateColorSlug(primaryColor)
      : "XX");

  const previewSku = activeDesignSlug
    ? buildSku(
      activeDesignSlug,
      firstColorCode,
      formSerialNumber
    )
    : "RSF-DESIGN-XX-001";

  // ==========================================================
  // KEYBOARD SHORTCUTS
  // ==========================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "KeyN") {
        e.preventDefault();
        openCreateModal();
      }

      if (
        e.code === "Escape" &&
        isModalOpen
      ) {
        e.preventDefault();
        setIsModalOpen(false);
      }

      if (e.ctrlKey && e.code === "Slash") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [isModalOpen]);

  function handleDesignChange(name: string) {
    setFormName(name);

    const serial = editingProductId
      ? formSerialNumber
      : getNextDesignSerial(
        name,
        inventory
      );

    setFormSerialNumber(serial);

    setFormVariants((prev) =>
      prev.map((v) => ({
        ...v,
        sku: buildSku(
          createDesignSlug(name),
          v.colorSlug,
          serial
        ),
      }))
    );
  }

  function handlePrimaryColorChange(
    color: string
  ) {
    setPrimaryColor(color);

    if (
      !color.trim() ||
      !activeDesignSlug
    ) {
      return;
    }

    const slug = generateColorSlug(
      color.trim()
    );

    setFormVariants((prev) => {
      if (prev.length === 0) {
        return [
          {
            color: color.trim(),
            colorSlug: slug,
            stock:
              primaryStock.trim() === ""
                ? 0
                : Math.max(
                  0,
                  Number(primaryStock)
                ),
            sku: buildSku(
              activeDesignSlug,
              slug,
              formSerialNumber
            ),
          },
        ];
      }

      return [
        {
          ...prev[0],
          color: color.trim(),
          colorSlug: slug,
          sku: buildSku(
            activeDesignSlug,
            slug,
            formSerialNumber
          ),
        },
        ...prev.slice(1),
      ];
    });
  }

  function handlePrimaryStockChange(
    val: string
  ) {
    setPrimaryStock(val);

    const parsed =
      val.trim() === ""
        ? 0
        : Math.max(0, Number(val));

    setFormVariants((prev) =>
      prev.length > 0
        ? [
          {
            ...prev[0],
            stock: parsed,
          },
          ...prev.slice(1),
        ]
        : prev
    );
  }

  function openCreateModal() {
    setEditingProductId(null);
    setFormName("");
    setFormCategory(
      categories[0]?.id || ""
    );
    setFormPurchasePrice("");
    setFormSalePrice("");
    setFormTags("handloom, premium");
    setFormVariants([]);
    setPrimaryColor("");
    setPrimaryStock("");
    setFormImageUrl("");
    setFormSerialNumber("001");
    setIsModalOpen(true);
  }

  function openEditModal(
    product: Product
  ) {
    setEditingProductId(product.id);
    setFormName(product.name);
    setFormCategory(product.categoryId);
    setFormSerialNumber(
      getProductSerial(product)
    );
    setFormPurchasePrice(
      String(product.purchasePrice)
    );
    setFormSalePrice(
      String(product.salePrice)
    );
    setFormTags(
      product.tags.join(", ")
    );
    setFormVariants(
      product.variants.map((v) => ({
        ...v,
      }))
    );
    setPrimaryColor(
      product.variants[0]?.color || ""
    );
    setPrimaryStock(
      product.variants[0]
        ? String(
          product.variants[0].stock
        )
        : ""
    );
    setFormImageUrl(
      product.imageUrl || ""
    );
    setIsModalOpen(true);
  }

  function handleSaveProduct(
    e: FormEvent
  ) {
    e.preventDefault();

    const name = formName.trim();

    if (
      !name ||
      !formPurchasePrice ||
      !formSalePrice ||
      formVariants.length === 0
    ) {
      alert(
        "Please complete required design name, prices, and at least one color hue."
      );
      return;
    }

    const designSlug =
      createDesignSlug(name);

    const finalVariants =
      formVariants.map((v) => ({
        ...v,
        sku: buildSku(
          designSlug,
          v.colorSlug,
          formSerialNumber
        ),
      }));

    const payload: Product = {
      id:
        finalVariants[0]?.sku ||
        buildSku(
          designSlug,
          "XX",
          formSerialNumber
        ),
      name,
      categoryId: formCategory,
      purchasePrice:
        Number(formPurchasePrice) || 0,
      salePrice:
        Number(formSalePrice) || 0,
      tags: formTags
        .split(",")
        .map((t) =>
          t.trim().toLowerCase()
        )
        .filter(Boolean),
      variants: finalVariants,
      imageUrl:
        formImageUrl || undefined,
    };

    if (editingProductId) {
      onUpdateProduct(payload);
    } else {
      onAddProduct(
        payload,
        formCategory
      );
    }

    setIsModalOpen(false);
  }

  const lockedCategoryName =
    categories.find(
      (c) => c.id === formCategory
    )?.name ||
    categories[0]?.name ||
    "SiCo Gadwal";

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[1600px]
        space-y-6
        pb-8
        select-none
      "
    >
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          xl:flex-row
          xl:items-end
          xl:justify-between
        "
      >
        <div className="min-w-0">
          <h1
            className="
              font-display
              text-3xl
              font-semibold
              leading-tight
              text-stone-950
              sm:text-4xl
            "
          >
            Saree Stock
          </h1>

          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-stone-500">
            Manage handloom designs, color
            variants, SKU generation, and live
            showroom stock.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="
            group
            flex h-10
            shrink-0
            items-center
            justify-center
            gap-2
            self-start
            rounded-xl
            bg-[#2A0E20]
            px-4
            text-xs
            font-semibold
            text-amber-100
            shadow-sm
            transition-all duration-200
            hover:-translate-y-0.5
            hover:bg-[#3D142E]
            hover:shadow-md
            active:translate-y-0
            active:scale-[0.98]
            xl:self-auto
          "
        >
          <Plus
            size={15}
            className="
              text-brand-gold
              transition-transform
              duration-200
              group-hover:rotate-90
            "
          />

          <span>Add New Stock</span>

          <span
            className="
              hidden
              rounded
              border
              border-white/10
              px-1.5 py-0.5
              text-[9px]
              text-white/50
              xl:inline
            "
          >
            CTRL+N
          </span>
        </button>
      </div>

      {/* ========================================================
          METRIC CARDS
      ======================================================== */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Total Stock */}
        <div
          className="
            glass-panel
            flex
            min-h-[116px]
            items-center
            justify-between
            gap-4
            rounded-3xl
            p-5
            transition-all duration-200
            hover:-translate-y-0.5
            hover:shadow-md
          "
        >
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Total Drapes
            </span>

            <p className="mt-1 text-2xl font-bold leading-none text-stone-950">
              {metrics.totalStock}
            </p>

            <p className="mt-1 text-[10px] leading-relaxed text-stone-400">
              Across all registered variants
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
            <Package size={20} />
          </div>
        </div>

        {/* Valuation */}
        <div
          className="
            glass-panel
            flex
            min-h-[116px]
            items-center
            justify-between
            gap-4
            rounded-3xl
            p-5
            transition-all duration-200
            hover:-translate-y-0.5
            hover:shadow-md
          "
        >
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Inventory Valuation
            </span>

            <p className="mt-1 truncate text-2xl font-bold leading-none text-stone-950">
              {CurrencyFormatter.format(
                metrics.inventoryCost
              )}
            </p>

            <p className="mt-1 text-[10px] leading-relaxed text-stone-400">
              Based on weaver cost
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-brand-gold">
            <IndianRupee size={20} />
          </div>
        </div>

        {/* Low Stock */}
        <button
          type="button"
          onClick={() =>
            setIsLowStockModalOpen(true)
          }
          className="
            glass-panel
            group
            flex
            min-h-[116px]
            items-center
            justify-between
            gap-4
            rounded-3xl
            p-5
            text-left
            transition-all duration-200
            hover:-translate-y-0.5
            hover:border-rose-200
            hover:shadow-md
            active:scale-[0.995]
          "
        >
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
              Low Stock Warnings
            </span>

            <p className="mt-1 text-2xl font-bold leading-none text-stone-950">
              {metrics.lowStockCount}
            </p>

            <p className="mt-1 text-[10px] font-semibold leading-relaxed text-rose-600">
              Tap to review &amp; replenish &rarr;
            </p>
          </div>

          <div
            className="
              flex h-12 w-12
              shrink-0
              items-center justify-center
              rounded-2xl
              bg-rose-50
              text-rose-600
              transition-transform
              duration-200
              group-hover:scale-105
            "
          >
            <AlertTriangle size={20} />
          </div>
        </button>
      </div>

      {/* ========================================================
          SEARCH
      ======================================================== */}

      <div
        className="
          glass-panel
          flex h-12
          items-center
          gap-2
          rounded-2xl
          p-2.5
          transition-all duration-200
          focus-within:border-[#D4A373]/50
          focus-within:shadow-sm
        "
      >
        <Search
          size={15}
          className="ml-2 shrink-0 text-stone-400"
        />

        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search by SKU, design, hue, or tag... (Ctrl + /)"
          value={searchQuery}
          onChange={(e) =>
            setSearchQuery(e.target.value)
          }
          className="
            min-w-0
            flex-1
            bg-transparent
            py-1.5
            text-xs
            text-stone-800
            outline-none
            placeholder:text-stone-400
          "
        />

        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
            className="
              flex h-7 w-7
              shrink-0
              items-center justify-center
              rounded-lg
              text-stone-400
              transition-all
              hover:bg-stone-100
              hover:text-stone-700
              active:scale-90
            "
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* ========================================================
          CATALOG
      ======================================================== */}

      <div
        className="
          glass-panel
          space-y-4
          rounded-3xl
          p-4
          sm:p-5
        "
      >
        <div className="flex flex-col gap-2 border-b border-stone-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Box
              size={16}
              className="shrink-0 text-brand-plum"
            />

            <h2 className="text-sm font-bold text-stone-900">
              Registered Weaves
            </h2>
          </div>

          <span className="text-[10px] font-mono text-stone-400 sm:text-xs">
            Showing {filteredProducts.length} of{" "}
            {inventory.length} designs
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="flex min-h-[260px] items-center justify-center py-16 text-center text-xs text-stone-400">
            No matching drapes found in catalogue.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onEdit={() =>
                  openEditModal(p)
                }
                onDelete={() => {
                  if (
                    confirm(
                      `Remove SKU ${p.id} (${p.name}) from catalogue?`
                    )
                  ) {
                    onDeleteProduct(p.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ========================================================
          ADD / EDIT MODAL
      ======================================================== */}

      {isModalOpen && (
        <div
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            bg-stone-950/40
            p-3
            backdrop-blur-sm
            sm:p-4
          "
          onClick={() =>
            setIsModalOpen(false)
          }
        >
          <div
            className="
              flex
              max-h-[94vh]
              w-full
              max-w-3xl
              flex-col
              overflow-hidden
              rounded-[28px]
              border border-white/60
              bg-white
              shadow-[0_30px_90px_rgba(28,18,24,0.24)]
            "
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* Modal Header */}
            <div
              className="
                flex shrink-0
                items-center
                justify-between
                gap-4
                border-b border-stone-100
                px-5 py-4
                sm:px-6
              "
            >
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-stone-900">
                  {editingProductId
                    ? "Edit Saree Record"
                    : "Add New Drapery"}
                </h2>

                <p className="mt-0.5 truncate font-mono text-[10px] text-stone-400">
                  {previewSku}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsModalOpen(false)
                }
                aria-label="Close modal"
                className="
                  flex h-8 w-8
                  shrink-0
                  items-center justify-center
                  rounded-xl
                  text-stone-400
                  transition-all
                  hover:bg-stone-100
                  hover:text-stone-700
                  active:scale-90
                "
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSaveProduct}
              className="
                min-h-0
                flex-1
                space-y-4
                overflow-y-auto
                p-5
                text-xs
                sm:p-6
              "
            >
              {/* Category / SKU */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase text-stone-400">
                    Weave Classification
                  </label>

                  <div
                    className="
                      flex h-11
                      items-center
                      overflow-hidden
                      rounded-2xl
                      border border-stone-200
                      bg-stone-50
                      px-3
                      font-semibold
                      text-stone-700
                    "
                  >
                    <span className="truncate">
                      {lockedCategoryName}
                    </span>
                  </div>
                </div>

                <div className="min-w-0">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase text-stone-400">
                    Auto Generated SKU
                  </label>

                  <div
                    className="
                      flex h-11
                      items-center
                      overflow-hidden
                      rounded-2xl
                      border border-amber-200
                      bg-amber-50/50
                      px-3
                      font-mono
                      font-bold
                      text-brand-plum
                    "
                  >
                    <span className="truncate">
                      {previewSku}
                    </span>
                  </div>
                </div>
              </div>

              {/* Design */}
              <DesignInput
                value={formName}
                options={designOptions}
                onChange={handleDesignChange}
              />

              {/* Color / Stock */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase text-stone-400">
                    Primary Color Hue
                  </label>

                  <ColorInput
                    value={primaryColor}
                    onChange={
                      handlePrimaryColorChange
                    }
                  />
                </div>

                <div className="min-w-0">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase text-stone-400">
                    Initial Stock (Pieces)
                  </label>

                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={primaryStock}
                    onChange={(e) =>
                      handlePrimaryStockChange(
                        e.target.value
                      )
                    }
                    className="
                      h-11 w-full
                      rounded-2xl
                      border border-stone-200
                      px-3.5
                      text-xs
                      outline-none
                      transition-all
                      focus:border-[#D4A373]
                      focus:ring-2
                      focus:ring-[#D4A373]/10
                    "
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase text-stone-400">
                    Procurement / Weaving Cost (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    value={formPurchasePrice}
                    onChange={(e) =>
                      setFormPurchasePrice(
                        e.target.value
                      )
                    }
                    className="
                      h-11 w-full
                      rounded-2xl
                      border border-stone-200
                      px-3.5
                      text-xs
                      outline-none
                      transition-all
                      focus:border-[#D4A373]
                      focus:ring-2
                      focus:ring-[#D4A373]/10
                    "
                  />
                </div>

                <div className="min-w-0">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase text-stone-400">
                    Showroom Selling Price (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    value={formSalePrice}
                    onChange={(e) =>
                      setFormSalePrice(
                        e.target.value
                      )
                    }
                    className="
                      h-11 w-full
                      rounded-2xl
                      border border-stone-200
                      px-3.5
                      text-xs
                      outline-none
                      transition-all
                      focus:border-[#D4A373]
                      focus:ring-2
                      focus:ring-[#D4A373]/10
                    "
                  />
                </div>
              </div>

              {/* Image */}
              <ImageUploadInput
                value={formImageUrl}
                onChange={setFormImageUrl}
              />

              {/* Variants */}
              <VariantShadeManager
                variants={formVariants}
                designSlug={activeDesignSlug}
                serialNumber={
                  formSerialNumber
                }
                onRemove={(idx) =>
                  setFormVariants(
                    formVariants.filter(
                      (_, i) => i !== idx
                    )
                  )
                }
                onAdd={(v) =>
                  setFormVariants([
                    ...formVariants,
                    v,
                  ])
                }
              />

              {/* Tags */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase text-stone-400">
                  Catalogue Tags &amp; Keywords
                </label>

                <input
                  type="text"
                  value={formTags}
                  onChange={(e) =>
                    setFormTags(
                      e.target.value
                    )
                  }
                  placeholder="handloom, bridal, zari..."
                  className="
                    h-10 w-full
                    rounded-xl
                    border border-stone-200
                    px-3.5
                    text-xs
                    outline-none
                    transition-all
                    focus:border-[#D4A373]
                    focus:ring-2
                    focus:ring-[#D4A373]/10
                  "
                />
              </div>

              {/* Footer */}
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                  border-t border-stone-100
                  pt-4
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    setIsModalOpen(false)
                  }
                  className="
                    flex h-10
                    items-center justify-center
                    rounded-xl
                    px-4
                    text-xs
                    font-semibold
                    text-stone-500
                    transition-all
                    hover:bg-stone-100
                    hover:text-stone-800
                    active:scale-95
                  "
                >
                  Discard
                </button>

                <button
                  type="submit"
                  className="
                    group
                    flex h-10
                    items-center
                    justify-center
                    gap-1.5
                    rounded-xl
                    bg-[#2A0E20]
                    px-5
                    text-xs
                    font-semibold
                    text-amber-100
                    shadow-sm
                    transition-all duration-200
                    hover:-translate-y-0.5
                    hover:bg-[#3D142E]
                    hover:shadow-md
                    active:translate-y-0
                    active:scale-[0.98]
                  "
                >
                  <Check
                    size={14}
                    className="
                      text-brand-gold
                      transition-transform
                      duration-200
                      group-hover:scale-110
                    "
                  />

                  <span>
                    {editingProductId
                      ? "Update Product"
                      : "Save Saree"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          LOW STOCK MODAL
      ======================================================== */}

      <LowStockModal
        isOpen={isLowStockModalOpen}
        onClose={() =>
          setIsLowStockModalOpen(false)
        }
        inventory={inventory}
        onUpdateProduct={
          onUpdateProduct
        }
      />
    </div>
  );
}