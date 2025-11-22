"use client";

import NavBar from "./dashboard/components/NavBar";
import { ToastContainer } from "react-toastify";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Top nav */}
      <NavBar />

      {/* Page content */}
      <main>{children}</main>

      {/* Toasts */}
      <ToastContainer />
    </>
  );
}
