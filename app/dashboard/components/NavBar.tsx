"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export default function NavBar() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!isMounted) return;
      setUser(user);
      setIsLoadingSession(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        setUser(session?.user ?? null);
        setIsLoadingSession(false);
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  function handleSignIn() {
    router.push("/login");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Left: brand */}
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Muse logo"
            width={25}
            height={25}
            className="shrink-0"
            style={{
              mixBlendMode: "multiply",
              filter: "contrast(1.2) brightness(1.1)",
            }}
          />
          <h1 className="text-2xl font-bold text-gray-900">Muse</h1>
        </div>

        {/* Right: actions */}
        <div className="flex items-center space-x-3">
          {/* Contact */}
          <a
            href="mailto:ckn9573@nyu.edu?subject=Muse%20-%20Support%20Ticket"
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Contact
          </a>

          {/* Auth controls */}
          {!isLoadingSession && (
            user ? (
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
              >
                Sign out
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
              >
                Sign in
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
