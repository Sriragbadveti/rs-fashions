import { motion } from "framer-motion";

import SEO from "../components/common/SEO";
import Hero from "../components/home/Hero";
import MaterialCollections from "../components/home/MaterialCollections";
import ForSaleProducts from "../components/home/ForSaleProducts";
import TrendingProducts from "../components/home/TrendingProducts";
import ProductShowcase from "../components/home/ProductShowcase";
import CinematicReel from "../components/home/CinematicReel";

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

      <ForSaleProducts />

      {/* Trending Section: Exclusively displays sarees marked as Special Offer */}
      <TrendingProducts />

      {/* Full-Screen Curved Lookbook Showcase */}
      <ProductShowcase />

      {/* Netflix Cinematic View & Infinite Artisan Marquee Reel */}
      <CinematicReel />
    </motion.div>
  );
}

export default Home;
