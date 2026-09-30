import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Sparkles } from "lucide-react";
import { normalizeText } from "../../types/catalog";

// ============================================================
// BORDER COLOR REGISTRY & SUB-COMPONENT
// ============================================================
export const DEFAULT_BORDER_COLORS = [
  "Contrast Maroon Zari",
  "Royal Gold Zari",
  "Temple Emerald Green",
  "Peacock Blue Contrast",
  "Ruby Crimson Red",
  "Rich Magenta Pink",
  "Mustard Yellow Contrast",
  "Silver Antique Zari",
  "Self Border / Running",
  "Bottlegreen Contrast",
  "Deep Purple Border",
];

const BORDER_REGISTRY_KEY = "rs_border_colors_registry";

export function getRegisteredBorderColors(): string[] {
  try {
    const raw = localStorage.getItem(BORDER_REGISTRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return Array.from(new Set([...parsed, ...DEFAULT_BORDER_COLORS]));
      }
    }
  } catch {}
  return DEFAULT_BORDER_COLORS;
}

export function saveBorderColorToRegistry(color: string) {
  const trimmed = color.trim();
  if (!trimmed) return;
  try {
    const current = getRegisteredBorderColors();
    const exists = current.some((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      const updated = [trimmed, ...current];
      localStorage.setItem(BORDER_REGISTRY_KEY, JSON.stringify(updated));
    }
  } catch {}
}

export function BorderColorInput({
  value,
  onChange,
  placeholder = "Select border shade or type new custom color...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const [registry, setRegistry] = useState<string[]>(() => getRegisteredBorderColors());
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refreshRegistry = () => {
    setRegistry(getRegisteredBorderColors());
  };

  const filteredOptions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return registry;
    return registry.filter((c) => c.toLowerCase().includes(query));
  }, [registry, value]);

  const isExactMatch = useMemo(() => {
    const query = value.trim().toLowerCase();
    return registry.some((c) => c.toLowerCase() === query);
  }, [registry, value]);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        if (value.trim() && !isExactMatch) {
          saveBorderColorToRegistry(value.trim());
          refreshRegistry();
        }
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [value, isExactMatch]);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenAbove(spaceBelow < 250 && rect.top > spaceBelow);
    }
  }, [isOpen]);

  const handleSelectColor = (col: string) => {
    onChange(col);
    saveBorderColorToRegistry(col);
    refreshRegistry();
    setIsOpen(false);
  };

  const handleAddNewCustom = () => {
    if (!value.trim()) return;
    saveBorderColorToRegistry(value.trim());
    refreshRegistry();
    setIsOpen(false);
  };

  const quickPillColors = useMemo(() => registry.slice(0, 5), [registry]);

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      <div
        className={`relative flex h-11 w-full items-center rounded-2xl border bg-white/90 shadow-2xs backdrop-blur-md transition-all duration-200 ${
          isOpen
            ? "border-[#D4A373] ring-4 ring-[#D4A373]/15 shadow-sm"
            : "border-stone-200/80 hover:border-stone-300"
        }`}
      >
        <Sparkles size={15} className="pointer-events-none absolute left-3.5 text-[#D4A373]" />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onFocus={() => {
            refreshRegistry();
            setIsOpen(true);
          }}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (value.trim()) {
                handleAddNewCustom();
              }
            }
          }}
          placeholder={placeholder}
          className="h-full w-full rounded-2xl bg-transparent py-3 pl-9 pr-9 text-xs font-semibold text-stone-900 outline-none placeholder:text-stone-400 placeholder:font-normal"
        />

        <button
          type="button"
          aria-label="Toggle border color list"
          onClick={() => {
            refreshRegistry();
            setIsOpen((prev) => !prev);
          }}
          className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 transition-all hover:bg-stone-100 hover:text-stone-700 active:scale-90"
        >
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Quick 1-click pills under the input */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[9.5px] font-bold text-stone-400 uppercase tracking-wider mr-1">
          Quick Pick:
        </span>
        {quickPillColors.map((color) => {
          const isSelected = normalizeText(value) === normalizeText(color);
          return (
            <button
              key={color}
              type="button"
              onClick={() => handleSelectColor(color)}
              className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold transition-all active:scale-95 ${
                isSelected
                  ? "bg-[#2A0E20] text-[#D4A373] ring-1 ring-[#D4A373]/50 shadow-2xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900"
              }`}
            >
              {color}
            </button>
          );
        })}
      </div>

      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-[120] overflow-hidden rounded-2xl border border-stone-200/90 bg-white/95 shadow-[0_20px_50px_rgba(42,14,32,0.14)] backdrop-blur-xl ring-1 ring-black/[0.04] animate-in fade-in duration-150 ${
            openAbove ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <div className="flex items-center justify-between border-b border-stone-100 px-3.5 py-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
              Registered Border Colors ({registry.length})
            </span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-[#8E3D51] border border-amber-200/60">
              Auto-registers new colors
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto p-1.5">
            {value.trim() && !isExactMatch && (
              <button
                type="button"
                onClick={handleAddNewCustom}
                className="mb-1 flex w-full items-center justify-between rounded-xl bg-amber-50/80 px-3 py-2 text-left text-xs font-bold text-[#8E3D51] hover:bg-amber-100/80 transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <Plus size={13} className="shrink-0 text-[#8E3D51]" />
                  <span className="truncate">Add "{value.trim()}" to border registry</span>
                </div>
                <span className="shrink-0 rounded bg-[#8E3D51] px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                  Register
                </span>
              </button>
            )}

            {filteredOptions.length === 0 && !value.trim() ? (
              <div className="py-4 text-center text-xs text-stone-400">No border colors found</div>
            ) : (
              filteredOptions.map((color) => {
                const selected = normalizeText(value) === normalizeText(color);
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleSelectColor(color)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors duration-150 ${
                      selected
                        ? "bg-amber-50 font-bold text-[#2A0E20]"
                        : "text-stone-700 hover:bg-stone-50 font-medium"
                    }`}
                  >
                    <span className="truncate">{color}</span>
                    {selected && <Check size={12} className="ml-3 shrink-0 text-[#8E3D51]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
