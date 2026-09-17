import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
import { Link } from "react-router-dom";
import {
  FiVolume2,
  FiVolumeX,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCompass,
  FiCheck,
  FiHeart,
  FiAward,
  FiGlobe,
  FiUsers,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiArrowRight,
  FiShield,
  FiArrowDown,
  FiStar,
  FiHelpCircle,
} from "react-icons/fi";
import { ambientSound } from "../utils/ambientAudio";

/* ============================================================================
   STORY CHAPTER ARCHIVES & DATA COLLECTIONS
============================================================================ */

interface Chapter {
  id: string;
  num: string;
  label: string;
}

const chapters: Chapter[] = [
  { id: "prologue", num: "01", label: "Prologue" },
  { id: "founders", num: "02", label: "The Visionaries" },
  { id: "crucible", num: "03", label: "The Crucible" },
  { id: "achievements", num: "04", label: "Scale & Impact" },
  { id: "voices", num: "05", label: "Artisan Voices" },
  { id: "covenant", num: "06", label: "The Covenant" },
];

interface Founder {
  id: string;
  name: string;
  role: string;
  tagline: string;
  quote: string;
  bio: string[];
  contributions: string[];
  image: string;
  signature: string;
}

const founders: Founder[] = [
  {
    id: "srirag",
    name: "Srirag Badveti",
    role: "Founder & Creative Director",
    tagline: "The Guardian of the Loom",
    quote:
      "When a woman drapes our saree, she isn't wearing fabric. She is wrapping herself in ninety days of a weaver's patience, five hundred knots of pure zari, and our family's unbroken promise.",
    bio: [
      "Raised with a deep reverence for Indian textile heritage, Srirag was captivated by the rhythmic 'thud-clack' of pit-looms in rural Telangana. As modern commerce pivoted to cheap polyester blends, he saw generational wisdom slipping away.",
      "Srirag personally reviews every warp lot before weaving begins. He spent months on weaver cottage floors in Gadwal, mastering the complex geometry of traditional interlocked 'kuttu' borders and reviving temple motifs that had been shelved for decades.",
    ],
    contributions: [
      "Revived heirloom SiCo Gadwal drapes, delivering featherlight yet opulent festive weaves.",
      "Mandates 100% natural yarns and certified tested zari, barring synthetic foils.",
      "Curates shade palettes and border geometry directly with master weaver guild elders.",
      "Instituted zero-defect microscopic inspection standards for bridal drapes.",
    ],
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1600&q=90",
    signature: "Srirag Badveti",
  },
  {
    id: "himanshu",
    name: "Himanshu Dugar",
    role: "Co-Founder & Head of Operations",
    tagline: "The Architect of the Guild",
    quote:
      "We didn't build RS Fashions merely to sell sarees. We built it so that when a master weaver's daughter looks at her father's wooden loom, she sees pride, dignity, and an enduring future — not poverty.",
    bio: [
      "Himanshu serves as the operational engine of RS Fashions. In an industry plagued by predatory middlemen and delayed artisan payments, he designed an equitable, transparent supply chain from the ground up.",
      "From hauling 40-kg trunks on unreserved train berths to building direct fulfillment pipelines across North America, Europe, and the Gulf, Himanshu ensures artisan dignity is matched by global service.",
    ],
    contributions: [
      "Bypassed predatory commission brokers to institute direct artisan trade cooperatives.",
      "Pioneered same-day wage settlements for 350+ weaving families upon saree completion.",
      "Established the RS Fashions emergency healthcare and loom sustenance fund.",
      "Engineered secure global fulfillment, connecting rural pit-looms to patrons across 22 countries.",
    ],
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1600&q=90",
    signature: "Himanshu Dugar",
  },
];

interface StruggleChapter {
  year: string;
  phase: string;
  title: string;
  context: string;
  theStruggle: string;
  theTurningPoint: string;
  quote: string;
  speaker: string;
  metric: string;
  metricLabel: string;
  image: string;
}

const struggleChapters: StruggleChapter[] = [
  {
    year: "2019",
    phase: "The Midnight Berths",
    title: "Sleeping on Station Benches with 40kg Sample Trunks",
    context: "Gadwal & Varanasi Weaver Belts",
    theStruggle:
      "With barely enough capital for unreserved second-class train tickets, Srirag and Himanshu traveled overnight across Telangana and Uttar Pradesh. They slept on cold railway benches, using wooden sample trunks as pillows so their collection wouldn't be stolen. In wholesale corridors, fourteen consecutive brokers rejected them: 'Handloom is dead. Blend nylon, slash weaver wages, and sell cheap.'",
    theTurningPoint:
      "They refused to listen. They spent their remaining cash buying authentic raw mulberry silk directly from elderly weavers whose looms had stood idle for months.",
    quote:
      "We survived on bananas and railway chai three nights a week, but we swore we would never dilute a single strand of zari.",
    speaker: "Himanshu Dugar",
    metric: "14",
    metricLabel: "Wholesale Rejections",
    image:
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1400&q=90",
  },
  {
    year: "2020",
    phase: "The Loom Freeze Crisis",
    title: "Mortgaging Personal Gold to Keep 60 Pit-Looms Alive",
    context: "The Lockdown Crucible",
    theStruggle:
      "When lockdowns struck, all logistics ceased and retail was paralyzed. Weavers were stranded without yarn or food, with families on the verge of breaking antique wooden looms for firewood. RS Fashions had zero incoming revenue, with warehouse rent and bills mounting.",
    theTurningPoint:
      "Srirag and Himanshu emptied their personal savings, pledged their family gold jewelry, and wired grocery funds and advance wages to 60 master weavers in rural Telangana. Their pledge was simple: 'Keep your shuttles moving. Do not break the loom. We promise we will sell every yard you weave.'",
    quote:
      "If the looms went cold during that lockdown, three centuries of Gadwal memory would have died with them. We had no right to let that happen.",
    speaker: "Srirag Badveti",
    metric: "60+",
    metricLabel: "Weaver Families Sustained",
    image:
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1400&q=90",
  },
  {
    year: "2021",
    phase: "The Counterfeit War",
    title: "Boycotting the Machine-Made Synthetic Flood",
    context: "Standing Against Imitation Silk",
    theStruggle:
      "The market was saturated with cheap Chinese polyester imitations falsely labeled 'Pure Gadwal'. Commercial brokers pressured RS Fashions: 'Blend 30% nylon in the weft; no customer can tell the difference in pictures.' It would have tripled profit margins overnight while they were financially bleeding.",
    theTurningPoint:
      "They instituted radical transparency. RS Fashions became one of the few boutique houses to introduce certified Silk Mark testing and live video burn-tests for patrons. They lost short-term margins, but won the enduring trust of brides seeking genuine heirlooms.",
    quote:
      "We told our patrons the truth: authentic handloom has tiny human imperfections because artisan hands knotted it, not a computer.",
    speaker: "Himanshu Dugar",
    metric: "100%",
    metricLabel: "Silk Mark Tested",
    image:
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1400&q=90",
  },
  {
    year: "2022",
    phase: "The 4 AM Living Room",
    title: "Packaging Every Saree with Handwritten Letters",
    context: "The Word-of-Mouth Wave",
    theStruggle:
      "Operating with zero marketing budget from a 120-sq-ft living room, every drape was examined under warm halogen bulbs, ironed by hand between archival butter sheets, and paired with an individualized note recounting the weaver who crafted it.",
    theTurningPoint:
      "A bride in New Jersey posted an unboxing video of her wedding saree. Within weeks, orders poured in from Hyderabad, Bangalore, Dallas, and London. The organic patronage wave had begun.",
    quote:
      "When you pack a saree at 4 AM with tired eyes, thinking of the bride who will step onto her mandap wearing it — exhaustion turns into reverence.",
    speaker: "Srirag Badveti",
    metric: "22",
    metricLabel: "Countries Reached",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1400&q=90",
  },
];

interface StatItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: string;
  label: string;
  subtext: string;
}

const stats: StatItem[] = [
  {
    icon: FiDollarSign,
    value: "₹8.5+ Cr",
    label: "Artisanal Sales Delivered",
    subtext:
      "Achieved without outside venture capital — powered entirely by organic patron trust and word of mouth.",
  },
  {
    icon: FiUsers,
    value: "350+",
    label: "Master Weaver Households",
    subtext:
      "Ensuring stable, year-round livelihood at rates 3x higher than commercial middleman rates.",
  },
  {
    icon: FiGlobe,
    value: "18,500+",
    label: "Heirloom Drapes Shipped",
    subtext:
      "Adorning brides and discerning patrons across 22 countries from London to California.",
  },
  {
    icon: FiAward,
    value: "100%",
    label: "Certified Silk Mark Purity",
    subtext:
      "Every thread lab-certified. Zero synthetic blends, zero compromise on authentic zari weave.",
  },
  {
    icon: FiClock,
    value: "24-Hour",
    label: "Direct Wage Settlement",
    subtext:
      "Weavers receive direct bank transfers on the exact day their saree completes its inspection.",
  },
  {
    icon: FiCheckCircle,
    value: "0",
    label: "Middlemen or Brokers",
    subtext:
      "A direct bridge from the pit-loom artisan in Gadwal straight to your celebratory mandap.",
  },
];

interface SalesMilestone {
  period: string;
  title: string;
  achievement: string;
  significance: string;
}

const salesMilestones: SalesMilestone[] = [
  {
    period: "Phase I · 2020",
    title: "The Initial ₹10 Lakh Month",
    achievement:
      "Sold our debut 120-saree archive in under 48 hours via private WhatsApp consultations.",
    significance:
      "Proved that modern women value handloom soul over mass fast-fashion garments.",
  },
  {
    period: "Phase II · 2022",
    title: "Crossing ₹1 Crore Cumulative",
    achievement:
      "Crossed ₹1 Crore in sales with zero paid advertising or commercial marketing spend.",
    significance:
      "100% of profits were reinvested directly into advance raw mulberry silk yarn procurement for weavers.",
  },
  {
    period: "Phase III · 2024",
    title: "Jubilee Hills Private Salon",
    achievement:
      "Opened our bespoke private viewing sanctuary in Jubilee Hills, Hyderabad by appointment.",
    significance:
      "Provided brides an intimate haven to feel and experience authentic SiCo Gadwal weaves.",
  },
  {
    period: "Phase IV · 2026",
    title: "Global Vault & Living Heritage",
    achievement:
      "Achieved ₹8.5+ Crores with patrons across North America, Europe, Australia, and the Middle East.",
    significance:
      "Established RS Fashions as a trusted modern custodian of endangered Indian handloom drapes.",
  },
];

interface ArtisanVoice {
  id: string;
  artisanName: string;
  role: string;
  village: string;
  experience: string;
  quote: string;
  impactStory: string;
  image: string;
}

const artisanVoices: ArtisanVoice[] = [
  {
    id: "narasimha",
    artisanName: "Master Weaver Narasimha Swamy",
    role: "SiCo Gadwal Pit-Loom Elder",
    village: "Gadwal Artisan Cluster, Telangana",
    experience: "42 Years on the Loom",
    quote:
      "When Srirag and Himanshu first arrived in our lane, three out of five pit-looms were covered in cobwebs. Commission brokers hadn't paid us in six months. Srirag sat on our mud floor, inspected the thread count with his own hands, and Himanshu transferred our full wage before the sun set. Today, my pit-loom sings every morning at 6 AM, and my daughter is completing her engineering degree.",
    impactStory:
      "Father of 3, 3rd generation weaver. Now leads a guild of 18 pit-looms exclusively for RS Fashions.",
    image:
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1400&q=90",
  },
  {
    id: "shakuntala",
    artisanName: "Shakuntala Devi",
    role: "Kuttu Interlocking Border Specialist",
    village: "Gadwal Heritage Colony",
    experience: "28 Years of Handloom Weaving",
    quote:
      "Every merchant who came to our village wanted us to weave faster with cheap polyester blends so they could sell sarees for cheap. RS Fashions was the only one who said: 'Take forty-five days. Do not cut a single corner. We want the world to see what true Indian silk feels like.' When a customer in London or New York buys that drape, they are keeping our pride alive.",
    impactStory:
      "Preserved the sacred 3-shuttle interlocking border technique taught to her by her mother.",
    image:
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1400&q=90",
  },
  {
    id: "govindram",
    artisanName: "Govindram Sharma",
    role: "Zari & Pure Mulberry Silk Guild Lead",
    village: "Varanasi Heritage Belt",
    experience: "35 Years of Tested Zari Craft",
    quote:
      "Himanshu told me on day one: 'Uncle, you will never have to chase me for money.' In thirty-five years of weaving, I have never seen young founders who treat artisans like equals. They don't just order sarees; they know our children by name. When you wear RS Fashions, remember that every golden motif was knotted by hands that were honored.",
    impactStory:
      "Oversees testing and certification for pure silver and electroplated tested-zari drapes.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1400&q=90",
  },
];

/* ============================================================================
   LIGHTWEIGHT SPRINT HELPERS
============================================================================ */

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.85,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.35em] text-[#D4AF37]">
      <span className="h-px w-8 bg-[#D4AF37]/40" />
      <span>{children}</span>
      <span className="h-px w-8 bg-[#D4AF37]/40" />
    </div>
  );
}

function AmbientGlow({
  className = "",
  color = "gold",
}: {
  className?: string;
  color?: "gold" | "burgundy" | "rose";
}) {
  const glowMap = {
    gold: "bg-[#D4AF37]/10",
    burgundy: "bg-[#8E3D51]/15",
    rose: "bg-[#E892A2]/10",
  };

  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-[160px] will-change-transform ${glowMap[color]} ${className}`}
    />
  );
}

/* ============================================================================
   MAIN COMPONENT
============================================================================ */

export default function OurStory() {
  const [activeChapter, setActiveChapter] = useState("prologue");
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [activeFounder, setActiveFounder] = useState("srirag");
  const [artisanIdx, setArtisanIdx] = useState(0);

  const { scrollYProgress } = useScroll();

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 26,
    mass: 0.15,
  });

  const heroScale = useTransform(smoothProgress, [0, 0.16], [1, 1.08]);
  const heroY = useTransform(smoothProgress, [0, 0.16], [0, -50]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.14], [1, 0]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  // Sync current section with right-hand chapter rail
  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY + window.innerHeight * 0.38;

      for (let i = chapters.length - 1; i >= 0; i--) {
        const section = document.getElementById(chapters[i].id);
        if (section && section.offsetTop <= position) {
          setActiveChapter(chapters[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const toggleSound = () => {
    const newState = ambientSound.toggle();
    setIsPlayingSound(newState);
  };

  const currentFounder = useMemo(
    () => founders.find((f) => f.id === activeFounder) || founders[0],
    [activeFounder]
  );

  const currentArtisan = artisanVoices[artisanIdx];

  const prevArtisan = () => {
    setArtisanIdx((curr) => (curr === 0 ? artisanVoices.length - 1 : curr - 1));
  };

  const nextArtisan = () => {
    setArtisanIdx((curr) => (curr === artisanVoices.length - 1 ? 0 : curr + 1));
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
        className="fixed left-0 top-0 z-'100' h-[2.5px] origin-left bg-linear-to-r from-[#8E3D51] via-[#D4AF37] to-[#FAF7F2]"
        style={{ scaleX: smoothProgress }}
      />

      {/* Screen Atmosphere Grain */}
      <div
        className="pointer-events-none fixed inset-0 z-'90' opacity-[0.035] mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Floating Story Chapter Rail */}
      <nav
        aria-label="Story chapters"
        className="fixed right-6 top-1/2 z-'80' hidden -translate-y-1/2 xl:block select-none"
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
                  className={`absolute rounded-full transition-all duration-300 ${active
                      ? "h-2.5 w-2.5 bg-[#D4AF37] shadow-[0_0_14px_rgba(212,175,55,0.7)]"
                      : "h-1.5 w-1.5 bg-white/20 group-hover:bg-white/60"
                    }`}
                />

                <span
                  className={`pointer-events-none absolute right-9 whitespace-nowrap rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.22em] opacity-0 shadow-xl transition-all duration-300 group-hover:opacity-100 ${active
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

      {/* ======================================================================
          ACT 0: CINEMATIC PROLOGUE & HERO
      ====================================================================== */}
      <section
        id="prologue"
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#100D0B] select-none pt-24 pb-16"
      >
        <motion.div
          style={{ scale: heroScale, y: heroY }}
          className="absolute inset-0 z-0 will-change-transform"
        >
          <img
            src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=2400&q=92"
            alt="Traditional Gadwal pit-loom artisan craft"
            className="h-full w-full object-cover object-center filter contrast-105 brightness-[0.45]"
          />
          <div className="absolute inset-0 bg-radial from-transparent via-[#100D0B]/70 to-[#100D0B]" />
          <div className="absolute inset-0 bg-linear-to-b from-[#100D0B]/80 via-transparent to-[#100D0B]" />
        </motion.div>

        <AmbientGlow color="burgundy" className="-left-40 top-10 h-137.5 w-137.5" />
        <AmbientGlow color="gold" className="-bottom-50 right-0 h-162.5 w-162.5" />

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 mx-auto w-full max-w-5xl px-6 text-center text-white"
        >

          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight leading-[1.08]"
          >
            Before the Silk. <br className="hidden sm:inline" />
            <span className="italic font-normal bg-linear-to-r from-[#FAF7F2] via-[#E8D4BE] to-[#D4AF37] bg-clip-text text-transparent">
              Before the Glory.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 1 }}
            className="mx-auto mt-8 max-w-2xl text-sm sm:text-base md:text-lg font-light leading-relaxed text-[#D2C7BC]"
          >
            In an age of high-speed powerlooms and synthetic shortcuts, two brothers chose
            the slow, sacred road of pure handloom. This is the unvarnished memory of{" "}
            <strong className="font-medium text-[#FAF7F2] underline decoration-[#D4AF37]/40 underline-offset-4">
              Srirag Badveti
            </strong>{" "}
            and{" "}
            <strong className="font-medium text-[#FAF7F2] underline decoration-[#D4AF37]/40 underline-offset-4">
              Himanshu Dugar
            </strong>{" "}
            — who mortgaged their youth to protect the sacred pit-looms of Gadwal.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.8 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <button
              type="button"
              onClick={() => scrollTo("founders")}
              className="group inline-flex items-center gap-3 rounded-full bg-[#8E3D51] px-8 py-4 text-[10.5px] font-bold uppercase tracking-[0.24em] text-white shadow-xl transition-all duration-300 hover:bg-[#A3475E] hover:shadow-[0_10px_35px_rgba(142,61,81,0.45)] active:scale-95"
            >
              <span>Begin The Journey</span>
              <FiChevronDown className="transition-transform duration-300 group-hover:translate-y-0.5" />
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ======================================================================
          ACT I: THE VISIONARIES (FOUNDERS' CHRONICLE)
      ====================================================================== */}
      <section
        id="founders"
        className="relative min-h-screen bg-[#161210] text-[#FAF7F2] py-28 px-6 sm:px-10 lg:px-16 overflow-hidden select-none"
      >
        <AmbientGlow color="burgundy" className="top-1/4 -left-48 h-150 w-150" />
        <AmbientGlow color="gold" className="bottom-10 -right-48 h-150 w-150" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-4 font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#FAF7F2]"
            >
              Two Brothers. <span className="italic font-normal text-[#D4AF37]">One Sacred Oath.</span>
            </motion.h2>
            <p className="mt-4 text-xs sm:text-sm text-[#C9BFB5] font-light leading-relaxed max-w-2xl mx-auto">
              Behind every warp and pallu at RS Fashions is a complementary partnership: one dedicated
              to the purity of the weave, the other committed to honoring the hands that craft it.
            </p>

            {/* Founder Pill Switcher */}
            <div className="mt-10 inline-flex items-center gap-2 p-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
              {founders.map((f) => {
                const isSelected = f.id === activeFounder;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveFounder(f.id)}
                    className={`relative rounded-full px-6 py-2.5 text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 ${isSelected ? "text-[#161210]" : "text-stone-300 hover:text-white"
                      }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="active-founder-pill"
                        className="absolute inset-0 rounded-full bg-[#FAF7F2] shadow-[0_4px_20px_rgba(250,247,242,0.3)]"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{f.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Founder Spotlight Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFounder.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center rounded-3xl border border-white/10 bg-linear-to-b from-white/[0.07] to-white/2 p-8 sm:p-12 lg:p-16 backdrop-blur-2xl shadow-2xl"
            >
              {/* Left: Founder Portrait */}
              <div className="lg:col-span-5 relative">
                <div className="relative aspect-3/4 w-full max-w-md mx-auto overflow-hidden rounded-2xl border border-[#D4AF37]/30 shadow-2xl group">
                  <img
                    src={currentFounder.image}
                    alt={currentFounder.name}
                    className="h-full w-full object-cover object-top filter grayscale-15 contrast-105 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-[#100D0B] via-transparent to-transparent opacity-80" />

                  <div className="absolute top-4 left-4 rounded-full border border-white/20 bg-[#100D0B]/80 backdrop-blur-md px-3.5 py-1 text-[9px] uppercase tracking-[0.25em] text-[#D4AF37]">
                    {currentFounder.tagline}
                  </div>

                  <div className="absolute bottom-5 inset-x-5 flex items-end justify-between border-t border-white/15 pt-3">
                    <div>
                      <p className="font-serif text-lg font-light text-white">{currentFounder.name}</p>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#C9BFB5]">
                        {currentFounder.role}
                      </p>
                    </div>
                    <div className="font-serif italic text-sm text-[#D4AF37]/90">
                      Handloom Custodian
                    </div>
                  </div>
                </div>

                <div className="hidden sm:block absolute -top-2.5 -left-2.5 h-6 w-6 border-t-2 border-l-2 border-[#D4AF37]" />
                <div className="hidden sm:block absolute -bottom-2.5 -right-2.5 h-6 w-6 border-b-2 border-r-2 border-[#D4AF37]" />
              </div>

              {/* Right: Narrative & Pillars */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-[#D4AF37] font-semibold">
                  <span>Core Dedication</span>
                  <span className="h-px w-8 bg-[#D4AF37]/40" />
                </div>

                <blockquote className="mt-4 border-l-2 border-[#D4AF37] pl-5 sm:pl-6 py-2">
                  <p className="font-serif text-lg sm:text-xl md:text-2xl font-light italic leading-relaxed text-[#FAF7F2]">
                    "{currentFounder.quote}"
                  </p>
                </blockquote>

                <div className="mt-6 space-y-3.5 text-xs sm:text-sm text-[#C9BFB5] font-light leading-relaxed">
                  {currentFounder.bio.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>

                <div className="mt-8 border-t border-white/10 pt-6">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-medium mb-3.5">
                    Signature Contributions
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentFounder.contributions.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-white/3 p-3 text-xs text-[#FAF7F2]/90 backdrop-blur-sm"
                      >
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/20 text-[#D4AF37]">
                          <FiCheck size={11} />
                        </div>
                        <span className="font-light leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Synergy Card */}
          <div className="mt-14 rounded-2xl border border-white/10 bg-white/3 p-6 sm:p-8 text-center max-w-3xl mx-auto backdrop-blur-md">
            <div className="flex justify-center mb-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8E3D51]/20 text-[#E892A2]">
                <FiHeart size={16} />
              </div>
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-light text-[#FAF7F2]">
              The Union of Artistry &amp; Infrastructure
            </h3>
            <p className="mt-2 text-xs text-[#C9BFB5] font-light leading-relaxed max-w-xl mx-auto">
              "Srirag ensures the soul of our looms is never compromised. Himanshu ensures every weaver pouring their life into that loom is honored with financial dignity. One cannot thrive without the other."
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================================
          CINEMATIC INTERMISSION: THE PATIENCE OF WEAVE
      ====================================================================== */}
      <section className="relative flex min-h-[65vh] items-center overflow-hidden bg-[#100D0B] px-6 py-24 text-white">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=2200&q=90"
            alt="Intricate pure zari borders and master handloom motifs"
            className="h-full w-full object-cover filter brightness-[0.35] contrast-110"
          />
          <div className="absolute inset-0 bg-[#100D0B]/60" />
          <div className="absolute inset-0 bg-linear-to-r from-[#100D0B] via-transparent to-[#100D0B]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal>
            <FiStar className="mx-auto mb-5 text-[#D4AF37]" size={22} />
            <p className="font-serif text-lg sm:text-xl italic text-[#D4AF37]/90">
              "Luxury is not accelerated throughput."
            </p>
            <h2 className="mt-4 font-serif text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight">
              Luxury is <span className="italic text-[#E892A2]">unwavering patience.</span>
            </h2>
            <div className="mx-auto mt-6 h-px w-16 bg-[#D4AF37]/40" />
          </Reveal>
        </div>
      </section>

      {/* ======================================================================
          ACT II: THE CRUCIBLE (STRUGGLE & PERSEVERANCE)
      ====================================================================== */}
      <section
        id="crucible"
        className="relative min-h-screen bg-[#14100E] text-[#FAF7F2] py-28 px-6 sm:px-10 lg:px-16 overflow-hidden select-none"
      >
        <AmbientGlow color="burgundy" className="top-1/3 -right-32 h-125 w-125" />
        <AmbientGlow color="gold" className="bottom-20 -left-32 h-125 w-125" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-4 font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#FAF7F2]"
            >
              The Fire That <span className="italic font-normal text-[#D4AF37]">Forged Us.</span>
            </motion.h2>
            <p className="mt-4 text-xs sm:text-sm text-[#C9BFB5] font-light leading-relaxed max-w-2xl mx-auto">
              True luxury is not born in air-conditioned boardrooms. It was forged on midnight train platforms,
              empty bank accounts, and an unyielding refusal to compromise the weaver's craft.
            </p>
          </div>

          <div className="space-y-16 lg:space-y-24">
            {struggleChapters.map((ch, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <motion.div
                  key={ch.year}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.75, delay: idx * 0.08 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center rounded-3xl border border-white/10 bg-white/3 p-6 sm:p-10 lg:p-12 backdrop-blur-xl hover:border-[#D4AF37]/35 transition-all duration-300"
                >
                  {/* Visual Card */}
                  <div
                    className={`lg:col-span-5 relative ${isEven ? "lg:order-1" : "lg:order-2"
                      }`}
                  >
                    <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl group">
                      <img
                        src={ch.image}
                        alt={ch.title}
                        className="h-full w-full object-cover filter contrast-105 brightness-90 transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-[#100D0B] via-transparent to-transparent opacity-80" />

                      <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-white/20 bg-[#100D0B]/85 px-3 py-1 text-xs font-serif tracking-wider text-[#D4AF37] backdrop-blur-md">
                        <span>{ch.year}</span>
                        <span className="h-1 w-1 rounded-full bg-[#D4AF37]" />
                        <span className="text-[9px] uppercase font-sans tracking-widest text-stone-200">
                          {ch.phase}
                        </span>
                      </div>

                      <div className="absolute bottom-4 right-4 text-right bg-[#100D0B]/85 border border-white/10 rounded-xl p-3 backdrop-blur-md">
                        <p className="font-serif text-xl sm:text-2xl font-light text-[#D4AF37]">
                          {ch.metric}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider text-stone-400">
                          {ch.metricLabel}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Narrative Body */}
                  <div
                    className={`lg:col-span-7 flex flex-col justify-center ${isEven ? "lg:order-2" : "lg:order-1"
                      }`}
                  >
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#8E3D51] font-semibold">
                      {ch.context}
                    </span>

                    <h3 className="mt-2 font-serif text-2xl sm:text-3xl font-light tracking-tight text-[#FAF7F2]">
                      {ch.title}
                    </h3>

                    <div className="mt-5 space-y-3 text-xs sm:text-sm text-[#C9BFB5] font-light leading-relaxed">
                      <p className="border-l-2 border-red-400/40 pl-3.5 text-[#E6D7CD]">
                        <strong className="font-medium text-white block mb-0.5">
                          The Hard Reality:
                        </strong>
                        {ch.theStruggle}
                      </p>
                      <p className="border-l-2 border-[#D4AF37]/50 pl-3.5 text-[#FAF7F2]">
                        <strong className="font-medium text-[#D4AF37] block mb-0.5">
                          The Turning Point:
                        </strong>
                        {ch.theTurningPoint}
                      </p>
                    </div>

                    <div className="mt-6 rounded-2xl border border-white/5 bg-white/2 p-4 backdrop-blur-sm">
                      <p className="font-serif text-xs sm:text-sm italic text-[#FAF7F2]/90">
                        "{ch.quote}"
                      </p>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">
                        — {ch.speaker}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================================
          ACT III: SCALE, LIVING IMPACT NUMBERS & GROWTH
      ====================================================================== */}
      <section
        id="achievements"
        className="relative min-h-screen bg-[#161210] text-[#FAF7F2] py-28 px-6 sm:px-10 lg:px-16 overflow-hidden select-none"
      >
        <AmbientGlow color="burgundy" className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-175 w-225" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-4 font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#FAF7F2]"
            >
              The Numbers <span className="italic font-normal text-[#D4AF37]">Behind The Sweat.</span>
            </motion.h2>
            <p className="mt-4 text-xs sm:text-sm text-[#C9BFB5] font-light leading-relaxed max-w-2xl mx-auto">
              For Srirag and Himanshu, revenue was never a vanity metric. Every rupee earned represents a loom
              kept singing, an artisan paid with respect, and an ancient craft shielded from extinction.
            </p>
          </div>

          {/* Big Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {stats.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.08 }}
                  className="group relative rounded-3xl border border-white/10 bg-white/4 p-8 backdrop-blur-xl hover:border-[#D4AF37]/40 hover:bg-white/[0.07] transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-[#D4AF37] border border-white/10 group-hover:scale-105 transition-transform">
                      <Icon size={22} />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#A89C8F]">
                      Verified
                    </span>
                  </div>

                  <div className="font-serif text-4xl sm:text-5xl font-light tracking-tight text-[#FAF7F2] mb-2 group-hover:text-[#D4AF37] transition-colors">
                    {item.value}
                  </div>

                  <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-[#FAF7F2]/90 mb-2">
                    {item.label}
                  </h3>

                  <p className="text-xs text-[#C9BFB5] font-light leading-relaxed">
                    {item.subtext}
                  </p>

                  <div className="absolute bottom-0 inset-x-8 h-px bg-linear-to-r from-transparent via-[#D4AF37]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              );
            })}
          </div>

          {/* Horizontal Milestone Progression */}
          <div className="mt-20 rounded-3xl border border-white/10 bg-linear-to-b from-white/6 to-white/2 p-8 sm:p-12 backdrop-blur-2xl shadow-xl">
            <div className="max-w-xl mx-auto text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
                Sales &amp; Heritage Growth
              </span>
              <h3 className="mt-2 font-serif text-2xl sm:text-3xl font-light text-[#FAF7F2]">
                From a 120-Sq-Ft Room to Global Heirloom Sanctuary
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {salesMilestones.map((m, idx) => (
                <div
                  key={idx}
                  className="relative rounded-2xl border border-white/10 bg-white/3 p-6 flex flex-col justify-between backdrop-blur-sm"
                >
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#8E3D51] font-semibold block mb-2">
                      {m.period}
                    </span>
                    <h4 className="font-serif text-lg font-light text-[#FAF7F2] mb-2.5">
                      {m.title}
                    </h4>
                    <p className="text-xs text-[#C9BFB5] font-light leading-relaxed mb-4">
                      {m.achievement}
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-3">
                    <p className="text-[10.5px] italic text-[#D4AF37]/90 font-light">
                      "{m.significance}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          ACT IV: ARTISAN VOICES & THE LIVING LOOMS
      ====================================================================== */}
      <section
        id="voices"
        className="relative min-h-screen bg-[#100D0B] text-[#FAF7F2] py-28 px-6 sm:px-10 lg:px-16 overflow-hidden select-none"
      >
        <AmbientGlow color="gold" className="bottom-1/4 -right-20 h-125 w-125" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-4 font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#FAF7F2]"
            >
              Voices From <span className="italic font-normal text-[#D4AF37]">The Pit-Looms.</span>
            </motion.h2>
            <p className="mt-4 text-xs sm:text-sm text-[#C9BFB5] font-light leading-relaxed max-w-2xl mx-auto">
              A brand is defined not by what it claims in advertisements, but by what the artisans
              say when the founders are not in the room.
            </p>
          </div>

          <div className="relative rounded-3xl border border-white/10 bg-linear-to-b from-white/[0.07] to-white/2 p-8 sm:p-12 lg:p-16 backdrop-blur-2xl shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentArtisan.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
              >
                {/* Artisan Image */}
                <div className="lg:col-span-4 relative">
                  <div className="aspect-4/5 w-full max-w-sm mx-auto overflow-hidden rounded-2xl border border-white/15 shadow-xl">
                    <img
                      src={currentArtisan.image}
                      alt={currentArtisan.artisanName}
                      className="h-full w-full object-cover filter contrast-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-[#100D0B] via-transparent to-transparent opacity-75" />
                  </div>
                  <div className="absolute bottom-4 inset-x-4 text-center bg-[#100D0B]/85 border border-white/10 rounded-xl py-2 px-3 backdrop-blur-md">
                    <p className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold">
                      {currentArtisan.experience}
                    </p>
                    <p className="text-[9px] text-[#A89C8F] uppercase tracking-widest mt-0.5">
                      {currentArtisan.village}
                    </p>
                  </div>
                </div>

                {/* Unedited Testimony */}
                <div className="lg:col-span-8 flex flex-col justify-center">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-[#8E3D51]" />
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#A89C8F]">
                      Artisan Memoir · Unedited
                    </span>
                  </div>

                  <blockquote className="mt-4 border-l-2 border-[#D4AF37] pl-5 sm:pl-7 py-2">
                    <p className="font-serif text-base sm:text-lg md:text-xl font-light italic leading-relaxed text-[#FAF7F2]">
                      "{currentArtisan.quote}"
                    </p>
                  </blockquote>

                  <div className="mt-6">
                    <p className="font-serif text-lg font-light text-white">{currentArtisan.artisanName}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#D4AF37] font-semibold mt-0.5">
                      {currentArtisan.role}
                    </p>
                    <p className="text-xs text-[#C9BFB5] font-light mt-3 border-t border-white/10 pt-3">
                      <strong className="text-white font-medium">Livelihood Impact: </strong>
                      {currentArtisan.impactStory}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel Navigation */}
            <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
              <div className="flex items-center gap-2 text-xs text-[#C9BFB5]">
                <span className="font-serif text-sm text-[#D4AF37]">0{artisanIdx + 1}</span>
                <span>/</span>
                <span>0{artisanVoices.length}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={prevArtisan}
                  aria-label="Previous testimony"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#FAF7F2] transition-all hover:bg-white/15 hover:border-[#D4AF37]/50 active:scale-90"
                >
                  <FiChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={nextArtisan}
                  aria-label="Next testimony"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#FAF7F2] transition-all hover:bg-white/15 hover:border-[#D4AF37]/50 active:scale-90"
                >
                  <FiChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          ACT V: THE COVENANT (FOUNDERS' PERSONAL LETTER & FINAL CTA)
      ====================================================================== */}
      <section
        id="covenant"
        className="relative min-h-screen bg-[#100D0B] text-[#FAF7F2] py-28 px-6 sm:px-10 lg:px-16 overflow-hidden select-none"
      >
        <AmbientGlow color="burgundy" className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-187.5 w-225" />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-3xl border border-[#D4AF37]/25 bg-linear-to-b from-[#1A1412] via-[#140F0D] to-[#100D0B] p-8 sm:p-14 lg:p-20 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.8)]"
          >
            {/* Wax Seal Emblem */}
            <div className="flex flex-col items-center text-center mb-12">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-[#8E3D51] text-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.4)]">
                <span className="font-serif text-xl font-bold tracking-widest">RS</span>
                <div className="absolute -inset-1 rounded-full border border-[#D4AF37]/30 animate-pulse" />
              </div>
              <span className="mt-4 text-[10px] uppercase tracking-[0.35em] text-[#D4AF37] font-semibold">
                The Founders' Covenant · 2026
              </span>
              <h2 className="mt-2 font-serif text-2xl sm:text-4xl font-light text-[#FAF7F2]">
                A Personal Letter to Our Patrons
              </h2>
            </div>

            {/* Letter Prose */}
            <div className="space-y-6 text-sm sm:text-base text-[#D4C8BC] font-light leading-relaxed font-sans">
              <p className="first-letter:font-serif first-letter:text-4xl first-letter:text-[#D4AF37] first-letter:font-normal first-letter:float-left first-letter:mr-3 first-letter:leading-none">
                When we first packed forty kilograms of silk onto those unreserved midnight trains back in 2019, people warned us that handloom was a dying art. They told us that the modern world is too impatient for ninety days of slow pit-loom weaving, and that patrons would never know the difference between certified tested zari and plastic metallic foil.
              </p>

              <p>They were wrong. You proved them wrong.</p>

              <p>
                Every time you select an RS Fashions saree for your wedding, your mother’s milestone birthday, or a festive celebration in your home, you aren’t just making a luxury purchase. You are directly providing for Narasimha Swamy's household in Gadwal. You are ensuring Shakuntala Devi’s daughter can complete her education. You are preserving three centuries of sacred handloom knowledge from being displaced by synthetic machinery.
              </p>

              <p>
                We promise you this: As long as RS Fashions exists, our shuttles will never touch synthetic polyester. Our artisans will never wait longer than twenty-four hours for their wages. And every drape that leaves our care will carry the soul, dignity, and blessing of the weavers who crafted it.
              </p>

              <p className="text-white font-medium italic pt-2">
                With deepest gratitude and reverence for the craft,
              </p>
            </div>

            {/* Signatures */}
            <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-8 items-end">
              <div>
                <p className="font-serif text-2xl font-light italic text-[#D4AF37]">
                  Srirag Badveti
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-[#A89C8F] mt-1">
                  Founder &amp; Creative Director
                </p>
              </div>

              <div className="sm:text-right">
                <p className="font-serif text-2xl font-light italic text-[#D4AF37]">
                  Himanshu Dugar
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-[#A89C8F] mt-1">
                  Co-Founder &amp; Head of Operations
                </p>
              </div>
            </div>
          </motion.div>

          {/* Final Call to Action */}
          <div className="mt-20 text-center">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#8E3D51] font-semibold">
              Become Part of The Living Heritage
            </span>
            <h3 className="mt-3 font-serif text-3xl sm:text-5xl font-light text-[#FAF7F2]">
              Discover Your Generational Heirloom
            </h3>
            <p className="mt-4 text-xs sm:text-sm text-[#C9BFB5] font-light max-w-lg mx-auto leading-relaxed">
              Every saree in our archive is an unrepeatable masterwork. Explore our authentic SiCo Gadwal drapes and bridal collections.
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