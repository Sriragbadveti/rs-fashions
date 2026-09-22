import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiArrowUpRight, FiInstagram, FiMail, FiHeart, FiX, FiExternalLink } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { Globe, Smartphone } from "lucide-react";

import logo from "../../assets/logo/logo1.png";
import { STORE_WHATSAPP_NUMBER } from "../../config/routes";

function HomeFooter() {
  const location = useLocation();
  const currentYear = new Date().getFullYear();
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);

  if (location.pathname !== "/") {
    return null;
  }

  const defaultMsg = encodeURIComponent("Hello RS Fashions, I would like to inquire about your handcrafted sarees and special offers.");
  const waNumber = STORE_WHATSAPP_NUMBER || "919876543210";
  const whatsappWebUrl = `https://web.whatsapp.com/send?phone=${waNumber}&text=${defaultMsg}`;
  const whatsappAppUrl = `https://wa.me/${waNumber}?text=${defaultMsg}`;

  const footerColumns = [
    {
      title: "Explore Sarees",
      links: [
        { label: "Vintage Checks", path: "/shop?search=Vintage+Checks" },
        { label: "Gatti Borders", path: "/shop?search=Gatti+borders" },
        { label: "Ma Inti Bangaram", path: "/shop?search=Ma+inti+Bangaram" },
        { label: "Big Kanchi Borders", path: "/shop?search=Big+Kanchi" },
        { label: "Festive Silk Editions", path: "/shop?category=SiCo+Gadwal+Sarees" },
      ],
    },
    {
      title: "About Us",
      links: [{ label: "Our Story", path: "/our-story" }],
    },
    {
      title: "Customer Support",
      links: [
        { label: "Track Your Order", path: "/account" },
        { label: "Shipping & Delivery", path: "/shipping" },
        { label: "FAQs", path: "/faq" },
      ],
    },
  ];

  const legalLinks = [
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "Terms & Conditions", path: "/terms" },
    { label: "Return & Replacement", path: "/returns" },
    { label: "Shipping Policy", path: "/shipping" },
  ];

  return (
    <>
      <footer className="relative isolate overflow-hidden bg-[#8E3D51] font-sans text-[#F7F4EE] selection:bg-white selection:text-[#8E3D51] rounded-t-[3.5rem] sm:rounded-t-[5rem] shadow-[0_-20px_60px_rgba(42,36,33,0.25)] mt-12">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-28 -top-24 h-112.5 w-112.5 rounded-full bg-linear-to-br from-[#A64D63]/40 via-[#8E3D51]/20 to-transparent blur-[110px]" />
          <div className="absolute -right-24 top-1/4 h-125 w-125 rounded-full bg-linear-to-bl from-[#D4A373]/30 via-[#C28C57]/15 to-transparent blur-[130px]" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#D4AF37]/15 blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] bg-size-[48px_48px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 pb-8 pt-16 sm:px-8 sm:pt-24 sm:pb-10 lg:px-10">
          
          {/* Main Section: Brand + Quick Connect */}
          <div className="grid grid-cols-1 items-center gap-10 pb-12 lg:grid-cols-12 lg:gap-14">
            
            {/* Brand Note */}
            <div className="lg:col-span-7">
              <Link to="/" className="group inline-flex items-center gap-3.5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white p-2 shadow-md transition-transform duration-300 group-hover:scale-105 sm:h-16 sm:w-16">
                  <img src={logo} alt="RS Fashions" className="h-full w-full object-contain" />
                </div>
                <div>
                  <span className="block font-serif text-2xl font-semibold tracking-tight text-white sm:text-[26px]">
                    Fashions
                  </span>
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.22em] text-[#F3C68F]">
                    Handcrafted SiCo Gadwal Sarees
                  </span>
                </div>
              </Link>

              <h2 className="mt-7 max-w-xl font-serif text-3xl font-light leading-[1.15] text-[#FDFBF7] sm:text-4xl lg:text-[42px]">
                Draped in{" "}
                <span className="bg-linear-to-r from-[#F3C68F] via-[#E8B070] to-[#FFD8A8] bg-clip-text font-normal italic text-transparent">
                  tradition
                </span>
                , woven with{" "}
                <span className="bg-linear-to-r from-[#FFD8A8] via-[#F3C68F] to-white bg-clip-text font-normal italic text-transparent">
                  care
                </span>
                .
              </h2>

              <p className="mt-4 max-w-md text-xs leading-relaxed text-[#F0E6DE] sm:text-sm">
                Every drape tells a story of patience, authentic handloom craftsmanship, and designs made to be cherished for generations.
              </p>
            </div>

            {/* Quick Connect Card */}
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-6 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-8">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

                <div className="relative flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#F3C68F]">
                    Need Help Choosing?
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white">
                    <FiHeart size={13} className="fill-current text-[#F3C68F]" />
                  </span>
                </div>

                <h3 className="relative mt-3 font-serif text-2xl font-normal leading-snug text-white">
                  We're just a message away.
                </h3>
                <p className="relative mt-2 text-xs leading-relaxed text-[#F0E6DE] sm:text-[13px]">
                  Whether you need help selecting a shade, planning bridal outfits, or asking about a saree — reach out to us directly.
                </p>

                <div className="relative mt-6 grid grid-cols-3 gap-3">
                  {/* WhatsApp Action Button with options */}
                  <button
                    type="button"
                    onClick={() => setWhatsappModalOpen(true)}
                    aria-label="WhatsApp Support"
                    className="group/btn flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-emerald-200 bg-linear-to-b from-[#F0FDF4] to-[#DCFCE7] p-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-400 cursor-pointer"
                  >
                    <span className="transition-transform duration-300 group-hover/btn:scale-110">
                      <FaWhatsapp size={18} className="text-emerald-600" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-stone-800">WhatsApp</span>
                  </button>

                  <a
                    href="mailto:support@rsfashions.com"
                    aria-label="Email Support"
                    className="group/btn flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-rose-200 bg-linear-to-b from-[#FFF5F6] to-[#FFE2E7] p-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-rose-400"
                  >
                    <span className="transition-transform duration-300 group-hover/btn:scale-110">
                      <FiMail size={18} className="text-[#8E3D51]" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-stone-800">Email</span>
                  </a>

                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram Support"
                    className="group/btn flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-pink-200 bg-linear-to-b from-[#FDF2F8] to-[#FCE7F3] p-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-pink-400"
                  >
                    <span className="transition-transform duration-300 group-hover/btn:scale-110">
                      <FiInstagram size={18} className="text-[#BE185D]" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-stone-800">Instagram</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 3-Column Navigation Directory */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-9 border-t border-white/15 pt-10 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.22em] text-[#F3C68F]">
                  {column.title}
                </p>
                <ul className="space-y-2.5">
                  {column.links.map((item) => (
                    <li key={item.label}>
                      <Link
                        to={item.path}
                        className="group inline-flex items-center text-[13px] font-medium text-[#F0E6DE] transition-colors hover:text-white"
                      >
                        <span className="relative">
                          {item.label}
                          <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-linear-to-r from-white to-[#F3C68F] transition-all duration-300 group-hover:w-full" />
                        </span>
                        <FiArrowUpRight
                          size={12}
                          className="ml-1 -translate-y-0.5 text-[#F3C68F] opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0 group-hover:opacity-100"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Strip */}
          <div className="mt-10 border-t border-white/15 pt-6">
            <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:items-start">
                <span className="text-[10.5px] font-sans tracking-wide text-white">
                  &copy; {currentYear} RS Fashions. All rights reserved.
                </span>
                <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[10.5px] text-[#D8CBC3] sm:justify-start">
                  {legalLinks.map((link, index) => (
                    <React.Fragment key={link.path}>
                      <Link to={link.path} className="transition-colors hover:text-white">
                        {link.label}
                      </Link>
                      {index < legalLinks.length - 1 && <span className="select-none text-white/40">&bull;</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5 font-display text-[10.5px] text-[#D8CBC3]">
                <span>Made with</span>
                <FiHeart size={11} className="fill-red-500 text-[#D8CBC3]" />
                <span>by</span>
                <span className="font-display text-[#D8CBC3]">Becho A Marketing Firm</span>
              </div>
            </div>
          </div>

        </div>
      </footer>

      {/* WHATSAPP OPTIONS MODAL */}
      {whatsappModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-stone-200">
            <button
              type="button"
              onClick={() => setWhatsappModalOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
            >
              <FiX size={16} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <FaWhatsapp size={22} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">Message RS Fashions</h3>
                <p className="text-[11px] text-stone-500">Choose your preferred WhatsApp experience</p>
              </div>
            </div>

            <div className="space-y-3 mt-5">
              {/* WhatsApp Web Button */}
              <a
                href={whatsappWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setWhatsappModalOpen(false)}
                className="group flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4 transition-all hover:bg-emerald-100/80 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                    <Globe size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">Open in WhatsApp Web</h4>
                    <p className="text-[10px] text-emerald-800">Best for Laptops &amp; Desktop browsers</p>
                  </div>
                </div>
                <FiExternalLink size={15} className="text-emerald-700 transition-transform group-hover:translate-x-0.5" />
              </a>

              {/* WhatsApp Mobile / App Button */}
              <a
                href={whatsappAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setWhatsappModalOpen(false)}
                className="group flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 p-4 transition-all hover:bg-stone-100 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-800 text-white shadow-xs">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">Open in WhatsApp App</h4>
                    <p className="text-[10px] text-stone-600">Best for Phones &amp; WhatsApp desktop app</p>
                  </div>
                </div>
                <FiArrowUpRight size={15} className="text-stone-700 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>

            <p className="mt-4 text-center text-[10px] text-stone-400 font-light">
              We respond quickly for saree selection, customized colors &amp; bridal styling.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default HomeFooter;