import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiShield, FiX, FiCheck, FiSettings, FiExternalLink } from "react-icons/fi";

const COOKIE_STORAGE_KEY = "rs_fashions_cookie_consent";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: true,
    marketing: true,
    timestamp: new Date().toISOString(),
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!stored) {
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    savePreferences(allAccepted);
  };

  const handleDeclineOptional = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    savePreferences(necessaryOnly);
  };

  const handleSavePreferences = () => {
    savePreferences({
      ...preferences,
      necessary: true,
      timestamp: new Date().toISOString(),
    });
  };

  const savePreferences = (prefs: CookiePreferences) => {
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
    setIsVisible(false);
    setShowPreferences(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-4 left-4 right-4 z-90 mx-auto max-w-2xl sm:bottom-6 sm:left-6 sm:right-auto font-sans select-none"
      >
        <div className="relative overflow-hidden rounded-2xl border border-[#D4A373]/40 bg-[#FAF7F2]/98 p-5 shadow-[0_12px_40px_-10px_rgba(42,36,33,0.18)] backdrop-blur-xl sm:p-6">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-[#8E3D51] to-transparent opacity-60" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8E3D51]/10 text-[#8E3D51]">
                <FiShield size={15} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8E3D51]">
                RS Fashions Privacy &amp; Cookies
              </span>
            </div>

            <button
              type="button"
              onClick={handleDeclineOptional}
              className="text-[#8C7A6B] transition-colors hover:text-[#2A2421]"
              aria-label="Dismiss cookie notice"
            >
              <FiX size={16} />
            </button>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-[#544B44]">
          We use cookies to save your unique styling choices, hold onto the sarees in your shopping bag, and help us improve your experience within our digital space.
          </p>

          {showPreferences && (
            <div className="mt-4 space-y-3 rounded-xl border border-black/6 bg-white/70 p-3.5 text-xs text-[#2A2421]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#2A2421]">Essential &amp; Bag State</p>
                  <p className="text-[10px] text-[#8C7A6B]">Necessary for bag checkout and secure sessions.</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E3D51]">Required</span>
              </div>

              <div className="flex items-center justify-between border-t border-black/6 pt-2.5">
                <div>
                  <p className="font-semibold text-[#2A2421]">Analytics</p>
                  <p className="text-[10px] text-[#8C7A6B]">Helps us enhance collection discovery &amp; speed.</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences((p) => ({ ...p, analytics: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-[#8E3D51] accent-[#8E3D51]"
                />
              </div>

              <div className="flex items-center justify-between border-t border-black/6 pt-2.5">
                <div>
                  <p className="font-semibold text-[#2A2421]">Personalized Drapes &amp; Offers</p>
                  <p className="text-[10px] text-[#8C7A6B]">Tailored festival privileges and weave updates.</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences((p) => ({ ...p, marketing: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-[#8E3D51] accent-[#8E3D51]"
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-black/6 pt-3.5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPreferences((prev) => !prev)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8C7A6B] transition-colors hover:text-[#2A2421]"
              >
                <FiSettings size={12} />
                <span>{showPreferences ? "Hide Settings" : "Customize"}</span>
              </button>

              <Link
                to="/privacy-policy"
                className="flex items-center gap-1 text-[11px] font-medium text-[#8C7A6B] hover:text-[#8E3D51] transition-colors underline"
              >
                <span>Cookie Policy</span>
                <FiExternalLink size={10} />
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeclineOptional}
                className="rounded-full border border-black/15 bg-white px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#4A4039] transition-all hover:bg-[#EFEAE2]"
              >
                Necessary Only
              </button>

              <button
                type="button"
                onClick={showPreferences ? handleSavePreferences : handleAcceptAll}
                className="flex items-center gap-1.5 rounded-full bg-[#8E3D51] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-[#722F40] active:scale-95"
              >
                <FiCheck size={13} />
                <span>{showPreferences ? "Save Preferences" : "Accept All"}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
