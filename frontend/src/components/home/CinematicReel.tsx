import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowUpRight,
  Eye,
  ZoomIn,
  Layers,
  ShieldCheck,
  Feather,
  Activity,
  Radio,
  MousePointerClick,
} from "lucide-react";
import { StoreService } from "../../services/supabase";
import { type Product } from "../../data/products";

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
  borderColor: string;
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
  if (lower.includes("bill") || lower.includes("screen") || lower.includes("monitor") || lower.includes("test")) {
    return false;
  }
  return true;
};

const GUARANTEED_EDITORIAL_SAREES: ReelItem[] = [
  {
    id: "sico-green-kuttu",
    name: "Royal Emerald SiCo Gadwal",
    category: "SiCo Gadwal Sarees",
    material: "Pure Silk & Cotton",
    borderColor: "Royal Blue & Gold Kuttu Border",
    image: sicoGreenKuttu,
    link: "/shop?search=Kuttu+Borders",
  },
  {
    id: "rose-kanchi-zari",
    name: "Rose Pink & Peacock Border Drape",
    category: "SiCo Gadwal Sarees",
    material: "Pure Silk & Cotton",
    borderColor: "Peacock Kanchi Temple Border",
    image: roseKanchiZari,
    link: "/shop?search=Big+Kanchi",
  },
  {
    id: "teal-royal-checks",
    name: "Vintage Checks SiCo Drape",
    category: "SiCo Gadwal Sarees",
    material: "Pure Silk & Cotton",
    borderColor: "Silver & Purple Zari Border",
    image: sicoGreenKuttu,
    link: "/shop?search=Vintage+Checks",
  },
  {
    id: "pit-loom-crimson",
    name: "Maa Inti Bangaram Heirloom Saree",
    category: "SiCo Gadwal Sarees",
    material: "Pure Silk & Cotton",
    borderColor: "Gatti Kumbha Temple Border",
    image: pitLoomCrimson,
    link: "/shop?search=Ma+Inti+Bangaram",
  },
  {
    id: "mustard-gatti-gadwal",
    name: "Mustard Gold Gatti Border Drape",
    category: "SiCo Gadwal Sarees",
    material: "Pure Silk & Cotton",
    borderColor: "Gatti Zari Kumbha Border",
    image: sicoGreenKuttu,
    link: "/shop?search=Gatti+Borders",
  },
  {
    id: "ruby-temple-pattu",
    name: "Ruby Temple Weave Gadwal",
    category: "SiCo Gadwal Sarees",
    material: "Pure Silk & Cotton",
    borderColor: "Antique Kumbha Zari Border",
    image: roseKanchiZari,
    link: "/shop?category=SiCo+Gadwal+Sarees",
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
    // Reverse order for dynamic visual contrast
    const reversed = [...displayItems].reverse();
    return [...reversed, ...reversed, ...reversed];
  }, [displayItems]);

  return (
    <section className="relative w-full overflow-hidden bg-linear-to-b from-[#F7EBEC] via-[#F4E7E4] to-[#E9C9C3]/45 py-16 sm:py-24 font-sans select-none border-t border-[#CBC0D3]/45">
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
        }

        .cinematic-track-right {
          display: flex;
          width: max-content;
          animation: cinematicStreamRight 42s linear infinite;
          will-change: transform;
        }

        .cinematic-track-left.paused,
        .cinematic-track-right.paused {
          animation-play-state: paused;
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

      {/* Brand Color Ambient Luster Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-[#8E3D51]/7 blur-[120px]" />
        <div className="absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-[#E9C9C3]/40 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-112 w-md rounded-full bg-[#D4AF37]/8 blur-[130px]" />
      </div>

      {/* =========================================================
          SECTION HEADER (Directly on Page Canvas)
      ========================================================== */}
      <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 sm:pb-6 border-b border-[#CBC0D3]/50">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-[#2A2421]">
              Sarees in <span className="italic font-normal text-[#8E3D51]">Motion.</span>
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#756A60] font-light max-w-xl">
              Experience the fluid drape, authentic temple borders, and untarnished zari work of certified Gadwal handlooms.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================
          STREAM 2: MOVING RIGHT (Opposite Flow · Diverse Weaves)
      ========================================================== */}
      <div
        className="relative w-full overflow-hidden py-3 mt-2 sm:mt-4 mask-[linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]"
        onMouseEnter={() => setIsPausedRow2(true)}
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
                className="group relative flex aspect-[3/4.6] w-full flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl bg-linear-to-b from-white via-[#FCF9F9] to-[#F7EBEC] p-3.5 sm:p-4 shadow-[0_10px_30px_rgba(42,36,33,0.06)] transition-all duration-300 hover:shadow-[0_20px_42px_rgba(142,61,81,0.18)] hover:-translate-y-2 border border-[#CBC0D3]/80 hover:border-[#8E3D51]/70"
              >
                {/* Clean Framed Showcase for the Saree Image */}
                <div className="relative h-60 sm:h-68 w-full rounded-xl sm:rounded-2xl overflow-hidden bg-[#FAF6F5] border border-[#CBC0D3]/40 flex items-center justify-center p-3 shadow-inner group-hover:border-[#8E3D51]/25 transition-colors">
                  {/* Subtle ambient silk warmth */}
                  <img
                    src={item.image}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover object-center blur-lg opacity-20 scale-110 pointer-events-none"
                  />

                  {/* Foreground Full Unclipped Saree Image */}
                  <img
                    src={item.image}
                    alt={humanizeText(item.name)}
                    loading="lazy"
                    draggable={false}
                    onError={(e) => {
                      const fallback = LOCAL_FALLBACK_IMAGES[(idx + 1) % LOCAL_FALLBACK_IMAGES.length];
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                    className="relative z-0 max-h-full max-w-full object-contain object-center saturate-[1.05] contrast-[1.02] transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                  />

                  {/* Top Floating Badge Row */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-start justify-end gap-2">
                    <span className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-white/90 text-[#8E3D51] border border-[#CBC0D3]/70 shadow-2xs backdrop-blur-md transition-all duration-300 group-hover:bg-[#8E3D51] group-hover:text-white group-hover:rotate-45">
                      <ArrowUpRight size={13} />
                    </span>
                  </div>
                </div>

                {/* Bottom Saree Details (Humanized, No Price, User Comfortable) */}
                <div className="relative z-10 pt-3 flex flex-col justify-between flex-1">
                  <div>
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#8E3D51] font-bold block truncate">
                      {humanizeText(item.borderColor) || "Handloom Border"}
                    </span>

                    <h3 className="font-serif text-base sm:text-lg font-normal text-[#2A2421] leading-snug group-hover:text-[#8E3D51] transition-colors mt-0.5 truncate">
                      {humanizeText(item.name)}
                    </h3>

                    <p className="text-xs text-[#756A60] font-light mt-1 truncate">
                      {humanizeText(item.category)}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#CBC0D3]/60 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#8E3D51] group-hover:translate-x-0.5 transition-transform">
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

      {/* =========================================================
          SURREAL ANIMATED UI: THE LIVING ATELIER & HOLOGRAPHIC TILES
      ========================================================== */}
      <SurrealAtelierExperience />

      {/* =========================================================
          FEATURE 3: SPOTLIGHT INGRESS RUNWAY & BLURRED CANVAS
          (Right-to-Left moving cards passing behind Fixed Left Card + Click to Blur Canvas)
      ========================================================== */}
      <SpotlightIngressStage items={displayItems} />
    </section>
  );
}

/* =====================================================================
   SURREAL ATELIER: LIVING 3D DRAPE, MACRO LOUPE & HOLOGRAPHIC LOOMS
   (React Bits / Haute Couture Interactive Physics)
===================================================================== */

interface HolographicFeature {
  title: string;
  desc: string;
  image: string;
  tag: string;
  link: string;
  weaveType: string;
  origin: string;
  weight: string;
  zariPurity: string;
}

const SURREAL_FEATURES: HolographicFeature[] = [
  {
    title: "Box Gadwal Checks",
    desc: "",
    image: tealRoyalChecks,
    tag: "Signature Kuttu",
    link: "/shop?search=Box+Gadwal+Checks",
    weaveType: "Interlocked Pit-Loom",
    origin: "Gadwal Heritage Cluster",
    weight: "435g Featherlight",
    zariPurity: "Untarnished Gold Tested",
  },
  {
    title: "Pure Untarnished Zari",
    desc: "Woven with untarnished high-luster zari filaments that capture natural sunlight and ceremonial candlelight with royal brilliance.",
    image: roseKanchiZari,
    tag: "Zari Pallu",
    link: "/shop?search=Big+Kanchi+Border",
    weaveType: "High-Density Zari Weft",
    origin: "Temple Kanchi Guild",
    weight: "450g Royal Drape",
    zariPurity: "100% Untarnished Foil",
  },
  {
    title: "Featherlight SiCo Drape",
    desc: "The gossamer lightness of fine combed cotton warp interwoven with the royal sheen of pure 8-ply silk. Flows effortlessly like water.",
    image: sicoGreenKuttu,
    tag: "SiCo Heritage",
    link: "/shop?material=SiCo",
    weaveType: "8-Ply Mulberry SiCo",
    origin: "Telangana Pit-Looms",
    weight: "418g Gossamer Light",
    zariPurity: "Silver-Plated Filament",
  },
  {
    title: "Maa Inti Bangaram",
    desc: "Consecrated South Indian ceremonial sarees passed down across generations as heirloom blessings of prosperity and eternal grace.",
    image: pitLoomCrimson,
    tag: "Ceremonial Silk",
    link: "/shop?search=Ma+Inti+Bangaram",
    weaveType: "Sacred Kumbha Weave",
    origin: "Gadwal Royal Loom",
    weight: "460g Heirloom Pattu",
    zariPurity: "Temple Tested Zari",
  },
];

/* ---------------------------------------------------------------------
   1. SILK STARDUST CANVAS: Interactive Floating Golden Micro-Fibrils
--------------------------------------------------------------------- */
function SilkStardustCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 800);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    // Generate 32 delicate floating stardust motes in brand gold & blush tones
    const colors = ["#D4AF37", "#F5D77F", "#E9C9C3", "#8E3D51"];
    const particles = Array.from({ length: 32 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 0.8,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.5 + 0.2,
      baseAlpha: Math.random() * 0.5 + 0.2,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.35 - 0.15,
      pulse: Math.random() * Math.PI * 2,
    }));

    let mouseX = -1000;
    let mouseY = -1000;

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const onMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    canvas.parentElement?.addEventListener("mousemove", onMouseMove);
    canvas.parentElement?.addEventListener("mouseleave", onMouseLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        // Floating drift
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.02;
        p.alpha = p.baseAlpha + Math.sin(p.pulse) * 0.2;

        // Wrap around borders
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Interactive mouse gentle repulsion
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110 && dist > 0) {
          const force = (110 - dist) / 110;
          p.x += (dx / dist) * force * 1.8;
          p.y += (dy / dist) * force * 1.8;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.parentElement?.removeEventListener("mousemove", onMouseMove);
      canvas.parentElement?.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-70"
    />
  );
}

/* ---------------------------------------------------------------------
   2. MAIN SURREAL ATELIER CONTAINER
--------------------------------------------------------------------- */
function SurrealAtelierExperience(): React.JSX.Element {
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const activeFeature = SURREAL_FEATURES[activeFeatureIndex];

  return (
    <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24">
      {/* Living Silk Stardust Particles */}
      <SilkStardustCanvas />

      {/* =========================================================
          LIVING SILK SINE-WAVE RIBBON (The Sacred Reed)
      ========================================================== */}
      <div className="relative w-full py-6 flex items-center justify-center overflow-hidden z-10">
        <svg
          viewBox="0 0 1200 60"
          className="w-full h-10 sm:h-12 text-[#8E3D51]/30 fill-none stroke-current"
          preserveAspectRatio="none"
        >
          <path
            d="M0,30 C150,5 300,55 450,30 C600,5 750,55 900,30 C1050,5 1200,55 1350,30"
            strokeWidth="1.75"
            strokeDasharray="6 6"
            className="animate-pulse"
          />
          <path
            d="M0,30 C150,55 300,5 450,30 C600,55 750,5 900,30 C1050,55 1200,5 1350,30"
            strokeWidth="1"
            className="opacity-40"
          />
        </svg>

        <div className="absolute inset-auto inline-flex items-center gap-2 rounded-full border border-[#8E3D51]/25 bg-[#F7EBEC]/95 px-4 sm:px-5 py-1.5 text-[10px] sm:text-xs font-serif font-medium uppercase tracking-[0.24em] text-[#8E3D51] shadow-xs backdrop-blur-md">
          <Sparkles size={11} className="text-[#D4AF37] animate-spin" style={{ animationDuration: "8s" }} />
          <span>The Alchemy of the Loom</span>
          <Sparkles size={11} className="text-[#D4AF37] animate-spin" style={{ animationDuration: "8s" }} />
        </div>
      </div>

      {/* =========================================================
          SECTION HEADLINE & CONCEPT
      ========================================================== */}
      <div className="relative text-center max-w-3xl mx-auto my-8 sm:my-10 z-10">
        <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-[#2A2421] leading-tight">
          Feel the Drape Before You Choose.{" "}
        </h3>
        <p className="mt-3 text-xs sm:text-sm text-[#756A60] font-light leading-relaxed max-w-2xl mx-auto">
         Move through our collection to see how real Gadwal silk falls in the light. </p>
      </div>

      {/* =========================================================
          FEATURE 1: INTERACTIVE 3D MASTER DRAPE STAGE (With Macro Loupe)
      ========================================================== */}
      <MasterDrapeStage activeFeature={activeFeature} />

      {/* =========================================================
          FEATURE 2: 4 SURREAL HOLOGRAPHIC 3D PEDESTALS
      ========================================================== */}
      <div className="relative z-10 my-12 sm:my-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="font-serif text-xl sm:text-2xl font-light text-[#2A2421]">
              Four Pillars of the <span className="italic text-[#8E3D51]">Gadwal Masterpiece</span>
            </h4>
            <p className="text-xs text-[#756A60] mt-0.5">
              Select any pedestal to inspect its weave in the holographic stage above.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#8E3D51]">
            <Layers size={14} />
            <span>Interactive 3D Pedestals</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {SURREAL_FEATURES.map((feat, idx) => (
            <HolographicCard
              key={feat.title}
              feature={feat}
              isActive={activeFeatureIndex === idx}
              onSelect={() => setActiveFeatureIndex(idx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   3. MASTER DRAPE STAGE: 3D PERSPECTIVE TILT, ZARI FOIL & MACRO LOUPE
===================================================================== */
function MasterDrapeStage({ activeFeature }: { activeFeature: HolographicFeature }) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isLoupeActive, setIsLoupeActive] = useState(false);
  const [loupePos, setLoupePos] = useState({ x: 50, y: 50, bgX: 50, bgY: 50 });
  const drapeRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!drapeRef.current) return;
    const rect = drapeRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // 3D perspective tilt
    const rotX = ((y - centerY) / centerY) * -8;
    const rotY = ((x - centerX) / centerX) * 8;
    setRotateX(rotX);
    setRotateY(rotY);

    // Glare position percentage
    const pX = (x / rect.width) * 100;
    const pY = (y / rect.height) * 100;
    setGlarePos({ x: pX, y: pY });

    // Loupe position (exact pixel coordinates inside image container)
    setLoupePos({
      x,
      y,
      bgX: pX,
      bgY: pY,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos({ x: 50, y: 50 });
    setIsLoupeActive(false);
  };

  return (
    <div className="relative z-10 overflow-hidden rounded-3xl sm:rounded-[2.5rem] border border-[#CBC0D3]/80 bg-linear-to-br from-white/95 via-[#FDF9F8] to-[#F7EBEC]/90 p-6 sm:p-10 shadow-[0_20px_60px_rgba(42,36,33,0.07)] backdrop-blur-xl">
      {/* Brand Color Ambient Auras */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-[#8E3D51]/10 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[#D4AF37]/15 blur-[90px]" />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* =========================================================
            3D PERSPECTIVE DRAPE WITH REAL-TIME MACRO LOUPE
        ========================================================== */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div
            ref={drapeRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsLoupeActive(true)}
            onMouseLeave={handleMouseLeave}
            style={{
              perspective: "1200px",
            }}
            className="relative w-full cursor-crosshair group"
          >
            <div
              style={{
                transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                transition: "transform 0.15s ease-out",
                transformStyle: "preserve-3d",
              }}
              className="relative h-76 sm:h-96 md:h-112 w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-[#CBC0D3]/80 bg-[#1C1417]"
            >
              {/* Ambient Blurred Backdrop so container is richly filled */}
              <img
                src={activeFeature.image}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover object-center blur-xl opacity-35 scale-110 select-none pointer-events-none"
              />

              {/* Saree Foreground Drape - 100% Unclipped */}
              <img
                src={activeFeature.image}
                alt={activeFeature.title}
                className="relative z-0 h-full w-full object-contain object-center p-3 sm:p-4 filter contrast-[1.05] saturate-[1.08] transition-transform duration-700 ease-out group-hover:scale-102 select-none pointer-events-none"
              />

              {/* Dynamic Iridescent Gold Zari Sheen (Tracks Mouse) */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-color-dodge"
                style={{
                  background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(245,215,127,0.55) 0%, rgba(212,175,55,0.2) 35%, transparent 65%)`,
                }}
              />

              {/* Cinematic Vignette */}
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

              {/* =====================================================
                  INTERACTIVE PRECISION MACRO LOUPE (2.6x Zoom Aperture)
              ====================================================== */}
              {isLoupeActive && (
                <div
                  className="pointer-events-none absolute h-40 w-40 sm:h-44 sm:w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#D4AF37] ring-4 ring-[#8E3D51]/30 shadow-[0_0_35px_rgba(212,175,55,0.6)] overflow-hidden hidden md:block z-30"
                  style={{
                    left: `${loupePos.x}px`,
                    top: `${loupePos.y}px`,
                    backgroundImage: `url(${activeFeature.image})`,
                    backgroundPosition: `${loupePos.bgX}% ${loupePos.bgY}%`,
                    backgroundSize: "260%",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  {/* Loupe Crosshair HUD */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-4 border border-[#D4AF37]/60 rounded-full" />
                    <div className="absolute h-full w-px bg-[#D4AF37]/30" />
                    <div className="absolute w-full h-px bg-[#D4AF37]/30" />
                  </div>

                  {/* Micro Specs HUD Pill inside Loupe */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider text-[#F5D77F] backdrop-blur-md whitespace-nowrap border border-[#D4AF37]/40">
                    260% Macro · Zari Weft
                  </div>
                </div>
              )}

              {/* Bottom Image Title */}
              <div className="absolute bottom-4 left-4 right-4 text-white pointer-events-none z-20">
                <h4 className="font-serif text-xl sm:text-2xl font-normal drop-shadow-md">
                  {activeFeature.title}
                </h4>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            ARTISAN NARRATIVE, METRICS & SHOP ACTION
        ========================================================== */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full">
          <div>

            <h4 className="mt-2 font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-[#2A2421] leading-tight">
              {activeFeature.title}
            </h4>

            <p className="mt-4 text-xs sm:text-sm text-[#756A60] font-light leading-relaxed">
              {activeFeature.desc}
            </p>

            {/* 4 Interactive Weave Spec Metrics */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#CBC0D3]/70 bg-white/80 p-3 shadow-xs">
                <span className="block text-[9px] uppercase tracking-wider text-[#8C7A6B]">
                  Weave Architecture
                </span>
                <span className="font-serif text-sm font-semibold text-[#2A2421]">
                  {activeFeature.weaveType}
                </span>
              </div>

              <div className="rounded-xl border border-[#CBC0D3]/70 bg-white/80 p-3 shadow-xs">
                <span className="block text-[9px] uppercase tracking-wider text-[#8C7A6B]">
                  Artisan Guild Origin
                </span>
                <span className="font-serif text-sm font-semibold text-[#8E3D51]">
                  {activeFeature.origin}
                </span>
              </div>

              <div className="rounded-xl border border-[#CBC0D3]/70 bg-white/80 p-3 shadow-xs">
                <span className="block text-[9px] uppercase tracking-wider text-[#8C7A6B]">
                  Drape Weight
                </span>
                <span className="font-serif text-sm font-semibold text-[#2A2421]">
                  {activeFeature.weight}
                </span>
              </div>

              <div className="rounded-xl border border-[#CBC0D3]/70 bg-white/80 p-3 shadow-xs">
                <span className="block text-[9px] uppercase tracking-wider text-[#8C7A6B]">
                  Zari Certification
                </span>
                <span className="font-serif text-sm font-semibold text-[#8E3D51]">
                  {activeFeature.zariPurity}
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="mt-8 pt-6 border-t border-[#CBC0D3]/70 flex flex-wrap sm:flex-nowrap items-end justify-end gap-4">

            <Link
              to={activeFeature.link}
              className="group/btn flex items-center gap-2 rounded-2xl bg-[#8E3D51] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#783144] transition-all hover:scale-105 active:scale-95"
            >
              <span>Explore In Vault</span>
              <ArrowUpRight size={14} className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   4. HOLOGRAPHIC 3D PEDESTAL CARDS (Physics Tilt & Glare Shimmer)
===================================================================== */
function HolographicCard({
  feature,
  isActive,
  onSelect,
}: {
  feature: HolographicFeature;
  isActive: boolean;
  onSelect: () => void;
}) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -9; // Max 9 deg tilt
    const rotY = ((x - centerX) / centerX) * 9;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos({ x: 50, y: 50 });
  };

  return (
    <div
      onClick={onSelect}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: "1000px",
      }}
      className="cursor-pointer group"
    >
      <div
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${isActive ? 1.02 : 1}, ${isActive ? 1.02 : 1}, 1)`,
          transition: "transform 0.15s ease-out, box-shadow 0.25s ease",
        }}
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border p-5 transition-colors duration-300 bg-linear-to-b from-white via-[#FDF9F8] to-[#F7EBEC] ${
          isActive
            ? "border-[#8E3D51] ring-2 ring-[#8E3D51]/30 shadow-[0_16px_36px_rgba(142,61,81,0.18)]"
            : "border-[#CBC0D3]/70 shadow-[0_8px_24px_rgba(42,36,33,0.06)] hover:border-[#8E3D51]/60 hover:shadow-[0_12px_30px_rgba(142,61,81,0.12)]"
        }`}
      >
        {/* Holographic Interactive Glare Foil */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-overlay"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.7) 0%, rgba(212,175,55,0.25) 35%, transparent 70%)`,
          }}
        />

        {/* Thumbnail Preview Image - Unclipped */}
        <div className="relative h-44 sm:h-48 w-full rounded-xl sm:rounded-2xl overflow-hidden mb-4 bg-[#1C1417]">
          <img
            src={feature.image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center blur-md opacity-35 scale-110 pointer-events-none"
          />
          <img
            src={feature.image}
            alt={feature.title}
            className="relative z-0 h-full w-full object-contain object-center p-2 filter contrast-[1.03] transition-transform duration-500 group-hover:scale-105 pointer-events-none"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          <span className="absolute top-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#8E3D51] shadow-xs">
            {feature.tag}
          </span>
        </div>
        
        <h4 className="font-serif text-base sm:text-lg font-medium text-[#2A2421] leading-snug line-clamp-1">
          {feature.title}
        </h4>

        <p className="mt-1.5 text-xs text-[#756A60] font-light leading-relaxed line-clamp-2">
          {feature.desc}
        </p>

        {/* Footer of Card */}
        <div className="mt-4 pt-3 border-t border-[#CBC0D3]/50 flex items-center justify-between text-[11px]">
          <span className="text-[#8E3D51] font-bold inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            <span>{isActive ? "Viewing" : "Select"}</span> &rarr;
          </span>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   6. SPOTLIGHT INGRESS RUNWAY: FIXED LEFT CARD + RIGHT-TO-LEFT STREAM
      (Matches Page Color Palette: #F7EBEC, #F4E7E4, #E9C9C3, #CBC0D3, #8E3D51)
===================================================================== */
function SpotlightIngressStage({ items }: { items: ReelItem[] }): React.JSX.Element {
  const [activeCard, setActiveCard] = useState<ReelItem>(items[0] || GUARANTEED_EDITORIAL_SAREES[0]);
  const [isPaused, setIsPaused] = useState(false);

  // Triple items for continuous seamless infinite CSS marquee
  const tripledItems = useMemo(() => {
    return [...items, ...items, ...items];
  }, [items]);

  // Synchronized cycle: As cards move from right to left and reach the left card,
  // update the activeCard if the user is not actively hovering or inspecting
  useEffect(() => {
    if (isPaused || items.length === 0) return;
    const interval = setInterval(() => {
      setActiveCard((prev: ReelItem) => {
        const idx = items.findIndex((it) => it.id === prev.id);
        const nextIdx = (idx + 1) % items.length;
        return items[nextIdx];
      });
    }, 5200);

    return () => clearInterval(interval);
  }, [isPaused, items]);

  return (
    <div className="relative w-full overflow-hidden mt-12 sm:mt-16 pt-4 sm:pt-8 pb-16 sm:pb-24">
      {/* =========================================================
          DYNAMIC BLURRED SILK GLOW (Morphs on Card Click)
          (Seamlessly blended with above page: 0 line breaks, 0 muddy tints)
      ========================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 mask-[radial-gradient(ellipse_at_center,black_30%,transparent_80%)]">
        <img
          key={activeCard.id}
          src={activeCard.image}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center scale-125 filter blur-[90px] sm:blur-[120px] saturate-[1.2] brightness-[1.05] opacity-20 sm:opacity-25 transition-all duration-1000 ease-in-out"
        />
        {/* Soft Brand Auras */}
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#8E3D51]/8 blur-[90px]" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#D4AF37]/10 blur-[90px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto mb-8 sm:mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-[#2A2421] leading-tight">
              The <span className="italic font-normal text-[#8E3D51]">Silk Runway.</span>
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#756A60] font-light max-w-xl">
              Flowing continuously from right to left. Click any drape to immerse the canvas in its blurred aura, or watch as each arriving weave takes center spotlight on the left pedestal.
            </p>
          </div>
        </div>
      </div>

      {/* Runway Layout: Left Fixed Card + Right Moving Track */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center lg:items-stretch gap-6 lg:gap-8">
        {/* =========================================================
            LEFT FIXED SPOTLIGHT CARD (Permanent Brand Anchor)
        ========================================================== */}
        <div className="relative z-20 shrink-0 w-full sm:w-90 md:w-100 lg:w-107.5 rounded-3xl border-2 border-[#8E3D51] bg-linear-to-b from-white via-[#FDF9F8] to-[#F7EBEC] p-5 sm:p-6 shadow-[0_20px_50px_rgba(142,61,81,0.16)] ring-4 ring-[#8E3D51]/15 flex flex-col justify-between overflow-hidden">
          {/* Subtle Ambient Auras Inside Fixed Card */}
          <div className="pointer-events-none absolute -top-20 -left-20 h-56 w-56 rounded-full bg-[#8E3D51]/10 blur-[60px]" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[#D4AF37]/15 blur-[60px]" />

          {/* Unclipped Image Showcase */}
          <div className="relative z-10 flex-1 min-h-70 sm:min-h-80 rounded-2xl overflow-hidden bg-white/95 border border-[#CBC0D3]/80 flex items-center justify-center p-3 shadow-inner group">
            {/* Ambient Blurred Backdrop */}
            <img
              src={activeCard.image}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-center blur-md opacity-25 scale-110 pointer-events-none"
            />
            {/* Unclipped Crisp Saree */}
            <img
              key={activeCard.id}
              src={activeCard.image}
              alt={humanizeText(activeCard.name)}
              className="relative z-0 max-h-full max-w-full object-contain object-center transition-all duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-white/20 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Bottom Info & Action */}
          <div className="relative z-10 mt-4 pt-3 border-t border-[#CBC0D3]/70">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8E3D51] block">
              {humanizeText(activeCard.borderColor)} · {humanizeText(activeCard.material)}
            </span>
            <h4 className="font-serif text-xl sm:text-2xl font-normal text-[#2A2421] mt-0.5 truncate">
              {humanizeText(activeCard.name)}
            </h4>
            <div className="mt-3 flex items-end justify-end gap-3">
             
              <Link
                to={activeCard.link}
                className="shrink-0 inline-flex gap-1.5 rounded-xl bg-[#8E3D51] hover:bg-[#783144] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md"
              >
                <span>View Saree</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* =========================================================
            CENTER TO RIGHT: RIGHT-TO-LEFT INGRESS MARQUEE
            (Moving smoothly right-to-left, sliding behind the fixed card)
        ========================================================== */}
        <div
          className="relative z-10 flex-1 overflow-hidden min-w-0 py-2 sm:py-4 mask-[linear-gradient(to_right,transparent,black_6%,black_98%,transparent)] flex items-center"
          onMouseEnter={() => setIsPaused(true)}
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
                  onClick={() => setActiveCard(item)}
                  className="w-56 sm:w-64 md:w-72 shrink-0 cursor-pointer group"
                >
                  <div
                    className={`relative flex aspect-[3/4.4] w-full flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl p-4 transition-all duration-300 ${
                      isCurrent
                        ? "bg-white border-2 border-[#8E3D51] ring-4 ring-[#8E3D51]/25 shadow-[0_18px_40px_rgba(142,61,81,0.22)] scale-[1.03]"
                        : "bg-white/90 backdrop-blur-md border border-[#CBC0D3]/80 hover:border-[#8E3D51]/70 hover:shadow-[0_14px_32px_rgba(142,61,81,0.15)] hover:-translate-y-1.5 shadow-[0_8px_20px_rgba(42,36,33,0.06)]"
                    }`}
                  >
                    {/* Thumbnail Image Container - Clean Light Frame */}
                    <div className="relative h-48 sm:h-52 w-full rounded-xl sm:rounded-2xl overflow-hidden mb-3 bg-[#FAF6F5] border border-[#CBC0D3]/50 flex items-center justify-center p-2">
                      <img
                        src={item.image}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full object-cover object-center blur-md opacity-25 scale-110 pointer-events-none"
                      />
                      <img
                        src={item.image}
                        alt={humanizeText(item.name)}
                        loading="lazy"
                        draggable={false}
                        className="relative z-0 max-h-full max-w-full object-contain object-center transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                      />
                    </div>
                    {/* Bottom Details (Humanized, No Price) */}
                    <div className="relative z-10 pt-2 border-t border-[#CBC0D3]/50">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] uppercase tracking-wider text-[#8E3D51] font-semibold truncate">
                          {humanizeText(item.borderColor) || "Handloom Border"}
                        </span>
                        <span className="shrink-0 text-[10px] text-[#756A60] font-medium">
                          {humanizeText(item.material) || "Pure Silk & Cotton"}
                        </span>
                      </div>
                      <h5 className="font-serif text-sm sm:text-base font-medium text-[#2A2421] leading-snug truncate group-hover:text-[#8E3D51] transition-colors">
                        {humanizeText(item.name)}
                      </h5>
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