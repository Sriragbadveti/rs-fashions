import type { ReactNode } from "react";
import Navbar from "./Navbar";

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-dvh overflow-x-hidden">
      <Navbar />

      <main className="page-shell">
        {children}
      </main>
    </div>
  );
}

export default Layout;