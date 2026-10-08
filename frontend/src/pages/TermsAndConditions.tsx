import React from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { BusinessDetails, PolicyNav } from "../components/common/BusinessDetails";
import { BRAND_NAME, LEGAL_BUSINESS_NAME, PROPRIETOR_NAME, POLICY_LAST_UPDATED } from "../config/business";

export default function TermsAndConditions() {
  return (
    <div className="relative min-h-screen bg-linear-to-b from-[#F7EBEC] via-[#F4E7E4] to-[#E9C9C3]/40 font-sans text-[#2C2420] py-12 px-4 sm:px-6 lg:px-8 overflow-hidden selection:bg-[#8E3D51] selection:text-white">
      {/* Soft warm silk accents */}
      <div className="pointer-events-none absolute -top-24 -left-20 hidden h-96 w-96 rounded-full bg-[#CBC0D3]/50 blur-3xl sm:block" />
      <div className="pointer-events-none absolute top-1/3 -right-24 hidden h-96 w-96 rounded-full bg-[#E9C9C3]/60 blur-3xl sm:block" />

      <div className="relative mx-auto max-w-3xl">
        {/* Navigation */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#8E3D51] hover:text-[#6E2A3C] transition-colors mb-6 group"
        >
          <FiArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to store</span>
        </Link>

        {/* Content Card */}
        <article className="rounded-2xl border border-white/60 bg-white/85 p-6 sm:p-10 shadow-sm sm:backdrop-blur-md">
          {/* Header */}
          <header className="border-b border-[#8E3D51]/10 pb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8E3D51]/15 bg-[#8E3D51]/5 px-3 py-1 text-[11px] font-semibold text-[#8E3D51] mb-3">
              <span>Guidelines</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl text-[#2C2420] font-normal tracking-tight">
              Terms &amp; Conditions
            </h1>
            <p className="mt-2 text-xs text-stone-500">
              Last updated: {POLICY_LAST_UPDATED} &middot; {BRAND_NAME} ({LEGAL_BUSINESS_NAME})
            </p>
          </header>

          {/* Body Content */}
          <div className="mt-8 space-y-7 text-xs sm:text-[13px] leading-relaxed text-stone-700">
            {/* Section 1 */}
            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">
                1. Shopping With Us
              </h2>
              <p>
                This website is operated by {LEGAL_BUSINESS_NAME} (Proprietor: {PROPRIETOR_NAME}) under the brand name {BRAND_NAME}. When you browse our collection or place an order for our sarees through our website, you agree to the practical shopping guidelines detailed below. Please take a moment to read through them so you know what to expect.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">
                2. Authentic Handloom &amp; Natural Characteristics
              </h2>
              <p className="mb-2">
                Every saree in our store is woven by hand on traditional pit-looms, focusing on genuine SiCo and heritage Gadwal borders. Because these are handmade items:
              </p>
              <ul className="space-y-1.5 pl-1 text-stone-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#8E3D51] shrink-0" />
                  <span>Slight thread variations, tiny knotting in the zari, or subtle unevenness in selvedges are natural outcomes of the manual handloom process, not structural defects.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#8E3D51] shrink-0" />
                  <span>We photograph all sarees in natural daylight. Minor tone differences may still happen depending on your mobile screen or display brightness.</span>
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">
                3. Prices, Offers &amp; Taxes
              </h2>
              <p>
                All prices shown on the store are in Indian Rupees (INR) and already include Goods and Services Tax (GST). If an active bundle discount (such as Buy 2 or Festive Specials) applies to your selected saree, the reduced price calculates directly at checkout.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">
                4. Order Confirmations &amp; Payments
              </h2>
              <p>
                Once your payment succeeds through our verified gateways (UPI, Cards, or Netbanking), you will receive an immediate confirmation via WhatsApp and email. If an unexpected stock issue occurs before packing, we will contact you right away using the details on your order.
              </p>
              <p className="mt-2">
                All orders are non-refundable and cannot be cancelled once payment is completed. Please read our{" "}
                <Link to="/cancellation-refund-policy" className="font-medium text-[#8E3D51] underline underline-offset-2 hover:text-[#6E2A3C]">
                  Cancellation &amp; Refund Policy
                </Link>{" "}
                before placing an order.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">
                5. Packing &amp; Safe Dispatch
              </h2>
              <p>
                Every saree goes through a manual quality check before being placed in protective, water-resistant packaging. We hand over parcels to reliable courier partners within 24 to 48 working hours and share your live tracking link as soon as it is generated.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">
                6. Photographs &amp; Store Content
              </h2>
              <p>
                All drape photography, saree styling images, motif layouts, and design descriptions are original creative assets of {BRAND_NAME} ({LEGAL_BUSINESS_NAME}). We ask that our pictures not be copied or repurposed for unauthorized commercial listings elsewhere.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">
                7. Questions or Assistance?
              </h2>
              <p className="mb-3">
                If you ever face an issue with your parcel, invoice, or saree condition, reach out to us directly:
              </p>
              <BusinessDetails />
              <p className="mt-3 text-[11px] text-stone-500">
                Location: Telangana, India. Legal claims or disputes are subject to the jurisdiction of the competent courts in Telangana, India.
              </p>
            </section>
          </div>
        </article>

        <PolicyNav current="/terms-and-conditions" />
      </div>
    </div>
  );
}