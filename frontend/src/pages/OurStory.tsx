import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
import { Link } from "react-router-dom";
import {
  FiVolume2,
  FiVolumeX,
  FiChevronDown,
  FiHeart,
  FiArrowRight,
  FiHelpCircle,
} from "react-icons/fi";
import { Sparkles } from "lucide-react";
import { ambientSound } from "../utils/ambientAudio";

/* ============================================================================
   STORY CHAPTER ARCHIVES & DATA
============================================================================ */

interface Chapter {
  id: string;
  num: string;
  label: string;
}

const chapters: Chapter[] = [
  { id: "prologue", num: "01", label: "Our Story" },
  { id: "turning-point", num: "02", label: "The Turning Point" },
  { id: "roots", num: "03", label: "Gadwal Roots" },
  { id: "purpose", num: "04", label: "Our Purpose" },
  { id: "community", num: "05", label: "Our Community" },
  { id: "covenant", num: "06", label: "Our Promise" },
];

function AmbientGlow({
  color,
  className,
}: {
  color: "burgundy" | "gold";
  className?: string;
}) {
  const bg =
    color === "burgundy"
      ? "bg-[radial-gradient(circle_at_center,rgba(142,61,81,0.28)_0%,transparent_70%)]"
      : "bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.22)_0%,transparent_70%)]";

  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-3xl filter will-change-transform ${bg} ${
        className || ""
      }`}
      aria-hidden="true"
    />
  );
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function OurStory() {
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [activeChapter, setActiveChapter] = useState<string>("prologue");

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  const { scrollYProgress: globalScroll } = useScroll();
  const smoothProgress = useSpring(globalScroll, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  useEffect(() => {
    return () => {
      ambientSound.stop();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight * 0.45;
      for (const chap of chapters) {
        const el = document.getElementById(chap.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveChapter(chap.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const toggleSound = () => {
    const newState = ambientSound.toggle();
    setIsPlayingSound(newState);
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="relative -mt-20 min-h-screen overflow-x-hidden bg-[#100D0B] font-sans text-[#FAF7F2] selection:bg-[#8E3D51] selection:text-white"
    >
      {/* Precision Scroll Progress Header */}
      <motion.div
        className="fixed left-0 top-0 z-[100] h-[2.5px] origin-left bg-gradient-to-r from-[#8E3D51] via-[#D4AF37] to-[#FAF7F2]"
        style={{ scaleX: smoothProgress }}
      />

      {/* Screen Atmosphere Grain */}
      <div
        className="pointer-events-none fixed inset-0 z-[90] opacity-[0.035] mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Floating Story Chapter Rail */}
      <nav
        aria-label="Story chapters"
        className="fixed right-6 top-1/2 z-[80] hidden -translate-y-1/2 xl:block select-none"
      >
        <div className="flex flex-col gap-3.5 rounded-full border border-white/10 bg-[#161210]/70 p-2.5 shadow-2xl backdrop-blur-2xl">
          {chapters.map((chap) => {
            const active = activeChapter === chap.id;

            return (
              <button
                key={chap.id}
                type="button"
                onClick={() => scrollTo(chap.id)}
                title={chap.label}
                className="group relative flex h-7 w-7 items-center justify-center rounded-full"
              >
                <span
                  className={`absolute rounded-full transition-all duration-300 ${
                    active
                      ? "h-2.5 w-2.5 bg-[#D4AF37] shadow-[0_0_14px_rgba(212,175,55,0.7)]"
                      : "h-1.5 w-1.5 bg-white/20 group-hover:bg-white/60"
                  }`}
                />

                <span
                  className={`pointer-events-none absolute right-9 whitespace-nowrap rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.22em] opacity-0 shadow-xl transition-all duration-300 group-hover:opacity-100 ${
                    active
                      ? "border-[#D4AF37]/40 bg-[#161210] text-[#D4AF37]"
                      : "border-white/10 bg-[#14100E] text-stone-300"
                  }`}
                >
                  {chap.num} · {chap.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Floating Ambient Audio Toggle */}
      <div className="fixed bottom-6 left-6 z-[80] select-none">
        <button
          type="button"
          onClick={toggleSound}
          className={`flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] shadow-2xl backdrop-blur-xl transition-all duration-300 ${
            isPlayingSound
              ? "border-[#D4AF37]/60 bg-[#D4AF37]/20 text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)]"
              : "border-white/10 bg-[#161210]/80 text-stone-400 hover:border-white/30 hover:text-white"
          }`}
        >
          {isPlayingSound ? <FiVolume2 size={14} /> : <FiVolumeX size={14} />}
          <span>{isPlayingSound ? "Ambient Audio On" : "Loom Soundscape"}</span>
        </button>
      </div>

      {/* ======================================================================
          HERO SECTION: OUR STORY
      ====================================================================== */}
      <section
        id="prologue"
        ref={heroRef}
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#100D0B] select-none pt-24 pb-16"
      >
        <motion.div
          style={{ scale: heroScale, y: heroY }}
          className="absolute inset-0 z-0 will-change-transform"
        >
          <img
            src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=2400&q=92"
            alt="Traditional SiCo Gadwal pit-loom artisan craft"
            className="h-full w-full object-cover object-center filter contrast-105 brightness-[0.42]"
          />
          <div className="absolute inset-0 bg-radial from-transparent via-[#100D0B]/70 to-[#100D0B]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#100D0B]/80 via-transparent to-[#100D0B]" />
        </motion.div>

        <AmbientGlow color="burgundy" className="-left-40 top-10 h-135 w-135" />
        <AmbientGlow color="gold" className="-bottom-48 right-0 h-160 w-160" />

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 mx-auto w-full max-w-5xl px-6 text-center text-white"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#161210]/75 px-5 py-2 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
              RS Fashions Heritage
            </span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-tight leading-[1.05]"
          >
            OUR STORY
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 1 }}
            className="mx-auto mt-8 max-w-2xl font-serif text-lg sm:text-2xl md:text-3xl font-light italic leading-relaxed text-[#E8D4BE]"
          >
            I’m Kanneboina Sindhuja, Founder &amp; Proprietor of RS Fashions.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.9 }}
            className="mx-auto mt-6 max-w-xl text-xs sm:text-sm md:text-base font-light text-[#D2C7BC] leading-relaxed"
          >
            Some journeys are planned, and some simply unfold when life takes an unexpected turn.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.8 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <button
              type="button"
              onClick={() => scrollTo("turning-point")}
              className="group inline-flex items-center gap-3 rounded-full bg-[#8E3D51] px-8 py-4 text-[10.5px] font-bold uppercase tracking-[0.24em] text-white shadow-xl transition-all duration-300 hover:bg-[#A3475E] hover:shadow-[0_10px_35px_rgba(142,61,81,0.45)] active:scale-95"
            >
              <span>Read The Story</span>
              <FiChevronDown className="transition-transform duration-300 group-hover:translate-y-0.5" />
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ======================================================================
          SECTION 2: THE TURNING POINT
      ====================================================================== */}
      <section
        id="turning-point"
        className="relative min-h-[80vh] bg-[#161210] text-[#FAF7F2] py-24 px-6 sm:px-10 lg:px-16 overflow-hidden select-none"
      >
        <AmbientGlow color="burgundy" className="top-1/4 -left-48 h-150 w-150" />
        <AmbientGlow color="gold" className="bottom-10 -right-48 h-150 w-150" />

        <div className="max-w-5xl mx-auto relative z-10">
          <Reveal>
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
              <span>Chapter 01</span>
              <span className="h-px w-8 bg-[#D4AF37]/40" />
              <span>A Dream Waiting to Begin</span>
            </div>

            <h2 className="mt-4 font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#FAF7F2] leading-tight">
              When Life Gives You <br />
              <span className="italic font-normal text-[#D4AF37]">A Turning Point.</span>
            </h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6 text-sm sm:text-base md:text-lg text-[#D4C8BC] font-light leading-relaxed">
              <Reveal delay={0.1}>
                <p>
                  For years, I was part of the corporate world, while my husband worked in the gaming industry. Life was comfortable, stable and going just the way we had imagined. Yet, somewhere in the back of my mind, there was always one little dream — to create a clothing brand of my own. I had spoken about it with my husband many times, but never really took the first step.
                </p>
              </Reveal>

              <Reveal delay={0.2}>
                <p className="border-l-2 border-[#D4AF37]/70 pl-6 italic text-[#FAF7F2] font-serif text-lg sm:text-xl">
                  Then life gave us a turning point. I had to step away from my job, and around the same time, my husband’s company closed due to changes in the gaming industry.
                </p>
              </Reveal>

              <Reveal delay={0.3}>
                <p>
                  Sometimes, when one door closes, it quietly opens the door to an idea you had been waiting to pursue. That was the moment we thought — why not give our dream a chance?
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-5 relative">
              <Reveal delay={0.2}>
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-[#D4AF37]/30 shadow-2xl group">
                  <img
                    src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=90"
                    alt="Handloom weaving threads and tradition"
                    className="h-full w-full object-cover filter contrast-105 brightness-90 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#100D0B] via-transparent to-transparent opacity-85" />
                  <div className="absolute bottom-6 inset-x-6 text-center">
                    <p className="font-serif italic text-base sm:text-lg text-[#FAF7F2]">
                      "Why not give our dream a chance?"
                    </p>
                    <span className="mt-1 block text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">
                      The Spark of RS Fashions
                    </span>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          SECTION 3: ROOTS IN GADWAL & THE DISCOVERY
      ====================================================================== */}
      <section
        id="roots"
        className="relative min-h-[75vh] bg-[#14100E] text-[#FAF7F2] py-24 px-6 sm:px-10 lg:px-16 overflow-hidden select-none"
      >
        <AmbientGlow color="gold" className="top-1/3 -right-32 h-135 w-135" />

        <div className="max-w-5xl mx-auto relative z-10">
          <Reveal>
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
              <span>Chapter 02</span>
              <span className="h-px w-8 bg-[#D4AF37]/40" />
              <span>A Generational Gift</span>
            </div>

            <h2 className="mt-4 font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#FAF7F2] leading-tight">
              Roots in Gadwal. <br />
              <span className="italic font-normal text-[#D4AF37]">The Saree That Changed Everything.</span>
            </h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 order-2 lg:order-1 relative">
              <Reveal delay={0.1}>
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/15 shadow-2xl group">
                  <img
                    src="https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=90"
                    alt="Authentic SiCo Gadwal drape weaving"
                    className="h-full w-full object-cover filter contrast-105 brightness-90 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#100D0B] via-transparent to-transparent opacity-85" />
                  <div className="absolute bottom-6 inset-x-6 text-center">
                    <p className="font-serif italic text-base sm:text-lg text-[#FAF7F2]">
                      Silk-Cotton Harmony
                    </p>
                    <span className="mt-1 block text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">
                      The SiCo Gadwal Weave
                    </span>
                  </div>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-7 order-1 lg:order-2 space-y-6 text-sm sm:text-base md:text-lg text-[#D4C8BC] font-light leading-relaxed">
              <Reveal delay={0.2}>
                <p>
                  My in-laws have deep roots in Gadwal, a place known for its rich saree-weaving tradition. When my mother-in-law once gifted me a SiCo Gadwal saree, something clicked.
                </p>
              </Reveal>

              <Reveal delay={0.3}>
                <p>
                  We realised that while Gadwal sarees were already known, SiCo Gadwals were still unfamiliar to many people. The silk-cotton blend, the weaving, the intricate designs, the colours and the many beautiful concepts within this variety deserved to be discovered.
                </p>
              </Reveal>

              <Reveal delay={0.4}>
                <div className="rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#1C1613] to-[#14100E] p-6 backdrop-blur-md">
                  <p className="font-serif italic text-xl sm:text-2xl text-[#FAF7F2] leading-snug">
                    "And that became our purpose."
                  </p>
                  <p className="mt-2 text-xs sm:text-sm text-[#C9BFB5] font-light">
                    To champion SiCo Gadwals and bring this treasured handloom craft into the hearts of saree lovers everywhere.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          SECTION 4: OUR PURPOSE
      ====================================================================== */}
      <section
        id="purpose"
        className="relative min-h-[75vh] bg-[#161210] text-[#FAF7F2] py-24 px-6 sm:px-10 lg:px-16 overflow-hidden select-none"
      >
        <AmbientGlow color="burgundy" className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-160 w-160" />

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#14100E]/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.28em] text-[#D4AF37] font-semibold mb-6">
              <Sparkles size={12} />
              <span>More Than Commerce</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#FAF7F2] leading-tight">
              Not Just to Sell Sarees. <br />
              <span className="italic font-normal text-[#D4AF37]">To Share The Story.</span>
            </h2>
          </Reveal>

          <Reveal delay={0.2} className="mt-10 space-y-6 text-sm sm:text-base md:text-lg text-[#D4C8BC] font-light leading-relaxed max-w-3xl mx-auto">
            <p>
              RS Fashions was not started just to sell sarees. We wanted to introduce people to SiCo Gadwals, help them understand what they were buying, and appreciate the story behind every design, weave and colour combination.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ======================================================================
          SECTION 5: THE COMMUNITY
      ====================================================================== */}
      <section
        id="community"
        className="relative min-h-[70vh] bg-[#100D0B] text-[#FAF7F2] py-24 px-6 sm:px-10 lg:px-16 overflow-hidden select-none"
      >
        <AmbientGlow color="gold" className="-left-40 bottom-10 h-135 w-135" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6 text-sm sm:text-base md:text-lg text-[#D4C8BC] font-light leading-relaxed">
              <Reveal>
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold mb-4">
                  <span>Chapter 03</span>
                  <span className="h-px w-8 bg-[#D4AF37]/40" />
                  <span>A Growing Family</span>
                </div>

                <h2 className="font-serif text-3xl sm:text-5xl font-light tracking-tight text-[#FAF7F2] leading-tight">
                  From One Saree and One Idea <br />
                  <span className="italic font-normal text-[#D4AF37]">To A Thriving Community.</span>
                </h2>
              </Reveal>

              <Reveal delay={0.15}>
                <p>
                  What began with one saree and one idea slowly grew into a beautiful community that embraced SiCo Gadwals with so much love. Seeing more people discover and recognise this beautiful variety has been one of the most fulfilling parts of our journey.
                </p>
              </Reveal>

              <Reveal delay={0.25}>
                <p>
                  Today, from a dream we once only spoke about, RS Fashions has grown into a brand loved by thousands. And as we take our next step with our very own website, we carry the same purpose with us —
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-5 relative">
              <Reveal delay={0.2}>
                <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#1C1513] to-[#120E0C] p-8 sm:p-10 flex flex-col justify-center text-center shadow-2xl">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#8E3D51]/30 text-[#E892A2] mb-5 border border-[#8E3D51]/50">
                    <FiHeart size={24} />
                  </div>
                  <p className="font-serif text-2xl sm:text-3xl font-light text-[#FAF7F2]">
                    Loved by Thousands
                  </p>
                  <p className="mt-3 text-xs sm:text-sm text-[#C9BFB5] font-light leading-relaxed">
                    A vibrant community connected by authenticity, exquisite craftsmanship, and timeless Gadwal elegance.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          SECTION 6: THE COVENANT & CLOSING
      ====================================================================== */}
      <section
        id="covenant"
        className="relative min-h-screen bg-[#100D0B] text-[#FAF7F2] py-28 px-6 sm:px-10 lg:px-16 overflow-hidden select-none"
      >
        <AmbientGlow color="burgundy" className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-185 w-220" />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-3xl border border-[#D4AF37]/25 bg-gradient-to-b from-[#1A1412] via-[#140F0D] to-[#100D0B] p-8 sm:p-14 lg:p-20 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.8)]"
          >
            {/* Wax Seal Emblem */}
            <div className="flex flex-col items-center text-center mb-10">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-[#8E3D51] text-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.4)]">
                <span className="font-serif text-xl font-bold tracking-widest">RS</span>
                <div className="absolute -inset-1 rounded-full border border-[#D4AF37]/30 animate-pulse" />
              </div>
              <span className="mt-4 text-[10px] uppercase tracking-[0.35em] text-[#D4AF37] font-semibold">
                Founder's Heart &bull; RS Fashions
              </span>
              <h2 className="mt-2 font-serif text-2xl sm:text-4xl font-light text-[#FAF7F2]">
                Our Unbroken Promise
              </h2>
            </div>

            {/* Letter Prose */}
            <div className="space-y-6 text-sm sm:text-base md:text-lg text-[#D4C8BC] font-light leading-relaxed font-sans text-center">
              <p className="font-serif text-xl sm:text-2xl md:text-3xl text-[#FAF7F2] italic leading-relaxed">
                "to bring beautiful Gadwal sarees closer to you, with authenticity, knowledge and a lot of heart."
              </p>

              <div className="mx-auto h-px w-24 bg-[#D4AF37]/40 my-8" />

              <p className="text-base sm:text-lg font-normal text-[#FAF7F2]">
                This is not just a business we started.
              </p>

              <p className="font-serif text-xl sm:text-2xl text-[#D4AF37] italic font-normal">
                This is a dream we chose to believe in.
              </p>
            </div>

            {/* Founder Sign-off */}
            <div className="mt-14 pt-8 border-t border-white/10 text-center">
              <p className="font-serif text-2xl sm:text-3xl font-light italic text-[#D4AF37]">
                Kanneboina Sindhuja
              </p>
              <p className="text-xs uppercase tracking-[0.25em] text-[#A89C8F] mt-1.5 font-medium">
                Founder &amp; Proprietor &bull; RS Fashions
              </p>
            </div>
          </motion.div>

          {/* Final Call to Action */}
          <div className="mt-20 text-center">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#8E3D51] font-semibold">
              Explore The Heritage
            </span>
            <h3 className="mt-3 font-serif text-3xl sm:text-5xl font-light text-[#FAF7F2]">
              Discover Authentic SiCo Gadwal Sarees
            </h3>
            <p className="mt-4 text-xs sm:text-sm text-[#C9BFB5] font-light max-w-lg mx-auto leading-relaxed">
              Every saree in our collection is crafted with authenticity, knowledge, and a lot of heart.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/shop"
                className="group flex items-center gap-2.5 rounded-full bg-[#D4AF37] px-8 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#100D0B] transition-all duration-300 hover:bg-[#E8C560] hover:shadow-[0_10px_35px_rgba(212,175,55,0.4)] active:scale-95"
              >
                <span>Explore The Shop</span>
                <FiArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <a
                href="https://wa.me/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#FAF7F2] transition-all hover:bg-white/10 active:scale-95"
              >
                <FiHelpCircle size={14} className="text-[#D4AF37]" />
                <span>Contact Us</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </motion.main>
  );
}