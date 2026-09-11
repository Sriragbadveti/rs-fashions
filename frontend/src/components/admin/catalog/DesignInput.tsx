import React, { useState, useRef, useEffect } from "react";
import { Sparkles, ChevronDown, Check } from "lucide-react";

interface DesignInputProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export const DesignInput: React.FC<DesignInputProps> = ({
  value,
  options,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(value.toLowerCase().trim())
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="e.g. Vintage Checks or Gatti Borders"
          className="w-full h-11 pl-10 pr-10 text-xs bg-white/90 border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 transition-all text-stone-900 font-medium placeholder:text-stone-400"
        />
        <Sparkles
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
        >
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto bg-white/95 backdrop-blur-xl border border-stone-200/80 rounded-2xl shadow-xl p-1.5 space-y-0.5">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected = opt.toLowerCase() === value.toLowerCase();
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all ${
                    isSelected
                      ? "bg-[#2A0E20] text-amber-100 font-semibold shadow-sm"
                      : "text-stone-700 hover:bg-stone-100/80 hover:text-stone-900"
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && <Check size={14} className="text-[#D4A373]" />}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-[11px] text-stone-500 italic">
              Custom design pattern: "{value}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
