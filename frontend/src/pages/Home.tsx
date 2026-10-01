import { lazy, Suspense } from "react";
import { motion } from "framer-motion";

import SEO from "../components/common/SEO";
import Hero from "../components/home/Hero";
import MaterialCollections from "../components/home/MaterialCollections";
import LazySection from "../components/common/LazySection";

// Below-the-fold sections load their code and data only when scrolled near.
const ForSaleProducts = lazy(() => import("../components/home/ForSaleProducts"));
const TrendingProducts = lazy(() => import("../components/home/TrendingProducts"));
const ProductShowcase = lazy(() => import("../components/home/ProductShowcase"));
const CinematicReel = lazy(() => import("../components/home/CinematicReel"));

function Home() {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      transition={{
        duration: 0.4,
      }}
    >
      <SEO
        title="RS Fashions — Authentic Handloom SiCo Gadwal & Silk Sarees"
        description="Shop authentic handloom SiCo Gadwal sarees, pure Kanchipuram silks, Kuttu border weaves, and bridal heritage collections at RS Fashions. Thoughtfully chosen artisan drapes shipped across India."
        canonicalPath="/"
      />
      <Hero />

      {/* <Marquee
        text="RS FASHIONS · ELEGANCE WITHOUT EFFORT"
        speed={26}
      /> */}

      <MaterialCollections />

      <LazySection minHeight={420}><Suspense fallback={null}><ForSaleProducts /></Suspense></LazySection>

      {/* Trending Section: Exclusively displays sarees marked as Special Offer */}
      <LazySection minHeight={520}><Suspense fallback={null}><TrendingProducts /></Suspense></LazySection>

      {/* Full-Screen Curved Lookbook Showcase */}
      <LazySection minHeight={600}><Suspense fallback={null}><ProductShowcase /></Suspense></LazySection>

      {/* Netflix Cinematic View & Infinite Artisan Marquee Reel */}
      <LazySection minHeight={600}><Suspense fallback={null}><CinematicReel /></Suspense></LazySection>
    </motion.div>
  );
}

export default Home;
