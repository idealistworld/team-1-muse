"use client";

import NavBar from "./dashboard/components/NavBar";
import { ToastContainer } from "react-toastify";
import { usePathname, useSearchParams } from "next/navigation";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEmbed = searchParams?.get("embed") === "docs";
  const shouldShowNav = pathname !== "/" && !isEmbed;

  return (
    <>
      {/* Top nav */}
      {shouldShowNav && <NavBar />}

      {/* Page content */}
      <main className={isEmbed ? "min-h-screen" : undefined}>{children}</main>

      {/* Toasts */}
      <ToastContainer />
    </>
  );
}
