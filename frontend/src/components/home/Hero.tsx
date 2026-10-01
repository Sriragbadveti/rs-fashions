import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowDownRight } from "react-icons/fi";
import homePortraitImg from "../../assets/images/home_banner.jpeg";
import homeLandscapeImg from "../../assets/images/Home_laptop.png";

// Tip: You can either import an image from "../../assets/..." like above,
// or type a relative path string from src/assets (e.g., "../assets/images/Home.jpg")
const localAssets = import.meta.glob<string>("../../assets/**/*", {
  eager: true,
  import: "default",
});

function resolveAssetSrc(src: string): string {
  if (!src) return "";
  if (src.startsWith("http") || src.startsWith("data:") || src.startsWith("/@fs/") || src.startsWith("/src/")) {
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

export const heroBanner = {
  title: "moment.",
  // 1. Portrait Image -> Shown on Mobile (Android/iPhone) & Portrait iPad/Tablets
  portraitImageSrc: homePortraitImg, // e.g., "../assets/images/Home.jpg"
  // 2. Landscape Image -> Shown on Laptops, Monitors & Landscape Large Screens
  landscapeImageSrc: homeLandscapeImg, // Replace with your 16:9 landscape banner image (e.g., "../assets/images/HomeLandscape.jpg")
  // Optional Top-Left Brand Logo
  logoSrc: "", // e.g., "../assets/logo/logo1.png"
  link: "/shop",
};

export default function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const resolvedPortraitSrc = resolveAssetSrc(heroBanner.portraitImageSrc);
  const resolvedLandscapeSrc = resolveAssetSrc(
    heroBanner.landscapeImageSrc || heroBanner.portraitImageSrc
  );
  const resolvedLogoSrc = resolveAssetSrc(heroBanner.logoSrc);

  return (
    <section className="relative overflow-hidden px-3.5 pb-4 pt-1 sm:px-6 sm:pb-6 sm:pt-1">
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto flex h-[calc(100dvh-96px)] min-h-130 max-w-[1600px] overflow-hidden rounded-3xl sm:rounded-[2.25rem] bg-[#1A1513] shadow-[0_20px_50px_rgba(26,21,19,0.14)] transform-gpu will-change-transform"
      >
        {/* Single Responsive Hero Image (Portrait on Mobile/Tablet, Landscape on Laptop/Desktop) */}
        <motion.picture
          initial={prefersReducedMotion ? false : { scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 block h-full w-full transform-gpu will-change-transform"
        >
          <source
            media="(min-width: 1920px), (min-width: 1080px) and (orientation: landscape)"
            srcSet={resolvedLandscapeSrc}
          />
          <img
            src={resolvedPortraitSrc}
            alt="RS Fashions SiCo collection"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover object-top lg:object-[center_18%]"
          />
        </motion.picture>

        {/* Clean Bottom Scrim for Text Legibility */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

        {/* Hero Content — Clean Bottom-Aligned Editorial Layout */}
        <div className="relative z-10 flex h-full w-full flex-col justify-between p-6 sm:p-10 lg:p-14">
          {/* Optional Top-Left Brand Logo (only renders if logoSrc is set) */}
          <div>
            {resolvedLogoSrc && (
              <img
                src={resolvedLogoSrc}
                alt="RS Fashions Logo"
                className="h-15 sm:h-14 w-auto object-contain"
              />
            )}
          </div>

          {/* Bottom Row: Left-Aligned Typography & Right-Aligned Action Button */}
          <div className="flex w-full items-end justify-between gap-6">
            <div className="max-w-xl overflow-hidden">
              <motion.h1
                initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="font-serif text-3xl font-light tracking-tight text-[#F5E6C8]  sm:text-5xl lg:text-6xl leading-[1.08]"
              >
                Draped in timeless{" "}
                <span className="italic font-normal text-[#F5E6C8]">
                  grace
                </span>
                .
              </motion.h1>

              <motion.p
                initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mt-2.5 text-xs sm:text-sm lg:text-base text-white/85 font-light max-w-md leading-relaxed"
              >
                Direct handloom dispatches of authentic SiCo Gadwal sarees.
              </motion.p>
            </div>

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to={heroBanner.link || "/shop"}
                className="group flex h-12 w-auto min-w-12 sm:h-14 sm:min-w-14 px-4 sm:px-5 shrink-0 items-center justify-center rounded-full bg-[#FAF7F2] text-[#2A2421] shadow-lg transition-all duration-300 hover:scale-105 hover:bg-white active:scale-95 gap-2"
                aria-label="Shop the collection"
              >
                <span className="text-base sm:text-lg font-medium tracking-tight">
                  Explore
                </span>
                <FiArrowDownRight
                  size={22}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5 text-[#2A2421]"
                />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}