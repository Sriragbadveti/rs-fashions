import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import HomeFooter from "../home/HomeFooter";
import CookieConsent from "../common/CookieConsent";
import CurtainIntro from "../common/CurtainIntro";

function SiteLayout() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#F7EBEC] via-[#F4E7E4] to-[#E9C9C3]/45 text-[#2A2421] flex flex-col justify-between">
      {/* Cinematic Luxury Curtain Reveal Intro */}
      <CurtainIntro />

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