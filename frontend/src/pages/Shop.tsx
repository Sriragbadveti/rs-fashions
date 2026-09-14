
import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  FiChevronDown,
  FiFilter,
  FiSearch,
  FiSliders,
  FiX,
  FiRotateCcw,
} from "react-icons/fi";

import { type Product, products as fallbackProducts } from "../data/products";
import ProductCard from "../components/product/ProductCard";
import FilterSheet, {
  type FilterState,
} from "../components/shop/FilterSheet";
import { StoreService } from "../services/supabase";

type SortOption =
  | "Featured"
  | "Price: Low to High"
  | "Price: High to Low"
  | "Most Popular";

const sortOptionsList: SortOption[] = [
  "Featured",
  "Price: Low to High",
  "Price: High to Low",
  "Most Popular",
];

const initialCategoryPills = [
  "All",
  "SiCo Gadwal Sarees",
];

const initialFilters: FilterState = {
  category: "All",
  material: "All",
  priceRange: "All",
};

function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem("rs_fashions_products");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any) => ({ ...p, category: "SiCo Gadwal Sarees" }));
        }
      }
    } catch {
      // ignore
    }
    return fallbackProducts.map((p) => ({ ...p, category: "SiCo Gadwal Sarees" }));
  });
  const [, setLoading] = useState(false);

  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "All";
  const initialMaterial = searchParams.get("material") || "All";
  const initialMinPrice = searchParams.get("minPrice");
  const initialMaxPrice = searchParams.get("maxPrice");
  const initialSortParam = searchParams.get("sort");

  const [search, setSearch] = useState(initialSearch);
  const [filters, setFilters] = useState<FilterState>({
    category: (initialCategory as any) || "All",
    material: (initialMaterial as any) || "All",
    priceRange: "All",
  });

  const [customPriceRange, setCustomPriceRange] = useState<{
    min: number | null;
    max: number | null;
  }>({
    min: initialMinPrice ? Number(initialMinPrice) : null,
    max: initialMaxPrice ? Number(initialMaxPrice) : null,
  });

  const [sort, setSort] = useState<SortOption>(() => {
    if (initialSortParam === "price_asc") return "Price: Low to High";
    if (initialSortParam === "price_desc") return "Price: High to Low";
    if (initialSortParam === "bestseller") return "Most Popular";
    return "Featured";
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  // Dynamic category pills that automatically include live categories
  const categoryPills = useMemo(() => {
    const liveCats = allProducts
      .map((p) => p.category)
      .filter((c): c is string => Boolean(c && c.trim()));
    return Array.from(new Set([...initialCategoryPills, ...liveCats]));
  }, [allProducts]);

  // Instant SWR loading: products are displayed on frame 0, then seamlessly synced
  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        const data = await StoreService.getProducts();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setAllProducts(data);
        }
      } catch (err) {
        console.error("Error refreshing products:", err);
      }
    }
    loadProducts();

    const handleInventorySync = () => {
      loadProducts();
    };

    window.addEventListener("rs_inventory_updated", handleInventorySync);
    window.addEventListener("storage", handleInventorySync);

    const unsubscribe = StoreService.subscribeToRealtime(() => {
      loadProducts();
    });

    return () => {
      isMounted = false;
      window.removeEventListener("rs_inventory_updated", handleInventorySync);
      window.removeEventListener("storage", handleInventorySync);
      unsubscribe();
    };
  }, []);

  // Sync searchParams with state
  useEffect(() => {
    const urlQuery = searchParams.get("search");
    const urlCategory = searchParams.get("category");
    const urlMaterial = searchParams.get("material");
    const urlMin = searchParams.get("minPrice");
    const urlMax = searchParams.get("maxPrice");
    const urlSort = searchParams.get("sort");

    if (urlQuery !== null) setSearch(urlQuery);
    if (urlCategory) {
      setFilters((prev) => ({ ...prev, category: urlCategory as any }));
    }
    if (urlMaterial) {
      setFilters((prev) => ({ ...prev, material: urlMaterial as any }));
    }
    if (urlMin || urlMax) {
      setCustomPriceRange({
        min: urlMin ? Number(urlMin) : null,
        max: urlMax ? Number(urlMax) : null,
      });
    }
    if (urlSort) {
      if (urlSort === "price_asc") setSort("Price: Low to High");
      else if (urlSort === "price_desc") setSort("Price: High to Low");
      else if (urlSort === "bestseller") setSort("Most Popular");
    }
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Search query filter
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter((product: Product) =>
        [product.name, product.category, product.material, product.description]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }

    // Category filter
    if (filters.category !== "All") {
      const catFilter = filters.category.toLowerCase().trim();
      result = result.filter((product: Product) => {
        const prodCat = (product.category || "").toLowerCase().trim();
        return (
          prodCat === catFilter ||
          prodCat.includes(catFilter) ||
          catFilter.includes(prodCat)
        );
      });
    }

    // Material filter
    if (filters.material !== "All") {
      result = result.filter(
        (product: Product) =>
          product.material?.toLowerCase().includes(filters.material.toLowerCase())
      );
    }

    // Custom Min/Max Price filter from URL / Mobile Menu
    if (customPriceRange.min !== null) {
      result = result.filter((product: Product) => product.price >= customPriceRange.min!);
    }
    if (customPriceRange.max !== null) {
      result = result.filter((product: Product) => product.price <= customPriceRange.max!);
    }

    // Price range filter (FilterSheet preset options)
    if (filters.priceRange === "Under 2000") {
      result = result.filter((product: Product) => product.price < 2000);
    } else if (filters.priceRange === "2000-4000") {
      result = result.filter(
        (product: Product) => product.price >= 2000 && product.price <= 4000
      );
    } else if (filters.priceRange === "Above 4000") {
      result = result.filter((product: Product) => product.price > 4000);
    }

    // Sorting
    switch (sort) {
      case "Price: Low to High":
        result.sort((a, b) => a.price - b.price);
        break;
      case "Price: High to Low":
        result.sort((a, b) => b.price - a.price);
        break;
      case "Most Popular":
        result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
      default:
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return result;
  }, [allProducts, search, filters, customPriceRange, sort]);

  const activeFilterCount = [
    filters.category !== "All",
    filters.material !== "All",
    filters.priceRange !== "All",
    customPriceRange.min !== null || customPriceRange.max !== null,
  ].filter(Boolean).length;

  const handleResetAll = () => {
    setSearch("");
    setFilters(initialFilters);
    setCustomPriceRange({ min: null, max: null });
    setSearchParams({});
  };

  return (
    <>
      <main className="min-h-screen bg-[#FAF7F2] px-4 pb-16 pt-6 sm:px-6 lg:px-12 font-sans select-none text-[#2A2421]">
        <div className="mx-auto max-w-[1600px]">
          {/* Header */}
          <div className="mb-8 flex flex-col justify-between gap-4 border-b border-black/6 pb-8 md:flex-row md:items-end">
            <div>
              <h1 className="mt-1 font-serif text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-[#2A2421]">
                Find your <span className="italic font-normal text-[#8E3D51]">story.</span>
              </h1>
            </div>

            <p className="max-w-xs text-xs font-light leading-relaxed text-[#756A60]">
              From traditional temple borders to weightless handloom SiCo weaves, discover authentic SiCo Gadwal drapes.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="relative mb-6">
            <div className="flex items-center rounded-2xl border border-black/40 bg-white/80 p-1.5 shadow-[0_8px_30px_rgba(42,36,33,0.04)] backdrop-blur-xl transition-all focus-within:border-[#8E3D51]/40">
              <div className="relative flex flex-1 items-center pl-3 sm:pl-4">
                <FiSearch size={18} className="shrink-0 text-[#8C7A6B]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search SiCo Gadwal Sarees..."
                  className="h-11 w-full bg-transparent pl-3 pr-8 text-xs sm:text-sm font-light tracking-wide text-[#2A2421] placeholder-[#A89C8F] outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setSearchParams({});
                    }}
                    className="absolute right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-[#6E6359] hover:bg-black/10"
                  >
                    <FiX size={13} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 border-l border-black/30 pl-2">
                <button
                  type="button"
                  onClick={() => setShowFilters(true)}
                  className={`flex h-10 items-center gap-2 rounded-xl px-3 sm:px-4 text-[11px] font-medium uppercase tracking-[0.14em] transition-all active:scale-95 ${
                    activeFilterCount > 0
                      ? "bg-[#8E3D51] text-white shadow-sm"
                      : "bg-[#FAF7F2] text-[#2A2421] hover:bg-[#EFEAE2]"
                  }`}
                >
                  <FiFilter size={13} />
                  <span className="hidden sm:inline">Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-[#8E3D51]">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSort((prev) => !prev)}
                    className="flex h-10 items-center gap-1.5 rounded-xl bg-[#FAF7F2] px-3 sm:px-4 text-[11px] font-medium uppercase tracking-[0.14em] text-[#2A2421] transition-all hover:bg-[#EFEAE2] active:scale-95"
                  >
                    <FiSliders size={13} />
                    <span className="hidden md:inline">{sort}</span>
                    <FiChevronDown
                      size={13}
                      className={`transition-transform duration-300 ${
                        showSort ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {showSort && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-[calc(100%+8px)] z-30 w-48 rounded-2xl border border-black/5 bg-[#FAF7F2]/98 p-1.5 shadow-[0_15px_40px_rgba(42,36,33,0.12)] backdrop-blur-xl"
                      >
                        {sortOptionsList.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setSort(option);
                              setShowSort(false);
                            }}
                            className={`w-full rounded-xl px-3 py-2.5 text-left text-xs font-light transition-colors ${
                              sort === option
                                ? "bg-[#2A2421] text-[#FAF7F2] font-medium"
                                : "text-[#4A4039] hover:bg-black/5"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Category Chips */}
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categoryPills.map((cat) => {
                const isActive = filters.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      setFilters({
                        ...filters,
                        category: cat as FilterState["category"],
                      })
                    }
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium tracking-wide transition-all ${
                      isActive
                        ? "bg-[#2A2421] text-[#FAF7F2] shadow-sm"
                        : "border border-black/10 bg-white/60 text-[#6E6359] hover:border-black/20 hover:bg-white"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Active Filter Tags */}
            {(activeFilterCount > 0 || search) && (
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-black/4">
                <span className="text-[10px] uppercase tracking-widest text-[#8C7A6B]">
                  Active Filters:
                </span>

                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setSearchParams({});
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#8E3D51]/10 px-3 py-1 text-[11px] text-[#8E3D51]"
                  >
                    <span>"{search}"</span>
                    <FiX size={12} />
                  </button>
                )}

                {filters.category !== "All" && (
                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, category: "All" })}
                    className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-[11px] text-[#2A2421] hover:bg-black/10"
                  >
                    <span>Category: {filters.category}</span>
                    <FiX size={12} />
                  </button>
                )}

                {filters.material !== "All" && (
                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, material: "All" })}
                    className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-[11px] text-[#2A2421] hover:bg-black/10"
                  >
                    <span>Material: {filters.material}</span>
                    <FiX size={12} />
                  </button>
                )}

                {(customPriceRange.min !== null || customPriceRange.max !== null) && (
                  <button
                    type="button"
                    onClick={() => setCustomPriceRange({ min: null, max: null })}
                    className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-[11px] text-[#2A2421] hover:bg-black/10"
                  >
                    <span>
                      ₹{customPriceRange.min?.toLocaleString("en-IN") || "0"} — ₹
                      {customPriceRange.max?.toLocaleString("en-IN") || "50,000+"}
                    </span>
                    <FiX size={12} />
                  </button>
                )}

                {filters.priceRange !== "All" && (
                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, priceRange: "All" })}
                    className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-[11px] text-[#2A2421] hover:bg-black/10"
                  >
                    <span>{filters.priceRange}</span>
                    <FiX size={12} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetAll}
                  className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#8E3D51] hover:underline ml-2"
                >
                  <FiRotateCcw size={11} />
                  <span>Reset All</span>
                </button>
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="mb-6 flex items-center justify-between border-b border-black/4 pb-3 text-xs text-[#8C7A6B]">
            <p>
              Showing{" "}
              <strong className="font-medium text-[#2A2421]">
                {filteredProducts.length}
              </strong>{" "}
              {filteredProducts.length === 1 ? "artisan drape" : "artisan drapes"}
            </p>
            <p className="font-serif italic text-[13px]">{sort}</p>
          </div>

          {/* Product Grid */}
          <AnimatePresence mode="popLayout">
            {filteredProducts.length > 0 ? (
              <motion.div
                layout
                className="grid grid-cols-2 gap-x-3.5 gap-y-10 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4"
              >
                {filteredProducts.map((product: Product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </motion.div>
            ) : (
              <div className="flex min-h-[45vh] flex-col items-center justify-center text-center p-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/3 text-[#8C7A6B]">
                  <FiSearch size={22} />
                </div>

                <h2 className="mt-5 font-serif text-2xl sm:text-3xl font-light text-[#2A2421]">
                  No weaves match your selection
                </h2>

                <p className="mt-2 max-w-sm text-xs leading-relaxed text-[#756A60]">
                  Try clearing your search keyword or relaxing material and price filters.
                </p>

                <button
                  type="button"
                  onClick={handleResetAll}
                  className="mt-6 rounded-full bg-[#2A2421] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-all hover:bg-[#8E3D51] active:scale-95"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {showFilters && (
          <FilterSheet
            filters={filters}
            onChange={setFilters}
            onClose={() => setShowFilters(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default Shop;
