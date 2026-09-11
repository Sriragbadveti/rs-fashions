import React, { useState, useRef, useEffect } from "react";
import { Palette, ChevronDown, Search } from "lucide-react";
import { COLOR_CODES } from "../../../types/dashboard";

interface ColorInputProps {
  value: string;
  onChange: (colorName: string) => void;
}

export const ColorInput: React.FC<ColorInputProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

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

  const filteredColors = COLOR_CODES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const selectedDef = COLOR_CODES.find(
    (c) => c.name.toLowerCase() === value.toLowerCase()
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-11 pl-10 pr-10 text-xs bg-white/90 border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 transition-all text-left flex items-center justify-between font-medium text-stone-900"
        >
          <span className="truncate">
            {value ? (
              <span className="flex items-center gap-2">
                <span>{value}</span>
                {selectedDef && (
                  <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-mono text-[10px] font-bold">
                    {selectedDef.code}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-stone-400 font-normal">
                Select Shade / Color...
              </span>
            )}
          </span>
          <ChevronDown
            size={16}
            className={`text-stone-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        <Palette
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
        />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white/95 backdrop-blur-xl border border-stone-200/80 rounded-2xl shadow-xl p-2 space-y-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shades or code..."
              className="w-full h-8 pl-8 pr-3 text-[11px] bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#D4A373]"
              autoFocus
            />
          </div>

          <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1">
            {filteredColors.length > 0 ? (
              filteredColors.map((colorDef) => {
                const isSelected =
                  colorDef.name.toLowerCase() === value.toLowerCase();
                return (
                  <button
                    key={colorDef.code + colorDef.name}
                    type="button"
                    onClick={() => {
                      onChange(colorDef.name);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-left transition-all ${
                      isSelected
                        ? "bg-[#2A0E20] text-amber-100 font-semibold shadow-sm"
                        : "text-stone-700 hover:bg-stone-100/80 hover:text-stone-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full border border-stone-300 shadow-xs"
                        style={{
                          backgroundColor:
                            colorDef.name.toLowerCase().includes("red")
                              ? "#dc2626"
                              : colorDef.name.toLowerCase().includes("green")
                              ? "#16a34a"
                              : colorDef.name.toLowerCase().includes("blue")
                              ? "#2563eb"
                              : colorDef.name.toLowerCase().includes("teal")
                              ? "#0d9488"
                              : colorDef.name.toLowerCase().includes("pink")
                              ? "#ec4899"
                              : colorDef.name.toLowerCase().includes("yellow")
                              ? "#eab308"
                              : colorDef.name.toLowerCase().includes("gold")
                              ? "#d97706"
                              : colorDef.name.toLowerCase().includes("silver")
                              ? "#94a3b8"
                              : colorDef.name.toLowerCase().includes("maroon") ||
                                colorDef.name.toLowerCase().includes("wine")
                              ? "#881337"
                              : colorDef.name.toLowerCase().includes("purple") ||
                                colorDef.name.toLowerCase().includes("violet")
                              ? "#7e22ce"
                              : colorDef.name.toLowerCase().includes("orange")
                              ? "#ea580c"
                              : colorDef.name.toLowerCase().includes("black")
                              ? "#171717"
                              : "#e2e8f0",
                        }}
                      />
                      <span>{colorDef.name}</span>
                    </div>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/10">
                      {colorDef.code}
                    </span>
                  </button>
                );
              })
            ) : (
              <button
                type="button"
                onClick={() => {
                  onChange(search);
                  setIsOpen(false);
                  setSearch("");
                }}
                className="w-full text-left px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 rounded-xl"
              >
                Use custom shade: "{search}"
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
