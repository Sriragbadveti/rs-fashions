import { useEffect, useState } from "react";
import {
  FiArrowUpRight,
  FiX,
  FiTrendingUp,
  FiTrendingDown,
  FiAward,
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

const categories = [
  "New Arrivals",
  "Sarees",
  "Silk Sarees",
  "Cotton Sarees",
  "Designer Sarees",
  "Festive Wear",
  "Party Wear",
  "Bridal Heritage",
  "Handloom Linen",
  "Best Sellers",
];

const secondaryLinks = [
  {
    label: "Our Story",
    path: "/our-story",
  },
  {
    label: "Exclusive Offers",
    path: "/offers",
  },
  {
    label: "Client Concierge",
    path: "/contact",
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
          overscroll-behavior: contain;
          scrollbar-width: thin;
          scrollbar-color: rgba(142, 61, 81, 0.28) transparent;
        }

        .becho-menu-scroll::-webkit-scrollbar {
          width: 3px;
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
          contain: layout paint;
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
          inset: 0;
          width: 100%;
          height: 24px;
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
          box-shadow: 0 2px 6px rgba(0,0,0,0.18);
          cursor: pointer;
        }

        .becho-range::-moz-range-thumb {
          pointer-events: auto;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #8E3D51;
          border: 2px solid #FFFFFF;
          box-shadow: 0 2px 6px rgba(0,0,0,0.18);
          cursor: pointer;
        }

        /* Desktop hover refinements */
        @media (hover: hover) and (pointer: fine) {
          .becho-menu-link:hover {
            color: #8E3D51;
          }
          .becho-menu-link:hover .becho-menu-arrow {
            opacity: 1;
            transform: translate3d(0, 0, 0) rotate(45deg);
          }
          .becho-menu-link:hover .becho-menu-label {
            transform: translate3d(6px, 0, 0);
          }
          .becho-menu-close:hover {
            background: rgba(0, 0, 0, 0.08);
          }
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

      <div className="fixed inset-0 z-[100] font-sans" style={{ touchAction: "none" }}>
        {/* Backdrop */}
        <div
          aria-hidden="true"
          onClick={handleDismiss}
          className="becho-menu-backdrop absolute inset-0 bg-black/45 md:bg-black/35 md:backdrop-blur-sm"
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
          aria-label="Mobile navigation"
          className="becho-menu-drawer relative flex h-full w-full max-w-[420px] flex-col overflow-hidden bg-[#FAF7F2]"
          style={{
            animation: isClosing
              ? "bechoDrawerOut 230ms cubic-bezier(0.32, 0, 0.67, 0) both"
              : "bechoDrawerIn 360ms cubic-bezier(0.16, 1, 0.3, 1) both",
            boxShadow: "18px 0 45px rgba(0,0,0,0.13)",
          }}
        >
          {/* Header */}
          <header className="flex shrink-0 items-center justify-between border-b border-black/[0.045] px-6 pb-3 pt-[max(1.4rem,env(safe-area-inset-top))]">
            <Link
              to="/"
              onClick={handleDismiss}
              className="font-serif text-2xl font-light tracking-[0.24em] text-[#2A2421]"
            >
              BECHO
            </Link>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close menu"
              className="becho-menu-close flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.045] text-[#2A2421] transition-colors duration-150 active:scale-90"
            >
              <FiX size={19} strokeWidth={1.5} />
            </button>
          </header>

          {/* Filter Panel */}
          <section className="shrink-0 border-b border-black/[0.05] bg-[#F3EFE9]/60 px-6 py-3.5">
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
                  overscrollBehaviorX: "contain",
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
                className="shrink-0 rounded-full bg-[#2A2421] px-3.5 py-1 text-[9.5px] font-semibold uppercase tracking-wider text-white transition-transform duration-150 active:scale-95"
              >
                Apply
              </button>
            </div>
          </section>

          {/* Scrollable Collections */}
          <div className="becho-menu-scroll min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <p className="mb-2 text-[9.5px] font-semibold uppercase tracking-[0.26em] text-[#8C7A6B]">
              Curated Collections
            </p>

            <nav className="space-y-0.5" aria-label="Collections">
              {categories.map((category) => (
                <Link
                  key={category}
                  to="/shop"
                  onClick={handleDismiss}
                  className="becho-menu-link group flex items-center justify-between py-2 font-serif text-[clamp(1.15rem,4vw,1.45rem)] font-light tracking-wide text-[#2A2421] transition-colors duration-150"
                >
                  <span className="becho-menu-label transition-transform duration-200 ease-out">
                    {category}
                  </span>

                  <span className="becho-menu-arrow flex h-6 w-6 items-center justify-center text-[#8E3D51] opacity-0 transition-all duration-200">
                    <FiArrowUpRight size={14} strokeWidth={1.5} />
                  </span>
                </Link>
              ))}
            </nav>

            {/* Secondary Links */}
            <div className="mt-5 border-t border-black/[0.05] pb-4 pt-4">
              <p className="mb-2 text-[9.5px] font-semibold uppercase tracking-[0.26em] text-[#8C7A6B]">
                The Atelier
              </p>

              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {secondaryLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.path}
                    onClick={handleDismiss}
                    className="text-xs tracking-wider text-[#5A5048] transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Promo */}
          <footer className="shrink-0 bg-gradient-to-t from-[#FAF7F2] via-[#FAF7F2] to-transparent px-6 pb-6 pt-1">
            <div className="rounded-2xl border border-black/10 bg-white p-3.5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-serif text-sm font-normal text-[#2A2421]">
                    Bridal Weaves '26
                  </p>
                  <p className="mt-0.5 text-[10.5px] leading-4 text-[#6E6359]">
                    Heirloom Kanjivarams handcrafted for brides.
                  </p>
                </div>

                <Link
                  to="/shop"
                  onClick={handleDismiss}
                  aria-label="Explore Bridal Weaves"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8E3D51] text-white transition-transform duration-150 active:scale-90"
                >
                  <FiArrowUpRight size={13} />
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