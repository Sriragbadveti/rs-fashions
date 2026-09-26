import { useState, useEffect } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";
import { ModalProvider } from "../context/ModalContext";
import { OrderFulfillmentProvider } from "../context/OrderFulfillmentContext";
import {
  getAdminSession,
  clearAdminSession,
  getAdminToken,
} from "../utils/adminSession";
import { API_BASE } from "../config/api";

export interface UserSession {
  name: string;
  email: string;
  role: string;
}

export default function Admin() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const session = getAdminSession();
    return session ? session.user : null;
  });

  // Verify server-side token validity on mount
  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;

    let isMounted = true;
    fetch(`${API_BASE}/auth/admin-verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        if (!json.success || !json.data?.valid) {
          console.warn("[Admin] Server rejected admin session. Logging out.");
          clearAdminSession();
          setCurrentUser(null);
        }
      })
      .catch(() => {
        // Network offline fallback
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ModalProvider>
      <OrderFulfillmentProvider>
        {!currentUser ? (
          <Login
            onLoginSuccess={(user) => {
              setCurrentUser(user);
            }}
          />
        ) : (
          <Dashboard
            user={currentUser}
            onLogout={async () => {
              await clearAdminSession();
              setCurrentUser(null);
            }}
          />
        )}
      </OrderFulfillmentProvider>
    </ModalProvider>
  );
}
