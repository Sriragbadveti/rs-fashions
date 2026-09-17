import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiLayers } from "react-icons/fi";

export interface MaterialItem {
  id: string;
  name: string;
  accent: string;
  borderGlow: string;
  link: string;
  image: string;
}

const materials: MaterialItem[] = [
  {
    id: "sico",
    name: "Maa Inti Bangaram",
    accent: "from-rose-500/80 to-amber-500/80",
    borderGlow: "hover:border-rose-400/60",
    link: "/shop?material=SiCo",
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "gatti-border",
    name: "Gatti Borders",
    accent: "from-emerald-600/80 to-teal-500/80",
    borderGlow: "hover:border-emerald-400/60",
    link: "/shop?search=Gatti+Borders",
    image:
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "checks-gadwal",
    name: "Vintage Checks",
    accent: "from-amber-500/80 to-orange-600/80",
    borderGlow: "hover:border-amber-400/60",
    link: "/shop?search=Vintage+Checks",
    image:
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "kanchi-border",
    name: "Kanchi Borders",
    accent: "from-fuchsia-600/80 to-[#8E3D51]/80",
    borderGlow: "hover:border-fuchsia-400/60",
    link: "/shop?search=Big+Kanchi",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=85",
  },
];

// Buffer size for smooth seamless wrap-around loop
const CARD_BUFFER = 4;

export default function MaterialCollections() {
  const [internalCardIndex, setInternalCardIndex] = useState(CARD_BUFFER);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const firstCardRef = useRef<HTMLDivElement>(null);
  const isCardAnimating = useRef(false);
  const x = useMotionValue(0);

  // Multi-item clone buffers on both sides
  const clonedMaterials = useMemo(() => {
    const n = materials.length;
    if (n === 0) return [];
    const prefix: MaterialItem[] = [];
    const suffix: MaterialItem[] = [];
    for (let i = 0; i < CARD_BUFFER; i++) {
      prefix.unshift(materials[n - 1 - (i % n)]);
      suffix.push(materials[i % n]);
    }
    return [...prefix, ...materials, ...suffix];
  }, []);

  // Compute active pagination index (0 to materials.length - 1)
  const activeDotIndex = useMemo(() => {
    const n = materials.length;
    if (n === 0) return 0;
    return (((internalCardIndex - CARD_BUFFER) % n) + n) % n;
  }, [internalCardIndex]);

  // Compute full card step dynamically
  const getCardStep = useCallback(() => {
    if (!firstCardRef.current) return window.innerWidth >= 640 ? 294 : 256;
    const cardWidth = firstCardRef.current.offsetWidth;
    const gap = window.innerWidth >= 640 ? 24 : 16;
    return cardWidth + gap;
  }, []);

  // Sync initial offset and handle resize
  useEffect(() => {
    const syncPosition = () => {
      const step = getCardStep();
      x.set(-internalCardIndex * step);
    };
    syncPosition();
    window.addEventListener("resize", syncPosition);
    return () => window.removeEventListener("resize", syncPosition);
  }, [getCardStep, internalCardIndex, x]);

  // Slide transition with silent buffer teleportation
  const slideToCardIndex = (targetIdx: number) => {
    const n = materials.length;
    if (n <= 1) return;

    isCardAnimating.current = true;
    const step = getCardStep();
    const targetX = -targetIdx * step;

    animate(x, targetX, {
      type: "spring",
      stiffness: 260,
      damping: 30,
      onComplete: () => {
        isCardAnimating.current = false;
        let finalIdx = targetIdx;

        if (targetIdx >= CARD_BUFFER + n) {
          finalIdx = targetIdx - n;
          x.set(-finalIdx * step);
          setInternalCardIndex(finalIdx);
        } else if (targetIdx < CARD_BUFFER) {
          finalIdx = targetIdx + n;
          x.set(-finalIdx * step);
          setInternalCardIndex(finalIdx);
        }
      },
    });
    setInternalCardIndex(targetIdx);
  };

  // Automated step interval (pauses on hover)
  useEffect(() => {
    if (isHovered || isDragging || materials.length <= 1) return;
    const interval = setInterval(() => {
      if (isCardAnimating.current) return;
      slideToCardIndex(internalCardIndex + 1);
    }, 3200);
    return () => clearInterval(interval);
  }, [isHovered, isDragging, internalCardIndex]);

  // Drag and flick handling
  const handleCardDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    setIsDragging(false);
    const step = getCardStep();
    const currentX = x.get();
    const dragOffset = info.offset.x;
    const velocity = info.velocity.x;

    let target = internalCardIndex;
    if (dragOffset < -40 || velocity < -300) {
      target = internalCardIndex + 1;
    } else if (dragOffset > 40 || velocity > 300) {
      target = internalCardIndex - 1;
    } else {
      target = Math.round(Math.abs(currentX) / step);
    }
    slideToCardIndex(target);
  };

  return (
    <section className="relative overflow-hidden bg-[#FAF7F2] py-10 font-sans select-none sm:py-14">
      {/* Jewel-Tone Background Light */}
      <div className="pointer-events-none absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-gradient-to-br from-[#8E3D51]/15 to-rose-400/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-gradient-to-tl from-[#D47E37]/15 to-amber-300/10 blur-[120px]" />

      <div className="mx-auto max-w-[1600px] px-3.5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-2 pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.26em] text-[#8E3D51]">
              <FiLayers size={11} />
              <span>Signature Weaves</span>
            </span>
            <h2 className="mt-2 font-serif text-2xl font-light tracking-tight text-[#2B1B17] sm:text-4xl lg:text-5xl">
              Feel the{" "}
              <span className="bg-gradient-to-r from-[#8E3D51] via-[#C94A67] to-[#D47E37] bg-clip-text italic font-normal text-transparent">
                weave
              </span>
              .
            </h2>
          </div>
          <p className="max-w-xs text-xs text-stone-600">
            Handcrafted heritage weaves celebrating classic textures, heirloom pallus, and contrasting zari borders.
          </p>
        </div>
      </div>

      {/* Snap-to-Card Carousel Container with vertical padding buffer to prevent hover clipping */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing px-3.5 sm:px-6 lg:px-8 py-4 -my-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          style={{ x }}
          drag="x"
          dragElastic={0.15}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleCardDragEnd}
          className="flex w-max gap-4 sm:gap-6 py-2"
        >
          {clonedMaterials.map((mat, idx) => (
            <div
              key={`material-card-${mat.id}-${idx}`}
              ref={idx === 0 ? firstCardRef : null}
              className="w-[240px] shrink-0 sm:w-[270px]"
            >
              {/* Borderless Card Frame */}
              <Link
                to={mat.link}
                className="group relative flex aspect-[3/4.2] w-full flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl bg-black p-4 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]"
              >
                {/* Saree Image */}
                <img
                  src={mat.image}
                  alt={mat.name}
                  loading="lazy"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover object-center saturate-[1.2] contrast-[1.05] transition-transform duration-700 ease-out group-hover:scale-108 pointer-events-none"
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

                {/* Top Action Row */}
                <div className="relative z-10 flex items-center justify-end">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all duration-300 group-hover:bg-white group-hover:text-black group-hover:rotate-45">
                    <FiArrowUpRight size={13} />
                  </span>
                </div>

                {/* Bottom Details */}
                <div className="relative z-10">
                  <h3 className="font-serif text-base sm:text-lg font-medium tracking-wide text-white drop-shadow-sm">
                    {mat.name}
                  </h3>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 group-hover:underline">
                    Explore Collection &rarr;
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Pagination Indicator Dots */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {materials.map((mat, idx) => {
          const isActive = activeDotIndex === idx;
          return (
            <button
              key={`dot-${mat.id}-${idx}`}
              type="button"
              aria-label={`Go to slide ${idx + 1}: ${mat.name}`}
              onClick={() => slideToCardIndex(CARD_BUFFER + idx)}
              className={`h-2 rounded-full transition-all duration-300 ease-out focus:outline-none ${
                isActive
                  ? "w-6 bg-[#8E3D51] shadow-xs"
                  : "w-2 bg-[#8E3D51]/25 hover:bg-[#8E3D51]/50"
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}