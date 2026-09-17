import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FiArrowUpRight,
  FiCheck,
  FiCopy,
} from "react-icons/fi";

const ease = [0.16, 1, 0.3, 1] as const;

function OfferBanner() {
  const [copied, setCopied] = useState(false);

  const promoCode = "HERITAGE20";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        promoCode
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch {
      // Clipboard unavailable.
    }
  };

  return (
    <section
      className="
        bg-[#FAF7F2]
        px-3
        py-10
        font-sans
        select-none
        sm:px-6
        sm:py-20
        lg:px-10
        lg:py-24
      "
    >
      {/* =========================================================
          MAIN OFFER CARD
      ========================================================== */}

      <div
        className="
          relative
          isolate
          mx-auto
          max-w-[1600px]
          overflow-hidden
          rounded-[2rem]
          bg-[#221C19]
          text-[#FAF7F2]
          shadow-[0_16px_45px_rgba(34,28,25,0.14)]
          transform-gpu
          [-webkit-mask-image:-webkit-radial-gradient(white,black)]
          sm:rounded-[2.5rem]
          lg:rounded-[3rem]
        "
      >
        {/* =====================================================
            BACKGROUND IMAGE
        ====================================================== */}

        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=85"
            alt="Handloom Silk Offer"
            loading="lazy"
            className="
              h-full
              w-full
              object-cover
              object-[58%_30%]
              opacity-30
              sm:object-[center_35%]
              sm:opacity-35
            "
          />

          {/* Desktop / Tablet gradient */}

          <div
            className="
              absolute
              inset-0
              hidden
              bg-linear-to-r
              from-[#221C19]
              via-[#221C19]/90
              to-[#221C19]/45
              sm:block
            "
          />

          <div
            className="
              absolute
              inset-0
              bg-linear-to-b
              from-[#221C19]/55
              via-[#221C19]/75
              to-[#221C19]/98
              sm:hidden
            "
          />

          {/* Subtle mobile side vignette */}

          <div
            className="
              absolute
              inset-0
              bg-linear-to-r
              from-[#221C19]/45
              via-transparent
              to-[#221C19]/35
              sm:hidden
            "
          />
        </div>

        {/* =====================================================
            CONTENT
        ====================================================== */}

        <div
          className="
            relative
            z-10
            flex
            min-h-[500px]
            flex-col
            justify-between
            p-5
            sm:min-h-[560px]
            sm:p-10
            lg:min-h-[600px]
            lg:p-16
          "
        >
          {/* ===================================================
              TOP BAR
          ==================================================== */}

          <div className="flex items-center justify-between gap-4">
            

            <span
              className="
                hidden
                font-serif
                text-sm
                tracking-[0.2em]
                text-[#EDE7DF]/40
                sm:block
              "
            >
              LIMITED CURATION
            </span>
          </div>

          {/* ===================================================
              MAIN CONTENT
          ==================================================== */}

          <div
            className="
              my-12
              max-w-2xl
              sm:my-16
              lg:my-12
            "
          >
            <motion.p
              initial={{
                opacity: 0,
                y: 12,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.6,
                ease,
              }}
              className="
                mb-4
                text-[8px]
                font-semibold
                uppercase
                tracking-[0.28em]
                text-[#E5B869]
                sm:hidden
              "
            >
              A private festive privilege
            </motion.p>

            <motion.h2
              initial={{
                opacity: 0,
                y: 24,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                delay: 0.08,
                duration: 0.75,
                ease,
              }}
              className="
                max-w-[340px]
                font-serif
                text-[3.25rem]
                font-light
                leading-[0.88]
                tracking-[-0.045em]
                text-[#FAF7F2]
                sm:max-w-xl
                sm:text-[clamp(3.5rem,7vw,5.5rem)]
                sm:leading-[0.92]
                sm:tracking-tight
              "
            >
              A little
              <br />

              <span
                className="
                  italic
                  font-normal
                  text-[#F4E3D7]
                "
              >
                something extra.
              </span>
            </motion.h2>

            <motion.p
              initial={{
                opacity: 0,
                y: 16,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                delay: 0.18,
                duration: 0.7,
                ease,
              }}
              className="
                mt-5
                max-w-[310px]
                text-[11px]
                font-light
                leading-6
                text-[#DDD2C6]/80
                sm:mt-5
                sm:max-w-md
                sm:text-sm
                sm:leading-relaxed
              "
            >
              Complimentary ₹2,000 privilege
              savings on our signature handcrafted
              SiCo Gadwal sarees and bridal drapes.
            </motion.p>
          </div>

          {/* ===================================================
              BOTTOM ACTION AREA
          ==================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 18,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              delay: 0.28,
              duration: 0.7,
              ease,
            }}
            className="
              border-t
              border-white/10
              pt-5
              sm:pt-6
            "
          >
            {/* =================================================
                MOBILE: STACKED
            ================================================== */}

            <div className="flex flex-col gap-4 sm:hidden">
              {/* Bundle Deal Indicator */}
              <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-3.5 text-center">
                <span className="text-[8.5px] font-bold uppercase tracking-[0.25em] text-[#E5B869] block mb-1">
                  Festive Multi-Piece Bundles
                </span>
                <p className="text-xs font-serif font-medium text-[#FAF7F2]">
                  Buy 1 @ ₹2,500 · Buy 2 @ ₹4,900 · Buy 3 @ ₹4,800
                </p>
                <p className="text-[9px] text-[#DDD2C6]/70 mt-1">
                  Tier discounts apply automatically in cart
                </p>
              </div>

              {/* CTA */}
              <Link
                to="/offers"
                className="group flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[#FAF7F2] px-5 text-[9px] font-medium uppercase tracking-[0.18em] text-[#221C19] shadow-xl transition-transform duration-200 active:scale-[0.98]"
              >
                <span>Shop Dedicated Offers Store</span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#221C19] text-white transition-transform duration-300 group-hover:rotate-45">
                  <FiArrowUpRight size={13} />
                </span>
              </Link>
            </div>

            {/* =================================================
                TABLET + DESKTOP
            ================================================== */}

            <div className="hidden items-center justify-between gap-5 sm:flex">
              {/* Bundle Tiers Pill */}
              <div className="flex items-center gap-3 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-5 py-3 backdrop-blur-md">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#E5B869]">
                  Exclusive Bundles:
                </span>
                <span className="text-xs font-serif text-[#FAF7F2]">
                  Buy 1 @ ₹2,500 &nbsp;|&nbsp; Buy 2 @ ₹4,900 &nbsp;|&nbsp; Buy 3 @ ₹4,800
                </span>
              </div>

              {/* CTA */}
              <Link
                to="/offers"
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#FAF7F2] px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-[#221C19] shadow-xl transition-all duration-300 hover:bg-white active:scale-95"
              >
                <span>Shop Dedicated Offers Store</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#221C19] text-white transition-transform duration-300 group-hover:rotate-45">
                  <FiArrowUpRight size={12} />
                </span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* =====================================================
            MOBILE DECORATIVE DETAIL
        ====================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            right-[-45px]
            top-[42%]
            h-28
            w-28
            rounded-full
            border
            border-white/[0.08]
            sm:hidden
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            right-[-25px]
            top-[45%]
            h-16
            w-16
            rounded-full
            border
            border-[#E5B869]/10
            sm:hidden
          "
        />
      </div>
    </section>
  );
}

export default OfferBanner;