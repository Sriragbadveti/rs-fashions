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
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";

function AppContent() {
  const location = useLocation();

  return (
    <Routes location={location}>
      {/* ADMIN PORTAL (Stand-alone Layout) */}
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/login" element={<Login />} />

      {/* AUTHENTICATION / LOGIN */}
      <Route path="/login" element={<Auth />} />
      <Route path="/auth" element={<Auth />} />

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

        {/* PRIVACY POLICY */}
        <Route
          path="/privacy-policy"
          element={<PrivacyPolicy />}
        />

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
