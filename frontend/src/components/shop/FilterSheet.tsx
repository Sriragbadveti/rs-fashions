import { motion } from "framer-motion";
import { FiCheck, FiX, FiRotateCcw } from "react-icons/fi";

import type {
  ProductCategory,
  ProductMaterial,
} from "../../types/product";

export interface FilterState {
  category: ProductCategory | "All";
  material: ProductMaterial | "All";
  priceRange: "All" | "Under 2000" | "2000-4000" | "Above 4000";
}

interface FilterSheetProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onClose: () => void;
}

const categories: FilterState["category"][] = [
  "All",
  "SiCo Gadwal Sarees",
];

const materials: FilterState["material"][] = [
  "All",
  "SiCo",
];

const priceRanges: FilterState["priceRange"][] = [
  "All",
  "Under 2000",
  "2000-4000",
  "Above 4000",
];

function FilterOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-11 w-full items-center justify-between rounded-xl px-3.5 text-left text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
        active
          ? "border border-[#8E3D51] bg-[#8E3D51] text-white shadow-xs"
          : "border border-stone-200/90 bg-white text-[#3C322C] hover:border-stone-400 hover:bg-stone-50"
      }`}
    >
      <span className="truncate tracking-wide">{label}</span>
      {active && (
        <FiCheck size={14} className="ml-2 shrink-0 stroke-[2.5]" />
      )}
    </button>
  );
}

export default function FilterSheet({
  filters,
  onChange,
  onClose,
}: FilterSheetProps) {
  const handleReset = () => {
    onChange({
      category: "All",
      material: "All",
      priceRange: "All",
    });
  };

  const hasActiveFilters =
    filters.category !== "All" ||
    filters.material !== "All" ||
    filters.priceRange !== "All";

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center font-sans sm:items-center sm:p-4">
      {/* Zero-Blur Pure Hardware Alpha Backdrop */}
      <motion.div
        aria-hidden="true"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "linear" }}
        className="fixed inset-0 bg-stone-950/60 will-change-[opacity]"
      />

      {/* Hardware-Accelerated Sliding Window */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{
          duration: 0.28,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{ transform: "translateZ(0)" }}
        className="relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-[28px] border border-stone-200 bg-[#FAF7F2] shadow-2xl will-change-transform sm:max-w-md sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-stone-200/80 bg-[#FAF7F2] px-6 py-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8E3D51]">
              Refine Collection
            </span>
            <h2 className="font-serif text-2xl font-normal leading-tight text-[#2A2421]">
              Filters
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-full border border-[#8E3D51]/30 bg-white px-3 py-1 text-[11px] font-medium text-[#8E3D51] transition-colors hover:bg-rose-50 active:scale-95"
              >
                <FiRotateCcw size={11} />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              aria-label="Close filters"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-[#4A4039] shadow-2xs transition-colors hover:bg-stone-100 active:scale-90"
            >
              <FiX size={17} />
            </button>
          </div>
        </div>

        {/* Scrollable Filters Content */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 overscroll-contain">
          {/* Category */}
          <section>
            <span className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C7A6B]">
              Category
            </span>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <FilterOption
                  key={category}
                  label={category}
                  active={filters.category === category}
                  onClick={() =>
                    onChange({
                      ...filters,
                      category,
                    })
                  }
                />
              ))}
            </div>
          </section>

          {/* Fabric & Weave */}
          <section>
            <span className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C7A6B]">
              Fabric & Weave
            </span>
            <div className="grid grid-cols-2 gap-2">
              {materials.map((material) => (
                <FilterOption
                  key={material}
                  label={material}
                  active={filters.material === material}
                  onClick={() =>
                    onChange({
                      ...filters,
                      material,
                    })
                  }
                />
              ))}
            </div>
          </section>

          {/* Price Budget */}
          <section>
            <span className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C7A6B]">
              Price Budget
            </span>
            <div className="grid grid-cols-2 gap-2">
              {priceRanges.map((priceRange) => (
                <FilterOption
                  key={priceRange}
                  label={
                    priceRange === "All"
                      ? "All Prices"
                      : priceRange === "Under 2000"
                      ? "Under ₹2,000"
                      : priceRange === "2000-4000"
                      ? "₹2,000 – ₹4,000"
                      : "Above ₹4,000"
                  }
                  active={filters.priceRange === priceRange}
                  onClick={() =>
                    onChange({
                      ...filters,
                      priceRange,
                    })
                  }
                />
              ))}
            </div>
          </section>
        </div>

        {/* Action Footer */}
        <div className="shrink-0 border-t border-stone-200/80 bg-[#FAF7F2] p-4.5">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-full items-center justify-center rounded-2xl bg-[#8E3D51] text-xs font-bold uppercase tracking-[0.16em] text-white shadow-xs transition-colors hover:bg-[#783344] active:scale-[0.98]"
          >
            Show Results
          </button>
        </div>
      </motion.div>
    </div>
  );
}