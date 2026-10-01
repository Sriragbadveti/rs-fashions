import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const prevPathnameRef = useRef(pathname);

  // Force window to top instantly
  const scrollToTopInstant = useCallback(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // 1. Initial Page Load & Browser Scroll Restoration
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    scrollToTopInstant();

    const handleCurtainFinished = () => {
      scrollToTopInstant();
    };

    window.addEventListener("rs:curtain-finished", handleCurtainFinished);
    return () => window.removeEventListener("rs:curtain-finished", handleCurtainFinished);
  }, [scrollToTopInstant]);

  // 2. Route Changes: Only scroll to top when pathname actually changes (not on query params/tab switches)
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (!hash) {
        scrollToTopInstant();
      }
    }
  }, [pathname, hash, scrollToTopInstant]);

  // 3. Floating Scroll To Top Button visibility
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowScrollBtn(window.scrollY > 350);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToTopSmooth = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={handleScrollToTopSmooth}
      aria-label="Scroll to top of page"
      className={`fixed bottom-20 right-6 z-45 flex h-11 w-11 sm:bottom-6 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#8E3D51] text-[#FAF7F2] shadow-[0_8px_24px_rgba(42,36,33,0.3)] border border-white/20 transition-all duration-300 hover:bg-[#783144] hover:scale-110 active:scale-95 transform-gpu ${
        showScrollBtn
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-6 pointer-events-none"
      }`}
    >
      <ArrowUp size={20} className="stroke-[2.2]" />
    </button>
  );
}
