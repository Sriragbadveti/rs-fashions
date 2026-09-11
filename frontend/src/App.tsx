import {
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import SiteLayout from "./components/layout/SiteLayout";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OurStory from "./pages/OurStory";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";

function AppContent() {
  const location = useLocation();

  return (
    <Routes location={location}>
      {/* ADMIN PORTAL (Stand-alone Layout) */}
      <Route path="/admin" element={<Admin />} />

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
    </Routes>
  );
}

export default function App() {
  return <AppContent />;
}