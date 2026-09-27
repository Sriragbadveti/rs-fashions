import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { handleSareeImageError } from "../../utils/imageConverter";
import tempImg1 from "../../assets/images/Home.jpg";
import tempImg2 from "../../assets/images/Home1.jpg";
import tempImg3 from "../../assets/images/Home_laptop_1.png";
import tempImg4 from "../../assets/images/Home.jpg";
import tempImg5 from "../../assets/images/Home.jpg";
import tempImg6 from "../../assets/images/Home.jpg";

const localAssets = import.meta.glob<string>("../../assets/**/*", {
  eager: true,
  import: "default",
});

function resolveAssetSrc(src: string): string {
  if (!src) return "";
  if (
    src.startsWith("http") ||
    src.startsWith("data:") ||
    src.startsWith("/@fs/") ||
    src.startsWith("/src/") ||
    src.startsWith("/")
  ) {
    return src;
  }
  const normalized = src.replace(/^(\.\.\/)+/, "../../");
  if (localAssets[normalized]) {
    return localAssets[normalized];
  }
  const matchKey = Object.keys(localAssets).find((key) =>
    key.toLowerCase().endsWith(src.replace(/^(\.\.?\/)+/, "").toLowerCase())
  );
  return matchKey ? localAssets[matchKey] : src;
}

export interface ShowcaseItem {
  id: string;
  name: string;
  desc: string;
  image: string;
  bgColor: string;
  pattern: string;
  category: string;
  material: string;
}

export const FALLBACK_SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: "showcase-emerald-gadwal",
    name: "SiCo GADWAL Sarees",
    desc: "Handwoven SiCo Gadwal saree with traditional temple kuttu borders and intricate gold zari motifs crafted for timeless celebrations.",
    image: tempImg1,
    bgColor: "#d8b98a",
    pattern: "Kuttu Borders",
    category: "SiCo Gadwal Sarees",
    material: "SiCo",
  },
  {
    id: "showcase-rose-gadwal",
    name: "KANCHI BORDER",
    desc: "A romantic rose-pink handloom drape featuring rich antique zari peacock motifs along a contrasting maroon Kanchi border.",
    image: tempImg2,
    bgColor: "#e8a3ab",
    pattern: "Kanchi Borders",
    category: "SiCo Gadwal Sarees",
    material: "SiCo",
  },
  {
    id: "showcase-teal-checks",
    name: "Box Gadwal CHECKS",
    desc: "Box Gadwal Checks SiCo weave adorned with classic golden checks and a deep purple zari border for an authentic royal aura.",
    image: tempImg3,
    bgColor: "#7a1332",
    pattern: "Vintage Checks",
    category: "SiCo Gadwal Sarees",
    material: "SiCo",
  },
  {
    id: "showcase-mustard-gatti",
    name: "GATTI BORDER Gadwal",
    desc: "A classic mustard-yellow handloom weave highlighted by dense interlocking gatti borders and rich ceremonial pallu craftsmanship.",
    image: tempImg4,
    bgColor: "#d99b26",
    pattern: "Gatti Borders",
    category: "SiCo Gadwal Sarees",
    material: "SiCo",
  },
  {
    id: "showcase-peacock-vintage",
    name: "ROYAL PEACOCK Weave",
    desc: "A stunning peacock-blue drape embellished with intricate Mayil eye buttis woven in untarnished vintage gold zari threads.",
    image: tempImg5,
    bgColor: "#0e7490",
    pattern: "Vintage Checks",
    category: "SiCo Gadwal Sarees",
    material: "SiCo",
  },
  {
    id: "showcase-ruby-heritage",
    name: "MAA INTI BANGARAM",
    desc: "An heirloom crimson drape designed with traditional kumbha border architecture, carrying legacy craftsmanship across generations.",
    image: tempImg6,
    bgColor: "#a01e2e",
    pattern: "Maa Inti Bangaram",
    category: "SiCo Gadwal Sarees",
    material: "SiCo",
  },
];

function bezierPoint(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number }
) {
  const x = (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x;
  const y = (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y;
  return { x, y };
}

export default function ProductShowcase() {
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideState, setSlideState] = useState<
    | "slide-settled"
    | "slide-out-left"
    | "slide-out-right"
    | "slide-in-from-right"
    | "slide-in-from-left"
  >("slide-settled");
  const [infoHidden, setInfoHidden] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const curveRailRef = useRef<HTMLDivElement>(null);
  const activeThumbRef = useRef<HTMLButtonElement>(null);
  const [railHeight, setRailHeight] = useState(580);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const items = FALLBACK_SHOWCASE_ITEMS;

  const safeIndex = currentIndex < items.length ? currentIndex : 0;
  const activeItem = items[safeIndex] || FALLBACK_SHOWCASE_ITEMS[0];

  useEffect(() => {
    const updateHeight = () => {
      if (curveRailRef.current && window.innerWidth > 920) {
        setRailHeight(curveRailRef.current.clientHeight || 580);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [items.length]);

  // Keep active item in view inside mobile horizontal scroll rail
  useEffect(() => {
    if (window.innerWidth <= 920 && activeThumbRef.current) {
      activeThumbRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [safeIndex]);

  const CARD_HEIGHT = 86;
  const THUMB_OFFSET_X = 35;

  const dynamicRailHeight = useMemo(() => {
    return Math.max(railHeight, items.length * 105);
  }, [railHeight, items.length]);

  const thumbPositions = useMemo(() => {
    const total = items.length;
    const availableHeight = Math.max(0, dynamicRailHeight - CARD_HEIGHT);

    const p0 = { x: 75, y: 0 };
    const p1 = { x: -10, y: availableHeight * 0.5 };
    const p2 = { x: 75, y: availableHeight };

    return items.map((_, index) => {
      const t = total === 1 ? 0.5 : index / (total - 1);
      const point = bezierPoint(t, p0, p1, p2);

      const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
      const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const rotation = Math.max(-16, Math.min(16, angle - 90));

      return {
        x: point.x + THUMB_OFFSET_X,
        y: point.y,
        rotation,
      };
    });
  }, [items.length, dynamicRailHeight]);

  const goToProduct = useCallback(
    (newIndex: number, direction: "next" | "prev") => {
      if (isAnimating || newIndex === safeIndex) return;
      setIsAnimating(true);

      const exitClass = direction === "next" ? "slide-out-left" : "slide-out-right";
      const enterClass = direction === "next" ? "slide-in-from-right" : "slide-in-from-left";

      setSlideState(exitClass);
      setInfoHidden(true);

      setTimeout(() => {
        setCurrentIndex(newIndex);
        setSlideState(enterClass);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setSlideState("slide-settled");
            setInfoHidden(false);
          });
        });

        setTimeout(() => {
          setIsAnimating(false);
        }, 360);
      }, 280);
    },
    [isAnimating, safeIndex]
  );

  const handleNext = useCallback(() => {
    goToProduct((safeIndex + 1) % items.length, "next");
  }, [goToProduct, safeIndex, items.length]);

  const handlePrev = useCallback(() => {
    goToProduct((safeIndex - 1 + items.length) % items.length, "prev");
  }, [goToProduct, safeIndex, items.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleShopRedirect = (filterQuery?: string) => {
    const query = (
      filterQuery ||
      activeItem.pattern ||
      activeItem.category ||
      ""
    ).trim();

    if (query) {
      const params = new URLSearchParams();
      params.set("search", query);
      navigate(`/shop?${params.toString()}`);
    } else {
      navigate("/shop");
    }
  };

  const resolvedActiveImg = resolveAssetSrc(activeItem.image);

  return (
    <section className="psc-section" aria-label="Featured Saree Lookbook Showcase">
      <style>{`
        .psc-section {
          --bg-color: #F7EBEC;
          --accent: #7a1332;
          --accent-hover: #961b40;
          --text-dark: #1b1614;
          --text-muted: #6b635f;
          width: 100%;
          min-height: calc(100vh - 60px);
          background: radial-gradient(circle at 18% 25%, rgba(203, 192, 211, 0.45), transparent 50%),
                      radial-gradient(circle at 82% 75%, rgba(233, 201, 195, 0.5), transparent 48%),
                      linear-gradient(180deg, #F4E7E4 0%, #F7EBEC 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(20px, 4vw, 44px) clamp(16px, 3.5vw, 40px);
          box-sizing: border-box;
          overflow: hidden;
        }

        .psc-showcase {
          width: 100%;
          max-width: 1480px;
          display: grid;
          grid-template-columns: 190px 1fr 380px;
          align-items: center;
          gap: clamp(16px, 2.8vw, 40px);
        }

        .psc-curve-rail {
          position: relative;
          width: 190px;
          height: clamp(480px, 70vh, 640px);
          display: flex;
          align-items: center;
        }

        .psc-thumb-btn {
          position: absolute;
          width: 62px;
          height: 86px;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid #ffffff;
          padding: 0;
          background: #E9C9C3;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
          transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1),
                      border-color 0.25s ease,
                      box-shadow 0.25s ease;
          touch-action: manipulation;
          z-index: 2;
        }

        .psc-thumb-btn img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .psc-thumb-btn:hover {
          box-shadow: 0 10px 22px rgba(122, 19, 50, 0.22);
          border-color: var(--accent);
          z-index: 6;
        }

        .psc-thumb-btn.active {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(122, 19, 50, 0.25), 0 12px 26px rgba(0, 0, 0, 0.22);
          z-index: 5;
        }

        .psc-main-stage {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          touch-action: pan-y;
        }

        .psc-visual-card {
          position: relative;
          width: 100%;
          max-width: 520px;
          height: clamp(380px, 66vh, 620px);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 42px rgba(28, 14, 18, 0.18);
          cursor: pointer;
          transition: transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1),
                      opacity 0.3s ease;
        }

        .psc-visual-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
          display: block;
          transition: transform 0.5s ease;
        }

        .psc-visual-card:hover img {
          transform: scale(1.04);
        }

        .psc-visual-card.slide-out-left {
          transform: translateX(-40px) scale(0.96);
          opacity: 0;
        }
        .psc-visual-card.slide-out-right {
          transform: translateX(40px) scale(0.96);
          opacity: 0;
        }
        .psc-visual-card.slide-in-from-right {
          transform: translateX(40px) scale(0.96);
          opacity: 0;
        }
        .psc-visual-card.slide-in-from-left {
          transform: translateX(-40px) scale(0.96);
          opacity: 0;
        }
        .psc-visual-card.slide-settled {
          transform: translateX(0) scale(1);
          opacity: 1;
        }

        .psc-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.94);
          color: var(--text-dark);
          font-size: 22px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 8;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.14);
          transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }

        .psc-nav-btn:hover {
          background: var(--accent);
          color: #ffffff;
          transform: translateY(-50%) scale(1.08);
        }

        .psc-nav-prev {
          left: -16px;
        }

        .psc-nav-next {
          right: -16px;
        }

        .psc-info-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: opacity 0.28s ease, transform 0.28s ease;
        }

        .psc-info-panel.info-hidden {
          opacity: 0;
          transform: translateY(6px);
        }

        .psc-badge {
          align-self: flex-start;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 5px 12px;
          border-radius: 6px;
          background: rgba(122, 19, 50, 0.08);
          color: var(--accent);
        }

        .psc-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(24px, 2.3vw, 34px);
          font-weight: 700;
          line-height: 1.25;
          color: var(--text-dark);
          margin: 0;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .psc-title:hover {
          color: var(--accent);
        }

        .psc-desc {
          font-size: 15px;
          line-height: 1.7;
          color: var(--text-muted);
          margin: 0;
        }

        .psc-cta-btn {
          margin-top: 10px;
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--accent);
          color: #ffffff;
          border: none;
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 10px 20px rgba(122, 19, 50, 0.24);
          transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }

        .psc-cta-btn:hover {
          background: var(--accent-hover);
          transform: translateY(-2px);
          box-shadow: 0 14px 26px rgba(122, 19, 50, 0.32);
        }

        .psc-cta-btn span {
          transition: transform 0.2s ease;
        }

        .psc-cta-btn:hover span {
          transform: translateX(3px);
        }

        @media (max-width: 1160px) {
          .psc-showcase {
            grid-template-columns: 140px 1fr 310px;
            gap: 20px;
          }
          .psc-curve-rail {
            width: 140px;
          }
          .psc-thumb-btn {
            width: 54px;
            height: 76px;
          }
        }

        @media (max-width: 920px) {
          .psc-section {
            min-height: auto;
            padding: 24px 16px 40px;
            align-items: flex-start;
          }

          .psc-showcase {
            grid-template-columns: 1fr;
            max-width: 480px;
            margin: 0 auto;
            gap: 16px;
          }

          .psc-main-stage {
            order: 1;
            width: 100%;
          }

          .psc-visual-card {
            max-width: 100%;
            height: clamp(340px, 54vh, 460px);
            border-radius: 20px;
          }

          .psc-nav-btn {
            width: 38px;
            height: 38px;
            font-size: 18px;
            background: rgba(255, 255, 255, 0.96);
          }

          .psc-nav-prev {
            left: 10px;
          }

          .psc-nav-next {
            right: 10px;
          }

          .psc-curve-rail {
            order: 2;
            width: 100% !important;
            height: auto !important;
            min-height: unset;
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
            gap: 10px;
            padding: 6px 4px 10px;
            overflow-x: auto;
            overflow-y: hidden;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .psc-curve-rail::-webkit-scrollbar {
            display: none;
          }

          .psc-thumb-btn {
            position: relative !important;
            left: auto !important;
            top: auto !important;
            transform: none !important;
            flex: 0 0 54px;
            width: 54px;
            height: 74px;
            border-radius: 10px;
            scroll-snap-align: center;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          }

          .psc-thumb-btn.active {
            transform: scale(1.05) !important;
            box-shadow: 0 0 0 2px var(--accent), 0 8px 16px rgba(122, 19, 50, 0.25);
          }

          .psc-info-panel {
            order: 3;
            text-align: center;
            align-items: center;
            gap: 12px;
            padding: 0 6px;
          }

          .psc-badge {
            align-self: center;
          }

          .psc-title {
            font-size: 22px;
          }

          .psc-desc {
            font-size: 14px;
            line-height: 1.6;
          }

          .psc-cta-btn {
            align-self: center;
            width: 100%;
            max-width: 280px;
            justify-content: center;
            padding: 13px 22px;
          }
        }

        @media (max-width: 480px) {
          .psc-section {
            padding: 18px 12px 32px;
          }

          .psc-showcase {
            gap: 14px;
          }

          .psc-visual-card {
            height: clamp(300px, 48vh, 380px);
            border-radius: 16px;
          }

          .psc-thumb-btn {
            flex: 0 0 48px;
            width: 48px;
            height: 66px;
            border-radius: 8px;
          }

          .psc-title {
            font-size: 20px;
          }

          .psc-desc {
            font-size: 13px;
          }

          .psc-nav-btn {
            width: 34px;
            height: 34px;
            font-size: 16px;
          }

          .psc-nav-prev {
            left: 6px;
          }

          .psc-nav-next {
            right: 6px;
          }
        }
      `}</style>

      <div className="psc-showcase">
        <div
          className="psc-curve-rail"
          ref={curveRailRef}
          style={{ height: `${dynamicRailHeight}px` }}
          aria-label="Thumbnail carousel"
        >
          {items.map((item, idx) => {
            const pos = thumbPositions[idx] || {
              x: 40,
              y: idx * 95,
              rotation: 0,
            };
            const thumbSrc = resolveAssetSrc(item.image);
            const isActive = idx === safeIndex;

            return (
              <button
                key={item.id}
                ref={isActive ? activeThumbRef : null}
                type="button"
                aria-label={`Select ${item.name}`}
                aria-pressed={isActive}
                className={`psc-thumb-btn ${isActive ? "active" : ""}`}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: `rotate(${pos.rotation}deg) scale(${isActive ? 1.1 : 1})`,
                  backgroundColor: item.bgColor,
                }}
                onClick={() => {
                  if (idx !== safeIndex) {
                    goToProduct(idx, idx > safeIndex ? "next" : "prev");
                  }
                }}
              >
                <img
                  src={thumbSrc}
                  alt={item.name}
                  loading="lazy"
                  onError={(e) => handleSareeImageError(e, thumbSrc)}
                />
              </button>
            );
          })}
        </div>

        <div
          className="psc-main-stage"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            className="psc-nav-btn psc-nav-prev"
            onClick={handlePrev}
            aria-label="Previous product"
          >
            &#8249;
          </button>

          <div
            className={`psc-visual-card ${slideState}`}
            style={{ backgroundColor: activeItem.bgColor }}
            onClick={() => handleShopRedirect(activeItem.name)}
            title={`View ${activeItem.name} in shop`}
          >
            <img
              src={resolvedActiveImg}
              alt={activeItem.name}
              onError={(e) => handleSareeImageError(e, resolvedActiveImg)}
            />
          </div>

          <button
            type="button"
            className="psc-nav-btn psc-nav-next"
            onClick={handleNext}
            aria-label="Next product"
          >
            &#8250;
          </button>
        </div>

        <div className={`psc-info-panel ${infoHidden ? "info-hidden" : ""}`}>
          <span className="psc-badge">{activeItem.pattern || activeItem.category}</span>

          <h2
            className="psc-title"
            onClick={() => handleShopRedirect(activeItem.name)}
          >
            {activeItem.name}
          </h2>

          <p className="psc-desc">{activeItem.desc}</p>

          <button
            type="button"
            className="psc-cta-btn"
            onClick={() => handleShopRedirect(activeItem.name)}
          >
            Explore in Shop <span>&#8599;</span>
          </button>
        </div>
      </div>
    </section>
  );
}