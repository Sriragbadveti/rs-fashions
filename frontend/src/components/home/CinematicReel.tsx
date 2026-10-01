import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowUpRight,
  Eye,
} from "lucide-react";
import { StoreService } from "../../services/supabase";

// Guaranteed verified local high-resolution saree assets
import sicoGreenKuttu from "../../assets/images/Home.jpg";
import roseKanchiZari from "../../assets/images/Home1.jpg";
import tealRoyalChecks from "../../assets/images/Home_laptop_1.png";
import pitLoomCrimson from "../../assets/images/home_banner.jpeg";

interface ReelItem {
  id: string;
  name: string;
  category: string;
  material: string;
  borderColor?: string;
  image: string;
  link: string;
  badge?: string;
}

function humanizeText(text?: string): string {
  if (!text) return "";
  const cleaned = text
    .replace(/[_-]+/g, " ")
    .replace(/\b\d+\s*inch\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const isAuthenticSareeImage = (url?: string) => {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  if (
    lower.includes("bill") ||
    lower.includes("screen") ||
    lower.includes("monitor") ||
    lower.includes("test")
  ) {
    return false;
  }
  return true;
};

const GUARANTEED_EDITORIAL_SAREES: ReelItem[] = [
  {
    id: "sico-green-kuttu",
    name: "Kanchi Big Border",
    category: "SiCo Gadwal Sarees",
    material: "Pure Silk & Cotton",
    image: sicoGreenKuttu,
    link: "/shop?search=Kuttu+Borders",
  },
  {
    id: "rose-kanchi-zari",
    name: "Equal Border",
    category: "SiCo Gadwal Sarees",
    material: "Pure Silk & Cotton",
    image: roseKanchiZari,
    link: "/shop?search=Big+Kanchi",
  },
  {
    id: "teal-royal-checks",
    name: "Vintage Checks",
    category: "SiCo Gadwal Sarees",
    material: "Pure Silk & Cotton",
    image: tealRoyalChecks,
    link: "/shop?search=Vintage+Checks",
  },
  {
    id: "pit-loom-crimson",
    name: "Maa Inti Bangaram",
    category: "SiCo Gadwal Sarees",
    material: "Pure Silk & Cotton",
    image: pitLoomCrimson,
    link: "/shop?search=Ma+Inti+Bangaram",
  },
  {
    id: "mustard-gatti-gadwal",
    name: "Gap Border",
    category: "SiCo Gadwal Sarees",
    material: "Pure Silk & Cotton",
    image: sicoGreenKuttu,
    link: "/shop?search=Gatti+Borders",
  },
];

const LOCAL_FALLBACK_IMAGES = [
  sicoGreenKuttu,
  roseKanchiZari,
  tealRoyalChecks,
  pitLoomCrimson,
];

export default function CinematicReel(): React.JSX.Element {
  const [isPausedRow2, setIsPausedRow2] = useState(false);
  const [liveProducts, setLiveProducts] = useState<ReelItem[]>([]);

  // Fetch live products from backend/Supabase; gracefully combine with guaranteed sarees
  useEffect(() => {
    let isMounted = true;
    async function loadBackendProducts() {
      try {
        const list = await StoreService.getProducts();
        if (isMounted && Array.isArray(list) && list.length > 0) {
          const formatted = list
            .filter((p) => p && p.id)
            .map((p, idx) => {
              const rawImg: string =
                Array.isArray(p.images) && typeof p.images[0] === "string" ? p.images[0] : "";
              const safeImg: string =
                rawImg && isAuthenticSareeImage(rawImg)
                  ? rawImg
                  : LOCAL_FALLBACK_IMAGES[idx % LOCAL_FALLBACK_IMAGES.length];
              return {
                id: p.id,
                name: humanizeText(p.name) || "Artisan Handloom SiCo",
                category: humanizeText(p.category) || "SiCo Gadwal Sarees",
                material: p.material ? humanizeText(p.material) : "Pure Silk & Cotton",
                borderColor: p.borderColor ? humanizeText(p.borderColor) : "Authentic Temple Border",
                image: safeImg,
                link: `/product/${p.id}`,
                badge: p.featured ? "Featured Drape" : "Artisan Handloom",
              };
            });
          if (formatted.length > 0) {
            setLiveProducts(formatted);
          }
        }
      } catch (err) {
        console.warn("Cinematic marquee live product sync note:", err);
      }
    }
    loadBackendProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Merge live database sarees with our guaranteed editorial sarees
  const displayItems = useMemo(() => {
    if (liveProducts.length >= 4) {
      return [...liveProducts, ...GUARANTEED_EDITORIAL_SAREES];
    }
    return GUARANTEED_EDITORIAL_SAREES;
  }, [liveProducts]);

  // Triple items for mathematically seamless infinite continuous CSS marquee
  const rowTwoTripled = useMemo(() => {
    // Reverse order for dynamic visual contrast with ingress row
    const reversed = [...displayItems].reverse();
    return [...reversed, ...reversed, ...reversed];
  }, [displayItems]);

  return (
    <section className="relative w-full overflow-hidden bg-linear-to-b from-[#F7EBEC] via-[#F4E7E4] to-[#E9C9C3]/45 pt-12 sm:pt-16 pb-6 sm:pb-8 font-sans select-none border-t-0">
      {/* =========================================================
          HIGH-EFFICIENCY MATHEMATICAL CONTINUOUS MARQUEE CSS
          (Calculated at -100%/3 for 0% to 100% glitchless infinite loop)
      ========================================================== */}
      <style>{`
        @keyframes cinematicStreamLeft {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(calc(-100% / 3), 0, 0);
          }
        }

        @keyframes cinematicStreamRight {
          0% {
            transform: translate3d(calc(-100% / 3), 0, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }

        .cinematic-track-left {
          display: flex;
          width: max-content;
          animation: cinematicStreamLeft 36s linear infinite;
          will-change: transform;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
        }

        .cinematic-track-right {
          display: flex;
          width: max-content;
          animation: cinematicStreamRight 42s linear infinite;
          will-change: transform;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
        }

        .cinematic-track-left.paused,
        .cinematic-track-right.paused {
          animation-play-state: paused;
        }

        .mask-linear-fade {
          -webkit-mask-image: linear-gradient(to right, transparent, black 4%, black 96%, transparent);
          mask-image: linear-gradient(to right, transparent, black 4%, black 96%, transparent);
          contain: paint;
        }

        @media (max-width: 640px) {
          .cinematic-track-left {
            animation-duration: 26s;
          }
          .cinematic-track-right {
            animation-duration: 30s;
          }
        }
      `}</style>

      {/* Ambient background glow accents */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-linear-to-br from-[#CBC0D3]/45 to-[#E9C9C3]/35 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 right-10 h-96 w-96 rounded-full bg-linear-to-tl from-[#D4A373]/25 to-transparent blur-3xl" />

      {/* Section Header */}
      <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-end gap-3 pb-3 border-b border-[#CBC0D3]/50">
          <Link
            to="/shop"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#8E3D51] hover:text-[#783144] group shrink-0 transition-colors"
          >
            <span>Explore Collection</span>
            <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Top Continuous Marquee Row (Right-moving full-bleed image cards) */}
      <div
        className="relative w-full overflow-hidden py-2 mask-linear-fade"
        onMouseLeave={() => setIsPausedRow2(false)}
        onTouchStart={() => setIsPausedRow2(true)}
        onTouchEnd={() => setIsPausedRow2(false)}
      >
        <div className={`cinematic-track-right gap-4 sm:gap-6 px-4 ${isPausedRow2 ? "paused" : ""}`}>
          {rowTwoTripled.map((item, idx) => (
            <div
              key={`row2-${item.id}-${idx}`}
              className="w-60 sm:w-72 md:w-80 shrink-0"
            >
              <Link
                to={item.link}
                className="group relative flex aspect-3/4.5 w-full flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl shadow-[0_12px_32px_rgba(42,36,33,0.12)] transition-all duration-300 hover:shadow-[0_22px_48px_rgba(142,61,81,0.28)] hover:-translate-y-2 border border-white/30 hover:border-[#8E3D51] transform-gpu"
              >
                {/* Full-Bleed Image: The Image itself is the card */}
                <img
                  src={item.image}
                  alt={humanizeText(item.name)}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  onError={(e) => {
                    const fallback = LOCAL_FALLBACK_IMAGES[(idx + 1) % LOCAL_FALLBACK_IMAGES.length];
                    if (e.currentTarget.src !== fallback) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                  className="absolute inset-0 h-full w-full object-cover object-center saturate-[1.05] contrast-[1.02] transition-transform duration-500 ease-out group-hover:scale-108 will-change-transform"
                />

                {/* Scrim Gradient for Crisp Contrast */}
                <div className="absolute inset-0 bg-linear-to-t from-[#2A2421]/95 via-[#2A2421]/30 to-black/10 transition-opacity duration-300 group-hover:from-[#2A2421]/98" />

                {/* Top Floating Badge Row */}
                <div className="relative z-10 p-3.5 sm:p-4 flex items-start justify-end">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-sm transition-all duration-300 group-hover:bg-[#8E3D51] group-hover:scale-110 group-hover:rotate-45">
                    <ArrowUpRight size={14} />
                  </span>
                </div>

                {/* Bottom Details Floating Directly Over Image */}
                <div className="relative z-10 p-3.5 sm:p-4 flex flex-col justify-end">
                
                  <h3 className="font-serif text-lg sm:text-xl font-normal text-white leading-snug drop-shadow-sm mt-0.5 group-hover:text-amber-100 transition-colors truncate">
                    {humanizeText(item.name)}
                  </h3>

                  <div className="mt-3 pt-2 border-t border-white/15 flex items-center justify-between text-white/90">
                      <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-amber-200/90">
                    {humanizeText(item.category)}
                  </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-200 group-hover:translate-x-0.5 transition-transform">
                      <span>View Saree</span>
                      <ArrowUpRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Feature: Spotlight Ingress Runway (Left Fixed Card + Right Moving Marquee) */}
      <SpotlightIngressStage items={displayItems} />
    </section>
  );
}

/* =====================================================================
   SPOTLIGHT INGRESS RUNWAY: FIXED LEFT CARD + RIGHT-TO-LEFT STREAM
   (Full-Bleed Image Cards with Deep Silk Atelier Atmosphere)
===================================================================== */
function SpotlightIngressStage({ items }: { items: ReelItem[] }): React.JSX.Element {
  const [activeCard, setActiveCard] = useState<ReelItem>(items[0] || GUARANTEED_EDITORIAL_SAREES[0]);
  const [isPaused, setIsPaused] = useState(false);
  const pauseAutoRotateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);

  // Triple items for continuous seamless infinite CSS marquee
  const tripledItems = useMemo(() => {
    return [...items, ...items, ...items];
  }, [items]);

  // Keep activeCard synchronized if items change and current item is not present
  useEffect(() => {
    if (items.length > 0 && !items.some((it) => it.id === activeCard.id)) {
      setActiveCard(items[0]);
    }
  }, [items, activeCard.id]);

  // Auto-cycle through items every 5.5s unless user is hovering or just clicked
  useEffect(() => {
    if (isPaused || items.length === 0 || userInteracted) return;
    const interval = setInterval(() => {
      setActiveCard((prev: ReelItem) => {
        const idx = items.findIndex((it) => it.id === prev.id);
        const nextIdx = (idx + 1) % items.length;
        return items[nextIdx];
      });
    }, 5500);

    return () => clearInterval(interval);
  }, [isPaused, items, userInteracted]);

  const handleCardClick = (item: ReelItem) => {
    setActiveCard(item);
    setUserInteracted(true);
    if (pauseAutoRotateTimer.current) {
      clearTimeout(pauseAutoRotateTimer.current);
    }
    // Pause auto-rotation for 12 seconds after click so user can inspect details uninterrupted
    pauseAutoRotateTimer.current = setTimeout(() => {
      setUserInteracted(false);
    }, 12000);
  };

  useEffect(() => {
    return () => {
      if (pauseAutoRotateTimer.current) {
        clearTimeout(pauseAutoRotateTimer.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden mt-8 sm:mt-12 pt-3 sm:pt-4 pb-2 sm:pb-3">
      {/* Runway Layout: Left Fixed Spotlight Card + Right Moving Track */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto flex flex-col lg:flex-row items-stretch gap-5 lg:gap-7">
        {/* =========================================================
            LEFT FIXED SPOTLIGHT CARD (Permanent Brand Anchor)
            Full-Bleed: The Image Itself IS The Card
        ========================================================== */}
        <div className="group relative z-20 shrink-0 w-full sm:w-95 lg:w-102.5 xl:w-110 aspect-[3/4.4] sm:aspect-[3/4.2] rounded-3xl overflow-hidden ring-4 ring-[#8E3D51] flex flex-col justify-between">
          {/* Full-bleed high-res drape image */}
          <img
            key={activeCard.id}
            src={activeCard.image}
            alt={humanizeText(activeCard.name)}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center saturate-[1.05] contrast-[1.02] transition-transform duration-500 ease-out group-hover:scale-105 will-change-transform"
          />

          {/* Scrim Gradient for text clarity */}
          <div className="absolute inset-0 bg-linear-to-t from-[#2A2421]/95 via-[#2A2421]/25 to-black/15 transition-opacity duration-300" />

          {/* Top Chip / Status */}
          <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between gap-2">

          </div>

          {/* Bottom Info & Action Floating Over Image */}
          <div className="relative z-10 p-4 sm:p-5 flex flex-col justify-end">
            
            <h3 className="font-serif text-xl sm:text-2xl font-normal text-white truncate mt-0.5">
              {humanizeText(activeCard.name)}
            </h3>

            <div className="mt-3.5 pt-3 border-t border-white/20 flex items-center justify-between gap-3">
             <span className="text-[15px] font-semibold text-amber-200 uppercase tracking-wider truncate">
              {humanizeText(activeCard.category)}
            </span>
              <Link
                to={activeCard.link}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#8E3D51] hover:bg-[#783144] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] shadow-md shadow-black/30 border border-white/20"
              >
                <span>View Saree</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* =========================================================
            CENTER TO RIGHT: RIGHT-TO-LEFT INGRESS MARQUEE
            Full-Bleed: The Image Itself IS The Card
        ========================================================== */}
        <div
          className="relative z-10 flex-1 overflow-hidden min-w-0 w-full py-1 mask-linear-fade flex items-center"
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <div className={`cinematic-track-left gap-4 sm:gap-6 px-4 ${isPaused ? "paused" : ""}`}>
            {tripledItems.map((item, idx) => {
              const isCurrent = item.id === activeCard.id;
              return (
                <div
                  key={`ingress-${item.id}-${idx}`}
                  onClick={() => handleCardClick(item)}
                  className={`group relative flex aspect-[3/4.2] w-56 sm:w-64 md:w-70 shrink-0 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl transition-all duration-300 transform-gpu ${
                    isCurrent
                      ? "ring-4 ring-[#8E3D51] shadow-[0_16px_40px_rgba(243,198,143,0.3)] -translate-y-2 scale-[1.02]"
                      : "border border-white/25 shadow-[0_10px_28px_rgba(0,0,0,0.25)] hover:shadow-[0_18px_38px_rgba(0,0,0,0.35)] hover:-translate-y-1.5 hover:border-white/50"
                  }`}
                >
                  {/* Full-bleed image */}
                  <img
                    src={item.image}
                    alt={humanizeText(item.name)}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    onError={(e) => {
                      const fallback = LOCAL_FALLBACK_IMAGES[(idx + 1) % LOCAL_FALLBACK_IMAGES.length];
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                    className="absolute inset-0 h-full w-full object-cover object-center saturate-[1.05] contrast-[1.02] transition-transform duration-500 ease-out group-hover:scale-108 will-change-transform"
                  />

                  {/* Scrim Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-[#2A2421]/95 via-[#2A2421]/25 to-black/10 transition-opacity duration-300" />

                  {/* Top Floating Badge */}
                  <div className="relative z-10 p-3 sm:p-3.5 flex items-center justify-between">
                    
                  </div>

                  {/* Bottom Details Floating Over Image */}
                  <div className="relative z-10 p-3 sm:p-3.5 flex flex-col justify-end">
                    
                    <h4 className="font-serif text-base sm:text-lg font-normal text-white leading-snug truncate mt-0.5 group-hover:text-amber-100 transition-colors">
                      {humanizeText(item.name)}
                    </h4>
                    <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-amber-200/90">
                      {humanizeText(item.category)}
                    </span>
                      <span className="text-[11px] font-semibold text-amber-200 flex items-center gap-1">
                        <span>{isCurrent ? "Currently Active" : "Tap to Switch"}</span>
                        <ArrowUpRight size={11} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}