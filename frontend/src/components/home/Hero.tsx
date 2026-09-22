import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowDownRight } from "react-icons/fi";
import { StoreService, type CMSContent } from "../../services/supabase";

export default function Hero() {
  const [cms, setCms] = useState<CMSContent["heroBanner"]>({
    title: "moment.",
    imageUrl:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=90",
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
    <section className="relative min-h-[calc(100dvh-76px)] overflow-hidden px-3.5 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4">
      <div className="relative mx-auto flex min-h-[calc(100dvh-96px)] max-w-[1600px] overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-[#1E1614] shadow-md">
        {/* Background image */}
        <motion.img
          key={cms.imageUrl}
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          src={cms.imageUrl}
          alt="RS Fashions SiCo collection"
          className="absolute inset-0 h-full w-full object-cover object-center saturate-[1.1]"
        />

        {/* Cinematic Vignette */}
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/15" />
        <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-[#8E3D51]/20 blur-[130px]" />

        {/* Hero Content */}
        <div className="relative z-10 flex min-h-full w-full flex-col justify-between p-6 sm:p-10 lg:p-14">
          <div>
          </div>

          <div className="flex w-full items-end justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="max-w-xl"
            >
              <h1 className="font-serif text-3xl font-light tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
                Draped in timeless{" "}
                <span className="italic font-normal bg-linear-to-r from-rose-200 via-amber-200 to-amber-100 bg-clip-text text-transparent">
                  grace
                </span>
                .
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-stone-200/90 font-light max-w-md">
                Direct handloom dispatches of authentic SiCo Gadwal sarees from Telangana pit-looms.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Link
                to={cms.link || "/shop"}
                className="group flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-[#FAF7F2] text-[#2A2421] shadow-xl transition-all duration-300 hover:scale-110 hover:bg-white active:scale-95"
                aria-label="Shop the collection"
              >
                <FiArrowDownRight
                  size={24}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5 text-[#8E3D51]"
                />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Vertical watermark */}
        <div className="absolute bottom-8 right-6 hidden origin-right rotate-90 text-[9px] uppercase tracking-[0.35em] text-white/40 sm:block pointer-events-none">
          RS FASHIONS &middot; TELANGANA LOOMS
        </div>
      </div>
    </section>
  );
}