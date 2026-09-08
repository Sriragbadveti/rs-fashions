import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus } from "react-icons/fi";

export interface AccordionItem {
  title: string;
  content: string;
}

interface ProductAccordionProps {
  items: AccordionItem[];
}

function ProductAccordion({ items }: ProductAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-black/6 border-y border-black/8 font-sans select-none">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const indexNumber = String(index + 1).padStart(2, "0");

        return (
          <div
            key={item.title}
            className={`transition-colors duration-300 ${
              isOpen ? "bg-[#2A2421]/2" : "hover:bg-[#2A2421]/1"
            }`}
          >
            {/* Question Trigger */}
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="group flex w-full items-center justify-between py-5 text-left sm:py-6"
            >
              <div className="flex items-center gap-4 sm:gap-6 pr-4">
                <span className="font-mono text-xs tracking-widest text-[#8C7A6B]">
                  {indexNumber}
                </span>

                <span
                  className={`font-serif text-lg font-light tracking-wide transition-colors duration-200 sm:text-xl ${
                    isOpen ? "text-[#8E3D51]" : "text-[#2A2421] group-hover:text-[#8E3D51]"
                  }`}
                >
                  {item.title}
                </span>
              </div>

              {/* Rotating Minimalist Pill */}
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                  isOpen
                    ? "rotate-45 bg-[#8E3D51] text-white shadow-sm"
                    : "bg-black/5 text-[#2A2421] group-hover:bg-black/10"
                }`}
              >
                <FiPlus size={15} strokeWidth={1.8} />
              </span>
            </button>

            {/* Answer Content Panel */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-6 pl-8 sm:pl-12 pr-4 sm:pr-12">
                    <p className="max-w-2xl text-xs sm:text-sm font-light leading-relaxed tracking-wide text-[#6E6359]">
                      {item.content}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default ProductAccordion;