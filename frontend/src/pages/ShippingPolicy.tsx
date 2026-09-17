import React from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiLock, FiTruck, FiClock, FiShield } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

export default function ShippingPolicy() {
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

        {/* Content Card */}
        <article className="rounded-2xl border border-white/60 bg-white/75 p-6 sm:p-10 shadow-sm backdrop-blur-md">
          {/* Header */}
          <header className="border-b border-[#8E3D51]/10 pb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8E3D51]/15 bg-[#8E3D51]/5 px-3 py-1 text-[11px] font-semibold text-[#8E3D51] mb-3">
              <span>Orders &amp; Delivery</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl text-[#2C2420] font-normal tracking-tight">
              Shipping &amp; Delivery Policy
            </h1>
            <p className="mt-2 text-xs text-stone-500">
              Last updated: September 2026 &middot; RS Fashions
            </p>
          </header>

          {/* Quick Highlights Strip */}
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-xl border border-stone-200/80 bg-white/60 p-3.5 shadow-xs">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FAF4ED] text-[#8E3D51] mt-0.5">
                <FiClock size={16} />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[#2C2420]">24–48 Hr Dispatch</h3>
                <p className="text-[11px] text-stone-600 mt-0.5">Carefully inspected &amp; handed over</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-stone-200/80 bg-white/60 p-3.5 shadow-xs">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FAF4ED] text-[#8E3D51] mt-0.5">
                <FiTruck size={16} />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[#2C2420]">Clear Shipping Tiers</h3>
                <p className="text-[11px] text-stone-600 mt-0.5">Free delivery on qualifying orders</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-stone-200/80 bg-white/60 p-3.5 shadow-xs">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FAF4ED] text-[#8E3D51] mt-0.5">
                <FiShield size={16} />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[#2C2420]">Safe Packaging</h3>
                <p className="text-[11px] text-stone-600 mt-0.5">Moisture &amp; tamper protected</p>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="mt-8 space-y-7 text-xs sm:text-[13px] leading-relaxed text-stone-700">
            {/* Section 1 */}
            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">
                1. Shipping Charges &amp; Free Delivery Rules
              </h2>
              <p className="mb-3 text-stone-600">
                Delivery charges are calculated based on your total order value. Free delivery is granted only when the qualifying threshold is met:
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Standard Tier */}
                <div className="rounded-xl border border-stone-200/80 bg-white/60 p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#8E3D51] uppercase tracking-wider">
                      Orders ₹1,950 – ₹2,499
                    </span>
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-700">
                      ₹100 Shipping
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-2 leading-relaxed">
                    A flat ₹100 shipping fee is added at checkout for orders in this price range. Standard free shipping does not apply to this tier.
                  </p>
                </div>

                {/* Free Shipping Tier */}
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Orders ₹2,800 – ₹3,100+
                    </span>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                      Free Shipping
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-950 mt-2 leading-relaxed">
                    Complimentary doorstep delivery is applied automatically at checkout once your cart value meets this range. No coupons needed.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">
                2. Dispatch &amp; Delivery Timelines
              </h2>
              <p className="mb-3 text-stone-600">
                Every saree goes through a manual quality check and is securely packed before dispatch within <strong>24 to 48 working hours</strong>. Estimated transit times:
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-stone-200/80 bg-white/60 p-3.5 shadow-xs">
                  <h3 className="text-xs font-bold text-[#8E3D51] mb-0.5">
                    Metros &amp; South India
                  </h3>
                  <p className="text-xs font-semibold text-[#2C2420] mb-1">2 to 4 Business Days</p>
                  <p className="text-[11px] text-stone-600 leading-normal">
                    Hyderabad, Bengaluru, Chennai, Mumbai, Pune, Delhi NCR, and major state capitals.
                  </p>
                </div>

                <div className="rounded-xl border border-stone-200/80 bg-white/60 p-3.5 shadow-xs">
                  <h3 className="text-xs font-bold text-[#8E3D51] mb-0.5">
                    Rest of India &amp; Regional Towns
                  </h3>
                  <p className="text-xs font-semibold text-[#2C2420] mb-1">4 to 7 Business Days</p>
                  <p className="text-[11px] text-stone-600 leading-normal">
                    Tier-2/3 cities, regional towns, and rural pin codes serviced via standard express logistics.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">
                3. Live Order Tracking
              </h2>
              <p>
                Once our courier partner (Blue Dart, Delhivery, or DTDC) picks up your parcel, your tracking link and consignment number are shared instantly through <strong>WhatsApp and email</strong>. You can follow the live delivery progress step-by-step.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">
                4. Package Inspection Upon Delivery
              </h2>
              <p className="mb-2">
                All sarees are sent in secure outer packaging. If the package arrives clearly crushed, torn open, or resealed:
              </p>
              <ul className="space-y-1.5 pl-1 text-stone-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#8E3D51] shrink-0" />
                  <span>Take a clear photo of the outer condition before accepting or signing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#8E3D51] shrink-0" />
                  <span>You may refuse delivery if the tamper seal is visibly broken.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#8E3D51] shrink-0" />
                  <span>Always record a continuous 360&deg; unboxing video from the sealed box to validate any replacement claim.</span>
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="rounded-xl border border-stone-200/90 bg-white/70 p-4 sm:p-5">
              <h2 className="font-serif text-base font-medium text-[#2C2420] mb-1.5">
                5. Need Help With Your Order?
              </h2>
              <p className="text-xs text-stone-600 mb-3">
                If your parcel is delayed or you need to correct your address before dispatch, reach out directly:
              </p>
              <div className="flex flex-wrap gap-2.5">
                <a
                  href="https://wa.me/?text=Hi%20RS%20Fashions,%20I%20need%20an%20update%20on%20my%20saree%20shipment"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#345C38] text-white px-4 py-2.5 text-xs font-semibold tracking-wide hover:bg-[#28492C] transition-colors"
                >
                  <FaWhatsapp size={15} />
                  <span>WhatsApp Support</span>
                </a>

                <a
                  href="mailto:support@rsfashions.com?subject=Delivery%20Tracking%20Query"
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
            <span>Reliable pan-India delivery &middot; Direct handloom dispatches from Telangana.</span>
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
            to="/returns"
            className="hover:text-[#8E3D51] transition-colors underline-offset-4 hover:underline"
          >
            Return &amp; Replacement
          </Link>
        </div>
      </div>
    </div>
  );
}