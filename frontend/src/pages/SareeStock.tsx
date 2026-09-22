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
  CheckSquare,
  Square,
  Camera,
  Layers,
  Sparkles,
  ArrowUpDown,
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
  onBatchDelete?: (productIds: string[]) => void;
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
    <div ref={containerRef} className="relative w-full space-y-1.5">
      <label className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">
        <Wand2 size={12} className="text-[#8E3D51]" />
        <span>Design Pattern &amp; Motif Title</span>
      </label>

      <div
        className={`relative flex h-11 w-full items-center rounded-2xl border bg-white/90 shadow-2xs backdrop-blur-md transition-all duration-200 ${isOpen
            ? "border-[#D4A373] ring-4 ring-[#D4A373]/15 shadow-sm"
            : "border-stone-200/80 hover:border-stone-300"
          }`}
      >
        <input
          type="text"
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          placeholder="Select pattern or type new Gadwal design..."
          className="h-full w-full rounded-2xl bg-transparent px-4 pr-12 text-xs font-semibold text-stone-900 outline-none placeholder:text-stone-400 placeholder:font-normal"
        />

        <button
          type="button"
          aria-label="Toggle design list"
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 transition-all hover:bg-stone-100 hover:text-stone-700 active:scale-90"
        >
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {designSlug && (
        <div className="flex items-center gap-2 px-1 pt-0.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
            Pattern Code
          </span>
          <span className="rounded-md bg-stone-100 px-2 py-0.5 font-mono text-[9px] font-bold text-[#8E3D51]">
            {designSlug}
          </span>
        </div>
      )}

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-[120] mt-2 overflow-hidden rounded-2xl border border-stone-200/90 bg-white/95 p-1.5 shadow-[0_20px_50px_rgba(42,14,32,0.14)] backdrop-blur-xl ring-1 ring-black/[0.03] animate-in fade-in duration-150">
          <div className="border-b border-stone-100 px-3 py-2">
            <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-stone-400">
              Registered Gadwal Motifs ({filteredOptions.length})
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto">
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
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${isSelected
                      ? "bg-amber-50 text-[#2A0E20] font-bold"
                      : "text-stone-700 hover:bg-stone-50"
                    }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{design}</p>
                    <p className="font-mono text-[9px] text-stone-400">
                      {createDesignSlug(design)}
                    </p>
                  </div>

                  {isSelected && (
                    <Check size={14} className="ml-3 shrink-0 text-[#8E3D51]" />
                  )}
                </button>
              );
            })}

            {value.trim() &&
              !options.some(
                (d) => normalizeText(d) === normalizeText(value)
              ) && (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-1 flex w-full items-center gap-2.5 rounded-xl bg-amber-50/70 p-2.5 text-left transition-colors hover:bg-amber-100/70"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2A0E20] text-amber-100">
                    <Plus size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[#2A0E20]">
                      Register "{value}"
                    </p>
                    <p className="text-[9px] text-stone-500">
                      Create as a brand new Gadwal saree weave pattern
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
  placeholder = "Select or type shade...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

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
    const shouldOpenAbove = spaceBelow < dropdownHeight && rect.top > spaceBelow;

    setDropdownStyle({
      position: "fixed",
      top: shouldOpenAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
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
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const openDropdown = () => {
    setIsOpen(true);
    requestAnimationFrame(() => updateDropdownPosition());
  };

  const hasCustomColor =
    value.trim() &&
    !COLOR_OPTIONS.some((c) => normalizeText(c) === normalizeText(value));

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`relative flex h-11 w-full items-center rounded-2xl border bg-white/90 shadow-2xs backdrop-blur-md transition-all duration-200 ${isOpen
            ? "border-[#D4A373] ring-4 ring-[#D4A373]/15 shadow-sm"
            : "border-stone-200/80 hover:border-stone-300"
          }`}
      >
        <Palette size={15} className="pointer-events-none absolute left-3.5 text-stone-400" />

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
          className="h-full w-full rounded-2xl bg-transparent py-3 pl-9 pr-9 text-xs font-semibold text-stone-900 outline-none placeholder:text-stone-400 placeholder:font-normal"
        />

        <button
          type="button"
          aria-label="Toggle color list"
          onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
          className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 transition-all hover:bg-stone-100 hover:text-stone-700 active:scale-90"
        >
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {isOpen && (
        <div
          style={dropdownStyle}
          className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white/95 shadow-[0_20px_50px_rgba(42,14,32,0.14)] backdrop-blur-xl ring-1 ring-black/[0.04] animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-stone-100 px-3.5 py-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
              Select Silk Hue
            </span>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-bold text-stone-600">
              {filteredColors.length}
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto p-1.5">
            {filteredColors.map((color) => {
              const selected = normalizeText(value) === normalizeText(color);
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    onChange(color);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors duration-150 ${selected
                      ? "bg-amber-50 font-bold text-[#2A0E20]"
                      : "text-stone-700 hover:bg-stone-50 font-medium"
                    }`}
                >
                  <span className="truncate">{color}</span>
                  {selected && (
                    <Check size={12} className="ml-3 shrink-0 text-[#8E3D51]" />
                  )}
                </button>
              );
            })}

            {hasCustomColor && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="mt-1 flex w-full items-center gap-2 rounded-xl bg-amber-50/70 p-2 text-left transition-colors hover:bg-amber-100/70"
              >
                <Plus size={13} className="shrink-0 text-[#2A0E20]" />
                <span className="truncate text-xs font-bold text-[#2A0E20]">
                  Use Custom Hue "{value}"
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
// SUB-COMPONENT: MULTI-IMAGE UPLOADER
// ============================================================
function MultiImageUploadInput({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null | undefined) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      setUploadError("Please provide valid image files (JPG, PNG, or WebP).");
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(15);

    try {
      const readPromises = files.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          })
      );

      const dataUrls = await Promise.all(readPromises);
      setUploadProgress(50);

      // Upload via backend batch API if available
      try {
        const uploadedUrls = await StoreService.uploadImages(dataUrls, (pct) => setUploadProgress(pct));
        const merged = Array.from(new Set([...images, ...uploadedUrls]));
        onChange(merged);
      } catch (err) {
        console.warn("Fallback to local data URLs:", err);
        const merged = Array.from(new Set([...images, ...dataUrls]));
        onChange(merged);
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to process images.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleAddUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!images.includes(trimmed)) {
      onChange([...images, trimmed]);
    }
    setUrlInput("");
  }

  function handleRemoveImage(index: number) {
    const next = images.filter((_, i) => i !== index);
    onChange(next);
  }

  function handleSetPrimary(index: number) {
    if (index === 0 || index >= images.length) return;
    const selected = images[index];
    const rest = images.filter((_, i) => i !== index);
    onChange([selected, ...rest]);
  }

  const cloudSyncedCount = images.filter(
    (url) => url.includes("supabase.co") || (url.startsWith("http") && !url.startsWith("data:"))
  ).length;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">
          <ImageIcon size={12} className="text-[#8E3D51]" />
          <span>Saree Photograph Gallery ({images.length} Image{images.length !== 1 ? "s" : ""})</span>
        </label>
        {cloudSyncedCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 shadow-2xs">
            <CheckCircle2 size={11} />
            {cloudSyncedCount} Cloud Synced
          </span>
        )}
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`flex min-h-[110px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center transition-all duration-200 ${
          isDragging
            ? "border-[#D4A373] bg-amber-50/40 shadow-xs"
            : "border-stone-200/80 bg-white/60 hover:border-stone-300 hover:bg-stone-50/80"
        }`}
      >
        {isUploading ? (
          <div className="space-y-2 py-2 w-full max-w-xs">
            <div className="flex items-center justify-center gap-2 text-stone-800 text-xs font-semibold">
              <Loader2 size={16} className="animate-spin text-[#D4A373]" />
              <span>Uploading saree photos to cloud vault...</span>
            </div>
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-linear-to-r from-[#D4A373] to-[#8E3D51] h-full rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-[10px] text-stone-400 font-mono block">{uploadProgress}%</span>
          </div>
        ) : (
          <>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs text-[#D4A373] border border-stone-200/60">
              <UploadCloud size={18} />
            </div>
            <p className="text-xs font-semibold text-stone-700">
              Drop multiple drape photographs here
            </p>
            <p className="text-[10px] text-stone-400">
              or click to browse from device &bull; Select multiple files at once (JPG, PNG, WebP)
            </p>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {uploadError && <p className="text-[11px] text-rose-600 font-medium px-1">{uploadError}</p>}

      {/* Direct URL Input */}
      <div className="flex items-center gap-2">
        <Link2 size={13} className="shrink-0 text-stone-400 ml-1" />
        <input
          type="text"
          placeholder="...or paste an image URL and click Add"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddUrl();
            }
          }}
          className="h-9 min-w-0 flex-1 rounded-xl border border-stone-200/80 bg-white/90 px-3 text-xs text-stone-900 outline-none transition-all focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/10"
        />
        <button
          type="button"
          onClick={handleAddUrl}
          disabled={!urlInput.trim()}
          className="shrink-0 rounded-xl bg-[#2A0E20] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3E1630] disabled:opacity-40 transition-colors"
        >
          Add Image
        </button>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="pt-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">
            Gallery Previews ({images.length} item{images.length !== 1 ? "s" : ""}) &bull; First item is primary
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((imgUrl, index) => (
              <div
                key={`${imgUrl}-${index}`}
                className={`relative group rounded-2xl border p-1 bg-white transition-all shadow-xs ${
                  index === 0 ? "border-[#D4A373] ring-2 ring-[#D4A373]/30" : "border-stone-200/80 hover:border-stone-300"
                }`}
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-100">
                  <img
                    src={imgUrl}
                    alt={`Saree View ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {index === 0 && (
                    <span className="absolute top-1.5 left-1.5 rounded-md bg-[#2A0E20]/90 text-brand-gold px-1.5 py-0.5 text-[8.5px] font-bold tracking-wider uppercase shadow-xs backdrop-blur-2xs border border-brand-gold/30">
                      ★ Primary
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center justify-between px-1 py-0.5">
                  {index !== 0 ? (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(index)}
                      className="text-[10px] font-semibold text-stone-600 hover:text-[#8E3D51] transition-colors"
                    >
                      Set Primary
                    </button>
                  ) : (
                    <span className="text-[10px] font-semibold text-brand-gold">Main Cover</span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="text-stone-400 hover:text-rose-600 p-0.5 transition-colors"
                    title="Remove Photo"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: VARIANT SHADE MANAGER WITH PER-COLOR IMAGES
// ============================================================
function VariantShadeManager({
  variants,
  designSlug,
  serialNumber,
  onRemove,
  onAdd,
  onUpdateVariantImage,
  onUpdateVariantStock,
}: {
  variants: (ColorVariant & { imageUrl?: string })[];
  designSlug: string;
  serialNumber: string;
  onRemove: (idx: number) => void;
  onAdd: (variant: ColorVariant & { imageUrl?: string }) => void;
  onUpdateVariantImage: (idx: number, url: string) => void;
  onUpdateVariantStock?: (idx: number, stock: number) => void;
}) {
  const [newColor, setNewColor] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newVariantImage, setNewVariantImage] = useState("");
  const [isUploadingShadeIdx, setIsUploadingShadeIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rowFileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const handleVariantFile = (file: File | undefined, target: "new" | number) => {
    if (!file || !file.type.startsWith("image/")) return;

    if (typeof target === "number") {
      setIsUploadingShadeIdx(target);
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === "string") {
        const dataUrl = reader.result;
        try {
          const res = await StoreService.uploadImage(dataUrl);
          const finalUrl = res && res.success && res.url ? res.url : dataUrl;
          if (target === "new") {
            setNewVariantImage(finalUrl);
          } else {
            onUpdateVariantImage(target, finalUrl);
          }
        } catch {
          if (target === "new") {
            setNewVariantImage(dataUrl);
          } else {
            onUpdateVariantImage(target, dataUrl);
          }
        } finally {
          setIsUploadingShadeIdx(null);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  function handleAdd() {
    const colorName = newColor.trim();
    if (!colorName || !designSlug || !serialNumber) return;

    const alreadyExists = variants.some(
      (v) => normalizeText(v.color) === normalizeText(colorName)
    );

    if (alreadyExists) {
      alert("This color shade is already registered on this saree pattern.");
      return;
    }

    const colorSlug = generateColorSlug(colorName);
    const codeUsed = variants.some((v) => v.colorSlug === colorSlug);

    if (codeUsed) {
      alert(`The color abbreviation "${colorSlug}" is already assigned to another shade.`);
      return;
    }

    const sku = buildSku(designSlug, colorSlug, serialNumber);

    onAdd({
      color: colorName,
      colorSlug,
      stock: newStock.trim() === "" ? 0 : Math.max(0, Number(newStock)),
      sku,
      imageUrl: newVariantImage || undefined,
    });

    setNewColor("");
    setNewStock("");
    setNewVariantImage("");
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white/80 backdrop-blur-md shadow-2xs">
      <div className="flex items-center justify-between gap-3 border-b border-stone-100 bg-stone-50/60 px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2A0E20] text-[#D4A373] shadow-xs">
            <Palette size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-xs font-bold text-stone-900">
              Color Hues &amp; Floor Stock
            </h3>
            <p className="text-[10px] text-stone-400 font-light">
              Each shade can have its own photo preview and tracked SKU
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[10.5px] font-bold text-stone-700 border border-stone-200/80 shadow-2xs">
          {variants.length} {variants.length === 1 ? "Shade" : "Shades"}
        </span>
      </div>

      {/* Variant Cards List */}
      <div className="space-y-2 bg-stone-50/40 p-4">
        {variants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-7 text-center">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-2xl bg-stone-100 text-stone-300">
              <Palette size={18} />
            </div>
            <p className="text-xs font-semibold text-stone-500">
              No color shades added yet
            </p>
            <p className="text-[10px] text-stone-400 mt-0.5">
              Add at least one color shade below to complete this saree record
            </p>
          </div>
        ) : (
          <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
            {variants.map((v, idx) => (
              <div
                key={v.sku}
                className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white p-3 shadow-2xs transition-all duration-150 hover:border-[#D4A373]/60 hover:shadow-xs"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {/* Per-shade visual thumbnail uploader */}
                  <div
                    onClick={() => rowFileInputRefs.current[idx]?.click()}
                    className="relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-stone-50 transition-all hover:border-[#D4A373]"
                    title="Click to change or upload photo for this shade"
                  >
                    {isUploadingShadeIdx === idx ? (
                      <Loader2 size={15} className="animate-spin text-[#D4A373]" />
                    ) : v.imageUrl ? (
                      <>
                        <img
                          src={v.imageUrl}
                          alt={v.color}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                          <Camera size={14} className="text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-stone-400">
                        <Camera size={14} />
                        <span className="text-[7.5px] font-bold uppercase tracking-wider mt-0.5">Photo</span>
                      </div>
                    )}

                    <input
                      ref={(el) => {
                        rowFileInputRefs.current[idx] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleVariantFile(e.target.files?.[0], idx)}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-xs font-bold text-stone-900">
                        {v.color}
                      </p>
                      <span className="rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#8E3D51]">
                        {v.colorSlug}
                      </span>
                    </div>
                    <p className="truncate font-mono text-[10px] text-stone-400 mt-0.5">
                      {v.sku}
                    </p>
                  </div>
                </div>

                {/* Stock editing & remove action */}
                <div className="flex shrink-0 items-center gap-2.5">
                  <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 px-2 py-1 transition-all focus-within:border-[#D4A373] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#D4A373]/10">
                    <input
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        onUpdateVariantStock?.(idx, val);
                      }}
                      className="w-12 bg-transparent text-center font-mono text-xs font-bold text-stone-800 outline-none"
                      title="Directly edit in-store quantity"
                    />
                    <span className="text-[10px] text-stone-400 font-semibold">pcs</span>
                  </div>

                  <button
                    type="button"
                    aria-label={`Remove shade ${v.color}`}
                    onClick={() => onRemove(idx)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-90"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Variant Action Bar */}
      <div className="border-t border-stone-100 bg-white p-3.5 space-y-2">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="flex-1 min-w-0">
            <ColorInput
              value={newColor}
              onChange={setNewColor}
              placeholder="Pick or type next color shade..."
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Photo Attachment for New Shade */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border transition-all ${newVariantImage
                  ? "border-[#D4A373] bg-amber-50 shadow-2xs"
                  : "border-dashed border-stone-300 bg-stone-50 hover:border-stone-400"
                }`}
              title="Attach a photograph for this new shade"
            >
              {newVariantImage ? (
                <img
                  src={newVariantImage}
                  alt="New shade visual"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-stone-400">
                  <Camera size={14} />
                  <span className="text-[7.5px] font-bold">PHOTO</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleVariantFile(e.target.files?.[0], "new")}
              />
            </div>

            <input
              type="number"
              min="0"
              placeholder="Qty"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              className="h-11 w-20 rounded-2xl border border-stone-200/80 px-2 text-center text-xs font-semibold outline-none transition-all focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/10"
            />

            <button
              type="button"
              onClick={handleAdd}
              disabled={!newColor.trim() || !designSlug}
              className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-[#2A0E20] px-4 text-xs font-bold text-amber-100 shadow-xs transition-all duration-200 hover:bg-[#3D142E] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={14} />
              <span>Add Shade</span>
            </button>
          </div>
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
  isSelected = false,
  onToggleSelect,
  onEdit,
  onDelete,
}: {
  product: Product;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const totalStock = (product.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0);
  const isLowStock = totalStock <= LOW_STOCK_THRESHOLD;

  return (
    <div
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded-3xl border bg-white/80 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isSelected
          ? "border-[#8E3D51] ring-2 ring-[#8E3D51]/25 shadow-md bg-white"
          : "border-stone-200/80 hover:border-stone-300/90 shadow-2xs"
        }`}
    >
      {/* Saree Image Container */}
      <div className="relative aspect-[0.92] w-full overflow-hidden bg-stone-100">
        {/* Multi-select Checkbox Badge */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.();
          }}
          className={`absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-xl border transition-all duration-200 ${isSelected
              ? "border-[#8E3D51] bg-[#8E3D51] text-white shadow-md scale-105 opacity-100"
              : "border-stone-300 bg-white/90 text-transparent hover:border-[#8E3D51]/50 hover:bg-white backdrop-blur-md opacity-75 group-hover:opacity-100"
            }`}
          aria-label={isSelected ? "Deselect saree" : "Select saree"}
        >
          <Check size={13} className={isSelected ? "text-white stroke-[3]" : "text-transparent"} />
        </button>

        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package size={38} className="text-stone-300" />
          </div>
        )}

        {/* Hover Action Overlay */}
        <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 translate-y-1 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit saree pattern"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/70 bg-white/95 text-stone-700 shadow-sm backdrop-blur-md transition-all hover:text-[#2A0E20] hover:scale-105 active:scale-95"
          >
            <Edit3 size={13} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete saree"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/70 bg-white/95 text-stone-700 shadow-sm backdrop-blur-md transition-all hover:text-rose-600 hover:scale-105 active:scale-95"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {isLowStock && (
          <span className="absolute left-12 top-3 rounded-full bg-rose-600/90 backdrop-blur-xs px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-2xs">
            Low Stock
          </span>
        )}
      </div>

      {/* Card Content Information */}
      <div className="flex min-h-[145px] flex-1 flex-col p-4 justify-between">
        <div>
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-[#8E3D51]">
            <span>SiCo Gadwal</span>
            <span className="font-mono text-stone-400 font-semibold text-[9.5px]">
              {(product.variants || []).length} Shades
            </span>
          </div>

          <h3 className="font-serif text-[15px] font-normal tracking-tight text-stone-900 mt-1 line-clamp-1 group-hover:text-[#8E3D51] transition-colors">
            {product.name}
          </h3>

          <p className="font-mono text-[9px] text-stone-400 truncate mt-0.5">
            {product.id}
          </p>
        </div>

        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <p className="text-base font-bold text-stone-950">
            {CurrencyFormatter.format(product.salePrice)}
          </p>

          <span
            className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${isLowStock
                ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                : "bg-stone-100 text-stone-700"
              }`}
          >
            {totalStock} in stock
          </span>
        </div>

        {/* Shade Codes Pill Strip */}
        <div className="flex flex-wrap gap-1 pt-2">
          {(product.variants || []).slice(0, 5).map((v) => (
            <span
              key={v.sku}
              className="rounded-md border border-stone-200/80 bg-stone-50/80 px-1.5 py-0.5 font-mono text-[8.5px] font-bold text-stone-600"
            >
              {v.colorSlug}
            </span>
          ))}
          {(product.variants || []).length > 5 && (
            <span className="font-mono text-[8.5px] text-stone-400 self-center">
              +{(product.variants || []).length - 5}
            </span>
          )}
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
  const [editedStock, setEditedStock] = useState<Record<string, string>>({});

  const lowStockRows = useMemo(() => {
    const rows: {
      product: Product;
      variant: ColorVariant;
    }[] = [];

    inventory.forEach((p) => {
      (p.variants || []).forEach((v) => {
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

  function handleSaveRow(product: Product, variantSku: string) {
    const newVal = editedStock[variantSku];
    if (newVal === undefined || newVal.trim() === "") return;

    const parsed = Math.max(0, Number(newVal));
    const updatedVariants = product.variants.map((v) =>
      v.sku === variantSku ? { ...v, stock: parsed } : v
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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-stone-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-stone-900">
                Low Stock Drapery Audit
              </h2>
              <p className="text-[10.5px] text-stone-400">Review and replenish floor inventory quickly</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-5">
          {lowStockRows.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <Check size={20} />
              </div>
              <p className="text-xs font-semibold text-stone-600">
                All drapery stocks are currently well buffered.
              </p>
            </div>
          ) : (
            lowStockRows.map(({ product, variant }) => (
              <div
                key={variant.sku}
                className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white p-3.5 transition-all hover:border-stone-300 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-stone-900">
                    {product.name}
                  </p>
                  <p className="truncate font-mono text-[9.5px] text-stone-400">
                    Shade: {variant.color} &bull; {variant.sku}
                  </p>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-2.5 sm:justify-end">
                  <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 border border-rose-200/60">
                    {variant.stock} left
                  </span>

                  <input
                    type="number"
                    min="0"
                    placeholder="New"
                    value={editedStock[variant.sku] ?? ""}
                    onChange={(e) =>
                      setEditedStock({
                        ...editedStock,
                        [variant.sku]: e.target.value,
                      })
                    }
                    className="h-8 w-16 rounded-xl border border-stone-200 px-1 text-center font-mono text-xs font-bold outline-none transition-all focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/10"
                  />

                  <button
                    type="button"
                    onClick={() => handleSaveRow(product, variant.sku)}
                    disabled={!editedStock[variant.sku]?.trim()}
                    className="flex h-8 items-center justify-center rounded-xl bg-[#2A0E20] px-3 text-xs font-semibold text-amber-100 transition-all hover:bg-[#3D142E] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Set
                  </button>
                </div>
              </div>
            ))
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
  onBatchDelete,
}: CatalogProps) {
  const [productPendingDelete, setProductPendingDelete] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const sicoCategoryId = useMemo(() => {
    const found = categories.find(
      (c) =>
        c.name.toLowerCase().includes("gadwal") ||
        c.name.toLowerCase().includes("sico")
    );
    return found?.id || categories[0]?.id || "cat_sico_gadwal";
  }, [categories]);

  // Form State
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState(sicoCategoryId);
  const [formPurchasePrice, setFormPurchasePrice] = useState("");
  const [formSalePrice, setFormSalePrice] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formVariants, setFormVariants] = useState<(ColorVariant & { imageUrl?: string })[]>([]);
  const [formSerialNumber, setFormSerialNumber] = useState("001");
  const [primaryColor, setPrimaryColor] = useState("");
  const [primaryStock, setPrimaryStock] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formImages, setFormImages] = useState<string[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const designOptions = useMemo(
    () => getAvailableDesignOptions(inventory),
    [inventory]
  );

  const metrics = useMemo(
    () => calculateInventoryMetrics(inventory),
    [inventory]
  );

  const filteredProducts = useMemo(
    () => filterInventory(inventory, searchQuery),
    [inventory, searchQuery]
  );

  const activeDesignSlug = formName.trim()
    ? createDesignSlug(formName.trim())
    : "";

  const firstColorCode =
    formVariants[0]?.colorSlug ||
    (primaryColor.trim() ? generateColorSlug(primaryColor) : "XX");

  const previewSku = activeDesignSlug
    ? buildSku(activeDesignSlug, firstColorCode, formSerialNumber)
    : "RSF-DESIGN-XX-001";

  const handleSelectAllVisible = () => {
    if (selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  const executeBatchDelete = () => {
    if (selectedProductIds.length === 0) return;

    if (onBatchDelete) {
      onBatchDelete(selectedProductIds);
    } else {
      selectedProductIds.forEach((id) => onDeleteProduct(id));
    }

    setSelectedProductIds([]);
    setIsBatchDeleteModalOpen(false);
  };

  const executeSingleDelete = () => {
    if (!productPendingDelete) return;
    onDeleteProduct(productPendingDelete.id);
    setSelectedProductIds((prev) => prev.filter((id) => id !== productPendingDelete.id));
    setProductPendingDelete(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "KeyN") {
        e.preventDefault();
        openCreateModal();
      }

      if (e.code === "Escape" && isModalOpen) {
        e.preventDefault();
        setIsModalOpen(false);
      }

      if (e.ctrlKey && e.code === "Slash") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  function handleDesignChange(name: string) {
    setFormName(name);
    const serial = editingProductId
      ? formSerialNumber
      : getNextDesignSerial(name, inventory);
    setFormSerialNumber(serial);

    setFormVariants((prev) =>
      prev.map((v) => ({
        ...v,
        sku: buildSku(createDesignSlug(name), v.colorSlug, serial),
      }))
    );
  }

  function handlePrimaryColorChange(color: string) {
    setPrimaryColor(color);
    if (!color.trim() || !activeDesignSlug) return;
    const slug = generateColorSlug(color.trim());

    setFormVariants((prev) => {
      if (prev.length === 0) {
        return [
          {
            color: color.trim(),
            colorSlug: slug,
            stock:
              primaryStock.trim() === ""
                ? 0
                : Math.max(0, Number(primaryStock)),
            sku: buildSku(activeDesignSlug, slug, formSerialNumber),
          },
        ];
      }

      return [
        {
          ...prev[0],
          color: color.trim(),
          colorSlug: slug,
          sku: buildSku(activeDesignSlug, slug, formSerialNumber),
        },
        ...prev.slice(1),
      ];
    });
  }

  function handlePrimaryStockChange(val: string) {
    setPrimaryStock(val);
    const parsed = val.trim() === "" ? 0 : Math.max(0, Number(val));

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
    setFormCategory(sicoCategoryId);
    setFormPurchasePrice("");
    setFormSalePrice("");
    setFormTags("handloom, sico gadwal, zari");
    setFormVariants([]);
    setPrimaryColor("");
    setPrimaryStock("");
    setFormImageUrl("");
    setFormImages([]);
    setFormSerialNumber("001");
    setIsModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProductId(product.id);
    setFormName(product.name || "");
    setFormCategory(product.categoryId || sicoCategoryId);
    setFormSerialNumber(getProductSerial(product));
    setFormPurchasePrice(String(product.purchasePrice ?? 0));
    setFormSalePrice(String(product.salePrice ?? 0));
    setFormTags((product.tags || []).join(", "));
    setFormVariants((product.variants || []).map((v) => ({ ...v })));
    setPrimaryColor(product.variants?.[0]?.color || "");
    setPrimaryStock(product.variants?.[0] ? String(product.variants[0].stock) : "");
    const initialImgs = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.imageUrl
      ? [product.imageUrl]
      : [];
    setFormImages(initialImgs);
    setFormImageUrl(initialImgs[0] || product.imageUrl || "");
    setIsModalOpen(true);
  }

  function handleSaveProduct(e: FormEvent) {
    e.preventDefault();
    const name = formName.trim();

    if (
      !name ||
      !formPurchasePrice ||
      !formSalePrice ||
      formVariants.length === 0
    ) {
      alert("Please complete required design title, pricing, and at least one shade variant.");
      return;
    }

    const designSlug = createDesignSlug(name);
    const finalVariants = formVariants.map((v) => ({
      ...v,
      sku: v.sku || buildSku(designSlug, v.colorSlug, formSerialNumber),
    }));

    const finalCategory = formCategory || sicoCategoryId;
    const effectiveImages = formImages.length > 0
      ? formImages
      : formImageUrl
      ? [formImageUrl]
      : (finalVariants.map((v) => v.imageUrl).filter(Boolean) as string[]);

    const effectiveImageUrl = effectiveImages[0] || undefined;

    const payload: Product = {
      id:
        editingProductId ||
        finalVariants[0]?.sku ||
        buildSku(designSlug, "XX", formSerialNumber),
      name,
      categoryId: finalCategory,
      purchasePrice: Number(formPurchasePrice) || 0,
      salePrice: Number(formSalePrice) || 0,
      tags: formTags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      variants: finalVariants,
      imageUrl: effectiveImageUrl,
      images: effectiveImages.length > 0 ? effectiveImages : (effectiveImageUrl ? [effectiveImageUrl] : undefined),
    };

    if (editingProductId) {
      onUpdateProduct(payload);
    } else {
      onAddProduct(payload, finalCategory);
    }

    setIsModalOpen(false);
  }

  const lockedCategoryName = "SiCo Gadwal Sarees";

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-7 pb-24 select-none">
      {/* HEADER */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between border-b border-stone-200/50 pb-5">
        <div> 
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-stone-950 tracking-tight mt-1">
            SiCo Gadwal Saree Stock
          </h1>
          <p className="text-xs text-stone-500 font-light mt-1 max-w-2xl">
            Oversee handloom Gadwal patterns, shade photography, automated SKU generators, and showroom availability.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="group flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2A0E20] px-5 text-xs font-semibold text-amber-100 shadow-xs transition-all hover:bg-[#3D142E] active:scale-95"
        >
          <Plus
            size={15}
            className="text-[#D4A373] transition-transform duration-200 group-hover:rotate-90"
          />
          <span>Add New Drapery</span>
          <span className="hidden rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-mono text-amber-200/60 xl:inline">
            CTRL+N
          </span>
        </button>
      </div>

      {/* METRIC TILES */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Total Drapes */}
        <div className="rounded-3xl border border-white/80 bg-white/70 backdrop-blur-xl p-5 shadow-[0_6px_25px_rgba(42,14,32,0.03)] flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Total Drapes
            </span>
            <p className="mt-1 text-2xl font-serif font-bold text-stone-950">
              {metrics.totalStock}
            </p>
            <p className="mt-0.5 text-[10.5px] text-stone-400 font-light">
              Across all registered shade variants
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-700 shadow-2xs">
            <Package size={20} />
          </div>
        </div>

        {/* Valuation */}
        <div className="rounded-3xl border border-white/80 bg-white/70 backdrop-blur-xl p-5 shadow-[0_6px_25px_rgba(42,14,32,0.03)] flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Inventory Loom Valuation
            </span>
            <p className="mt-1 truncate text-2xl font-serif font-bold text-stone-950">
              {CurrencyFormatter.format(metrics.inventoryCost)}
            </p>
            <p className="mt-0.5 text-[10.5px] text-stone-400 font-light">
              Calculated on weaver cost
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-[#8E3D51] shadow-2xs">
            <IndianRupee size={20} />
          </div>
        </div>

        {/* Low Stock Warnings */}
        <button
          type="button"
          onClick={() => setIsLowStockModalOpen(true)}
          className="group rounded-3xl border border-white/80 bg-white/70 backdrop-blur-xl p-5 shadow-[0_6px_25px_rgba(42,14,32,0.03)] flex items-center justify-between gap-4 text-left transition-all hover:border-rose-200 hover:bg-white active:scale-98"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
              Low Stock Warnings
            </span>
            <p className="mt-1 text-2xl font-serif font-bold text-stone-950">
              {metrics.lowStockCount}
            </p>
            <p className="mt-0.5 text-[10.5px] font-semibold text-rose-600">
              Review low drapes &rarr;
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 transition-transform duration-200 group-hover:scale-105 shadow-2xs">
            <AlertTriangle size={20} />
          </div>
        </button>
      </div>

      {/* SEARCH STRIP */}
      <div className="flex h-12 items-center gap-2.5 rounded-2xl border border-white/80 bg-white/75 px-3.5 shadow-2xs backdrop-blur-md transition-all focus-within:border-[#D4A373] focus-within:bg-white focus-within:shadow-xs">
        <Search size={15} className="text-stone-400 shrink-0" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search by SKU, Gadwal pattern, hue, or keyword tags... (Ctrl + /)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-xs text-stone-800 outline-none placeholder:text-stone-400"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 active:scale-90"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* CATALOG GRID CONTAINER */}
      <div className="space-y-4 rounded-3xl border border-white/80 bg-white/60 p-5 backdrop-blur-xl shadow-[0_8px_30px_rgba(42,14,32,0.02)]">
        <div className="flex flex-col gap-2.5 border-b border-stone-200/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Box size={16} className="text-[#8E3D51]" />
              <h2 className="text-sm font-bold text-stone-900 font-serif">
                Registered SiCo Gadwal Weaves
              </h2>
            </div>

            {filteredProducts.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200/80 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-600 shadow-2xs hover:bg-stone-50 transition-all active:scale-95"
              >
                {selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                  <>
                    <CheckSquare size={13} className="text-[#8E3D51]" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <Square size={13} className="text-stone-400" />
                    <span>Select All Visible</span>
                  </>
                )}
              </button>
            )}
          </div>

          <span className="text-[10.5px] font-mono text-stone-400">
            Showing {filteredProducts.length} of {inventory.length} designs
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center py-16 text-center text-stone-400">
            <Package size={36} className="text-stone-300 mb-2" />
            <p className="text-xs font-semibold">No matching drapes found in catalogue.</p>
            <p className="text-[11px] text-stone-400 font-light mt-0.5">Try refining your search keyword.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isSelected={selectedProductIds.includes(p.id)}
                onToggleSelect={() =>
                  setSelectedProductIds((prev) =>
                    prev.includes(p.id)
                      ? prev.filter((id) => id !== p.id)
                      : [...prev, p.id]
                  )
                }
                onEdit={() => openEditModal(p)}
                onDelete={() => setProductPendingDelete(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FLOATING BATCH ACTIONS BAR */}
      {selectedProductIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-stone-800/80 bg-[#1E0916]/95 px-4 py-3 text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2 border-r border-white/15 pr-3 text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8E3D51] font-mono text-[10px] font-bold text-white">
              {selectedProductIds.length}
            </span>
            <span className="font-medium text-stone-300">
              {selectedProductIds.length === 1 ? "Gadwal drape selected" : "Gadwal drapes selected"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedProductIds([])}
            className="rounded-lg px-2.5 py-1.5 text-xs text-stone-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => setIsBatchDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-rose-700 active:scale-95"
          >
            <Trash2 size={13} />
            <span>Delete Selected</span>
          </button>
        </div>
      )}

      {/* BATCH DELETE CONFIRMATION MODAL */}
      {isBatchDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsBatchDeleteModalOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Trash2 size={24} />
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-base font-bold text-stone-900">
                Delete {selectedProductIds.length} Saree Records?
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-stone-500">
                This will permanently remove the selected SiCo Gadwal patterns and their associated SKU shade variants from stock.
              </p>
            </div>

            <div className="mt-6 flex gap-2.5">
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(false)}
                className="flex-1 rounded-xl border border-stone-200 bg-stone-50 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 active:scale-98 transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={executeBatchDelete}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-98 transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE ITEM DELETE CONFIRMATION MODAL */}
      {productPendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setProductPendingDelete(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Trash2 size={24} />
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-base font-bold text-stone-900">
                Delete "{productPendingDelete.name}"?
              </h3>
              <p className="mt-1 text-[11px] font-mono text-stone-400">
                {productPendingDelete.id}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-stone-500">
                Are you sure you want to remove this Gadwal pattern and its {(productPendingDelete.variants || []).length} color variants?
              </p>
            </div>

            <div className="mt-6 flex gap-2.5">
              <button
                type="button"
                onClick={() => setProductPendingDelete(null)}
                className="flex-1 rounded-xl border border-stone-200 bg-stone-50 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 active:scale-98 transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={executeSingleDelete}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-98 transition-all"
              >
                Delete Saree
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT RECORD MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-3 backdrop-blur-sm sm:p-4 animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white/95 shadow-2xl backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-stone-100 px-6 py-4">
              <div className="min-w-0">
                <h2 className="truncate font-serif text-lg font-bold text-stone-900">
                  {editingProductId ? "Update Gadwal Saree Record" : "Register New SiCo Gadwal Drapery"}
                </h2>
                <p className="mt-0.5 truncate font-mono text-[10px] text-stone-400">
                  {previewSku}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 active:scale-90 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSaveProduct}
              className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6 text-xs [scrollbar-width:thin]"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Weave Classification
                  </label>
                  <div className="flex h-11 items-center overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-50 px-3.5 font-semibold text-stone-800 text-xs">
                    <span className="truncate">{lockedCategoryName}</span>
                  </div>
                </div>

                <div className="min-w-0">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Master Generated SKU
                  </label>
                  <div className="flex h-11 items-center overflow-hidden rounded-2xl border border-amber-200/70 bg-amber-50/50 px-3.5 font-mono font-bold text-[#8E3D51] text-xs">
                    <span className="truncate">{previewSku}</span>
                  </div>
                </div>
              </div>

              <DesignInput
                value={formName}
                options={designOptions}
                onChange={handleDesignChange}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Primary Signature Shade
                  </label>
                  <ColorInput
                    value={primaryColor}
                    onChange={handlePrimaryColorChange}
                  />
                </div>

                <div className="min-w-0">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Initial Stock (Pieces)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={primaryStock}
                    onChange={(e) => handlePrimaryStockChange(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-stone-200/80 bg-white/90 px-3.5 text-xs font-semibold outline-none transition-all focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Procurement / Loom Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-stone-200/80 bg-white/90 px-3.5 text-xs font-semibold outline-none transition-all focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/10"
                  />
                </div>

                <div className="min-w-0">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Showroom Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-stone-200/80 bg-white/90 px-3.5 text-xs font-semibold outline-none transition-all focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/10"
                  />
                </div>
              </div>

              {/* Master Photograph Gallery */}
              <MultiImageUploadInput
                images={formImages}
                onChange={(imgs) => {
                  setFormImages(imgs);
                  setFormImageUrl(imgs[0] || "");
                }}
              />

              {/* Per-Color Variant Shade Manager with Photo Upload */}
              <VariantShadeManager
                variants={formVariants}
                designSlug={activeDesignSlug}
                serialNumber={formSerialNumber}
                onRemove={(idx) =>
                  setFormVariants(formVariants.filter((_, i) => i !== idx))
                }
                onAdd={(v) => setFormVariants([...formVariants, v])}
                onUpdateVariantImage={(idx, url) => {
                  setFormVariants((prev) =>
                    prev.map((item, i) => (i === idx ? { ...item, imageUrl: url } : item))
                  );
                }}
                onUpdateVariantStock={(idx, stock) => {
                  setFormVariants((prev) =>
                    prev.map((item, i) => (i === idx ? { ...item, stock } : item))
                  );
                }}
              />

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Catalogue Search Tags &amp; Keywords
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="handloom, sico gadwal, zari, temple border, bridal..."
                  className="h-10 w-full rounded-xl border border-stone-200/80 bg-white/90 px-3.5 text-xs outline-none transition-all focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/10"
                />
              </div>

              {/* Footer CTA */}
              <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex h-10 items-center justify-center rounded-xl px-4 text-xs font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-all active:scale-95"
                >
                  Discard
                </button>

                <button
                  type="submit"
                  className="group flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#2A0E20] px-5 text-xs font-bold text-amber-100 shadow-xs transition-all hover:bg-[#3D142E] active:scale-95"
                >
                  <Check
                    size={14}
                    className="text-[#D4A373] transition-transform duration-200 group-hover:scale-110"
                  />
                  <span>
                    {editingProductId ? "Update Saree Record" : "Save Drapery"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOW STOCK AUDIT MODAL */}
      <LowStockModal
        isOpen={isLowStockModalOpen}
        onClose={() => setIsLowStockModalOpen(false)}
        inventory={inventory}
        onUpdateProduct={onUpdateProduct}
      />
    </div>
  );
}