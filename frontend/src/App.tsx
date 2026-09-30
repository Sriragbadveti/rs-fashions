import { lazy, Suspense } from "react";
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
import Auth from "./pages/Auth";

// Lazy-loaded heavy routes to minimize initial bundle size and maximize performance on low-spec hardware
const Admin = lazy(() => import("./pages/Admin"));
const Login = lazy(() => import("./pages/Login"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Account = lazy(() => import("./pages/Account"));
const QuickPay = lazy(() => import("./pages/QuickPay"));
const OffersStore = lazy(() => import("./pages/OffersStore"));
const OurStory = lazy(() => import("./pages/OurStory"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const ReturnPolicy = lazy(() => import("./pages/ReturnPolicy"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));

import { ADMIN_SECRET_PATH, ADMIN_LOGIN_PATH } from "./config/routes";

function RouteLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-[#D4A373]" />
    </div>
  );
}

function AppContent() {
  const location = useLocation();

  return (
    <Suspense fallback={<RouteLoader />}>
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
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
