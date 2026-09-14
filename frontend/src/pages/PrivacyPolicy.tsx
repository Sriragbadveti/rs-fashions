import { Link } from "react-router-dom";
import { FiShield, FiLock, FiCheckCircle, FiArrowLeft } from "react-icons/fi";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] font-sans text-[#2A2421] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8E3D51] hover:text-[#722F40] transition-colors mb-8"
        >
          <FiArrowLeft size={14} />
          <span>Return to home</span>
        </Link>

        <div className="rounded-3xl border border-black/8 bg-white p-8 sm:p-12 shadow-sm">
          <div className="flex items-center gap-3 text-[#8E3D51] mb-3">
            <FiShield size={24} />
            <span className="text-xs font-bold uppercase tracking-[0.28em]">
              Security &amp; Trust
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-light text-[#2A2421] tracking-tight">
            Privacy &amp; Cookie <span className="italic font-normal">Charter.</span>
          </h1>

          <p className="mt-4 text-xs font-light uppercase tracking-wider text-[#8C7A6B]">
            Last updated: September 2026 · RS Fashions Studio, Jubilee Hills, Hyderabad
          </p>

          <div className="mt-8 space-y-8 text-sm leading-relaxed text-[#544B44]">
            <section>
              <h2 className="font-serif text-xl font-medium text-[#2A2421] mb-2">
                1. Our Commitment to Discretion &amp; Privacy
              </h2>
              <p>
                At RS Fashions, we hold the privacy of our patrons in the highest regard. We collect only the information essential to handcrafting your shopping experience, facilitating bespoke order fulfillment, and providing seamless showroom concierge support.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-medium text-[#2A2421] mb-2">
                2. Information We Gather
              </h2>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs">
                <li><strong>Patron Identity:</strong> Name, verified email address, and contact telephone for order verification and dispatch.</li>
                <li><strong>Delivery Coordinates:</strong> Shipping destination, state, and postal code.</li>
                <li><strong>Authentication Records:</strong> Secure login identifiers via Google Authentication or encrypted credentials. We never store raw passwords.</li>
                <li><strong>Transaction Records:</strong> Order histories, saree choices, and preferred weaves to provide celebratory tier privileges.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-medium text-[#2A2421] mb-2">
                3. Cookie Policy &amp; Usage
              </h2>
              <p className="mb-3">
                Cookies are minute data tokens saved in your browser that enable our studio to function reliably. We categorize cookies as follows:
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-black/8 bg-[#FAF7F2] p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8E3D51] block mb-1">
                    Essential
                  </span>
                  <p className="text-xs text-[#6E6359]">
                    Maintains your shopping bag across navigation, secures checkout tokens, and protects sessions. Always active.
                  </p>
                </div>
                <div className="rounded-2xl border border-black/8 bg-[#FAF7F2] p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8E3D51] block mb-1">
                    Analytics
                  </span>
                  <p className="text-xs text-[#6E6359]">
                    Measures showroom load times, discovery paths, and catalog performance to continuously refine our drapes presentation.
                  </p>
                </div>
                <div className="rounded-2xl border border-black/8 bg-[#FAF7F2] p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8E3D51] block mb-1">
                    Preferences
                  </span>
                  <p className="text-xs text-[#6E6359]">
                    Remembers your preferred weave types, celebratory discounts, and tailored festive saree collections.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-serif text-xl font-medium text-[#2A2421] mb-2">
                4. Data Protection &amp; Third Parties
              </h2>
              <p>
                We never monetize or trade your personal dossier. Data is shared strictly with accredited logistics partners (BlueDart, Delhivery) for courier delivery and authorized payment gateways (Razorpay, PhonePe) for secure UPI / card processing.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-medium text-[#2A2421] mb-2">
                5. Concierge &amp; Inquiries
              </h2>
              <p>
                To request data deletion, review your stored client record, or manage communication preferences, kindly reach out to our concierge at <span className="font-semibold text-[#8E3D51]">support@rsfashions.in</span> or visit our Jubilee Hills flagship showroom.
              </p>
            </section>
          </div>

          <div className="mt-10 border-t border-black/8 pt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
              <FiCheckCircle size={14} />
              <span>TLS 1.3 256-Bit Military Encryption Active</span>
            </div>

            <Link
              to="/shop"
              className="rounded-full bg-[#2A2421] text-white px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] hover:bg-[#8E3D51] transition-colors"
            >
              Explore Saree Collection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
