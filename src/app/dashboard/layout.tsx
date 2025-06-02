"use client";

import { useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  HomeIcon,
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ClockIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  XMarkIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import { signOut } from "next-auth/react";

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
    icon: CalendarIcon,
  },
  {
    name: "Verlofaanvragen",
    href: "/dashboard/leave-requests",
    icon: CalendarIcon,
  },
  {
    name: "Team Chat",
    href: "/dashboard/chat",
    icon: CalendarIcon,
  },
  {
    name: "Projecten",
    href: "/dashboard/projects",
    icon: CalendarIcon,
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
    icon: CalendarIcon,
  },
  {
    name: "Verlof beheren",
    href: "/dashboard/admin/leave-requests",
    icon: CalendarIcon,
  },
  {
    name: "Rooster Templates",
    href: "/dashboard/admin/schedule-templates",
    icon: CalendarIcon,
  },
  {
    name: "Klokstatus",
    href: "/dashboard/clock-management",
    icon: ClockIcon,
  },
  {
    name: "Kiosk Dashboard",
    href: "/dashboard/kiosk",
    icon: CalendarIcon,
  },
  {
    name: "Systeeminstellingen",
    href: "/dashboard/admin/system-settings",
    icon: Cog6ToothIcon,
  },
];

const userNavigation = [
  ...baseNavigation.slice(0, 1),
  { name: "Mijn Profiel", href: "/dashboard/profile", icon: HomeIcon },
  ...baseNavigation.slice(1, 5),
  { name: "Collega's", href: "/dashboard/colleagues", icon: UserGroupIcon },
  ...baseNavigation.slice(5),
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      // Auto collapse on mobile
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(false); // Don't collapse on mobile
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse">
            <span className="text-white font-bold text-2xl">J</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            JobFlow laden...
          </p>
        </div>
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

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrator";
      case "MANAGER":
        return "Manager";
      case "EMPLOYEE":
        return "Medewerker";
      case "FREELANCER":
        return "Freelancer";
      default:
        return "Gebruiker";
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Professional Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isMobile && !sidebarOpen ? -280 : 0,
          width: !isMobile && sidebarCollapsed ? 80 : 280,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-xl lg:translate-x-0 lg:static lg:inset-0"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="relative h-20 px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between h-full">
              <Link
                href="/dashboard"
                className={`flex items-center transition-all duration-300 ${
                  sidebarCollapsed && !isMobile
                    ? "justify-center w-full"
                    : "space-x-4"
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">J</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 shadow-sm animate-pulse"></div>
                </div>
                {(!sidebarCollapsed || isMobile) && (
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      JobFlow
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Professional
                    </p>
                  </div>
                )}
              </Link>

              {/* Close button for mobile */}
              {isMobile && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-all duration-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-hide">
            <AnimatePresence>
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={item.href}
                    className={`group relative flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      sidebarCollapsed && !isMobile ? "justify-center" : ""
                    } ${
                      isActive(item.href)
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => isMobile && setSidebarOpen(false)}
                    title={
                      sidebarCollapsed && !isMobile ? item.name : undefined
                    }
                  >
                    {/* Active indicator */}
                    {isActive(item.href) && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400 rounded-r-full"
                        initial={false}
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}

                    <div
                      className={`relative ${
                        sidebarCollapsed && !isMobile ? "" : "mr-3"
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 transition-all duration-200 ${
                          isActive(item.href)
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-current"
                        }`}
                      />
                    </div>

                    {(!sidebarCollapsed || isMobile) && (
                      <span className="truncate">{item.name}</span>
                    )}
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </nav>

          {/* User Section */}
          <div className="relative border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            {/* User Profile Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`w-full flex items-center p-3 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ${
                sidebarCollapsed && !isMobile ? "justify-center" : "space-x-3"
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">
                    {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 shadow-sm"></div>
              </div>

              {(!sidebarCollapsed || isMobile) && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {session?.user?.name || "Gebruiker"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {getRoleDisplayName(session?.user?.role || "")}
                  </p>
                </div>
              )}
            </motion.button>

            {/* User Dropdown Menu */}
            <AnimatePresence>
              {showUserMenu && (!sidebarCollapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 backdrop-blur-lg overflow-hidden"
                >
                  <div className="py-2">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => {
                        setShowUserMenu(false);
                        isMobile && setSidebarOpen(false);
                      }}
                      className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <UserCircleIcon className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500" />
                      Mijn Profiel
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => {
                        setShowUserMenu(false);
                        isMobile && setSidebarOpen(false);
                      }}
                      className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Cog6ToothIcon className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500" />
                      Instellingen
                    </Link>
                    <hr className="my-2 border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                      Uitloggen
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toggle Button - Bottom of Sidebar */}
            {!isMobile && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200 z-10"
                title={
                  sidebarCollapsed ? "Sidebar uitklappen" : "Sidebar inklappen"
                }
              >
                {sidebarCollapsed ? (
                  <ChevronRightIcon className="h-4 w-4" />
                ) : (
                  <ChevronLeftIcon className="h-4 w-4" />
                )}
              </motion.button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main
        className={`flex-1 flex flex-col min-h-0 transition-all duration-300 overflow-auto`}
        style={{
          marginLeft: isMobile ? 0 : sidebarCollapsed ? 80 : 280,
        }}
      >
        {/* Mobile Header - Only show hamburger when needed */}
        {isMobile && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 p-4"
          >
            <div className="flex items-center justify-between">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/50 transition-all duration-200"
              >
                <Bars3Icon className="h-6 w-6" />
              </motion.button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-sm">J</span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  JobFlow
                </span>
              </div>
              <div className="w-10" /> {/* Spacer for alignment */}
            </div>
          </motion.div>
        )}

        {/* Content Container */}
        <div className={`flex-1 p-3 lg:p-4 xl:p-6 max-w-7xl mx-auto w-full`}>
          <div className="min-h-full">{children}</div>
        </div>
      </main>
    </div>
  );
}
