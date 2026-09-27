import React from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiLock } from "react-icons/fi";

export default function PrivacyPolicy() {
  return (
    <div className="relative min-h-screen bg-linear-to-b from-[#F7EBEC] via-[#F4E7E4] to-[#E9C9C3]/40 font-sans text-[#2C2420] py-12 px-4 sm:px-6 lg:px-8 overflow-hidden selection:bg-[#8E3D51] selection:text-white">
      {/* Soft warm silk accents */}
      <div className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-[#CBC0D3]/50 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-[#E9C9C3]/60 blur-3xl" />

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
              <span>Customer Care &amp; Trust</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl text-[#2C2420] font-normal tracking-tight">
              Privacy &amp; Shopping Policy
            </h1>
            <p className="mt-2 text-xs text-stone-500">
              Last updated: September 2026 &middot; RS Fashions
            </p>
          </header>

          {/* Body Content */}
          <div className="mt-8 space-y-7 text-xs sm:text-[13px] leading-relaxed text-stone-700">
            {/* Section 1 */}
            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">
                1. Our Promise to You
              </h2>
              <p>
                At RS Fashions, we focus solely on bringing authentic handwoven Gadwal sarees directly from our looms to your wardrobe. We only collect the basic details needed to pack your saree carefully, ship it safely to your doorstep, and keep you updated on your parcel. We do not sell or trade your details to marketers.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">
                2. Details We Need for Your Order
              </h2>
              <ul className="space-y-2 pl-1">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#8E3D51] shrink-0" />
                  <span>
                    <strong>Your Name &amp; Contact:</strong> Your phone number and email are used to share order confirmations, WhatsApp tracking links, and dispatch updates.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#8E3D51] shrink-0" />
                  <span>
                    <strong>Shipping Address:</strong> Your complete house address and PIN code ensure our courier delivers your parcel without delay.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#8E3D51] shrink-0" />
                  <span>
                    <strong>Billing &amp; Payment:</strong> All payments are processed securely through certified Indian payment gateways (UPI, Netbanking, Cards). We never see or store your UPI PINs or card numbers.
                  </span>
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">
                3. How the Website Remembers Your Cart
              </h2>
              <p className="mb-3">
                Our site uses basic cookies to keep your shopping journey smooth:
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-stone-200/80 bg-white/60 p-3.5 shadow-xs">
                  <h3 className="text-xs font-bold text-[#8E3D51] mb-1">
                    Shopping Cart &amp; Checkout
                  </h3>
                  <p className="text-[11px] text-stone-600 leading-normal">
                    Keeps chosen sarees saved in your bag while you browse different borders and colors.
                  </p>
                </div>

                <div className="rounded-xl border border-stone-200/80 bg-white/60 p-3.5 shadow-xs">
                  <h3 className="text-xs font-bold text-[#8E3D51] mb-1">
                    Store Performance
                  </h3>
                  <p className="text-[11px] text-stone-600 leading-normal">
                    Helps high-resolution silk drape images load quickly on your mobile phone and browser.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">
                4. Courier &amp; Logistics Partners
              </h2>
              <p>
                To deliver your sarees safely, we share your name, delivery address, and phone number only with reputable courier partners (such as Blue Dart, Delhivery, or DTDC). They receive only the details strictly required for doorstep delivery and delivery notifications.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">
                5. Updating Your Details or Account
              </h2>
              <p>
                If you need to correct your delivery address before dispatch, check past orders, or delete your shopping account with us, simply drop a note to{" "}
                <a
                  href="mailto:support@rsfashions.com"
                  className="font-medium text-[#8E3D51] underline underline-offset-2 hover:text-[#6E2A3C]"
                >
                  support@rsfashions.com
                </a>{" "}
                or message us directly on WhatsApp.
              </p>
            </section>

            {/* Section 6 */}
            <section className="rounded-xl border border-stone-200/90 bg-white/70 p-4 sm:p-5">
              <h2 className="font-serif text-base font-medium text-[#2C2420] mb-1.5">
                6. Customer Support &amp; Grievances
              </h2>
              <p className="text-xs text-stone-600 mb-3">
                For any questions regarding an order, billing, or your personal information, reach out to our team directly:
              </p>
              <div className="text-xs space-y-1 text-stone-800">
                <p><strong>Brand:</strong> RS Fashions</p>
                <p><strong>Contact:</strong> Founder / Customer Care</p>
                <p>
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:support@rsfashions.com"
                    className="font-medium text-[#8E3D51] underline underline-offset-2 hover:text-[#6E2A3C]"
                  >
                    support@rsfashions.com
                  </a>
                </p>
                <p><strong>Origin:</strong> Telangana, India</p>
                <p className="text-[11px] text-stone-500 pt-1">
                  We reply to all customer inquiries and concerns within 24 to 48 hours.
                </p>
              </div>
            </section>
          </div>

          {/* Card Footer Badge */}
          <footer className="mt-9 border-t border-[#8E3D51]/10 pt-4 flex items-center gap-2 text-stone-500 text-xs">
            <FiLock size={13} className="text-[#8E3D51]" />
            <span>Secure checkout &middot; 100% verified authentic handloom purchases.</span>
          </footer>
        </article>

        {/* Sub-Footer Policy Navigation (Centered Under Card) */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-stone-500 text-center">
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