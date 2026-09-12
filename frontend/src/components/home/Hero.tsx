import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowDownRight } from "react-icons/fi";
import { StoreService, type CMSContent } from "../../services/supabase";

function Hero() {
  const [cms, setCms] = useState<CMSContent["heroBanner"]>({
    title: "moment.",
    subtitle: "Timeless silhouettes, effortless elegance, and pieces made to become memories.",
    badge: "The New Collection · 2026",
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=90",
    link: "/shop",
  });

  useEffect(() => {
    async function loadCMS() {
      try {
        const data = await StoreService.getCMSContent();
        if (data?.heroBanner) {
          setCms(data.heroBanner);
        }
      } catch (err) {
        console.warn("Failed to load CMS content for Hero:", err);
      }
    }
    loadCMS();
  }, []);

  return (
    <section className="relative min-h-[calc(100dvh-76px)] overflow-hidden px-4 pb-5 pt-4 sm:px-6">
      <div className="relative mx-auto flex min-h-[calc(100dvh-96px)] max-w-[1600px] overflow-hidden rounded-4xl bg-[#d9c9be] sm:rounded-[2.5rem]">
        {/* Background image */}
        <motion.img
          key={cms.imageUrl}
          initial={{
            scale: 1.12,
          }}
          animate={{
            scale: 1,
          }}
          transition={{
            duration: 1.8,
            ease: [0.22, 1, 0.36, 1],
          }}
          src={cms.imageUrl}
          alt="RS Fashions collection"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/15 to-black/5" />

        {/* Soft light */}
        <div className="absolute right-[-20%] top-[-15%] h-[60%] w-[70%] rounded-full bg-[#f2d8cf]/25 blur-[120px]" />

        {/* Top badge */}
        <motion.div
          initial={{
            opacity: 0,
            y: -20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.7,
            duration: 0.8,
          }}
          className="absolute left-5 top-5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-xl sm:left-8 sm:top-8"
        >
          {cms.badge || "The New Collection · 2026"}
        </motion.div>

        {/* Hero content */}
        <div className="relative z-10 flex min-h-full w-full flex-col justify-end p-6 sm:p-10 lg:p-14">
          <motion.p
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.4,
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/70"
          >
            Crafted for every story
          </motion.p>

          <motion.h1
            initial={{
              opacity: 0,
              y: 60,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.5,
              duration: 1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="max-w-4xl font-display text-[clamp(4rem,14vw,10rem)] leading-[0.78] tracking-[-0.04em] text-white"
          >
            Dress the
            <br />
            <span className="italic font-normal">
              {cms.title?.includes("moment") ? "moment." : cms.title || "moment."}
            </span>
          </motion.h1>

          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.8,
              duration: 0.8,
            }}
            className="mt-8 flex items-end justify-between gap-5"
          >
            <p className="max-w-65 text-sm leading-6 text-white/75 sm:text-base">
              {cms.subtitle || "Timeless silhouettes, effortless elegance, and pieces made to become memories."}
            </p>

            <Link
              to={cms.link || "/shop"}
              className="group flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#f8f4ef] text-[#211b18] transition-all duration-500 hover:scale-110 active:scale-95"
              aria-label="Shop the collection"
            >
              <FiArrowDownRight
                size={25}
                className="transition-transform duration-500 group-hover:translate-x-1 group-hover:translate-y-1"
              />
            </Link>
          </motion.div>
        </div>

        {/* Vertical side text */}
        <div className="absolute bottom-8 right-6 hidden origin-right rotate-90 text-[9px] uppercase tracking-[0.35em] text-white/50 sm:block">
          RS FASHIONS · MADE TO BE REMEMBERED
        </div>
      </div>
    </section>
  );
}

export default Hero;
