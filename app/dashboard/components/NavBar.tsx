"use client";

import React from "react";

export default function NavBar() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Left: brand */}
        <h1 className="text-2xl font-bold text-gray-900">
          Muse
        </h1>

        {/* Right: actions */}
        <div className="flex items-center space-x-3">
          {/* Contact */}
          <button
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Contact
          </button>

          {/* Sign out */}
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
