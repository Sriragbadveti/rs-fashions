import { motion } from "framer-motion";
import { FiAward, FiFeather, FiCompass, FiShield, FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function OurStory() {
  const milestones = [
    {
      year: "1994",
      title: "The Genesis in Varanasi",
      desc: "Begun as a modest family loom atelier in the ancient winding alleys of Varanasi, preserving authentic kadwa and meenakari techniques.",
    },
    {
      year: "2006",
      title: "Southern Heritage Loom Guild",
      desc: "Expanded into Kanchipuram and Arani, partnering directly with multigenerational weaving families to produce pure mulberry silk temple drapes.",
    },
    {
      year: "2018",
      title: "The Silk Mark Certification",
      desc: "Earned national certification for 100% pure natural silk and ethically tested tested-zari weaves across all saree collections.",
    },
    {
      year: "2026",
      title: "Digital Vault & Global Patrons",
      desc: "Bringing artisanal heritage drapes to discerning patrons globally with transparent craftsmanship and direct artisan compensation.",
    },
  ];

  const craftPillars = [
    {
      icon: FiFeather,
      title: "Pure Natural Fibres",
      desc: "Every drape is spun from 100% authentic mulberry silk, breathable organic cotton, or weightless natural organza.",
    },
    {
      icon: FiShield,
      title: "Silk Mark Guaranteed",
      desc: "Rigorous laboratory testing for purity, ensuring you possess heirloom assets crafted to endure across generations.",
    },
    {
      icon: FiAward,
      title: "Hand-Drawn Zari Motifs",
      desc: "Intricate floral jaals, paisleys, and mythological temple borders hand-woven by master weavers over 45 to 90 days.",
    },
    {
      icon: FiCompass,
      title: "Fair Artisan Sustenance",
      desc: "100% direct remuneration to craftspeople, supporting over 300+ weaving families across Uttar Pradesh and Tamil Nadu.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#FAF7F2] font-sans text-[#2A2421]">
      {/* Hero Banner */}
      <section className="relative overflow-hidden border-b border-black/5 bg-[#2A2421] py-24 text-white sm:py-32">
        <div className="absolute inset-0 opacity-25">
          <img
            src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1600&auto=format&fit=crop"
            alt="Handloom weaving heritage"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#2A2421] via-[#2A2421]/80 to-transparent" />

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#D4AF37]"
          >
            Our Artisanal Legacy
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 font-serif text-4xl font-light tracking-tight sm:text-6xl lg:text-7xl"
          >
            Draped in <span className="italic font-normal text-[#D4AF37]">History.</span>
            <br />
            Woven for <span className="italic font-normal text-[#D4AF37]">Generations.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-xs font-light leading-relaxed text-[#D8D0C5] sm:text-sm"
          >
            At RS Fashions, a saree is never just six yards of woven thread. It is a chronicle of cultural memory, a testament to months of human patience, and an heirloom passed tenderly from mother to daughter.
          </motion.p>
        </div>
      </section>

      {/* Editorial Narrative Section */}
      <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#8E3D51]">
              The RS Fashions Philosophy
            </span>
            <h2 className="mt-3 font-serif text-3xl font-light tracking-tight text-[#2A2421] sm:text-4xl">
              Where Ancient Looms Meet Modern Poetry
            </h2>

            <div className="mt-6 space-y-4 text-xs font-light leading-relaxed text-[#6E6359] sm:text-sm">
              <p>
                Founded over three decades ago, our journey began with a simple yet passionate conviction: that the authentic, rhythmic clatter of traditional wooden pit-looms produces a soul and drape that no modern machine could ever emulate.
              </p>
              <p>
                Each saree in our Curated Vault is conceived through intimate collaboration with master weavers across the historic handloom clusters of Varanasi, Kanchipuram, Chanderi, and Bengal. From selecting unadulterated mulberry silk yarn to meticulous natural vegetable dyeing and hand-tucking zari wefts, every creation takes anywhere from three weeks to four months of unhurried artisanship.
              </p>
              <p>
                When you wrap an RS Fashions saree, you wear an uncompromised piece of living art that will retain its radiant luster through family celebrations, weddings, and milestones for decades to come.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-6 border-t border-black/10 pt-6">
              <div>
                <p className="font-serif text-3xl font-light text-[#8E3D51]">30+</p>
                <p className="text-[10px] uppercase tracking-wider text-[#8C7A6B]">Years of Craft</p>
              </div>
              <div className="h-10 w-px bg-black/10" />
              <div>
                <p className="font-serif text-3xl font-light text-[#8E3D51]">300+</p>
                <p className="text-[10px] uppercase tracking-wider text-[#8C7A6B]">Master Artisans</p>
              </div>
              <div className="h-10 w-px bg-black/10" />
              <div>
                <p className="font-serif text-3xl font-light text-[#8E3D51]">100%</p>
                <p className="text-[10px] uppercase tracking-wider text-[#8C7A6B]">Silk Mark Purity</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-[#EFEAE2] shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop"
                alt="Master Weaver Crafting Saree"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-5 shadow-2xl border border-black/5 max-w-xs hidden sm:block">
              <p className="font-serif text-xs italic text-[#2A2421]">
                "Every knot in the zari holds the breath of our ancestors."
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-widest text-[#8E3D51]">
                — Master Weaver Govindram, Varanasi
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Craft Pillars */}
      <section className="border-y border-black/5 bg-[#F3EFE9]/70 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#8E3D51]">
              Our Guiding Pillars
            </span>
            <h2 className="mt-2 font-serif text-3xl font-light text-[#2A2421] sm:text-4xl">
              The Standard of Heirloom Excellence
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {craftPillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div key={idx} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8E3D51]/10 text-[#8E3D51]">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-5 font-serif text-base font-normal text-[#2A2421]">{pillar.title}</h3>
                  <p className="mt-2 text-xs font-light leading-relaxed text-[#6E6359]">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Heritage Timeline */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="text-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#8E3D51]">
            Chronicle
          </span>
          <h2 className="mt-2 font-serif text-3xl font-light text-[#2A2421] sm:text-4xl">
            A Journey of Threads & Timeless Art
          </h2>
        </div>

        <div className="mt-16 space-y-8">
          {milestones.map((m, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm hover:border-[#8E3D51]/20 transition-all"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#FAF7F2] font-serif text-xl font-medium text-[#8E3D51] border border-black/5">
                {m.year}
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-normal text-[#2A2421]">{m.title}</h3>
                <p className="mt-1 text-xs font-light leading-relaxed text-[#6E6359]">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 rounded-3xl bg-[#2A2421] p-10 text-center text-white sm:p-16">
          <h3 className="font-serif text-3xl font-light sm:text-4xl">
            Discover your own heirloom drape
          </h3>
          <p className="mx-auto mt-3 max-w-md text-xs font-light text-[#D8D0C5]">
            Explore our curated vault of handloom Kanjivarams, Banarasis, and breathable handloom silks.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-[#8E3D51] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all hover:bg-[#722F40] active:scale-95"
            >
              <span>Explore The Vault</span>
              <FiArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
