import { useEffect, useState } from "react";
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
import { Store } from "lucide-react";
import { useCart } from "../../context/CartContext";

import CartDrawer from "../cart/CartDrawer";
import MobileMenu from "./MobileMenu";
import logo from "../../assets/logo/logo1.png";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount } = useCart();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isOurStory = location.pathname === "/our-story";
  const [isNavVisible, setIsNavVisible] = useState(true);

  /* Scroll detection */
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Our Story page specific: Fades in at the top, fades out when scrolled down to page */
  useEffect(() => {
    if (!isOurStory) {
      setIsNavVisible(true);
      return;
    }

    const checkScrollPosition = () => {
      // At the top of the page: navbar fades in (visible)
      // When scrolled down to page: navbar fades out (hidden)
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
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, []);

  const showHeader = !isOurStory || isNavVisible || isMenuOpen || isSearchOpen || cartOpen;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-80 select-none font-sans transition-all duration-500 ease-in-out ${
          showHeader
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        {/* ===================================================
            TOP ANNOUNCEMENT BANNER
        ==================================================== */}
        <div className="relative overflow-hidden bg-[#2A2421] text-[#FDFBF7]">
          <div className="flex h-7 items-center overflow-hidden">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="flex min-w-max items-center will-change-transform"
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center whitespace-nowrap">
                  <span className="px-8 text-[9px] font-medium uppercase tracking-[0.26em]">
                    Complimentary shipping on orders over ₹1,999
                  </span>
                  <span className="text-[#8E3D51]/70 text-[8px]">✦</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ===================================================
            MAIN NAVIGATION BAR
        ==================================================== */}
        <nav
          className={`w-full transition-all duration-500 ease-out ${
            isScrolled || isOurStory
              ? "bg-[#FAF7F2]/95 py-3 shadow-[0_10px_30px_-10px_rgba(42,36,33,0.07)] backdrop-blur-md"
              : "bg-transparent py-4 sm:py-6"
          }`}
        >
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:px-12">
            {/* Left: Mobile Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
              className="group flex h-10 w-10 items-center justify-center rounded-full text-[#2A2421] transition-all duration-300 hover:bg-[#EFEAE2] active:scale-90"
            >
              <FiMenu
                size={21}
                strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:scale-105"
              />
            </button>

            {/* Center: Editorial Brand Logo */}
            <Link
              to="/"
              aria-label="RS Fashions Home"
              className="absolute left-1/2 -translate-x-1/2"
            >
              <img
                src={logo}
                alt="RS Fashions"
                className="h-10 w-auto object-contain transition-opacity duration-300 hover:opacity-75 sm:h-12"
              />
            </Link>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Search Toggle */}
              <button
                type="button"
                onClick={() => setIsSearchOpen((prev) => !prev)}
                aria-label="Search collection"
                aria-expanded={isSearchOpen}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#2A2421] transition-all duration-300 hover:bg-[#EFEAE2] active:scale-90"
              >
                {isSearchOpen ? (
                  <FiX size={19} strokeWidth={1.5} />
                ) : (
                  <FiSearch size={19} strokeWidth={1.5} />
                )}
              </button>

              {/* Shop Collection Link */}
              <Link
                to="/shop"
                aria-label="Explore Saree Shop Collection"
                title="Shop Saree Collection"
                className={`flex h-10 w-10 items-center justify-center rounded-full text-[#2A2421] transition-all duration-300 hover:bg-[#EFEAE2] active:scale-90 ${
                  location.pathname === "/shop" ? "bg-[#EFEAE2] text-[#8E3D51]" : ""
                }`}
              >
                <Store size={19} strokeWidth={1.5} />
              </Link>

              {/* Account / Login Link */}
              <Link
                to="/login"
                aria-label="User / Admin Login"
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#2A2421] transition-all duration-300 hover:bg-[#EFEAE2] active:scale-90"
              >
                <FiUser size={19} strokeWidth={1.5} />
              </Link>

              {/* Shopping Bag Trigger */}
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                aria-label="Open cart bag"
                aria-expanded={cartOpen}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#2A2421] transition-all duration-300 hover:bg-[#EFEAE2] active:scale-90"
              >
                <FiShoppingBag size={19} strokeWidth={1.5} />

                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      key={itemCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8E3D51] px-1 text-[8.5px] font-semibold text-white shadow-sm"
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
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden bg-[#FAF7F2]/98 backdrop-blur-xl"
              >
                <div className="mx-auto max-w-2xl px-6 pb-6 pt-2">
                  <form onSubmit={handleSearch}>
                    <div className="flex items-center gap-3 border-b border-[#D8D0C5] pb-2.5">
                      <FiSearch size={17} className="shrink-0 text-[#8C7A6B]" />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        placeholder="Search SiCo Gadwal sarees..."
                        className="w-full bg-transparent text-sm tracking-wide text-[#2A2421] placeholder-[#A89C8F] outline-none"
                      />

                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="text-[#8C7A6B] hover:text-[#2A2421]"
                        >
                          <FiX size={16} />
                        </button>
                      )}

                      <button
                        type="submit"
                        className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-[#8E3D51] transition-colors hover:text-[#682436]"
                      >
                        Search
                        <FiArrowUpRight size={13} />
                      </button>
                    </div>

                    <div className="mt-3.5 flex items-center gap-2">
                      <span className="text-[9px] uppercase tracking-widest text-[#8C7A6B]">
                        Trending:
                      </span>
                      {["Vintage Checks", "Gatti Borders", "Ma Inti Bangaram", "Big Kanchi"].map(
                        (tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setSearchQuery(tag)}
                            className="rounded-full bg-[#EFEAE2] px-2.5 py-1 text-[10px] text-[#4A4039] transition-all hover:bg-[#8E3D51] hover:text-white"
                          >
                            {tag}
                          </button>
                        )
                      )}
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>

      {/* =====================================================
          OVERLAYS: MOBILE MENU & CART
      ====================================================== */}
      <AnimatePresence>
        {isMenuOpen && (
          <MobileMenu onClose={() => setIsMenuOpen(false)} />
        )}
      </AnimatePresence>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

export default Navbar;
