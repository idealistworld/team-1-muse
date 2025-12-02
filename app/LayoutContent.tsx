"use client";

import NavBar from "./dashboard/components/NavBar";
import { ToastContainer } from "react-toastify";
import { usePathname } from "next/navigation";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const shouldShowNav = pathname !== "/";

  return (
    <>
      {/* Top nav */}
      {shouldShowNav && <NavBar />}

      {/* Page content */}
      <main>{children}</main>

      {/* Toasts */}
      <ToastContainer />
    </>
  );
}
