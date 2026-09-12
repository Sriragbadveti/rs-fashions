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
  const [currentUser, setCurrentUser] = useState<UserSession | null>({
    name: "Sindhu Reddy",
    email: "admin@rsfashions.in",
    role: "Superadmin",
  });

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
            onLogout={() => {
              setCurrentUser(null);
            }}
          />
        )}
      </OrderFulfillmentProvider>
    </ModalProvider>
  );
}
