"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ChartPie, House, Briefcase } from "lucide-react";
import { useAuth } from "../context/AuthHook";

export default function Sidebar() {
  const { userMDB, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const getLinkClass = (href: string) => {
    return pathname === href
      ? "flex items-center space-x-3 px-3 py-2 rounded-md bg-[#6C63FF] text-white"
      : "flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200";
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      // optional: router.push("/login");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <>
      <aside className="w-64 h-screen bg-gray-50 border-r border-gray-200 flex flex-col p-6">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Image
            src="/assets/images/app_logo.png"
            alt="App Logo"
            width={400}
            height={135}
            className="mb-2"
          />
        </div>

        <hr className="border-t-2 border-[#E0DEFF] rounded-full my-6" />

        {/* User Info */}
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-[#CCC9FF] flex items-center justify-center text-[#6C63FF] font-semibold">
            AU
          </div>
          <div>
            <p className="font-semibold text-gray-900">{userMDB?.email}</p>
            <p className="text-sm text-gray-500">{userMDB?.role}</p>
          </div>
        </div>

        <hr className="border-t-2 border-[#E0DEFF] rounded-full my-6" />

        {/* Menu */}
        <nav className="flex-1">
          <p className="text-[#6C63FF] font-semibold mb-2">Menu</p>
          <ul className="space-y-2 mb-6">
            <li>
              <Link href="/home" className={getLinkClass("/home")}>
                <House size={16} />
                <span>Home</span>
              </Link>
            </li>
            <li>
              <Link href="/analytics" className={getLinkClass("/analytics")}>
                <ChartPie size={16} />
                <span>Analytics</span>
              </Link>
            </li>
            <li>
              <Link href="/scrape" className={getLinkClass("/scrape")}>
                <Briefcase size={16} />
                <span>External Jobs</span>
              </Link>
            </li>
          </ul>

          <p className="text-[#6C63FF] font-semibold mb-2">General</p>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200 w-full text-left cursor-pointer"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-width-sm max-w-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Logout
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to log out?
            </p>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                disabled={isLoggingOut}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
