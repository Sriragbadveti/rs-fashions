import { motion } from "framer-motion";
import { FiCheck, FiX } from "react-icons/fi";

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
  "Sarees",
  "Designer",
  "Festive",
  "Party Wear",
  "New Arrivals",
];

const materials: FilterState["material"][] = [
  "All",
  "Silk",
  "Cotton",
  "Chiffon",
  "Georgette",
  "Organza",
  "Linen",
  "Banarasi",
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
      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-all ${
        active
          ? "bg-[#211b18] text-white"
          : "bg-black/[0.035] text-black/65"
      }`}
    >
      {label}

      {active && <FiCheck size={16} />}
    </button>
  );
}

function FilterSheet({
  filters,
  onChange,
  onClose,
}: FilterSheetProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120]"
    >
      <button
        type="button"
        aria-label="Close filters"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      />

      <motion.div
        initial={{
          y: "100%",
        }}
        animate={{
          y: 0,
        }}
        exit={{
          y: "100%",
        }}
        transition={{
          type: "spring",
          damping: 28,
          stiffness: 260,
        }}
        className="absolute bottom-0 left-0 right-0 max-h-[88dvh] overflow-hidden rounded-t-[2rem] bg-[#f8f5f0]"
      >
        <div className="flex items-center justify-between border-b border-black/[0.07] px-5 py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
              Refine
            </p>

            <h2 className="mt-1 font-display text-3xl">
              Filters
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.04]"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="max-h-[calc(88dvh-90px)] space-y-8 overflow-y-auto px-5 py-6 pb-10">
          
          <section>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
              Category
            </p>

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

          <section>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
              Material
            </p>

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

          <section>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
              Price
            </p>

            <div className="grid gap-2">
              {priceRanges.map((priceRange) => (
                <FilterOption
                  key={priceRange}
                  label={priceRange}
                  active={
                    filters.priceRange === priceRange
                  }
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

          <button
            type="button"
            onClick={onClose}
            className="safe-bottom sticky bottom-0 w-full rounded-full bg-[#8e3d51] px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white"
          >
            Show products
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default FilterSheet;
