import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiInstagram, FiMail, FiCheck } from "react-icons/fi";
import { FaPinterestP, FaWhatsapp } from "react-icons/fa";

function HomeFooter() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubscribed(true);
    setTimeout(() => {
      setIsSubscribed(false);
      setEmail("");
    }, 3500);
  };

  return (
    <footer className="relative isolate overflow-hidden rounded-t-[2.5rem] sm:rounded-t-[4rem] bg-[#1C1715] px-5 pb-10 pt-20 text-[#FAF7F2] select-none font-sans sm:px-8 sm:pt-28 lg:px-12 transform-gpu [-webkit-mask-image:-webkit-radial-gradient(white,black)] shadow-[0_-20px_50px_rgba(28,23,21,0.1)]">
      {/* Ambient Burgundy Glow Accent */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-80 w-2xl rounded-full bg-[#8E3D51]/15 blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-[1600px]">
        {/* =========================================================
            TOP SECTION: Editorial Header & Private Client Newsletter
        ========================================================== */}
        <div className="grid grid-cols-1 gap-12 border-b border-white/8 pb-16 lg:grid-cols-12 lg:items-end">
          {/* Main Statement */}
          <div className="lg:col-span-7">
            <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#A89C8F]">
              The Atelier Journal
            </span>
            <h2 className="mt-3 font-serif text-[clamp(2.5rem,6vw,5.2rem)] font-light leading-[0.92] tracking-tight text-[#FAF7F2]">
              Fashion fades. <br />
              <span className="italic font-normal text-[#E8D4C8]">
                Style remembers.
              </span>
            </h2>
          </div>

          {/* Luxury Newsletter Input */}
          <div className="lg:col-span-5">
            <p className="text-xs font-light text-[#C9BFB5] leading-relaxed max-w-md">
              Receive private previews of limited heirloom saree collections, draping edits, and festive privileges.
            </p>

            <form onSubmit={handleSubscribe} className="mt-5">
              <div className="flex items-center gap-3 border-b border-white/20 pb-3 transition-colors focus-within:border-[#E8D4C8]">
                <FiMail className="text-[#A89C8F] shrink-0" size={17} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full bg-transparent text-sm text-[#FAF7F2] placeholder-[#7D7166] tracking-wide outline-none font-light"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 shrink-0 rounded-full bg-[#FAF7F2] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1C1715] transition-all hover:bg-white active:scale-95"
                >
                  {isSubscribed ? (
                    <>
                      <span>Joined</span>
                      <FiCheck size={13} className="text-emerald-700" />
                    </>
                  ) : (
                    <>
                      <span>Join</span>
                      <FiArrowUpRight size={13} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* =========================================================
            MIDDLE SECTION: Directory Links & Concierge
        ========================================================== */}
        <div className="grid grid-cols-2 gap-8 py-16 sm:grid-cols-4 lg:grid-cols-12">
          {/* Column 1: Collections */}
          <div className="lg:col-span-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8C7A6B] mb-5">
              Collections
            </p>
            <ul className="space-y-3 text-xs tracking-wider text-[#C9BFB5]/80 font-light">
              <li>
                <Link to="/shop?material=silk" className="hover:text-white transition-colors">
                  Pure Kanjivaram Silks
                </Link>
              </li>
              <li>
                <Link to="/shop?material=banarasi" className="hover:text-white transition-colors">
                  Banarasi Katan Brocades
                </Link>
              </li>
              <li>
                <Link to="/shop?material=cotton" className="hover:text-white transition-colors">
                  Mulberry Cotton Handlooms
                </Link>
              </li>
              <li>
                <Link to="/shop?material=organza" className="hover:text-white transition-colors">
                  Chanderi & Organza Tissue
                </Link>
              </li>
              <li>
                <Link to="/shop?category=bridal" className="hover:text-white transition-colors">
                  The Bridal Heirloom Edit
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: The Atelier */}
          <div className="lg:col-span-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8C7A6B] mb-5">
              The Atelier
            </p>
            <ul className="space-y-3 text-xs tracking-wider text-[#C9BFB5]/80 font-light">
              <li>
                <Link to="/our-story" className="hover:text-white transition-colors">
                  Artisanal Heritage
                </Link>
              </li>
              <li>
                <Link to="/craftsmanship" className="hover:text-white transition-colors">
                  Slow Weaving Process
                </Link>
              </li>
              <li>
                <Link to="/sustainability" className="hover:text-white transition-colors">
                  Ethical Silk Sourcing
                </Link>
              </li>
              <li>
                <Link to="/drape-guide" className="hover:text-white transition-colors">
                  Saree Draping Masterclass
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Client Concierge */}
          <div className="lg:col-span-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8C7A6B] mb-5">
              Concierge
            </p>
            <ul className="space-y-3 text-xs tracking-wider text-[#C9BFB5]/80 font-light">
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Complimentary Stylist Consultation
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-white transition-colors">
                  Worldwide Insured Delivery
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-white transition-colors">
                  Bespoke Alterations & Care
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  Silk Certification Guarantee
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Private Salon & Socials */}
          <div className="lg:col-span-3 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8C7A6B] mb-5">
                Connect
              </p>
              <p className="text-xs text-[#C9BFB5]/80 font-light leading-relaxed mb-5">
                Flagship Atelier: Jubilee Hills, Hyderabad · By Prior Appointment
              </p>
            </div>

            {/* Social Pill Icons */}
            <div className="flex items-center gap-2.5">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#FAF7F2] transition-all hover:bg-[#8E3D51] hover:border-[#8E3D51] hover:scale-105"
              >
                <FiInstagram size={15} />
              </a>
              <a
                href="https://pinterest.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Pinterest"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#FAF7F2] transition-all hover:bg-[#8E3D51] hover:border-[#8E3D51] hover:scale-105"
              >
                <FaPinterestP size={14} />
              </a>
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp Concierge"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#FAF7F2] transition-all hover:bg-[#8E3D51] hover:border-[#8E3D51] hover:scale-105"
              >
                <FaWhatsapp size={15} />
              </a>
            </div>
          </div>
        </div>

        {/* =========================================================
            BOTTOM: Monumental Brand Name & Legal Bar
        ========================================================== */}
        <div className="border-t border-white/8 pt-12">
          {/* Monumental Editorial Brand Name */}
          <div className="overflow-hidden py-2 text-center">
            <span className="block font-serif text-[clamp(4.8rem,19vw,17.5rem)] font-light leading-[0.78] tracking-[0.14em] text-[#FAF7F2]/8 transition-colors duration-500 hover:text-[#FAF7F2]/15">
              BECHO
            </span>
          </div>

          {/* Legal Bar */}
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 text-[10px] uppercase tracking-[0.22em] text-[#8C7A6B] sm:flex-row">
            <span>© {new Date().getFullYear()} BECHO ATELIER. ALL RIGHTS RESERVED.</span>
            
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default HomeFooter;