import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import HomeFooter from "../home/HomeFooter";
import CookieConsent from "../common/CookieConsent";

function SiteLayout() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2A2421] flex flex-col justify-between">
      <Navbar />

      <main className="pt-22 sm:pt-25 grow">
        <Outlet />
      </main>

      {/* Global Storefront Footer with Policies & Attribution */}
      <HomeFooter />

      {/* Floating Bespoke Cookie Consent */}
      <CookieConsent />
    </div>
  );
}

export default SiteLayout;
