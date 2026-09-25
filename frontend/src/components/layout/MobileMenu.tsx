import { useEffect, useState } from "react";
import {
  FiArrowUpRight,
  FiX,
  FiTrendingUp,
  FiTrendingDown,
  FiChevronDown,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { Package, MapPin, LogOut, Sparkles, User } from "lucide-react";
import {
  getUserSession,
  clearUserSession,
  type UserSession,
} from "../../utils/userSession";
import logo from "../../assets/logo/logo1.png";
import { ADMIN_SECRET_PATH } from "../../config/routes";

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
];

const sareeSubcategories = [
  { label: "Vintage Checks", path: "/shop?search=Vintage+Checks" },
  { label: "Gatti borders", path: "/shop?search=Gatti+borders" },
  { label: "Ma inti Bangaram 3 inch borders", path: "/shop?search=Ma+inti+Bangaram" },
  { label: "Big Kanchi borders", path: "/shop?search=Big+Kanchi" },
  { label: "Equal Kanchi borders", path: "/shop?search=Equal+Kanchi" },
  { label: "Chakra border", path: "/shop?search=Chakra+border" },
  { label: "Gap borders", path: "/shop?search=Gap+borders" },
  { label: "Gap Border Checks", path: "/shop?search=Gap+checks" },
  { label: "Box Gadwal Checks", path: "/shop?search=Box+Gadwal+Checks" },
];

const secondaryLinks = [
  {
    label: "Shop",
    path: "/shop",
  },
  {
    label: "Our Story",
    path: "/our-story",
  },
];

const MIN_LIMIT = 999;
const MAX_LIMIT = 50000;
const STEP = 500;

function MobileMenu({ onClose }: MobileMenuProps) {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => getUserSession());
  const [minPrice, setMinPrice] = useState(1999);
  const [maxPrice, setMaxPrice] = useState(35000);
  const [activeSort, setActiveSort] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isSareeDropdownOpen, setIsSareeDropdownOpen] = useState(true);

  const handleDismiss = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 240);
  };

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isClosing]);

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
        .rsfasion-menu-scroll {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
          scrollbar-width: thin;
          scrollbar-color: rgba(142, 61, 81, 0.28) transparent;
        }

        .rsfasion-menu-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .rsfasion-menu-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .rsfasion-menu-scroll::-webkit-scrollbar-thumb {
          background: rgba(142, 61, 81, 0.28);
          border-radius: 999px;
        }

        .rsfasion-menu-drawer {
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          perspective: 1000px;
          will-change: transform;
        }

        .rsfasion-menu-backdrop {
          will-change: opacity;
          transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .rsfasion-range {
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

        .rsfasion-range::-webkit-slider-runnable-track {
          height: 4px;
          background: transparent;
          border: 0;
        }

        .rsfasion-range::-moz-range-track {
          height: 4px;
          background: transparent;
          border: 0;
        }

        .rsfasion-range::-webkit-slider-thumb {
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

        .rsfasion-range::-moz-range-thumb {
          pointer-events: auto;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #8E3D51;
          border: 2px solid #FFFFFF;
          box-shadow: 0 2px 6px rgba(0,0,0,0.22);
          cursor: pointer;
        }

        @keyframes rsfasionDrawerIn {
          from { transform: translate3d(-100%, 0, 0); }
          to { transform: translate3d(0, 0, 0); }
        }

        @keyframes rsfasionDrawerOut {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-100%, 0, 0); }
        }

        @keyframes rsfasionBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes rsfasionBackdropOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>

      <div className="fixed inset-0 z-100 font-sans">
        <div
          aria-hidden="true"
          onClick={handleDismiss}
          className="rsfasion-menu-backdrop absolute inset-0 bg-black/50 backdrop-blur-xs"
          style={{
            animation: isClosing
              ? "rsfasionBackdropOut 220ms ease-in both"
              : "rsfasionBackdropIn 260ms cubic-bezier(0.22, 1, 0.36, 1) both",
          }}
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          className="rsfasion-menu-drawer relative flex h-full w-full max-w-105 flex-col bg-[#FAF7F2] shadow-2xl"
          style={{
            animation: isClosing
              ? "rsfasionDrawerOut 230ms cubic-bezier(0.32, 0, 0.67, 0) both"
              : "rsfasionDrawerIn 360ms cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-black/6 px-6">
            <Link
              to="/"
              onClick={handleDismiss}
              className="inline-flex items-center gap-2.5"
            >
              <img src={logo} alt="RS Fashions" className="h-9 w-auto object-contain" />
              <span className="font-sans text-lg font-semibold mt-2.5 tracking-wide text-[#2A2421]">
                Fashions
              </span>
            </Link>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-[#2A2421] transition-transform active:scale-90"
            >
              <FiX size={18} strokeWidth={1.7} />
            </button>
          </header>

          {/* Filter / Price Panel */}
          <section className="shrink-0 border-b border-black/6 bg-[#F3EFE9]/70 px-6 py-4">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.24em] text-[#8C7A6B]">
                Price Range
              </span>

              <span className="whitespace-nowrap font-mono text-xs font-medium text-[#2A2421]">
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
                className="rsfasion-range z-20"
              />

              <input
                type="range"
                min={MIN_LIMIT}
                max={MAX_LIMIT}
                step={STEP}
                value={maxPrice}
                onChange={handleMaxChange}
                aria-label="Maximum price"
                className="rsfasion-range z-30"
              />
            </div>

            {/* Sort Options */}
            <div className="mt-3.5 flex items-center gap-2">
              <div
                className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-0.5"
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
                      className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[9.5px] font-medium tracking-wide transition-colors duration-150 active:scale-[0.97] ${
                        isActive
                          ? "bg-[#8E3D51] text-white"
                          : "border border-black/10 bg-white/80 text-[#544B44]"
                      }`}
                    >
                      <Icon size={11} className="shrink-0" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleApplyPrice}
                className="inline-flex h-6 shrink-0 items-center justify-center rounded-full bg-black px-4 text-[9.5px] font-serif uppercase tracking-widest text-white transition-all duration-150 hover:bg-[#8E3D51] active:scale-95"
              >
                Apply
              </button>
            </div>
          </section>

          {/* Scrollable Collections & Navigation Section */}
          <div className="rsfasion-menu-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {/* Section 1: Curated Collections */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8C7A6B]">
                  Collections
                </span>
              </div>

              {/* Saree Accordion Card */}
              <div
                className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                  isSareeDropdownOpen
                    ? "border-[#8E3D51]/30 bg-white shadow-md ring-1 ring-[#8E3D51]/10"
                    : "border-black/[0.07] bg-white/90 shadow-xs hover:border-black/15"
                }`}
              >
                {/* Accordion Toggle Header */}
                <button
                  type="button"
                  onClick={() => setIsSareeDropdownOpen(!isSareeDropdownOpen)}
                  className="group flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#8E3D51]/10 text-[#8E3D51] transition-transform duration-300 group-hover:scale-105">
                      <span className="font-serif text-sm font-semibold">G</span>
                    </div>
                    <div>
                      <h3 className="font-serif text-[15px] font-normal tracking-tight text-[#2A2421] transition-colors group-hover:text-[#8E3D51]">
                        SiCo Gadwal Sarees
                      </h3>
                      <p className="text-[10px] font-light tracking-wide text-[#8C7A6B]">
                        Interlocked Zari & Pure Silk Warp
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/3 text-[#8E3D51] transition-colors group-hover:bg-[#8E3D51]/10">
                      <FiChevronDown
                        size={14}
                        className={`transition-transform duration-300 ${
                          isSareeDropdownOpen ? "rotate-180 text-[#8E3D51]" : "text-stone-400"
                        }`}
                      />
                    </div>
                  </div>
                </button>

                {/* Accordion Content with CSS Grid Height Transition */}
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isSareeDropdownOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-1 border-t border-black/5 bg-[#FAF7F2]/75 p-2">
                      {sareeSubcategories.map((item, index) => (
                        <Link
                          key={item.label}
                          to={item.path}
                          onClick={handleDismiss}
                          style={{
                            transitionDelay: isSareeDropdownOpen ? `${index * 25}ms` : "0ms",
                          }}
                          className={`group flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-white hover:shadow-xs active:scale-[0.99] ${
                            isSareeDropdownOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#8E3D51]/30 transition-all duration-200 group-hover:w-3 group-hover:bg-[#8E3D51]" />
                            <span className="truncate text-xs font-medium text-[#4A3F35] transition-colors group-hover:text-[#8E3D51]">
                              {item.label}
                            </span>
                          </div>

                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-black/2 text-[#8C7A6B] opacity-40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-[#8E3D51]/10 group-hover:text-[#8E3D51] group-hover:opacity-100">
                            <FiArrowUpRight size={12} strokeWidth={2} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Explore */}
            <div className="mt-6 border-t border-black/6 pt-5">
              <p className="mb-3 text-[9.5px] font-semibold uppercase tracking-[0.26em] text-[#8C7A6B]">
                Explore
              </p>

              <div className="grid grid-cols-2 gap-2">
                {secondaryLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.path}
                    onClick={handleDismiss}
                    className="flex items-center justify-between rounded-xl border border-black/8 bg-white/80 px-3.5 py-2.5 text-xs font-medium text-[#5A5048] shadow-xs transition-colors hover:border-[#8E3D51]/30 hover:bg-white hover:text-[#8E3D51]"
                  >
                    <span>{link.label}</span>
                    <FiArrowUpRight size={13} className="text-[#8C7A6B]" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Section 3: Patron Account */}
              <div className="mt-6 border-t border-black/6 pt-5">
                <p className="mb-3 text-[9.5px] font-semibold uppercase tracking-[0.26em] text-[#8C7A6B]">
                  Patron Account
                </p>

                {currentUser ? (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-linear-to-r from-[#2A0E20] to-[#4A1637] text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-400 text-stone-900 font-serif font-bold text-sm flex items-center justify-center">
                          {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-serif font-bold text-xs truncate">{currentUser.name}</p>
                          <p className="text-[10px] text-stone-300 font-mono truncate">{currentUser.phone}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          clearUserSession();
                          handleDismiss();
                          navigate("/shop");
                        }}
                        className="p-1.5 text-stone-300 hover:text-red-300 transition-colors"
                        title="Sign Out"
                      >
                        <LogOut size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/account?tab=orders"
                        onClick={handleDismiss}
                        className="flex items-center justify-between rounded-xl border border-black/8 bg-white/80 p-3 text-xs font-medium text-[#5A5048]"
                      >
                        <span className="flex items-center gap-1.5">
                          <Package size={14} className="text-[#8E3D51]" />
                          My Orders
                        </span>
                        <FiArrowUpRight size={12} className="text-[#8C7A6B]" />
                      </Link>

                      <Link
                        to="/account?tab=addresses"
                        onClick={handleDismiss}
                        className="flex items-center justify-between rounded-xl border border-black/8 bg-white/80 p-3 text-xs font-medium text-[#5A5048]"
                      >
                        <span className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-[#8E3D51]" />
                          Addresses
                        </span>
                        <FiArrowUpRight size={12} className="text-[#8C7A6B]" />
                      </Link>
                    </div>

                    {Boolean(currentUser.role === "admin" && typeof window !== "undefined" && localStorage.getItem("rs_admin_session")) && (
                      <Link
                        to={ADMIN_SECRET_PATH}
                        onClick={handleDismiss}
                        className="flex items-center justify-between rounded-xl bg-amber-100/70 border border-amber-300 p-3 text-xs font-bold text-amber-950"
                      >
                        <span className="flex items-center gap-1.5">
                          <Sparkles size={14} className="text-amber-700" />
                          Admin Portal & POS
                        </span>
                        <FiArrowUpRight size={13} />
                      </Link>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={handleDismiss}
                    className="flex items-center justify-between rounded-xl bg-[#38152B] p-3.5 text-xs font-bold text-white shadow-sm"
                  >
                    <span className="flex items-center gap-2">
                      <User size={15} />
                      Sign In to RS Fashions
                    </span>
                    <FiArrowUpRight size={14} />
                  </Link>
                )}
              </div>
            </div>
        </aside>
      </div>
    </>
  );
}

export default MobileMenu;