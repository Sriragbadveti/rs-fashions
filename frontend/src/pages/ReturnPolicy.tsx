import React from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiLock, FiClock, FiVideo, FiAlertCircle } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

export default function ReturnPolicy() {
  return (
    <div className="relative min-h-screen bg-[#FAF7F2] font-sans text-[#2C2420] py-12 px-4 sm:px-6 lg:px-8 overflow-hidden selection:bg-[#8E3D51] selection:text-white">
      {/* Soft warm silk accents */}
      <div className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-[#8E3D51]/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-[#D4A373]/15 blur-3xl" />

      <div className="relative mx-auto max-w-3xl">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#8E3D51] hover:text-[#6E2A3C] transition-colors mb-6 group"
        >
          <FiArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to store</span>
        </Link>

        {/* Main Content Card */}
        <article className="rounded-2xl border border-white/60 bg-white/75 p-6 sm:p-10 shadow-sm backdrop-blur-md">
          {/* Header */}
          <header className="border-b border-[#8E3D51]/10 pb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8E3D51]/15 bg-[#8E3D51]/5 px-3 py-1 text-[11px] font-semibold text-[#8E3D51] mb-3">
              <span>Customer Care &amp; Guarantees</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl text-[#2C2420] font-normal tracking-tight">
              Return &amp; Replacement Policy
            </h1>
            <p className="mt-2 text-xs text-stone-500">
              Last updated: September 2026 &middot; RS Fashions
            </p>
          </header>

          {/* Core Unboxing Requirement Box */}
          <div className="mt-7 rounded-xl border border-[#8E3D51]/25 bg-[#8E3D51]/5 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#8E3D51] text-white mt-0.5">
                <FiAlertCircle size={17} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#8E3D51]">
                  Important: 48-Hour Window &amp; Unboxing Video
                </h3>
                <p className="mt-1 text-xs text-stone-700 leading-relaxed">
                  Every handloom saree undergoes thorough manual checks before packing. In the unlikely event that your saree arrives physically torn, stained, or damaged in transit, replacements or refunds require:
                </p>
                <ul className="mt-2.5 space-y-1.5 text-xs text-stone-800">
                  <li className="flex items-center gap-2">
                    <FiClock size={14} className="text-[#8E3D51] shrink-0" />
                    <span>Informing us within <strong>48 hours (2 days)</strong> of delivery confirmation.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FiVideo size={14} className="text-[#8E3D51] shrink-0" />
                    <span>Sharing a single, continuous <strong>360&deg; unboxing video</strong> from the sealed outer parcel to opening the saree.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="mt-8 space-y-7 text-xs sm:text-[13px] leading-relaxed text-stone-700">
            {/* Section 1 */}
            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">
                1. What Your Unboxing Video Needs to Show
              </h2>
              <p className="mb-3 text-stone-600">
                Because handloom silks are delicate and transit mishandling is outside our direct control, a clear video helps us quickly approve your claim without back-and-forth:
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-stone-200/80 bg-white/60 p-3.5 shadow-xs">
                  <h3 className="text-xs font-bold text-[#8E3D51] mb-1">
                    1. Show Sealed Parcel
                  </h3>
                  <p className="text-[11px] text-stone-600 leading-normal">
                    Show the intact package tape and the courier label clearly before opening.
                  </p>
                </div>

                <div className="rounded-xl border border-stone-200/80 bg-white/60 p-3.5 shadow-xs">
                  <h3 className="text-xs font-bold text-[#8E3D51] mb-1">
                    2. Unbroken Recording
                  </h3>
                  <p className="text-[11px] text-stone-600 leading-normal">
                    Film continuously without pauses or cuts while you open the parcel and unfold the saree.
                  </p>
                </div>

                <div className="rounded-xl border border-stone-200/80 bg-white/60 p-3.5 shadow-xs">
                  <h3 className="text-xs font-bold text-[#8E3D51] mb-1">
                    3. Highlight the Issue
                  </h3>
                  <p className="text-[11px] text-stone-600 leading-normal">
                    Bring any stain, cut, or visible fabric defect clearly into good lighting and focus.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">
                2. When Returns Are Not Accepted
              </h2>
              <ul className="space-y-1.5 pl-1 text-stone-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#8E3D51] shrink-0" />
                  <span>Requests submitted after 48 hours from delivery.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#8E3D51] shrink-0" />
                  <span>Sarees opened without a continuous, unedited unboxing video.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#8E3D51] shrink-0" />
                  <span>Drapes that have been draped, worn, dry-cleaned, washed, altered, or scented.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#8E3D51] shrink-0" />
                  <span>Pieces with missing tags, removed tassels, or cut/stitched blouse pieces.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#8E3D51] shrink-0" />
                  <span>Natural handloom traits—such as minute zari shifts, minor selvedge unevenness, or small knots on the reverse side.</span>
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">
                3. How the Replacement Process Works
              </h2>
              <div className="space-y-2.5 pl-1 text-stone-700">
                <p>
                  <strong>Step 1:</strong> Record your unboxing video as soon as the courier delivers the package.
                </p>
                <p>
                  <strong>Step 2:</strong> Send your Order Number and video to us over WhatsApp or email within 48 hours.
                </p>
                <p>
                  <strong>Step 3:</strong> Our team reviews the clip within 24 hours to verify the issue.
                </p>
                <p>
                  <strong>Step 4:</strong> Once verified, we arrange a reverse pickup from your address and immediately send a replacement saree or issue a 100% refund to your original payment method.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="rounded-xl border border-stone-200/90 bg-white/70 p-4 sm:p-5">
              <h2 className="font-serif text-base font-medium text-[#2C2420] mb-1.5">
                4. Need to Request a Return or Replacement?
              </h2>
              <p className="text-xs text-stone-600 mb-3">
                Message us directly with your order details and our team will guide you through the process right away:
              </p>
              <div className="flex flex-wrap gap-2.5">
                <a
                  href="https://wa.me/?text=Hi%20RS%20Fashions,%20I%20need%20assistance%20with%20my%20recent%20order"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#345C38] text-white px-4 py-2.5 text-xs font-semibold tracking-wide hover:bg-[#28492C] transition-colors"
                >
                  <FaWhatsapp size={15} />
                  <span>WhatsApp Support</span>
                </a>

                <a
                  href="mailto:support@rsfashions.com?subject=Return%20or%20Replacement%20Assistance"
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-[#FAF7F2] text-stone-800 px-4 py-2.5 text-xs font-semibold tracking-wide hover:bg-[#F3ECE1] hover:border-[#8E3D51]/30 transition-colors"
                >
                  <span>Email: support@rsfashions.com</span>
                </a>
              </div>
            </section>
          </div>

          {/* Card Footer */}
          <footer className="mt-9 border-t border-[#8E3D51]/10 pt-4 flex items-center gap-2 text-stone-500 text-xs">
            <FiLock size={13} className="text-[#8E3D51]" />
            <span>Guaranteed genuine handlooms &middot; Safe and insured pan-India delivery.</span>
          </footer>
        </article>

        {/* Sub-Footer Policy Navigation */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-stone-500 text-center">
          <Link
            to="/privacy-policy"
            className="hover:text-[#8E3D51] transition-colors underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
          <span className="text-stone-300 select-none">&bull;</span>
          <Link
            to="/terms"
            className="hover:text-[#8E3D51] transition-colors underline-offset-4 hover:underline"
          >
            Terms &amp; Conditions
          </Link>
          <span className="text-stone-300 select-none">&bull;</span>
          <Link
            to="/shipping"
            className="hover:text-[#8E3D51] transition-colors underline-offset-4 hover:underline"
          >
            Shipping Policy
          </Link>
        </div>
      </div>
    </div>
  );
}