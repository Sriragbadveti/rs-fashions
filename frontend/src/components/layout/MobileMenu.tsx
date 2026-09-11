import { useEffect, useState } from "react";
import {
  FiArrowUpRight,
  FiX,
  FiTrendingUp,
  FiTrendingDown,
  FiAward,
  FiChevronDown,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

interface MobileMenuProps {
  onClose: () => void;
}

const sortOptions = [
  {
    label: "Price: Low to High",
    query: "price_asc",
    icon: FiTrendingUp,
  },
  {
    label: "Price: High to Low",
    query: "price_desc",
    icon: FiTrendingDown,
  },
  {
    label: "Best Sellers",
    query: "bestseller",
    icon: FiAward,
  },
];

// Saree Types grouped into the Saree section dropdown
const sareeSubcategories = [
  { label: "All Sarees", path: "/shop" },
  { label: "Silk Sarees (Pure Katan & Mulberry)", path: "/shop?category=Silk+Sarees" },
  { label: "Kanjivaram Heritage Sarees", path: "/shop?search=kanjivaram" },
  { label: "Banarasi Weave Sarees", path: "/shop?material=Banarasi" },
  { label: "Cotton & Chanderi Sarees", path: "/shop?category=Cotton+Sarees" },
  { label: "Designer Sarees", path: "/shop?category=Designer+Sarees" },
  { label: "Organza & Tissue Sarees", path: "/shop?material=Organza" },
  { label: "Chiffon & Georgette Sarees", path: "/shop?material=Chiffon" },
  { label: "Handloom Linen Sarees", path: "/shop?material=Linen" },
  { label: "Bridal Heritage Sarees", path: "/shop?category=Bridal+Heritage" },
];

const otherCategories = [
  { label: "New Arrivals", path: "/shop?sort=bestseller" },
  { label: "Festive Wear", path: "/shop?category=Festive+Wear" },
  { label: "Party Wear", path: "/shop?category=Party+Wear" },
  { label: "Best Sellers", path: "/shop?sort=bestseller" },
];

const secondaryLinks = [
  {
    label: "Our Story",
    path: "/our-story",
  },
  {
    label: "Sign In / Login",
    path: "/login",
  },
  {
    label: "Admin Atelier",
    path: "/admin",
  },
  {
    label: "Curated Vault",
    path: "/shop",
  },
];

const MIN_LIMIT = 999;
const MAX_LIMIT = 50000;
const STEP = 500;

function MobileMenu({ onClose }: MobileMenuProps) {
  const navigate = useNavigate();

  const [minPrice, setMinPrice] = useState(1999);
  const [maxPrice, setMaxPrice] = useState(35000);
  const [activeSort, setActiveSort] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isSareeDropdownOpen, setIsSareeDropdownOpen] = useState(true);

  // Trigger smooth exit animation before unmounting
  const handleDismiss = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 240);
  };

  // Lock body scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isClosing]);

  // Price handlers
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    const nextValue = Math.min(value, maxPrice - STEP);
    setMinPrice(nextValue);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    const nextValue = Math.max(value, minPrice + STEP);
    setMaxPrice(nextValue);
  };

  const handleApplyPrice = () => {
    handleDismiss();
    navigate(`/shop?minPrice=${minPrice}&maxPrice=${maxPrice}`);
  };

  const handleSortClick = (queryValue: string) => {
    setActiveSort(queryValue);
    handleDismiss();
    navigate(`/shop?sort=${queryValue}`);
  };

  const minPercent = ((minPrice - MIN_LIMIT) / (MAX_LIMIT - MIN_LIMIT)) * 100;
  const maxPercent = ((maxPrice - MIN_LIMIT) / (MAX_LIMIT - MIN_LIMIT)) * 100;

  return (
    <>
      <style>{`
        /* Optimized touch scrolling */
        .becho-menu-scroll {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
          scrollbar-width: thin;
          scrollbar-color: rgba(142, 61, 81, 0.28) transparent;
        }

        .becho-menu-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .becho-menu-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .becho-menu-scroll::-webkit-scrollbar-thumb {
          background: rgba(142, 61, 81, 0.28);
          border-radius: 999px;
        }

        /* Pure GPU layer composition */
        .becho-menu-drawer {
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          perspective: 1000px;
          will-change: transform;
        }

        .becho-menu-backdrop {
          will-change: opacity;
          transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        /* Custom range slider */
        .becho-range {
          pointer-events: none;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          left: 0;
          width: 100%;
          height: 20px;
          appearance: none;
          -webkit-appearance: none;
          background: transparent;
          margin: 0;
          padding: 0;
        }

        .becho-range::-webkit-slider-runnable-track {
          height: 4px;
          background: transparent;
          border: 0;
        }

        .becho-range::-moz-range-track {
          height: 4px;
          background: transparent;
          border: 0;
        }

        .becho-range::-webkit-slider-thumb {
          pointer-events: auto;
          appearance: none;
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          margin-top: -7px;
          border-radius: 50%;
          background: #8E3D51;
          border: 2px solid #FFFFFF;
          box-shadow: 0 2px 6px rgba(0,0,0,0.22);
          cursor: pointer;
          position: relative;
        }

        .becho-range::-moz-range-thumb {
          pointer-events: auto;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #8E3D51;
          border: 2px solid #FFFFFF;
          box-shadow: 0 2px 6px rgba(0,0,0,0.22);
          cursor: pointer;
        }

        /* Keyframes */
        @keyframes bechoDrawerIn {
          from { transform: translate3d(-100%, 0, 0); }
          to { transform: translate3d(0, 0, 0); }
        }

        @keyframes bechoDrawerOut {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-100%, 0, 0); }
        }

        @keyframes bechoBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes bechoBackdropOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>

      <div className="fixed inset-0 z-[100] font-sans">
        {/* Backdrop */}
        <div
          aria-hidden="true"
          onClick={handleDismiss}
          className="becho-menu-backdrop absolute inset-0 bg-black/50 backdrop-blur-xs"
          style={{
            animation: isClosing
              ? "bechoBackdropOut 220ms ease-in both"
              : "bechoBackdropIn 260ms cubic-bezier(0.22, 1, 0.36, 1) both",
          }}
        />

        {/* Drawer */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          className="becho-menu-drawer relative flex h-full w-full max-w-[420px] flex-col bg-[#FAF7F2] shadow-2xl"
          style={{
            animation: isClosing
              ? "bechoDrawerOut 230ms cubic-bezier(0.32, 0, 0.67, 0) both"
              : "bechoDrawerIn 360ms cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          {/* Header */}
          <header className="flex shrink-0 items-center justify-between border-b border-black/[0.06] px-6 py-4">
            <Link
              to="/"
              onClick={handleDismiss}
              className="font-serif text-2xl font-light tracking-[0.24em] text-[#8E3D51]"
            >
              BECHO
            </Link>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05] text-[#2A2421] transition-transform active:scale-90"
            >
              <FiX size={18} strokeWidth={1.7} />
            </button>
          </header>

          {/* Filter / Price Panel */}
          <section className="shrink-0 border-b border-black/[0.06] bg-[#F3EFE9]/70 px-6 py-4">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.24em] text-[#8C7A6B]">
                Price Range
              </span>

              <span className="whitespace-nowrap font-sans text-xs font-medium text-[#2A2421]">
                ₹{minPrice.toLocaleString("en-IN")} — ₹{maxPrice.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Range Slider */}
            <div className="relative flex h-5 w-full items-center">
              <div className="absolute left-0 right-0 h-1.5 rounded-full bg-black/10" />

              <div
                className="absolute h-1.5 rounded-full bg-[#8E3D51]"
                style={{
                  left: `${minPercent}%`,
                  width: `${Math.max(0, maxPercent - minPercent)}%`,
                }}
              />

              <input
                type="range"
                min={MIN_LIMIT}
                max={MAX_LIMIT}
                step={STEP}
                value={minPrice}
                onChange={handleMinChange}
                aria-label="Minimum price"
                className="becho-range z-20"
              />

              <input
                type="range"
                min={MIN_LIMIT}
                max={MAX_LIMIT}
                step={STEP}
                value={maxPrice}
                onChange={handleMaxChange}
                aria-label="Maximum price"
                className="becho-range z-30"
              />
            </div>

            {/* Sort Options */}
            <div className="mt-3 flex items-center gap-2">
              <div
                className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-0.5"
                style={{
                  scrollbarWidth: "none",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {sortOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = activeSort === option.query;

                  return (
                    <button
                      key={option.query}
                      type="button"
                      onClick={() => handleSortClick(option.query)}
                      className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[9.5px] font-medium tracking-wide transition-colors duration-150 active:scale-[0.97] ${
                        isActive
                          ? "bg-[#8E3D51] text-white"
                          : "border border-black/10 bg-white/80 text-[#544B44]"
                      }`}
                    >
                      <Icon size={11} />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleApplyPrice}
                className="shrink-0 rounded-full bg-[#2A2421] px-3.5 py-1 text-[9.5px] font-semibold uppercase tracking-wider text-white transition-transform duration-150 active:scale-95 hover:bg-[#8E3D51]"
              >
                Apply
              </button>
            </div>
          </section>

          {/* Scrollable Collections & Sarees Dropdown */}
          <div className="becho-menu-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <p className="mb-3 text-[9.5px] font-semibold uppercase tracking-[0.26em] text-[#8C7A6B]">
              Curated Collections
            </p>

            <nav className="space-y-1.5" aria-label="Collections">
              {/* 1. Sarees Grouped Section (Dropdown Accordion) */}
              <div className="rounded-2xl border border-black/8 bg-white/80 p-1 transition-all overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsSareeDropdownOpen(!isSareeDropdownOpen)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left font-serif text-lg font-normal text-[#2A2421] hover:text-[#8E3D51]"
                >
                  <div className="flex items-center gap-2">
                    <span>Sarees Collection</span>
                    <span className="rounded-full bg-[#8E3D51]/10 px-2 py-0.5 text-[10px] font-bold font-sans text-[#8E3D51]">
                      {sareeSubcategories.length} Types
                    </span>
                  </div>

                  <FiChevronDown
                    size={18}
                    className={`text-[#8E3D51] transition-transform duration-300 ${
                      isSareeDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isSareeDropdownOpen && (
                  <div className="border-t border-black/5 bg-[#FAF7F2]/60 px-2 py-2 space-y-1">
                    {sareeSubcategories.map((item) => (
                      <Link
                        key={item.label}
                        to={item.path}
                        onClick={handleDismiss}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-light text-[#544B44] transition-colors hover:bg-white hover:text-[#8E3D51]"
                      >
                        <span>{item.label}</span>
                        <FiArrowUpRight size={13} className="text-[#8C7A6B]" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Other Categories */}
              {otherCategories.map((category) => (
                <Link
                  key={category.label}
                  to={category.path}
                  onClick={handleDismiss}
                  className="group flex items-center justify-between rounded-2xl px-4 py-3 font-serif text-lg font-light text-[#2A2421] transition-colors hover:bg-black/5 hover:text-[#8E3D51]"
                >
                  <span>{category.label}</span>
                  <FiArrowUpRight
                    size={15}
                    className="text-[#8C7A6B] opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </Link>
              ))}
            </nav>

            {/* Secondary Links */}
            <div className="mt-6 border-t border-black/[0.06] pt-5">
              <p className="mb-3 text-[9.5px] font-semibold uppercase tracking-[0.26em] text-[#8C7A6B]">
                The Atelier & Administration
              </p>

              <div className="flex flex-wrap gap-2">
                {secondaryLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.path}
                    onClick={handleDismiss}
                    className="rounded-xl border border-black/8 bg-white/70 px-3.5 py-1.5 text-xs font-medium tracking-wide text-[#5A5048] transition-colors hover:border-[#8E3D51]/30 hover:bg-white hover:text-[#8E3D51]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Banner */}
          <footer className="shrink-0 border-t border-black/[0.06] bg-[#FAF7F2] p-5">
            <div className="rounded-2xl border border-black/8 bg-white p-3.5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-serif text-sm font-normal text-[#2A2421]">
                    Heirloom Vault '26
                  </p>
                  <p className="mt-0.5 text-[10.5px] leading-4 text-[#6E6359]">
                    Certified pure Mulberry Silks & Zari.
                  </p>
                </div>

                <Link
                  to="/shop"
                  onClick={handleDismiss}
                  aria-label="Explore Vault"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8E3D51] text-white transition-transform active:scale-90"
                >
                  <FiArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </footer>
        </aside>
      </div>
    </>
  );
}

export default MobileMenu;