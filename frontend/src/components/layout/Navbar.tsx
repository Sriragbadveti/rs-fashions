import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { FiMenu, FiSearch, FiShoppingBag, FiX, FiArrowUpRight, FiUser } from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Store, Package, MapPin, LogOut, Sparkles, User as UserIcon, ChevronDown } from "lucide-react";

import { useCart } from "../../context/CartContext";
import { getUserSession, clearUserSession, USER_SESSION_EVENT, type UserSession } from "../../utils/userSession";

import CartDrawer from "../cart/CartDrawer";
import MobileMenu from "./MobileMenu";
import logo from "../../assets/logo/logo1.png";
import { ADMIN_SECRET_PATH } from "../../config/routes";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount } = useCart();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);

  const isOurStory = location.pathname === "/our-story";
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => getUserSession());
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownContentRef = useRef<HTMLDivElement>(null);

  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number | null; right: number | null }>({
    top: 0, left: null, right: null,
  });

  /* ---------------------------------------------------------
     SCROLL
  --------------------------------------------------------- */
  const { scrollY } = useScroll();
  const tickerHeight = useTransform(scrollY, [0, 45], [28, 0]);
  const tickerOpacity = useTransform(scrollY, [0, 30], [1, 0]);
  const navWidth = useTransform(scrollY, [0, 120], ["100%", "min(92%, 1240px)"]);
  const navMarginTop = useTransform(scrollY, [0, 120], [0, 10]);
  const navRadius = useTransform(scrollY, [0, 120], [0, 26]);

  useEffect(() => {
    return scrollY.onChange((latest) => {
      setIsScrolled(latest > 20);
    });
  }, [scrollY]);

  /* ---------------------------------------------------------
     USER SESSION
  --------------------------------------------------------- */
  useEffect(() => {
    const syncUser = () => setCurrentUser(getUserSession());
    window.addEventListener(USER_SESSION_EVENT, syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener(USER_SESSION_EVENT, syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  /* ---------------------------------------------------------
     DROPDOWN OUTSIDE CLICK
  --------------------------------------------------------- */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedInsideButton = dropdownRef.current && dropdownRef.current.contains(target);
      const clickedInsideDropdown = dropdownContentRef.current && dropdownContentRef.current.contains(target);

      if (!clickedInsideButton && !clickedInsideDropdown) {
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

  useEffect(() => {
    if (!isUserDropdownOpen) return;
    const handleScroll = () => setIsUserDropdownOpen(false);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isUserDropdownOpen]);

  const toggleUserDropdown = () => {
    if (!isUserDropdownOpen && userButtonRef.current) {
      const rect = userButtonRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;

      if (isMobile) {
        setDropdownPos({ top: 64, left: 12, right: 12 });
      } else {
        setDropdownPos({
          top: rect.bottom + 8,
          left: null,
          right: window.innerWidth - rect.right,
        });
      }
    }
    setIsUserDropdownOpen((prev) => !prev);
  };

  /* ---------------------------------------------------------
     OUR STORY NAV VISIBILITY
  --------------------------------------------------------- */
  useEffect(() => {
    if (!isOurStory) {
      setIsNavVisible(true);
      return;
    }
    const checkScrollPosition = () => setIsNavVisible(window.scrollY <= 60);
    checkScrollPosition();
    window.addEventListener("scroll", checkScrollPosition, { passive: true });
    return () => window.removeEventListener("scroll", checkScrollPosition);
  }, [isOurStory]);

  /* ---------------------------------------------------------
     ROUTE CHANGE & SCROLL LOCK
  --------------------------------------------------------- */
  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setCartOpen(false);
    setIsUserDropdownOpen(false);
    setSearchQuery("");
  }, [location.pathname]);

  useEffect(() => {
    const shouldLock = isMenuOpen || cartOpen;
    document.body.style.overflow = shouldLock ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen, cartOpen]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setIsSearchOpen(false);
    navigate(`/shop?search=${encodeURIComponent(query)}`);
  };

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

  const showHeader = !isOurStory || isNavVisible || isMenuOpen || isSearchOpen || cartOpen;

  const iconButton = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#2A2421] transition-colors duration-200 hover:bg-[#EFEAE2] active:scale-95 sm:h-10 sm:w-10";

  const clusterLeft = "flex shrink-0 items-center rounded-full border border-stone-200/80 bg-white/75 p-0.5 shadow-[0_2px_12px_rgba(42,36,33,0.04)] backdrop-blur-md gap-0.5 sm:gap-1 sm:p-1";

  const clusterRight = "flex shrink-0 items-center rounded-full border border-stone-200/80 bg-white/75 p-0.5 shadow-[0_2px_12px_rgba(42,36,33,0.04)] backdrop-blur-md gap-0.5 sm:gap-1.5 sm:p-1";

  const dividerSmall = "block h-3.5 w-px bg-stone-300 shrink-0";
  // Visible ONLY on large screens (sm:block)
  const dividerRight = "hidden h-4 w-px bg-stone-200 sm:block sm:mx-0.5";

  return (
    <>
      <motion.header
        initial={false}
        animate={showHeader ? { opacity: 1, y: 0 } : { opacity: 0, y: -24 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-x-0 top-0 z-50 select-none font-sans ${showHeader ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <motion.div style={{ height: tickerHeight, opacity: tickerOpacity }} className="relative overflow-hidden bg-[#2A2421] text-[#FDFBF7]">
          <div className="flex h-7 items-center overflow-hidden">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 45, repeat: Infinity, ease: "linear", repeatType: "loop" }}
              className="flex w-max items-center will-change-transform"
            >
              {[0, 1].map((copyIndex) => (
                <div key={copyIndex} className="flex shrink-0 items-center">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex shrink-0 items-center whitespace-nowrap">
                      <span className="px-4 text-[8px] font-medium uppercase tracking-[0.2em] text-stone-200 sm:px-8 sm:text-[9.5px] sm:tracking-[0.24em]">
                        Complimentary shipping on orders over ₹2,800
                      </span>
                      <span className="text-[7px] text-[#8E3D51]">✦</span>
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        <motion.nav
          layout
          style={{ width: navWidth, marginTop: navMarginTop, borderRadius: navRadius }}
          transition={{ layout: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
          className={`mx-auto overflow-hidden border transition-[background-color,border-color,box-shadow] duration-300 ease-out ${
            isScrolled || isOurStory
              ? "border-[#8E3D51]/15 bg-[#FAF7F2]/95 shadow-[0_12px_40px_rgba(42,36,33,0.12)] backdrop-blur-xl"
              : "border-stone-200/50 bg-[#FAF7F2]/80 backdrop-blur-md sm:border-transparent sm:bg-transparent sm:backdrop-blur-none"
          }`}
        >
          <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-0.5 px-2 py-2 sm:grid-cols-[1fr_auto_1fr] sm:gap-4 sm:px-4 sm:py-2.5 md:px-5 lg:px-7">
            
            <div className="flex min-w-0 justify-start">
              <div className={clusterLeft}>
                <button type="button" onClick={() => setIsMenuOpen(true)} aria-label="Open menu" aria-expanded={isMenuOpen} className={iconButton}>
                  <FiMenu size={17} strokeWidth={1.75} />
                </button>
                <span className={dividerSmall} />
                <button type="button" onClick={() => setIsSearchOpen((prev) => !prev)} aria-label="Search collection" aria-expanded={isSearchOpen} className={iconButton}>
                  {isSearchOpen ? <FiX size={16} strokeWidth={1.75} /> : <FiSearch size={16} strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            {/* CENTER LOGO */}
            <div className="flex min-w-0 items-center justify-center overflow-hidden px-0.5">
              <Link to="/" aria-label="RS Fashions Home" className="flex min-w-0 items-center justify-center gap-1.5 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] sm:gap-2.5">
                <img src={logo} alt="RS" className="h-7 w-auto max-w-6 shrink-0 object-contain sm:h-11 sm:max-w-12 md:h-12 md:max-w-14 lg:h-12.5 lg:max-w-16" />
                <span className="min-w-0 truncate font-serif font-medium leading-none tracking-tight text-black text-lg sm:text-2xl md:text-[26px] lg:text-[30px]">
                  Fashions
                </span>
              </Link>
            </div>

            <div className="flex min-w-0 justify-end">
              <div className={clusterRight}>
                <Link to="/shop" aria-label="Explore Saree Shop Collection" title="Shop Saree Collection" className={`${iconButton} ${location.pathname === "/shop" ? "bg-[#EFEAE2] text-[#8E3D51]" : ""}`}>
                  <Store size={16} strokeWidth={1.75} />
                </Link>

                <span className={dividerRight} />

                {currentUser ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      ref={userButtonRef}
                      type="button"
                      onClick={toggleUserDropdown}
                      aria-label="User Account Menu"
                      aria-expanded={isUserDropdownOpen}
                      className="flex h-8 shrink-0 items-center justify-center rounded-full transition hover:bg-[#EFEAE2] active:scale-95 sm:h-10 sm:gap-1.5 sm:px-2.5"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2A0E20] text-[10px] font-semibold text-yellow-400 sm:h-7 sm:w-7 sm:text-[11px]">
                        {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
                      </div>
                      {/* Name & Chevron only on large screens */}
                      <span className="hidden text-xs font-medium text-[#2A2421] sm:inline truncate max-w-22.5">
                        {currentUser.name?.split(" ")[0]}
                      </span>
                      <ChevronDown size={12} className={`hidden text-stone-500 transition-transform duration-200 sm:inline ${isUserDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isUserDropdownOpen &&
                      createPortal(
                        <AnimatePresence>
                          <motion.div
                            ref={dropdownContentRef}
                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.96 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            style={{
                              position: "fixed",
                              top: dropdownPos.top,
                              left: dropdownPos.left ?? undefined,
                              right: dropdownPos.right ?? undefined,
                            }}
                            className="z-50 max-h-[calc(100vh-80px)] w-auto max-w-sm overflow-y-auto rounded-2xl border border-stone-200 bg-white font-sans text-stone-800 shadow-xl sm:w-72"
                          >
                            <div className="bg-linear-to-br from-[#2A0E20] to-[#3E1630] p-4 text-white">
                              <h4 className="truncate text-sm font-semibold tracking-wider">{currentUser.name}</h4>
                              <p className="mt-0.5 truncate font-mono text-[11px] text-stone-300">{currentUser.phone}</p>
                            </div>

                            <div className="space-y-0.5 p-2 text-xs">
                              <Link to="/account?tab=orders" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-stone-700 transition-colors hover:bg-stone-100">
                                <Package size={15} className="text-[#8E3D51]" />
                                <span className="font-medium">My Orders</span>
                              </Link>

                              <Link to="/account?tab=addresses" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-stone-700 transition-colors hover:bg-stone-100">
                                <MapPin size={15} className="text-[#8E3D51]" />
                                <span className="font-medium">Saved Addresses</span>
                              </Link>

                              <Link to="/account?tab=profile" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-stone-700 transition-colors hover:bg-stone-100">
                                <UserIcon size={15} className="text-[#8E3D51]" />
                                <span className="font-medium">Profile Details</span>
                              </Link>

                              {Boolean(currentUser.role === "admin" && typeof window !== "undefined" && localStorage.getItem("rs_admin_session")) && (
                                <>
                                  <div className="my-1 border-t border-stone-100" />
                                  <Link to={ADMIN_SECRET_PATH} onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-2.5 rounded-xl bg-amber-50 px-3 py-2 font-semibold text-amber-950 transition-colors hover:bg-amber-100">
                                    <Sparkles size={15} className="text-amber-700" />
                                    <span>Admin Dashboard</span>
                                  </Link>
                                </>
                              )}
                            </div>

                            <div className="border-t border-stone-100 bg-stone-50 p-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsUserDropdownOpen(false);
                                  clearUserSession();
                                  navigate("/shop");
                                }}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50"
                              >
                                <span>Sign Out</span>
                                <LogOut size={14} />
                              </button>
                            </div>
                          </motion.div>
                        </AnimatePresence>,
                        document.body
                      )}
                  </div>
                ) : (
                  <Link to="/login" aria-label="User Login" className="flex h-8 shrink-0 items-center justify-center gap-0.5 rounded-full px-1.5 text-[#2A2421] transition hover:bg-[#EFEAE2] active:scale-95 sm:h-10 sm:gap-1.5 sm:px-3">
                    <FiUser size={16} strokeWidth={1.75} />
                    <span className="hidden text-xs font-medium sm:inline">Sign In</span>
                  </Link>
                )}

                <span className={dividerRight} />

                <button type="button" onClick={() => setCartOpen(true)} aria-label="Open shopping cart" aria-expanded={cartOpen} className={`${iconButton} relative`}>
                  <FiShoppingBag size={16} strokeWidth={1.75} />
                  <AnimatePresence>
                    {itemCount > 0 && (
                      <motion.span
                        key={itemCount}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#8E3D51] px-1 text-[7.5px] font-bold text-white shadow-sm"
                      >
                        {itemCount > 9 ? "9+" : itemCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`overflow-hidden border-t border-[#8E3D51]/10 bg-[#FAF7F2]/98 backdrop-blur-md ${isScrolled ? "rounded-b-3xl" : ""}`}
              >
                <div className="mx-auto w-full max-w-2xl px-4 py-3 sm:px-6 sm:py-5">
                  <form onSubmit={handleSearch}>
                    <div className="flex items-center gap-2.5 border-b border-[#8E3D51]/20 pb-2">
                      <FiSearch size={16} className="shrink-0 text-stone-500" />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        placeholder="Search SiCo Gadwal sarees..."
                        className="min-w-0 w-full bg-transparent text-xs text-[#2C2420] outline-none placeholder-stone-400 sm:text-sm"
                      />
                      {searchQuery && (
                        <button type="button" onClick={() => setSearchQuery("")} className="shrink-0 text-stone-400 hover:text-stone-700">
                          <FiX size={15} />
                        </button>
                      )}
                      <button type="submit" className="flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#8E3D51]">
                        <span>Search</span>
                        <FiArrowUpRight size={12} />
                      </button>
                    </div>

                    <div className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                      <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wider text-stone-400">Trending:</span>
                      {["Vintage Checks", "Gatti Borders", "Ma Inti Bangaram", "Big Kanchi"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSearchQuery(tag)}
                          className="shrink-0 rounded-full border border-stone-200 bg-white/70 px-2.5 py-0.5 text-[10px] font-medium text-stone-700 transition-colors hover:border-[#8E3D51] hover:text-[#8E3D51]"
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
        </motion.nav>
      </motion.header>

      <AnimatePresence>{isMenuOpen && <MobileMenu onClose={() => setIsMenuOpen(false)} />}</AnimatePresence>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

export default Navbar;