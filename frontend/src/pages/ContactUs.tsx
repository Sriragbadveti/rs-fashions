import { Link } from "react-router-dom";
import { FiArrowLeft, FiMail, FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { BusinessDetails, PolicyNav } from "../components/common/BusinessDetails";
import {
  BRAND_NAME,
  LEGAL_BUSINESS_NAME,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
  whatsappLink,
  mailtoLink,
} from "../config/business";

export default function ContactUs() {
  return (
    <div className="relative min-h-screen bg-linear-to-b from-[#F7EBEC] via-[#F4E7E4] to-[#E9C9C3]/40 font-sans text-[#2C2420] py-12 px-4 sm:px-6 lg:px-8 overflow-hidden selection:bg-[#8E3D51] selection:text-white">
      {/* Soft warm silk accents */}
      <div className="pointer-events-none absolute -top-24 -left-20 hidden h-96 w-96 rounded-full bg-[#CBC0D3]/50 blur-3xl sm:block" />
      <div className="pointer-events-none absolute top-1/3 -right-24 hidden h-96 w-96 rounded-full bg-[#E9C9C3]/60 blur-3xl sm:block" />

      <div className="relative mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#8E3D51] hover:text-[#6E2A3C] transition-colors mb-6 group"
        >
          <FiArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to store</span>
        </Link>

        <article className="rounded-2xl border border-white/60 bg-white/85 p-6 sm:p-10 shadow-sm sm:backdrop-blur-md">
          <header className="border-b border-[#8E3D51]/10 pb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8E3D51]/15 bg-[#8E3D51]/5 px-3 py-1 text-[11px] font-semibold text-[#8E3D51] mb-3">
              <span>Customer Support</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#2C2420] font-normal tracking-tight">Contact Us</h1>
            <p className="mt-2 text-xs text-stone-500">
              {BRAND_NAME} is operated by {LEGAL_BUSINESS_NAME}. We reply to customer inquiries within 24 to 48 hours.
            </p>
          </header>

          <div className="mt-8 space-y-7 text-xs sm:text-[13px] leading-relaxed text-stone-700">
            <section className="grid gap-3 sm:grid-cols-3">
              <a
                href={mailtoLink()}
                className="flex flex-col gap-1.5 rounded-xl border border-stone-200/80 bg-white/60 p-4 shadow-xs transition-colors hover:border-[#8E3D51]/30"
              >
                <FiMail size={18} className="text-[#8E3D51]" />
                <span className="text-xs font-bold text-[#2C2420]">Email</span>
                <span className="text-[11px] text-stone-600 break-all">{SUPPORT_EMAIL}</span>
              </a>
              <a
                href={`tel:${SUPPORT_PHONE_TEL}`}
                className="flex flex-col gap-1.5 rounded-xl border border-stone-200/80 bg-white/60 p-4 shadow-xs transition-colors hover:border-[#8E3D51]/30"
              >
                <FiPhone size={18} className="text-[#8E3D51]" />
                <span className="text-xs font-bold text-[#2C2420]">Phone</span>
                <span className="text-[11px] text-stone-600">{SUPPORT_PHONE_DISPLAY}</span>
              </a>
              <a
                href={whatsappLink("Hi RS Fashions, I have a question")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-xs transition-colors hover:border-emerald-400"
              >
                <FaWhatsapp size={18} className="text-emerald-700" />
                <span className="text-xs font-bold text-[#2C2420]">WhatsApp</span>
                <span className="text-[11px] text-stone-600">{SUPPORT_PHONE_DISPLAY}</span>
              </a>
            </section>

            <section>
              <h2 className="font-serif text-lg font-medium text-[#2C2420] mb-2">Order Questions</h2>
              <p>
                Please include your order number when you write to us. For delivery timelines, cancellations and
                refunds, see our{" "}
                <Link to="/shipping-policy" className="font-medium text-[#8E3D51] underline underline-offset-2">
                  Shipping &amp; Delivery Policy
                </Link>{" "}
                and{" "}
                <Link to="/cancellation-refund-policy" className="font-medium text-[#8E3D51] underline underline-offset-2">
                  Cancellation &amp; Refund Policy
                </Link>
                .
              </p>
            </section>

            <BusinessDetails />
          </div>
        </article>

        <PolicyNav current="/contact-us" />
      </div>
    </div>
  );
}
