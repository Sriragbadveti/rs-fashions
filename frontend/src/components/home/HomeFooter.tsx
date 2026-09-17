import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiArrowUpRight,
  FiInstagram,
  FiMail,
  FiHeart,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

import logo from "../../assets/logo/logo1.png";

function HomeFooter() {
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  // Strictly render ONLY on the Home route
  if (location.pathname !== "/") {
    return null;
  }

  return (
    <footer className="relative isolate overflow-hidden rounded-t-[2.5rem] sm:rounded-t-[3.5rem]  bg-linear-to-b from-[#FFFDF9] via-[#FAF4ED] to-[#F5ECE1] text-[#2C2420] font-sans selection:bg-[#8E3D51] selection:text-white border-t border-[#8E3D51]/20 shadow-[0_-20px_50px_rgba(142,61,81,0.06)]">
      {/* Rich Silk & Warm Sunset Ambient Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 -top-24 h-[450px] w-[450px] rounded-full  bg-linear-to-br from-[#E295A8]/30 via-[#C75D76]/15 to-transparent blur-[110px]" />
        <div className="absolute -right-24 top-1/4 h-[500px] w-[500px] rounded-full  bg-linear-to-bl from-[#F7C59F]/35 via-[#E8985E]/15 to-transparent blur-[130px]" />
        <div className="absolute left-1/3 bottom-0 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(#8E3D51_1px,transparent_1px),linear-gradient(90deg,#8E3D51_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pt-12 pb-5 sm:px-8 sm:pt-16 sm:pb-6 lg:px-10">
        {/* =========================================================
            MAIN SECTION: BRAND + CONTACT
        ========================================================== */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12 items-center py-10">
          {/* Brand Note */}
          <div className="lg:col-span-7">
            <Link to="/" className="inline-flex items-center gap-3.5 group">
              <div className="flex h-15 w-15 shrink-0 items-center justify-center rounded-2xl border border-[#8E3D51]/15 bg-white p-2 shadow-sm transition-transform duration-200 group-hover:scale-105">
                <img
                  src={logo}
                  alt="RS Fashions"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <span className="block font-serif text-2xl font-semibold tracking-tight text-[#3A1426]">
                  Fashions
                </span>
                <span className="block text-[10px] uppercase tracking-[0.24em] font-bold text-[#C03B58] mt-0.5">
                  Handcrafted SiCo Gadwal Sarees
                </span>
              </div>
            </Link>

            <h2 className="mt-6 font-serif text-3xl sm:text-4xl lg:text-5xl font-light leading-tight text-[#2B1B17]">
              Draped in{" "}
              <span className="italic font-normal  bg-linear-to-r from-[#8E3D51] via-[#C94A67] to-[#D47E37] bg-clip-text text-transparent">
                tradition
              </span>
              , woven with{" "}
              <span className="italic font-normal  bg-linear-to-r from-[#D47E37] via-[#D4AF37] to-[#8E3D51] bg-clip-text text-transparent">
                care
              </span>
              .
            </h2>

            <p className="mt-4 max-w-lg text-xs sm:text-sm text-[#6E5D57] leading-relaxed">
              Every drape tells a story of patience, authentic handloom craftsmanship, and designs made to be cherished for generations.
            </p>
          </div>

          {/* Quick Connect Box */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border border-[#8E3D51]/15 bg-white/85 p-6 sm:p-7 shadow-[0_12px_36px_rgba(142,61,81,0.08)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#C03B58]">
                  Need Help Choosing?
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8E3D51]/10 text-[#8E3D51]">
                  <FiHeart size={12} className="fill-current" />
                </span>
              </div>

              <h3 className="mt-2 font-serif text-2xl text-[#2B1B17] font-normal">
                We are just a message away.
              </h3>
              <p className="mt-1 text-xs text-[#73635C] leading-relaxed">
                Whether you need help selecting a shade, planning bridal outfits, or asking about a saree, reach out to us directly.
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2.5">
                <a
                  href="https://wa.me/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp Support"
                  className="group/btn flex flex-col items-center justify-center rounded-2xl border border-emerald-300/80  bg-linear-to-b from-[#F0FDF4] to-[#DCFCE7] p-3 text-emerald-950 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs hover:border-emerald-400"
                >
                  <FaWhatsapp size={17} className="text-emerald-600 transition-transform duration-200 group-hover/btn:scale-110" />
                  <span className="mt-1.5 text-[10px] font-bold tracking-wide uppercase">
                    WhatsApp
                  </span>
                </a>

                <a
                  href="mailto:support@rsfashions.com"
                  aria-label="Email Support"
                  className="group/btn flex flex-col items-center justify-center rounded-2xl border border-rose-300/80  bg-linear-to-b from-[#FFF5F6] to-[#FFE2E7] p-3 text-rose-950 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs hover:border-rose-400"
                >
                  <FiMail size={17} className="text-[#8E3D51] transition-transform duration-200 group-hover/btn:scale-110" />
                  <span className="mt-1.5 text-[10px] font-bold tracking-wide uppercase">
                    Email
                  </span>
                </a>

                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram Page"
                  className="group/btn flex flex-col items-center justify-center rounded-2xl border border-pink-300/80  bg-linear-to-b from-[#FDF2F8] to-[#FCE7F3] p-3 text-pink-950 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs hover:border-pink-400"
                >
                  <FiInstagram size={17} className="text-[#BE185D] transition-transform duration-200 group-hover/btn:scale-110" />
                  <span className="mt-1.5 text-[10px] font-bold tracking-wide uppercase">
                    Instagram
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            3-COLUMN NAVIGATION DIRECTORY
        ========================================================== */}
        <div className="grid grid-cols-1 gap-8 border-t border-[#8E3D51]/15 pt-10 sm:grid-cols-3">
          {/* Column 1 */}
          <div>
            <p className="mb-3.5 text-[10.5px] font-bold uppercase tracking-[0.24em] text-[#8E3D51]">
              Explore Sarees
            </p>
            <ul className="space-y-2.5">
              {[
                { label: "Vintage Checks", path: "/shop?search=Vintage+Checks" },
                { label: "Gatti Borders", path: "/shop?search=Gatti+borders" },
                { label: "Ma Inti Bangaram", path: "/shop?search=Ma+inti+Bangaram" },
                { label: "Big Kanchi Borders", path: "/shop?search=Big+Kanchi" },
                { label: "Festive Silk Editions", path: "/shop?category=SiCo+Gadwal+Sarees" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="group inline-flex items-center text-xs font-medium text-stone-600 hover:text-[#8E3D51] transition-colors"
                  >
                    <span className="relative">
                      {item.label}
                      <span className="absolute -bottom-0.5 left-0 h-0.5 w-0  bg-linear-to-r from-[#8E3D51] to-[#D47E37] transition-all duration-300 group-hover:w-full" />
                    </span>
                    <FiArrowUpRight size={11} className="ml-1 opacity-0 -translate-y-0.5 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:translate-y-0 text-[#8E3D51]" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <p className="mb-3.5 text-[10.5px] font-bold uppercase tracking-[0.24em] text-[#8E3D51]">
              About Us
            </p>
            <ul className="space-y-2.5">
              {[
                { label: "Our Story", path: "/our-story" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="group inline-flex items-center text-xs font-medium text-stone-600 hover:text-[#8E3D51] transition-colors"
                  >
                    <span className="relative">
                      {item.label}
                      <span className="absolute -bottom-0.5 left-0 h-0.5 w-0  bg-linear-to-r from-[#8E3D51] to-[#D47E37] transition-all duration-300 group-hover:w-full" />
                    </span>
                    <FiArrowUpRight size={11} className="ml-1 opacity-0 -translate-y-0.5 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:translate-y-0 text-[#8E3D51]" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <p className="mb-3.5 text-[10.5px] font-bold uppercase tracking-[0.24em] text-[#8E3D51]">
              Customer Support
            </p>
            <ul className="space-y-2.5">
              {[
                { label: "Track Your Order", path: "/account" },
                { label: "Shipping & Delivery", path: "/shipping" },
                { label: "FAQs", path: "/faq" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="group inline-flex items-center text-xs font-medium text-stone-600 hover:text-[#8E3D51] transition-colors"
                  >
                    <span className="relative">
                      {item.label}
                      <span className="absolute -bottom-0.5 left-0 h-0.5 w-0  bg-linear-to-r from-[#8E3D51] to-[#D47E37] transition-all duration-300 group-hover:w-full" />
                    </span>
                    <FiArrowUpRight size={11} className="ml-1 opacity-0 -translate-y-0.5 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:translate-y-0 text-[#8E3D51]" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* =========================================================
            BOTTOM STRIP
        ========================================================== */}
        <div className="mt-8 border-t border-[#8E3D51]/15 pt-5">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row text-center sm:text-left">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold tracking-wider text-[#73635C]">
                &copy; {currentYear} RS Fashions. All rights reserved.
              </span>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1 text-[10px] text-stone-500">
                <Link to="/privacy-policy" className="hover:text-[#8E3D51] transition-colors">
                  Privacy Policy
                </Link>
                <span className="select-none text-stone-300">&bull;</span>
                <Link to="/terms" className="hover:text-[#8E3D51] transition-colors">
                  Terms &amp; Conditions
                </Link>
                <span className="select-none text-stone-300">&bull;</span>
                <Link to="/returns" className="hover:text-[#8E3D51] transition-colors">
                  Return &amp; Replacement
                </Link>
                <span className="select-none text-stone-300">&bull;</span>
                <Link to="/shipping" className="hover:text-[#8E3D51] transition-colors">
                  Shipping Policy
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-[#73635C]">
              <span>Made with</span>
              <FiHeart size={11} className="fill-[#8E3D51] text-[#8E3D51]" />
              <span>by</span>
              <span className="font-bold text-[#3A1426]">Becho A Marketing Firm</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default HomeFooter;