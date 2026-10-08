import { Link } from "react-router-dom";
import {
  BRAND_NAME,
  LEGAL_BUSINESS_NAME,
  PROPRIETOR_NAME,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
  POLICY_LINKS,
  mailtoLink,
} from "../../config/business";

/** Legal business identity + support contacts, styled like the policy pages' info boxes. */
export function BusinessDetails({ heading = "Business & Contact Details" }: { heading?: string }) {
  return (
    <div className="rounded-xl border border-stone-200/90 bg-white/70 p-4 sm:p-5 text-xs sm:text-[13px] leading-relaxed text-stone-700">
      <h2 className="font-serif text-base font-medium text-[#2C2420] mb-2">{heading}</h2>
      <dl className="grid grid-cols-1 gap-y-1.5 sm:grid-cols-[11rem_1fr]">
        <dt className="font-semibold text-stone-800">Business Name</dt>
        <dd>{LEGAL_BUSINESS_NAME}</dd>
        <dt className="font-semibold text-stone-800">Proprietor</dt>
        <dd>{PROPRIETOR_NAME}</dd>
        <dt className="font-semibold text-stone-800">Brand</dt>
        <dd>{BRAND_NAME}</dd>
        <dt className="font-semibold text-stone-800">Customer Support Email</dt>
        <dd>
          <a href={mailtoLink()} className="font-medium text-[#8E3D51] underline-offset-4 hover:underline break-all">
            {SUPPORT_EMAIL}
          </a>
        </dd>
        <dt className="font-semibold text-stone-800">Customer Support Phone</dt>
        <dd>
          <a href={`tel:${SUPPORT_PHONE_TEL}`} className="font-medium text-[#8E3D51] underline-offset-4 hover:underline">
            {SUPPORT_PHONE_DISPLAY}
          </a>
        </dd>
      </dl>
    </div>
  );
}

/** Row of links to every policy page; the current page is shown but not linked. */
export function PolicyNav({ current }: { current?: string }) {
  return (
    <nav
      aria-label="Store policies"
      className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-stone-500 text-center"
    >
      {POLICY_LINKS.map((link) =>
        link.path === current ? (
          <span key={link.path} className="font-semibold text-[#8E3D51]" aria-current="page">
            {link.label}
          </span>
        ) : (
          <Link
            key={link.path}
            to={link.path}
            className="hover:text-[#8E3D51] transition-colors underline-offset-4 hover:underline"
          >
            {link.label}
          </Link>
        )
      )}
    </nav>
  );
}
