import React, { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiMenu,
  FiSearch,
  FiShoppingBag,
  FiX,
  FiArrowUpRight,
  FiUser,
} from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Store,
  Package,
  MapPin,
  LogOut,
  ChevronDown,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import {
  getUserSession,
  clearUserSession,
  USER_SESSION_EVENT,
  type UserSession,
} from "../../utils/userSession";

import CartDrawer from "../cart/CartDrawer";
import MobileMenu from "./MobileMenu";
import logo from "../../assets/logo/logo1.png";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount } = useCart();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const isOurStory = location.pathname === "/our-story";
  const [isNavVisible, setIsNavVisible] = useState(true);

  /* User Authentication & Session State */
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() =>
    getUserSession()
  );
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncUser = () => {
      setCurrentUser(getUserSession());
    };
    window.addEventListener(USER_SESSION_EVENT, syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener(USER_SESSION_EVENT, syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  /* Close user dropdown on outside click or escape */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsUserDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  /* Scroll detection */
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Our Story page scroll fade */
  useEffect(() => {
    if (!isOurStory) {
      setIsNavVisible(true);
      return;
    }

    const checkScrollPosition = () => {
      if (window.scrollY > 60) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }
    };

    checkScrollPosition();
    window.addEventListener("scroll", checkScrollPosition, { passive: true });
    return () => window.removeEventListener("scroll", checkScrollPosition);
  }, [isOurStory]);

  /* Close overlays on route change */
  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setCartOpen(false);
    setIsUserDropdownOpen(false);
    setSearchQuery("");
  }, [location.pathname]);

  /* Prevent background scrolling */
  useEffect(() => {
    const shouldLock = isMenuOpen || cartOpen;
    document.body.style.overflow = shouldLock ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen, cartOpen]);

  /* Search submission */
  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearchOpen(false);
    navigate(`/shop?search=${encodeURIComponent(query)}`);
  };

  /* Keyboard shortcut (Cmd/Ctrl + K and Escape) */
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
      }
      if (event.key === "Escape") {
        setIsSearchOpen(false);
        setIsMenuOpen(false);
        setCartOpen(false);
        setIsUserDropdownOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, []);

  const showHeader =
    !isOurStory || isNavVisible || isMenuOpen || isSearchOpen || cartOpen;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 select-none font-sans transition-all duration-500 ease-in-out ${showHeader
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-full pointer-events-none"
          }`}
      >
        {/* ===================================================
            TOP TICKER BANNER
        ==================================================== */}
        <div className="relative overflow-hidden bg-[#2A2421] text-[#FDFBF7]">
          <div className="flex h-6 sm:h-7 items-center overflow-hidden">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                duration: 45,
                repeat: Infinity,
                ease: "linear",
                repeatType: "loop",
              }}
              className="flex w-max items-center will-change-transform"
            >
              {[0, 1].map((copyIndex) => (
                <div key={copyIndex} className="flex shrink-0 items-center">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex shrink-0 items-center whitespace-nowrap"
                    >
                      <span className="px-4 sm:px-8 text-[8.5px] sm:text-[9.5px] font-medium uppercase tracking-[0.2em] sm:tracking-[0.24em] text-stone-200">
                        Complimentary shipping on orders over ₹2,800
                      </span>
                      <span className="text-[7px] text-[#8E3D51]">✦</span>
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ===================================================
            MAIN NAVIGATION BAR
        ==================================================== */}
        <nav
          className={`w-full transition-all duration-300 ease-out border-b ${isScrolled || isOurStory
              ? "bg-[#FAF7F2]/95 py-2.5 sm:py-3.5 border-[#8E3D51]/15 shadow-sm backdrop-blur-md"
              : "bg-[#FAF7F2]/80 sm:bg-transparent py-3 sm:py-5 border-stone-200/50 backdrop-blur-xs sm:backdrop-blur-none"
            }`}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
            {/* Left: Mobile Menu Trigger */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={isMenuOpen}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-[#2A2421] transition hover:bg-[#EFEAE2] active:scale-95"
              >
                <FiMenu size={20} strokeWidth={1.75} />
              </button>
            </div>

            {/* Center: Brand Logo */}
            {/* Center: Brand Logo */}
            <Link
              to="/"
              aria-label="RS Fashions Home"
              className="flex items-center justify-center gap-2 sm:gap-2 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <img
                src={logo}
                alt="RS"
                className="h-9 sm:h-10 w-auto object-contain shrink-0"
              />
              <span className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-[#2A2421] leading-none whitespace-nowrap">
                Fashions
              </span>
            </Link>

            {/* Right: Actions Hub */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search Toggle */}
              <button
                type="button"
                onClick={() => setIsSearchOpen((prev) => !prev)}
                aria-label="Search collection"
                aria-expanded={isSearchOpen}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-[#2A2421] transition hover:bg-[#EFEAE2] active:scale-95"
              >
                {isSearchOpen ? (
                  <FiX size={18} strokeWidth={1.75} />
                ) : (
                  <FiSearch size={18} strokeWidth={1.75} />
                )}
              </button>

              {/* Shop / Clothes Store Trigger */}
              <Link
                to="/shop"
                aria-label="Explore Saree Shop Collection"
                title="Shop Saree Collection"
                className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-[#2A2421] transition hover:bg-[#EFEAE2] active:scale-95 ${location.pathname === "/shop"
                    ? "bg-[#EFEAE2] text-[#8E3D51]"
                    : ""
                  }`}
              >
                <Store size={18} strokeWidth={1.75} />
              </Link>

              {/* User Account / Dropdown */}
              {currentUser ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                    aria-label="User Account Menu"
                    aria-expanded={isUserDropdownOpen}
                    className="flex items-center gap-1 sm:gap-1.5 h-9 sm:h-10 pl-1 pr-1.5 sm:px-2.5 rounded-full border border-[#8E3D51]/20 bg-white/80 transition hover:bg-[#FAF4ED] active:scale-95"
                  >
                    <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-[#2A0E20] text-[11px] font-semibold text-yellow-400 shadow-xs">
                      {currentUser.name
                        ? currentUser.name[0].toUpperCase()
                        : "U"}
                    </div>
                    <span className="hidden md:inline-block font-medium text-xs max-w-[80px] truncate text-stone-800">
                      {currentUser.name.split(" ")[0]}
                    </span>
                    <ChevronDown
                      size={13}
                      className={`text-stone-500 transition-transform duration-200 ${isUserDropdownOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isUserDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="fixed inset-x-3 top-16 mx-auto sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-72 max-w-sm rounded-2xl bg-white border border-stone-200 shadow-xl overflow-hidden z-50 text-stone-800 font-sans"
                      >
                        <div className="p-4 bg-gradient-to-br from-[#2A0E20] to-[#3E1630] text-white">
                          <h4 className="font-sans font-semibold text-sm tracking-wider truncate">
                            {currentUser.name}
                          </h4>
                          <p className="text-[11px] font-mono text-stone-300 mt-0.5 truncate">
                            {currentUser.phone}
                          </p>
                        </div>

                        <div className="p-2 space-y-0.5 text-xs">
                          <Link
                            to="/account?tab=orders"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-stone-100 text-stone-700 transition-colors"
                          >
                            <Package size={15} className="text-[#8E3D51]" />
                            <span className="font-medium">My Orders</span>
                          </Link>

                          <Link
                            to="/account?tab=addresses"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-stone-100 text-stone-700 transition-colors"
                          >
                            <MapPin size={15} className="text-[#8E3D51]" />
                            <span className="font-medium">Saved Addresses</span>
                          </Link>

                          <Link
                            to="/account?tab=profile"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-stone-100 text-stone-700 transition-colors"
                          >
                            <UserIcon size={15} className="text-[#8E3D51]" />
                            <span className="font-medium">Profile Details</span>
                          </Link>

                          {currentUser.role === "admin" && (
                            <>
                              <div className="my-1 border-t border-stone-100" />
                              <Link
                                to="/admin"
                                onClick={() => setIsUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-semibold transition-colors"
                              >
                                <Sparkles size={15} className="text-amber-700" />
                                <span>Admin Dashboard</span>
                              </Link>
                            </>
                          )}
                        </div>

                        <div className="p-2 border-t border-stone-100 bg-stone-50">
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserDropdownOpen(false);
                              clearUserSession();
                              navigate("/shop");
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <span>Sign Out</span>
                            <LogOut size={14} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  aria-label="User Login"
                  className="flex items-center gap-1 h-9 sm:h-10 px-2 sm:px-3 rounded-full text-[#2A2421] transition hover:bg-[#EFEAE2] active:scale-95 text-xs font-medium"
                >
                  <FiUser size={18} strokeWidth={1.75} />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )}

              {/* Shopping Bag Trigger */}
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                aria-label="Open shopping cart"
                aria-expanded={cartOpen}
                className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-[#2A2421] transition hover:bg-[#EFEAE2] active:scale-95"
              >
                <FiShoppingBag size={18} strokeWidth={1.75} />

                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      key={itemCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute right-0.5 top-0.5 sm:right-1 sm:top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8E3D51] px-1 text-[8px] font-bold text-white shadow-xs"
                    >
                      {itemCount > 9 ? "9+" : itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>

          {/* ===================================================
              SEARCH SLIDE-DOWN DRAWER
          ==================================================== */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden border-t border-[#8E3D51]/10 bg-[#FAF7F2]/98 backdrop-blur-md"
              >
                <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-5">
                  <form onSubmit={handleSearch}>
                    <div className="flex items-center gap-2.5 border-b border-[#8E3D51]/20 pb-2">
                      <FiSearch size={16} className="shrink-0 text-stone-500" />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        placeholder="Search SiCo Gadwal sarees..."
                        className="w-full bg-transparent text-xs sm:text-sm text-[#2C2420] placeholder-stone-400 outline-none"
                      />

                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="text-stone-400 hover:text-stone-700"
                        >
                          <FiX size={15} />
                        </button>
                      )}

                      <button
                        type="submit"
                        className="flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#8E3D51]"
                      >
                        <span>Search</span>
                        <FiArrowUpRight size={12} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-nowrap no-scrollbar">
                      <span className="text-[9.5px] font-semibold uppercase tracking-wider text-stone-400 shrink-0">
                        Trending:
                      </span>
                      {[
                        "Vintage Checks",
                        "Gatti Borders",
                        "Ma Inti Bangaram",
                        "Big Kanchi",
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSearchQuery(tag)}
                          className="shrink-0 rounded-full border border-stone-200 bg-white/70 px-2.5 py-0.5 text-[10px] font-medium text-stone-700 hover:border-[#8E3D51] hover:text-[#8E3D51] transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>

      {/* Overlays */}
      <AnimatePresence>
        {isMenuOpen && <MobileMenu onClose={() => setIsMenuOpen(false)} />}
      </AnimatePresence>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

export default Navbar;