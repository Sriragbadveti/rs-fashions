import { useMemo, useState, useEffect, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams, Link } from "react-router-dom";
import {
  FiChevronDown,
  FiFilter,
  FiSearch,
  FiSliders,
  FiX,
  FiRotateCcw,
  FiShoppingBag,
  FiCheck,
  FiStar,
  FiTag,
} from "react-icons/fi";

import { type Product, products as fallbackProducts } from "../data/products";
import FilterSheet, { type FilterState } from "../components/shop/FilterSheet";
import { StoreService } from "../services/supabase";
import { useCart } from "../context/CartContext";

// =====================================================================
// PRODUCT CARD
// =====================================================================

interface ProductCardProps {
  product: Product & { isOfferEligible?: boolean; offerTag?: string };
  isOffer: boolean;
  offerBadgeText?: string;
}

const ProductCard = memo(function ProductCard({
  product,
  isOffer,
  offerBadgeText,
}: ProductCardProps) {
  const { cart = [], addToCart } = useCart() as any;
  const cartList = cart || [];

  const inCart = cartList.some((cartItem: any) => {
    const cId = cartItem?.product?.id ?? cartItem?.id;
    return String(cId) === String(product.id);
  });

  const primaryImage = product.images?.[0] || "";
  const hoverImage = product.images?.[1] || primaryImage;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) return;

    addToCart(
      {
        id: product.id,
        name: product.name,
        category: product.category,
        material: (product.material || "SiCo").replace(/silk[\s-]*cotton/gi, "SiCo"),
        price: product.price,
        stock: product.stock || 10,
        rating: product.rating || 4.8,
        reviewCount: product.reviewCount || 15,
        images: product.images || [primaryImage],
        colors: product.colors || ["Standard"],
        sizes: ["Free Size (5.5m + 0.8m Blouse)"],
        description: product.description || "",
        longDescription: product.longDescription || product.description || "",
      },
      { quantity: 1, selectedColor: product.colors?.[0] || "Standard" }
    );
  };

  const cleanMaterial = (product.material || "SiCo").replace(/silk[\s-]*cotton/gi, "SiCo");

  return (
    <article
      style={{
        transform: "translate3d(0, 0, 0)",
        WebkitTransform: "translate3d(0, 0, 0)",
        contain: "paint layout",
      }}
      className="group relative flex flex-col font-sans select-none overflow-hidden rounded-2xl sm:rounded-3xl border border-white/60 bg-white p-2 sm:p-3 shadow-xs transition-transform duration-200 hover:-translate-y-1 sm:hover:shadow-md"
    >
      {/* Product Image Container */}
      <div className="relative aspect-[3/4.2] w-full overflow-hidden rounded-xl sm:rounded-2xl bg-[#EFEAE2]">
        <Link
          to={`/product/${product.id}`}
          state={{ product }}
          className="block h-full w-full"
        >
          <img
            src={primaryImage}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
          />

          {hoverImage && (
            <img
              src={hoverImage}
              alt={`${product.name} alternate view`}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 hidden sm:block"
            />
          )}
        </Link>

        {/* Desktop Quick Add Button */}
        <div className="absolute bottom-2.5 inset-x-2.5 transition-all duration-200 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hidden sm:block">
          <button
            type="button"
            disabled={inCart}
            onClick={handleQuickAdd}
            className={`w-full h-9 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all ${
              inCart
                ? "bg-emerald-600 text-white cursor-default"
                : "bg-[#2A2421]/90 text-[#FAF7F2] hover:bg-[#8E3D51] active:scale-95 cursor-pointer"
            }`}
          >
            {inCart ? (
              <>
                <FiCheck size={13} className="stroke-[2.5]" />
                <span>Added</span>
              </>
            ) : (
              <>
                <FiShoppingBag size={13} />
                <span>Quick Add</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Information Area */}
      <div className="mt-2.5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
            <span className="text-[9px] sm:text-[9.5px] font-bold uppercase tracking-widest text-[#8E3D51]">
              {cleanMaterial}
            </span>
            <div className="flex items-center gap-1 font-semibold text-amber-800">
              <FiStar size={11} className="fill-amber-400 text-amber-400" />
              <span>{product.rating || 4.8}</span>
              <span className="text-stone-400 font-light text-[9px] sm:text-[9.5px]">
                ({product.reviewCount || 18})
              </span>
            </div>
          </div>

          <Link
            to={`/product/${product.id}`}
            state={{ product }}
            className="group/link mt-1 block"
          >
            <h3 className="font-serif text-[0.95rem] sm:text-[1.05rem] font-normal leading-snug text-[#2A2421] transition-colors duration-200 group-hover/link:text-[#8E3D51] line-clamp-1">
              {product.name}
            </h3>
          </Link>

          <p className="mt-0.5 text-[10.5px] sm:text-[11px] text-stone-500 line-clamp-1 font-light">
            {product.description}
          </p>
        </div>

        <div className="mt-2 pt-2 border-t border-black/5">
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-lg font-bold text-[#2A2421]">
              ₹{product.price.toLocaleString("en-IN")}
            </span>

            {product.colors && product.colors.length > 0 && (
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-stone-600 bg-stone-100 px-1.5 sm:px-2 py-0.5 rounded-full">
                {product.colors.length} shades
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});

// =====================================================================
// SHOP PAGE
// =====================================================================

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

const initialCategoryPills = ["All", "SiCo Gadwal Sarees"];

const initialFilters: FilterState = {
  category: "All",
  material: "All",
  priceRange: "All",
};

export default function Shop() {
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
    } catch {}
    return fallbackProducts.map((p) => ({ ...p, category: "SiCo Gadwal Sarees" }));
  });

  const [offerProductIds, setOfferProductIds] = useState<Set<string>>(new Set());
  const [offerBadgesMap, setOfferBadgesMap] = useState<Record<string, string>>({});

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

  const [showOnlyOffers, setShowOnlyOffers] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  // Keyboard shortcut listener to close filter on Laptop/Desktop only
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && window.innerWidth >= 1024) {
        setShowFilters(false);
        setShowSort(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const categoryPills = useMemo(() => {
    const liveCats = allProducts
      .map((p) => p.category)
      .filter((c): c is string => Boolean(c && c.trim()));
    return Array.from(new Set([...initialCategoryPills, ...liveCats]));
  }, [allProducts]);

  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        const data = await StoreService.getProducts();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setAllProducts(data);
        }
      } catch (err) {
        console.error("Error loading products:", err);
      }
    }
    loadProducts();

    const handleInventorySync = () => loadProducts();
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

  useEffect(() => {
    let isMounted = true;
    async function loadSaleConfig() {
      try {
        const res = await fetch("/api/settings/sale");
        if (!res.ok) return;
        const json = await res.json();
        const conf = json?.data?.saleConfig || json?.saleConfig;
        if (isMounted && conf && conf.isEnabled !== false) {
          const ids = new Set<string>();
          const badgeMap: Record<string, string> = {};

          if (Array.isArray(conf.saleItems)) {
            conf.saleItems.forEach((item: any) => {
              if (item.isActive !== false) {
                const sId = String(item.id);
                ids.add(sId);
                badgeMap[sId] = item.customOfferText || "Special Offer";
              }
            });
          }

          if (Array.isArray(conf.saleProductIds)) {
            conf.saleProductIds.forEach((id: any) => {
              const sId = String(id);
              ids.add(sId);
              if (!badgeMap[sId]) badgeMap[sId] = "Special Offer";
            });
          }

          setOfferProductIds(ids);
          setOfferBadgesMap(badgeMap);
        }
      } catch (e) {
        console.error("Error reading sale config:", e);
      }
    }
    loadSaleConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const urlQuery = searchParams.get("search");
    const urlCategory = searchParams.get("category");
    const urlMaterial = searchParams.get("material");
    const urlMin = searchParams.get("minPrice");
    const urlMax = searchParams.get("maxPrice");
    const urlSort = searchParams.get("sort");

    if (urlQuery !== null) setSearch(urlQuery);
    if (urlCategory) setFilters((prev) => ({ ...prev, category: urlCategory as any }));
    if (urlMaterial) setFilters((prev) => ({ ...prev, material: urlMaterial as any }));
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

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter((product: Product) =>
        [product.name, product.category, product.material, product.description]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }

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

    if (filters.material !== "All") {
      result = result.filter((product: Product) =>
        product.material?.toLowerCase().includes(filters.material.toLowerCase())
      );
    }

    if (customPriceRange.min !== null) {
      result = result.filter((product: Product) => product.price >= customPriceRange.min!);
    }
    if (customPriceRange.max !== null) {
      result = result.filter((product: Product) => product.price <= customPriceRange.max!);
    }

    if (filters.priceRange === "Under 2000") {
      result = result.filter((product: Product) => product.price < 2000);
    } else if (filters.priceRange === "2000-4000") {
      result = result.filter(
        (product: Product) => product.price >= 2000 && product.price <= 4000
      );
    } else if (filters.priceRange === "Above 4000") {
      result = result.filter((product: Product) => product.price > 4000);
    }

    if (showOnlyOffers) {
      result = result.filter((product: Product) =>
        offerProductIds.has(String(product.id)) || Boolean((product as any).isOfferEligible)
      );
    }

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
  }, [allProducts, search, filters, customPriceRange, sort, showOnlyOffers, offerProductIds]);

  const activeFilterCount = [
    showOnlyOffers,
    filters.category !== "All",
    filters.material !== "All",
    filters.priceRange !== "All",
    customPriceRange.min !== null || customPriceRange.max !== null,
  ].filter(Boolean).length;

  const handleResetAll = () => {
    setSearch("");
    setShowOnlyOffers(false);
    setFilters(initialFilters);
    setCustomPriceRange({ min: null, max: null });
    setSearchParams({});
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] px-3.5 pb-16 pt-5 sm:px-6 lg:px-12 font-sans select-none text-[#2A2421]">
      <div className="mx-auto max-w-[1600px]">
        {/* Top Search & Filter Bar */}
        <div className="relative z-30 mb-4">
          <div className="flex items-center rounded-2xl border border-stone-200 bg-white p-1.5 shadow-sm transition-all focus-within:border-[#8E3D51]/50">
            <div className="relative flex flex-1 items-center pl-3 sm:pl-4">
              <FiSearch size={18} className="shrink-0 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by weave pattern, shade, zari border..."
                className="h-10 sm:h-11 w-full bg-transparent pl-2.5 sm:pl-3 pr-8 text-xs sm:text-sm font-light tracking-wide text-[#2A2421] placeholder-stone-400 outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSearchParams({});
                  }}
                  className="absolute right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-stone-500 hover:bg-black/10 transition-colors"
                >
                  <FiX size={13} />
                </button>
              )}
            </div>

            {/* Action Buttons: Anchored Dropdowns */}
            <div className="flex items-center gap-1.5 border-l border-stone-200 pl-2">
              {/* Filter Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  data-filter-trigger="true"
                  onClick={() => {
                    setShowFilters((prev) => !prev);
                    setShowSort(false);
                  }}
                  className={`flex h-10 items-center gap-2 rounded-xl px-3 sm:px-4 text-[11px] font-medium uppercase tracking-[0.14em] transition-all active:scale-95 ${
                    activeFilterCount > 0
                      ? "bg-[#8E3D51] text-white shadow-xs"
                      : "border border-stone-200 bg-stone-50 text-[#2A2421] hover:bg-stone-100"
                  }`}
                >
                  <FiFilter size={13} />
                  <span className="hidden sm:inline">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-[#8E3D51]">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showFilters && (
                    <FilterSheet
                      filters={filters}
                      onChange={setFilters}
                      onClose={() => setShowFilters(false)}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Sort Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowSort((prev) => !prev);
                    setShowFilters(false);
                  }}
                  className="flex h-10 items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 sm:px-4 text-[11px] font-medium uppercase tracking-[0.14em] text-[#2A2421] transition-all hover:bg-stone-100 active:scale-95"
                >
                  <FiSliders size={13} />
                  <span className="hidden md:inline">{sort}</span>
                  <FiChevronDown
                    size={13}
                    className={`transition-transform duration-200 ${
                      showSort ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {showSort && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                      style={{ transform: "translate3d(0, 0, 0)" }}
                      className="absolute right-0 top-[calc(100%+8px)] z-50 w-48 rounded-2xl border border-stone-200 bg-[#FAF7F2] p-1.5 shadow-xl will-change-transform"
                    >
                      {sortOptionsList.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setSort(option);
                            setShowSort(false);
                          }}
                          className={`w-full rounded-xl px-3 py-2.5 text-left text-xs transition-colors ${
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

        {/* Categories Bar */}
        <div className="relative z-10 mb-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setShowOnlyOffers((prev) => !prev)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-medium tracking-wide transition-all active:scale-95 ${
                showOnlyOffers
                  ? "bg-[#8E3D51] text-white shadow-xs border border-[#8E3D51]"
                  : "border border-amber-200 bg-amber-50/80 text-[#8E3D51] hover:bg-amber-100/80"
              }`}
            >
              <FiTag size={12} />
              <span>Special Offers</span>
            </button>

            {categoryPills.map((cat) => {
              const isActive = filters.category === cat && !showOnlyOffers;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setShowOnlyOffers(false);
                    setFilters({
                      ...filters,
                      category: cat as FilterState["category"],
                    });
                  }}
                  className={`shrink-0 rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-medium tracking-wide transition-all active:scale-95 ${
                    isActive
                      ? "bg-[#2A2421] text-[#FAF7F2] shadow-xs border border-[#2A2421]"
                      : "border border-stone-200 bg-white text-stone-600 hover:border-black/20 hover:bg-stone-50"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Active Filters Summary Chips */}
          {(activeFilterCount > 0 || search) && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 border-t border-black/4">
              <span className="text-[10px] uppercase tracking-widest text-stone-400">
                Active:
              </span>

              {showOnlyOffers && (
                <button
                  type="button"
                  onClick={() => setShowOnlyOffers(false)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#8E3D51]/30 bg-[#8E3D51]/10 px-2.5 py-1 text-[11px] font-semibold text-[#8E3D51] transition-colors hover:bg-[#8E3D51]/20"
                >
                  <span>Offers Only</span>
                  <FiX size={12} />
                </button>
              )}

              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSearchParams({});
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] text-[#8E3D51] hover:bg-stone-50"
                >
                  <span>"{search}"</span>
                  <FiX size={12} />
                </button>
              )}

              {filters.category !== "All" && (
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, category: "All" })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] text-[#2A2421] hover:bg-stone-50"
                >
                  <span>{filters.category}</span>
                  <FiX size={12} />
                </button>
              )}

              {filters.material !== "All" && (
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, material: "All" })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] text-[#2A2421] hover:bg-stone-50"
                >
                  <span>Material: {filters.material}</span>
                  <FiX size={12} />
                </button>
              )}

              {(customPriceRange.min !== null || customPriceRange.max !== null) && (
                <button
                  type="button"
                  onClick={() => setCustomPriceRange({ min: null, max: null })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] text-[#2A2421] hover:bg-stone-50"
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] text-[#2A2421] hover:bg-stone-50"
                >
                  <span>{filters.priceRange}</span>
                  <FiX size={12} />
                </button>
              )}

              <button
                type="button"
                onClick={handleResetAll}
                className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#8E3D51] hover:underline ml-1"
              >
                <FiRotateCcw size={11} />
                <span>Reset All</span>
              </button>
            </div>
          )}
        </div>

        {/* Results Counter */}
        <div className="mb-3.5 flex items-center justify-between border-b border-black/5 pb-2 text-xs text-stone-500">
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
        <div
          style={{ WebkitOverflowScrolling: "touch", contain: "layout style" }}
          className="grid grid-cols-2 gap-x-2.5 gap-y-3.5 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-6 lg:grid-cols-4 lg:gap-y-8"
        >
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product: Product) => {
              const sId = String(product.id);
              const isOffer = offerProductIds.has(sId) || Boolean((product as any).isOfferEligible);
              const badgeText = offerBadgesMap[sId] || (product as any).offerTag || "Special Offer";

              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  isOffer={isOffer}
                  offerBadgeText={badgeText}
                />
              );
            })
          ) : (
            <div className="col-span-full flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border border-stone-200 bg-white p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/5 text-stone-400">
                <FiSearch size={22} />
              </div>

              <h2 className="mt-5 font-serif text-2xl sm:text-3xl font-light text-[#2A2421]">
                No weaves match your selection
              </h2>

              <p className="mt-2 max-w-sm text-xs leading-relaxed text-stone-500">
                Try clearing your search keyword or relaxing your filter parameters.
              </p>

              <button
                type="button"
                onClick={handleResetAll}
                className="mt-6 rounded-full bg-[#2A2421] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-all hover:bg-[#8E3D51] active:scale-95 shadow-md"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}