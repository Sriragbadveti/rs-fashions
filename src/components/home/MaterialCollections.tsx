import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowUpRight } from "react-icons/fi";

const materials = [
  {
    id: "silk",
    name: "Pure Silk",
    origin: "Kanchipuram & Banaras",
    feel: "Lustrous · Heavy Drape · 100% Mulberry",
    tag: "01 / Heritage",
    link: "/shop?material=silk",
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "organza",
    name: "Organza & Tissue",
    origin: "Chanderi Weaves",
    feel: "Gossamer · Delicate Sheen · Featherlight",
    tag: "02 / Modern",
    link: "/shop?material=organza",
    image:
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "cotton",
    name: "Mulberry Cotton",
    origin: "Bengal Handlooms",
    feel: "Breathable · Soft Matte · Daily Luxury",
    tag: "03 / Artisanal",
    link: "/shop?material=cotton",
    image:
      "https://cdn.corenexis.com/f/Gr2AsoVtVeK.png",
  },
  {
    id: "bridal",
    name: "Bridal Zari",
    origin: "Royal Masterworks",
    feel: "Gold Threading · Heirloom · Bespoke",
    tag: "04 / Couture",
    link: "/shop?material=designer",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=85",
  },
];

function MaterialCollections() {
  const [activeId, setActiveId] = useState<string>("silk");

  return (
    <section className="bg-[#FAF7F2] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28 font-sans select-none">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-black/6 pb-6 sm:mb-12 md:flex-row md:items-end">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8C7A6B]">
              Textile Archive & Sensorial Library
            </span>
            <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-[#2A2421] sm:text-5xl lg:text-6xl">
              Feel the <span className="italic font-normal">weave.</span>
            </h2>
          </div>

          <p className="max-w-xs text-xs font-light leading-relaxed text-[#756A60]">
            Every drape carries slow artistry, geographic identity, and handcrafted elegance.
          </p>
        </div>

        {/* =========================================================
            MOBILE & IPAD / TABLET VIEW: 2-Column Grid Card Layout
        ========================================================== */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-5 lg:hidden">
          {materials.map((mat) => (
            <Link
              key={mat.id}
              to={mat.link}
              className="group relative flex aspect-[0.76] flex-col justify-between overflow-hidden rounded-2xl bg-[#EFEAE2] p-4 shadow-sm transition-all active:scale-[0.98] sm:aspect-[0.82] sm:p-5"
            >
              {/* Image */}
              <img
                src={mat.image}
                alt={mat.name}
                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />

              {/* Top Tag */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="rounded-full bg-black/25 px-2 py-0.5 text-[8.5px] font-medium uppercase tracking-widest text-white backdrop-blur-md">
                  {mat.tag}
                </span>

                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
                  <FiArrowUpRight size={13} />
                </span>
              </div>

              {/* Bottom Info */}
              <div className="relative z-10">
                <h3 className="font-serif text-lg font-light text-[#FAF7F2] sm:text-xl">
                  {mat.name}
                </h3>
                <p className="mt-0.5 text-[10px] text-white/70 sm:text-[11px] line-clamp-1">
                  {mat.origin}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* =========================================================
            DESKTOP / LAPTOP VIEW ONLY: Interactive Expanding Accordion
        ========================================================== */}
        <div className="hidden lg:flex lg:h-145 lg:gap-4">
          {materials.map((mat) => {
            const isActive = activeId === mat.id;

            return (
              <motion.div
                key={mat.id}
                layout
                onMouseEnter={() => setActiveId(mat.id)}
                transition={{
                  layout: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
                }}
                className={`relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-4xl p-8 transition-all duration-500 ${isActive ? "flex-[3.2]" : "flex-1"
                  }`}
              >
                {/* Background Image */}
                <motion.img
                  src={mat.image}
                  alt={mat.name}
                  className="absolute inset-0 h-full w-full object-cover object-center brightness-[0.85] transition-transform duration-700 ease-out"
                  animate={{ scale: isActive ? 1.04 : 1 }}
                />

                {/* Shading */}
                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-white/1" />

                {/* Top Badge */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-[9px] font-medium uppercase tracking-[0.25em] text-[#FAF7F2] backdrop-blur-md">
                    {mat.tag}
                  </span>

                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[11px] uppercase tracking-[0.22em] text-[#FAF7F2]/80"
                    >
                      {mat.origin}
                    </motion.span>
                  )}
                </div>

                {/* Bottom Details */}
                <div className="relative z-10">
                  <h3 className="font-serif text-2xl font-light tracking-wide text-[#FAF7F2] xl:text-4xl">
                    {mat.name}
                  </h3>

                  {isActive ? (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.1 }}
                      className="mt-3.5 flex items-end justify-between gap-4"
                    >
                      <p className="text-xs font-light tracking-wider text-[#FAF7F2]/85">
                        {mat.feel}
                      </p>

                      <Link
                        to={mat.link}
                        className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-[#FAF7F2] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2A2421] shadow-lg transition-all hover:bg-white active:scale-95"
                      >
                        <span>View Sarees</span>
                        <FiArrowUpRight
                          size={14}
                          className="transition-transform duration-300 group-hover:rotate-45"
                        />
                      </Link>
                    </motion.div>
                  ) : (
                    <p className="mt-1 text-[11px] font-light text-[#FAF7F2]/60">
                      Hover to explore
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default MaterialCollections;