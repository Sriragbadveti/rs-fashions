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

function AppContent() {
  const location = useLocation();

  return (
    <Routes location={location}>
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