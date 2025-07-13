"use client";

import { signOut } from "@/lib/auth";
import { useState, useEffect } from "react";

interface NavbarProps {
  onSidebarToggle: () => void;
}

export default function Navbar({ onSidebarToggle }: NavbarProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationCount] = useState(3); // Mock notification count

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const initialDark = savedTheme ? savedTheme === "dark" : systemDark;

    setIsDarkMode(initialDark);
    if (initialDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    // Apply theme to document
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic here
    console.log("Searching for:", searchQuery);
  };

  const handleSignOut = async () => {
    await fetch("/api/signout", { method: "POST" });
    window.location.href = "/sign-in"; // redirect ke halaman login
  };

  return (
    <nav className="navbar-transition bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 px-3 py-2 md:px-4 md:py-3">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Mobile Sidebar Toggle - Only visible on mobile */}
          <button
            onClick={onSidebarToggle}
            className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors md:hidden"
          >
            <span className="text-base md:text-lg dark:text-white">☰</span>
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Notifications */}
          <button className="cursor-pointer relative p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span className="text-lg md:text-xl">🔔</span>
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="cursor-pointer p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Ubah Tema"
          >
            <span className="text-lg md:text-xl">
              {isDarkMode ? "🌙" : "☀️"}
            </span>
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="cursor-pointer flex items-center space-x-1 md:space-x-2 p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-xs md:text-sm">
                  W
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Willy
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Administrator
                </p>
              </div>
              <span className="text-gray-400 text-xs md:text-sm">▼</span>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="py-1">
                  <a
                    href="#"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span className="mr-3">👤</span>
                    Profil Saya
                  </a>
                  <a
                    href="#"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span className="mr-3">⚙️</span>
                    Pengaturan Akun
                  </a>
                  <hr className="my-1 border-gray-200 dark:border-gray-600" />
                  <button
                    className="cursor-pointer w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={handleSignOut}
                  >
                    <span className="mr-3">🚪</span>
                    Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
