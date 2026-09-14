import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import CookieConsent from "../common/CookieConsent";

function SiteLayout() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2A2421]">
      <Navbar />

      <main className="pt-22 sm:pt-25">
        <Outlet />
      </main>

      {/* Floating Bespoke Cookie Consent */}
      <CookieConsent />
    </div>
  );
}

export default SiteLayout;
