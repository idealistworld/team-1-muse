"use client";

import { usePathname } from "next/navigation";
import NavBar from "./dashboard/components/NavBar";
import { ToastContainer } from "react-toastify";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <>
      {/* Top nav */}
      <NavBar />

      {/* Page content */}
      <main className={isLoginPage ? "" : "p-8"}>{children}</main>

      {/* Toasts */}
      <ToastContainer />
    </>
  );
}
