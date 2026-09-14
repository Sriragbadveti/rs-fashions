import { useState } from "react";
import { FiMessageCircle, FiMail } from "react-icons/fi";
import ProductAccordion from "./ProductAccordion";

const faqCategories = ["All", "Draping & Fit", "Care & Silk Mark", "Delivery"];

const faqData = [
  {
    category: "Draping & Fit",
    title: "Is the saree ready to wear, and does it include Fall & Pico?",
    content:
      "All our sarees come with complimentary pre-stitched Fall and hand-finished Pico roll edges. Each drape measures 5.5 meters and includes an attached unstitched 0.8-meter matching blouse piece.",
  },
  {
    category: "Care & Silk Mark",
    title: "Are these authentic handloom silks certified by Silk Mark?",
    content:
      "Yes. Every authentic SiCo Gadwal saree carries an authorized handloom authenticity card and certified weave verification inside your package.",
  },
  {
    category: "Care & Silk Mark",
    title: "How should I clean and preserve the zari embroidery?",
    content:
      "We strictly recommend professional dry cleaning for all zari and pure silk textiles. Store folded in a breathable unbleached muslin/cotton saree bag, away from direct sunlight and humidity.",
  },
  {
    category: "Delivery",
    title: "How long does insured express delivery take?",
    content:
      "Domestic metro orders arrive within 2–4 business days. All packages are insured and dispatched in double-walled luxury rigid boxes to preserve the fold integrity.",
  },
  {
    category: "Delivery",
    title: "What is your return & exchange policy on bridal drapes?",
    content:
      "We offer a 7-day doorstep return and exchange window for unused drapes with intact security tags and original gift packaging. Custom stitched blouses are non-returnable.",
  },
];

function ProductFAQ() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredItems =
    activeCategory === "All"
      ? faqData
      : faqData.filter((item) => item.category === activeCategory);

  return (
    <section className="bg-[#FAF7F2] px-4 py-16 font-sans select-none sm:px-6 sm:py-24 lg:px-12">
      <div className="mx-auto grid max-w-350 gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        
        {/* Left Column: Editorial Heading & Stylist Concierge */}
        <div className="flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8C7A6B]">
              Client Concierge
            </span>

            <h2 className="mt-3 font-serif text-3xl sm:text-5xl font-light tracking-tight text-[#2A2421]">
              Frequently <br />
              <span className="italic font-normal">asked questions.</span>
            </h2>

            <p className="mt-4 max-w-sm text-xs sm:text-sm font-light leading-relaxed text-[#756A60]">
              Everything you need to know regarding pure silk certification, fall/pico finishes, care rituals, and insured deliveries.
            </p>

            {/* Category Filter Chips */}
            <div className="mt-6 flex flex-wrap gap-2">
              {faqCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-3.5 py-1.5 text-[11px] font-medium tracking-wide transition-all ${
                    activeCategory === cat
                      ? "bg-[#2A2421] text-[#FAF7F2] shadow-sm"
                      : "border border-black/10 bg-white/60 text-[#544B44] hover:bg-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Need Stylist Assistance Card */}
          <div className="mt-10 rounded-2xl border border-[#8E3D51]/15 bg-[#FAF4ED] p-5">
            <p className="font-serif text-base font-normal text-[#2A2421]">
              Have a bespoke drape question?
            </p>
            <p className="mt-1 text-xs font-light text-[#756A60]">
              Our in-house draping consultants and fabric curators are available daily.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-[#8E3D51] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-white transition-transform active:scale-95"
              >
                <FiMessageCircle size={13} />
                <span>WhatsApp</span>
              </a>

              <a
                href="mailto:concierge@rsfashions.com"
                className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#2A2421] transition-transform active:scale-95"
              >
                <FiMail size={13} />
                <span>Email Us</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Accordion */}
        <div>
          <ProductAccordion items={filteredItems} />
        </div>
      </div>
    </section>
  );
}

export default ProductFAQ;
