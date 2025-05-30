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
    name: "Systeeminstellingen",
    href: "/dashboard/admin/system-settings",
    icon: Cog6ToothIcon,
  },
];

const userNavigation = [
  ...baseNavigation.slice(0, 5),
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
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <Link href="/dashboard" className="flex items-center">
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
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 touch-manipulation"
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
            <nav className={`${isMobile ? "px-3" : "px-2"} pb-4`}>
              <div className="space-y-1">
                {navItems.map((item) => (
                  <div key={item.name} className="relative">
                    <Link
                      href={item.href}
                      onClick={closeSidebar}
                      className={`group flex items-center rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white touch-manipulation ${
                        isMobile || isSidebarOpen
                          ? "px-4 py-3 text-sm font-medium min-h-[48px]"
                          : "px-3 py-3 justify-center"
                      }`}
                      title={
                        !isMobile && !isSidebarOpen ? item.name : undefined
                      }
                    >
                      <item.icon
                        className={`transition-colors text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300 flex-shrink-0 ${
                          isMobile || isSidebarOpen ? "mr-3 h-5 w-5" : "h-6 w-6"
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
                            className="truncate whitespace-nowrap"
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>

                    {/* Tooltip for collapsed state */}
                    {!isMobile && !isSidebarOpen && (
                      <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
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
            <div className="border-t border-gray-200 dark:border-gray-700">
              <div className="relative group">
                <button
                  onClick={toggleSidebar}
                  className={`w-full p-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white transition-colors duration-200 ${
                    isSidebarOpen ? "flex items-center" : "flex justify-center"
                  }`}
                  title={
                    isSidebarOpen ? "Sidebar inklappen" : "Sidebar uitklappen"
                  }
                >
                  {isSidebarOpen ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 19l-7-7 7-7"
                        />
                      </svg>
                      <span className="text-sm">Inklappen</span>
                    </>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </button>

                {/* Tooltip for collapsed state */}
                {!isSidebarOpen && (
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 5l7 7-7 7"
                        />
                      </svg>
                      Menu uitklappen
                    </div>
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 min-w-0 overflow-y-auto text-gray-900 dark:text-gray-100`}
          style={{
            marginTop: isMobile ? "0" : "0",
            paddingLeft: isMobile ? "0.75rem" : "1.5rem",
            paddingRight: isMobile ? "0.75rem" : "1.5rem",
            paddingTop: isMobile ? "1.5rem" : "1.5rem",
            paddingBottom: "1.5rem",
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
