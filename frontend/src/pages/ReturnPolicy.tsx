import React from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiClock, FiVideo, FiAlertCircle } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { BusinessDetails, PolicyNav } from "../components/common/BusinessDetails";
import {
  BRAND_NAME,
  LEGAL_BUSINESS_NAME,
  SUPPORT_EMAIL,
  POLICY_LAST_UPDATED,
  whatsappLink,
  mailtoLink,
} from "../config/business";

export default function ReturnPolicy() {
  return (
    <div className="relative min-h-screen bg-linear-to-b from-[#F7EBEC] via-[#F4E7E4] to-[#E9C9C3]/40 font-sans text-[#2C2420] py-12 px-4 sm:px-6 lg:px-8 overflow-hidden selection:bg-[#8E3D51] selection:text-white">
      {/* Soft warm silk accents */}
      <div className="pointer-events-none absolute -top-24 -left-20 hidden h-96 w-96 rounded-full bg-[#CBC0D3]/50 blur-3xl sm:block" />
      <div className="pointer-events-none absolute top-1/3 -right-24 hidden h-96 w-96 rounded-full bg-[#E9C9C3]/60 blur-3xl sm:block" />

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
        <article className="rounded-2xl border border-white/60 bg-white/85 p-6 sm:p-10 shadow-sm sm:backdrop-blur-md">
          {/* Header */}
          <header className="border-b border-[#8E3D51]/10 pb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8E3D51]/15 bg-[#8E3D51]/5 px-3 py-1 text-[11px] font-semibold text-[#8E3D51] mb-3">
              <span>Orders &amp; Payments</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl text-[#2C2420] font-normal tracking-tight">
              Cancellation &amp; Refund Policy
            </h1>
            <p className="mt-2 text-xs text-stone-500">
              Last updated: {POLICY_LAST_UPDATED} &middot; {BRAND_NAME} ({LEGAL_BUSINESS_NAME})
            </p>
          </header>

          {/* Core policy box */}
          <div className="mt-7 rounded-xl border border-[#8E3D51]/25 bg-[#8E3D51]/5 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#8E3D51] text-white mt-0.5">
                <FiAlertCircle size={17} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#8E3D51]">
                  We do not offer refunds
                </h2>
                <p className="mt-1 text-xs text-stone-700 leading-relaxed">
                  All purchases from {BRAND_NAME} ({LEGAL_BUSINESS_NAME}) are final. Orders are non-refundable and
                  cannot be cancelled once payment is completed. Please review your saree, colour and order details
                  carefully before paying.
                </p>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="mt-8 space-y-7 text-xs sm:text-[13px] leading-relaxed text-stone-700">
            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">1. Refunds</h2>
              <p>
                {BRAND_NAME} does not offer refunds on any order, whatever the payment method used (UPI, cards or
                netbanking).
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">2. Cancellations</h2>
              <p>
                Orders cannot be cancelled by the customer once the order has been placed and payment has been
                completed. The website does not offer an option to cancel a confirmed order.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">3. Returns &amp; Exchanges</h2>
              <p>
                We do not accept returns or exchanges, including for a change of mind, colour preference, or natural
                handloom characteristics such as minute zari shifts, minor selvedge unevenness, or small knots on the
                reverse side.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">
                4. Saree Damaged in Transit (Replacement Only)
              </h2>
              <p className="mb-3 text-stone-600">
                Every handloom saree is checked by hand before packing. If your saree arrives physically torn,
                stained, or damaged in transit, you may request a <strong>replacement</strong> (not a refund). A
                request is only considered when:
              </p>
              <ul className="mb-4 space-y-1.5 text-stone-800">
                <li className="flex items-center gap-2">
                  <FiClock size={14} className="text-[#8E3D51] shrink-0" />
                  <span>You inform us within <strong>48 hours (2 days)</strong> of delivery, and</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiVideo size={14} className="text-[#8E3D51] shrink-0" />
                  <span>You share a single, continuous <strong>360&deg; unboxing video</strong> from the sealed outer parcel to opening the saree.</span>
                </li>
              </ul>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-stone-200/80 bg-white/60 p-3.5 shadow-xs">
                  <h3 className="text-xs font-bold text-[#8E3D51] mb-1">1. Show Sealed Parcel</h3>
                  <p className="text-[11px] text-stone-600 leading-normal">
                    Show the intact package tape and the courier label clearly before opening.
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200/80 bg-white/60 p-3.5 shadow-xs">
                  <h3 className="text-xs font-bold text-[#8E3D51] mb-1">2. Unbroken Recording</h3>
                  <p className="text-[11px] text-stone-600 leading-normal">
                    Film continuously without pauses or cuts while you open the parcel and unfold the saree.
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200/80 bg-white/60 p-3.5 shadow-xs">
                  <h3 className="text-xs font-bold text-[#8E3D51] mb-1">3. Highlight the Issue</h3>
                  <p className="text-[11px] text-stone-600 leading-normal">
                    Bring any stain, cut, or visible fabric defect clearly into good lighting and focus.
                  </p>
                </div>
              </div>

              <p className="mt-4 mb-1.5 font-semibold text-stone-800">Replacement requests are not accepted for:</p>
              <ul className="space-y-1.5 pl-1 text-stone-600">
                {[
                  "Requests submitted after 48 hours from delivery.",
                  "Sarees opened without a continuous, unedited unboxing video.",
                  "Drapes that have been draped, worn, dry-cleaned, washed, altered, or scented.",
                  "Pieces with missing tags, removed tassels, or cut/stitched blouse pieces.",
                  "Natural handloom traits—such as minute zari shifts, minor selvedge unevenness, or small knots on the reverse side.",
                ].map((text) => (
                  <li key={text} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#8E3D51] shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3">
                To request a replacement, send your order number and the unboxing video to us on WhatsApp or by email
                within 48 hours of delivery. Our team will review it and reply with the outcome.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">5. Failed or Incomplete Payments</h2>
              <p>
                If a payment fails or is not confirmed, no order is placed. If an amount was debited from your
                account for a payment that failed, please contact us at{" "}
                <a href={mailtoLink("Failed payment")} className="font-medium text-[#8E3D51] underline-offset-4 hover:underline">
                  {SUPPORT_EMAIL}
                </a>{" "}
                with your order number, payment date and amount so we can help you check its status.
              </p>
            </section>

            <section className="rounded-xl border border-stone-200/90 bg-white/70 p-4 sm:p-5">
              <h2 className="font-serif text-base font-medium text-[#2C2420] mb-1.5">6. Need Help With an Order?</h2>
              <p className="text-xs text-stone-600 mb-3">
                Message us with your order number and our team will assist you:
              </p>
              <div className="flex flex-wrap gap-2.5">
                <a
                  href={whatsappLink("Hi RS Fashions, I need assistance with my recent order")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-green-700 text-white px-4 py-2.5 text-xs font-semibold tracking-wide hover:bg-[#28492C] transition-colors"
                >
                  <FaWhatsapp size={15} />
                  <span>WhatsApp Support</span>
                </a>
                <a
                  href={mailtoLink("Order Assistance")}
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-[#FAF7F2] text-stone-800 px-4 py-2.5 text-xs font-semibold tracking-wide hover:bg-[#F3ECE1] hover:border-[#8E3D51]/30 transition-colors break-all"
                >
                  <span>Email: {SUPPORT_EMAIL}</span>
                </a>
              </div>
            </section>

            <BusinessDetails />
          </div>
        </article>

        <PolicyNav current="/cancellation-refund-policy" />
      </div>
    </div>
  );
}
