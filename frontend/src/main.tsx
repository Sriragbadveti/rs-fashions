import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

import { CartProvider } from "./context/CartContext";
import ScrollToTop from "./components/ScrollToTop";

// Canonical Domain Enforcement:
// Seamlessly forward visitors landing on legacy/default Vercel production aliases
// to canonical https://www.rsfashions25.com without breaking preview or local development.
if (typeof window !== "undefined") {
  const host = window.location.hostname;
  if (host === "rs-fashions-d5h8.vercel.app" || host === "rs-fashions.vercel.app") {
    try {
      const now = Date.now();
      const lastRedirect = Number(sessionStorage.getItem("rs_domain_redir_ts") || 0);
      if (now - lastRedirect > 5000) {
        sessionStorage.setItem("rs_domain_redir_ts", String(now));
        window.location.replace(
          `https://www.rsfashions25.com${window.location.pathname}${window.location.search}${window.location.hash}`
        );
      }
    } catch {}
  }
}

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider>
        <ScrollToTop />
        <App />
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>
);