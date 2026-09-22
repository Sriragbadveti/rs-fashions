import { motion } from "framer-motion";

import Hero from "../components/home/Hero";
import MaterialCollections from "../components/home/MaterialCollections";
import ForSaleProducts from "../components/home/ForSaleProducts";
import TrendingProducts from "../components/home/TrendingProducts";
import OfferBanner from "../components/home/OfferBanner";
// import LoomStories from "../components/home/LoomStories";
import HomeFooter from "../components/home/HomeFooter";
// import Marquee from "../components/ui/Marquee";

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
      <Hero />

      {/* <Marquee
        text="RS FASHIONS · ELEGANCE WITHOUT EFFORT"
        speed={26}
      /> */}

      <MaterialCollections />

      <ForSaleProducts />

      <TrendingProducts />

      <OfferBanner />

      {/* <LoomStories /> */}

      {/* Footer temporarily hidden — remove display:none to restore */}
      <div style={{ display: "none" }}>
        <HomeFooter />
      </div>
    </motion.div>
  );
}

export default Home;
