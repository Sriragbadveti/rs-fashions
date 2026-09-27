import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight } from "react-icons/fi";
import tempImg1 from "../../assets/images/Home.jpg";
import tempImg2 from "../../assets/images/Home1.jpg";
import tempImg3 from "../../assets/images/Home_laptop_1.png";

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
    image: tempImg1,
  },
  {
    id: "gatti-border",
    name: "Gatti Borders",
    accent: "from-emerald-600/80 to-teal-500/80",
    borderGlow: "hover:border-emerald-400/60",
    link: "/shop?search=Gatti+Borders",
    image: tempImg2,
  },
  {
    id: "checks-gadwal",
    name: "Vintage Checks",
    accent: "from-amber-500/80 to-orange-600/80",
    borderGlow: "hover:border-amber-400/60",
    link: "/shop?search=Vintage+Checks",
    image: tempImg3,
  },
  {
    id: "kanchi-border",
    name: "Kanchi Borders",
    accent: "from-fuchsia-600/80 to-[#8E3D51]/80",
    borderGlow: "hover:border-fuchsia-400/60",
    link: "/shop?search=Big+Kanchi",
    image: tempImg1,
  },
];

export default function MaterialCollections() {
  const [isPaused, setIsPaused] = useState(false);

  // Triple the items to ensure seamless infinite looping on all screen sizes
  const repeatedMaterials = [...materials, ...materials, ...materials];

  return (
    <section className="relative overflow-hidden bg-[#FAF7F2] py-10 font-sans select-none sm:py-14">
      <style>{`
        @keyframes continuousMarquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% / 3));
          }
        }

        .marquee-track {
          display: flex;
          width: max-content;
          animation: continuousMarquee 32s linear infinite;
          will-change: transform;
        }

        .marquee-track.paused {
          animation-play-state: paused;
        }
      `}</style>

      {/* Jewel-Tone Background Light */}
      <div className="pointer-events-none absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-gradient-to-br from-[#8E3D51]/15 to-rose-400/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-gradient-to-tl from-[#D47E37]/15 to-amber-300/10 blur-[120px]" />

      <div className="mx-auto max-w-[1600px] px-3.5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-2 pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="mt-2 font-serif text-2xl font-light tracking-tight text-[#2B1B17] sm:text-4xl lg:text-5xl">
              Feel the{" "}
              <span className="bg-gradient-to-r from-[#8E3D51] via-[#C94A67] to-[#D47E37] bg-clip-text italic font-normal text-transparent">
                weave
              </span>
              .
            </h2>
          </div>

          <p className="max-w-xs text-xs text-stone-600 hidden sm:block">
            Handcrafted heritage weaves celebrating classic textures, heirloom, and contrasting borders.
          </p>
        </div>
      </div>

      {/* Continuous Marquee Rail */}
      <div
        className="relative w-full overflow-hidden py-4 -my-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div className={`marquee-track gap-4 sm:gap-6 px-3.5 sm:px-6 lg:px-8 ${isPaused ? "paused" : ""}`}>
          {repeatedMaterials.map((mat, idx) => (
            <div
              key={`marquee-card-${mat.id}-${idx}`}
              className="w-56 shrink-0 sm:w-64"
            >
              <Link
                to={mat.link}
                className="group relative flex aspect-[3/4.2] w-full flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl bg-black p-4 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 active:scale-[0.98]"
              >
                {/* Saree Image */}
                <img
                  src={mat.image}
                  alt={mat.name}
                  loading="lazy"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover object-center saturate-[1.2] contrast-[1.05] transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
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
        </div>
      </div>
    </section>
  );
}