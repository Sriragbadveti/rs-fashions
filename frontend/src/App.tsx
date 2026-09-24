import {
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import SiteLayout from "./components/layout/SiteLayout";
import ErrorBoundary from "./components/common/ErrorBoundary";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OurStory from "./pages/OurStory";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import ReturnPolicy from "./pages/ReturnPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import OffersStore from "./pages/OffersStore";
import AuthCallback from "./pages/AuthCallback";
import QuickPay from "./pages/QuickPay";

import { ADMIN_SECRET_PATH, ADMIN_LOGIN_PATH } from "./config/routes";

function AppContent() {
  const location = useLocation();

  return (
    <Routes location={location}>
      {/* QUICK PAY COUNTER / PAYMENT LINK PORTAL */}
      <Route path="/pay" element={<QuickPay />} />

      {/* CRYPTOGRAPHIC ADMIN PORTAL (Stand-alone Layout) */}
      <Route path={ADMIN_SECRET_PATH} element={<Admin />} />
      <Route path={ADMIN_LOGIN_PATH} element={<Login />} />
      <Route path="/admin" element={<NotFound />} />
      <Route path="/admin/login" element={<NotFound />} />

      {/* AUTHENTICATION / LOGIN */}
      <Route path="/login" element={<Auth />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* STOREFRONT ROUTES (Site Layout) */}
      <Route element={<SiteLayout />}>
        {/* HOME */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* SHOP */}
        <Route
          path="/shop"
          element={<Shop />}
        />

        {/* EXCLUSIVE OFFERS STORE (Bundle Deals) */}
        <Route
          path="/offers"
          element={<OffersStore />}
        />

        {/* PRODUCT */}
        <Route
          path="/product/:id"
          element={<Product />}
        />

        {/* OUR STORY */}
        <Route
          path="/our-story"
          element={<OurStory />}
        />

        {/* POLICIES & LEGAL CHARTER */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/returns" element={<ReturnPolicy />} />
        <Route path="/return-policy" element={<ReturnPolicy />} />
        <Route path="/shipping" element={<ShippingPolicy />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />

        {/* CART */}
        <Route
          path="/cart"
          element={<Cart />}
        />

        {/* CHECKOUT */}
        <Route
          path="/checkout"
          element={<Checkout />}
        />

        {/* CUSTOMER ACCOUNT & ORDERS HUB */}
        <Route
          path="/account"
          element={<Account />}
        />
        <Route
          path="/orders"
          element={<Account />}
        />
      </Route>

      {/* 404 NOT FOUND (CATCH-ALL) */}
      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
