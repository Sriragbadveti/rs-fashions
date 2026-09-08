import { motion } from "framer-motion";

import Hero from "../components/home/Hero";
import MaterialCollections from "../components/home/MaterialCollections";
import TrendingProducts from "../components/home/TrendingProducts";
import OfferBanner from "../components/home/OfferBanner";
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
        text="BECHO · ELEGANCE WITHOUT EFFORT"
        speed={26}
      /> */}

      <MaterialCollections />

      <TrendingProducts />

      <OfferBanner />

      <HomeFooter />
    </motion.div>
  );
}

export default Home;