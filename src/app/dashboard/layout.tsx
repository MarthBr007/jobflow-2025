"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  Bars3Icon,
  XMarkIcon,
  CalendarDaysIcon,
  HomeIcon,
  UserIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";
import Header from "@/components/Header";
import { motion, AnimatePresence } from "framer-motion";

const baseNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  {
    name: "Tijdsregistratie",
    href: "/dashboard/time-tracking",
    icon: ClockIcon,
  },
  {
    name: "Beschikbaarheid",
    href: "/dashboard/availability",
    icon: CalendarDaysIcon,
  },
  {
    name: "Verlofaanvragen",
    href: "/dashboard/leave-requests",
    icon: CalendarDaysIcon,
  },
  {
    name: "Team Chat",
    href: "/dashboard/chat",
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: "Projecten",
    href: "/dashboard/projects",
    icon: ClipboardDocumentListIcon,
  },
  {
    name: "Werkomschrijvingen",
    href: "/dashboard/work-descriptions",
    icon: DocumentTextIcon,
  },
];

const adminNavigation = [
  ...baseNavigation.slice(0, 3),
  { name: "Personeel", href: "/dashboard/personnel", icon: UserGroupIcon },
  { name: "Rooster", href: "/dashboard/schedule", icon: CalendarIcon },
  ...baseNavigation.slice(4),
  {
    name: "Uren goedkeuren",
    href: "/dashboard/time-approval",
    icon: ClipboardDocumentCheckIcon,
  },
  {
    name: "Verlof beheren",
    href: "/dashboard/admin/leave-requests",
    icon: CalendarDaysIcon,
  },
  {
    name: "Rooster Templates",
    href: "/dashboard/admin/schedule-templates",
    icon: CalendarDaysIcon,
  },
  {
    name: "Klokstatus",
    href: "/dashboard/clock-management",
    icon: ClockIcon,
  },
  {
    name: "Kiosk Dashboard",
    href: "/dashboard/kiosk",
    icon: ComputerDesktopIcon,
  },
  {
    name: "Systeeminstellingen",
    href: "/dashboard/admin/system-settings",
    icon: Cog6ToothIcon,
  },
];

const userNavigation = [
  ...baseNavigation.slice(0, 1),
  { name: "Mijn Profiel", href: "/dashboard/profile", icon: UserIcon },
  ...baseNavigation.slice(1, 5),
  { name: "Collega's", href: "/dashboard/colleagues", icon: UserGroupIcon },
  ...baseNavigation.slice(5),
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Start open on desktop
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true); // Keep open on desktop
      } else {
        setIsSidebarOpen(false); // Always closed on mobile by default
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Dark mode initialization and persistence
  useEffect(() => {
    // Check stored preference first, then system preference
    const storedPreference = localStorage.getItem("darkMode");

    if (storedPreference !== null) {
      const isDark = storedPreference === "true";
      setIsDarkMode(isDark);
      // Apply to document immediately
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      // Fall back to system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setIsDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      // Store the initial preference
      localStorage.setItem("darkMode", prefersDark.toString());
    }
  }, []);

  // Apply dark mode changes to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [isDarkMode]);

  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xl text-gray-900 dark:text-white"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const navItems =
    session.user.role === "ADMIN" || session.user.role === "MANAGER"
      ? adminNavigation
      : userNavigation;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header
        isDarkMode={isDarkMode}
        onDarkModeToggle={handleDarkModeToggle}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <div className="flex h-screen pt-16 relative">
        {/* Mobile Overlay */}
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
              onClick={closeSidebar}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.div
          initial={false}
          animate={{
            width: isMobile
              ? isSidebarOpen
                ? 280
                : 0
              : isSidebarOpen
              ? 256
              : 64,
          }}
          transition={{ type: "spring", damping: 25, stiffness: 120 }}
          className={`${
            isMobile
              ? "fixed left-0 top-0 bottom-0 z-50"
              : "relative flex-shrink-0"
          } bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 overflow-hidden`}
          style={{
            marginTop: isMobile ? "0" : "0",
            height: isMobile ? "100vh" : "100%",
          }}
        >
          {/* Mobile Header with Logo */}
          {isMobile && isSidebarOpen && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 min-h-[64px]">
              <Link
                href="/dashboard"
                className="flex items-center"
                onClick={closeSidebar}
              >
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent"
                >
                  JobFlow
                </motion.span>
              </Link>
              <button
                onClick={closeSidebar}
                className="p-3 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 touch-manipulation transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          )}

          <div
            className="overflow-y-auto flex-1"
            style={{
              paddingTop: isMobile ? (isSidebarOpen ? "0" : "0") : "1.25rem",
              height: isMobile
                ? isSidebarOpen
                  ? "calc(100vh - 4rem)"
                  : "0"
                : "calc(100vh - 4rem - 1.25rem)",
            }}
          >
            <nav className={`${isMobile ? "px-4 py-2" : "px-2"} pb-4`}>
              <div className="space-y-1">
                {navItems.map((item) => (
                  <div key={item.name} className="relative">
                    <Link
                      href={item.href}
                      onClick={closeSidebar}
                      className={`group flex items-center rounded-xl transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white touch-manipulation ${
                        isMobile || isSidebarOpen
                          ? "px-4 py-4 text-sm font-medium min-h-[56px]"
                          : "px-3 py-3 justify-center"
                      }`}
                      title={
                        !isMobile && !isSidebarOpen ? item.name : undefined
                      }
                    >
                      <item.icon
                        className={`transition-colors text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300 flex-shrink-0 ${
                          isMobile || isSidebarOpen ? "mr-4 h-6 w-6" : "h-6 w-6"
                        }`}
                        aria-hidden="true"
                      />
                      <AnimatePresence>
                        {(isMobile || isSidebarOpen) && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="truncate whitespace-nowrap font-medium"
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>

                    {/* Tooltip for collapsed state */}
                    {!isMobile && !isSidebarOpen && (
                      <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                        {item.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </nav>
          </div>

          {/* Desktop Toggle Button - Integrated in sidebar */}
          {!isMobile && (
            <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2">
              <div className="relative group">
                <button
                  onClick={toggleSidebar}
                  className={`w-full p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold transition-all duration-200 rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] ${
                    isSidebarOpen
                      ? "flex items-center justify-center"
                      : "flex justify-center items-center"
                  }`}
                  title={
                    isSidebarOpen ? "Sidebar inklappen" : "Sidebar uitklappen"
                  }
                >
                  {isSidebarOpen ? (
                    <>
                      <svg
                        className="w-5 h-5 mr-2 text-white flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11 19l-7-7 7-7"
                        />
                      </svg>
                      <span className="text-sm font-semibold text-white">
                        ← Inklappen
                      </span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 5l7 7-7 7"
                        />
                      </svg>
                    </>
                  )}
                </button>

                {/* Enhanced Tooltip for collapsed state */}
                {!isSidebarOpen && (
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 px-4 py-3 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-gray-700 dark:border-gray-600">
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 5l7 7-7 7"
                        />
                      </svg>
                      <span className="font-medium">→ Menu uitklappen</span>
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 w-3 h-3 bg-gray-900 dark:bg-gray-700 border-l border-b border-gray-700 dark:border-gray-600 rotate-45"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Toggle Button for when sidebar is collapsed */}
          {isMobile && !isSidebarOpen && (
            <div className="fixed bottom-6 left-6 z-50">
              <button
                onClick={toggleSidebar}
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-white dark:border-gray-800"
                title="Menu openen"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          )}
        </motion.div>

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 min-w-0 overflow-y-auto text-gray-900 dark:text-gray-100`}
          style={{
            marginTop: isMobile ? "0" : "0",
            paddingLeft: isMobile ? "1rem" : "1.5rem",
            paddingRight: isMobile ? "1rem" : "1.5rem",
            paddingTop: isMobile ? "1rem" : "1.5rem",
            paddingBottom: isMobile ? "5rem" : "1.5rem", // Extra bottom padding on mobile for floating menu button
            height: "calc(100vh - 4rem)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
