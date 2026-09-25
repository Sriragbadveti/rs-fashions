import { useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";
import { ModalProvider } from "../context/ModalContext";
import { OrderFulfillmentProvider } from "../context/OrderFulfillmentContext";

export interface UserSession {
  name: string;
  email: string;
  role: string;
}

export default function Admin() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem("rs_admin_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role === "admin") return parsed;
      }
    } catch {}
    return null;
  });

  return (
    <ModalProvider>
      <OrderFulfillmentProvider>
        {!currentUser ? (
          <Login
            onLoginSuccess={(user) => {
              try {
                localStorage.setItem("rs_admin_session", JSON.stringify(user));
              } catch {}
              setCurrentUser(user);
            }}
          />
        ) : (
          <Dashboard
            user={currentUser}
            onLogout={() => {
              try {
                localStorage.removeItem("rs_admin_session");
              } catch {}
              setCurrentUser(null);
            }}
          />
        )}
      </OrderFulfillmentProvider>
    </ModalProvider>
  );
}
