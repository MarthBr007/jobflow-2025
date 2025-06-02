"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { BellIcon } from "@heroicons/react/24/outline";
import Avatar from "@/components/ui/Avatar";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

interface HeaderProps {
  isDarkMode: boolean;
  onDarkModeToggle: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

interface Notification {
  id: string;
  type: string;
  createdAt: string;
  enabled: boolean;
}

export default function Header({
  isDarkMode,
  onDarkModeToggle,
  isSidebarOpen,
  onToggleSidebar,
}: HeaderProps) {
  const { data: session } = useSession();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] =
    useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
      fetchUserProfile();
    }
  }, [session]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        setNotifications(notifications.filter((n) => n.id !== notificationId));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getNotificationText = (type: string) => {
    switch (type) {
      case "TIME_TRACKING":
        return "Nieuwe tijdsregistratie melding";
      case "PROJECT":
        return "Project update beschikbaar";
      case "EMAIL":
        return "Nieuwe e-mail notificatie";
      case "AVAILABILITY":
        return "Beschikbaarheid update";
      default:
        return "Nieuwe notificatie";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "TIME_TRACKING":
        return "🕐";
      case "PROJECT":
        return "📋";
      case "EMAIL":
        return "📧";
      case "AVAILABILITY":
        return "📅";
      default:
        return "🔔";
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-gray-200 dark:border-gray-700 safe-top ${
        isScrolled
          ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg"
          : "bg-white dark:bg-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - hidden on mobile, hamburger menu will take this spot */}
          <div className="flex-shrink-0 hidden md:block">
            <Link href="/dashboard" className="flex items-center">
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent"
              >
                JobFlow
              </motion.span>
            </Link>
          </div>

          {/* Hamburger Menu Button for Mobile - positioned where logo was */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-3 rounded-xl shadow-sm transition-all duration-200 bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white hover:text-gray-900 dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-600/50 touch-manipulation"
            style={{ minHeight: "48px", minWidth: "48px" }}
          >
            {isSidebarOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>

          {/* Right side items - responsive spacing */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Dark mode toggle - touch-friendly */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDarkModeToggle}
              className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 touch-manipulation"
              style={{ minHeight: "44px", minWidth: "44px" }}
              aria-label="Toggle dark mode"
            >
              <motion.div
                initial={false}
                animate={{ rotate: isDarkMode ? 180 : 0 }}
                transition={{ duration: 0.5 }}
              >
                {isDarkMode ? (
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </motion.div>
            </motion.button>

            {/* Notification dropdown - touch-friendly */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setIsNotificationDropdownOpen(!isNotificationDropdownOpen)
                }
                className="relative flex items-center p-2 sm:p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
              >
                <BellIcon
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </motion.button>

              <AnimatePresence>
                {isNotificationDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: "spring", bounce: 0.25 }}
                    className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50"
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Notificaties
                      </h3>
                      {unreadCount > 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {unreadCount} nieuwe melding
                          {unreadCount !== 1 ? "en" : ""}
                        </p>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="flex items-start p-4 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 cursor-pointer"
                            onClick={() =>
                              markNotificationAsRead(notification.id)
                            }
                          >
                            <div className="flex-shrink-0 mr-3">
                              <span className="text-lg">
                                {getNotificationIcon(notification.type)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {getNotificationText(notification.type)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {new Date(
                                  notification.createdAt
                                ).toLocaleString("nl-NL", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationAsRead(notification.id);
                              }}
                              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <BellIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Geen nieuwe notificaties
                          </p>
                        </div>
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            // Mark all as read
                            notifications.forEach((n) =>
                              markNotificationAsRead(n.id)
                            );
                          }}
                          className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                        >
                          Alle markeren als gelezen
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User dropdown */}
            {session?.user && (
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 touch-manipulation"
                  style={{ minHeight: "44px" }}
                >
                  <Avatar
                    src={session.user.image || undefined}
                    alt={session.user.name || "User"}
                    size="sm"
                    className="ring-2 ring-white dark:ring-gray-700"
                  />
                  {/* Username - hidden on mobile for more space */}
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-32 truncate">
                    {session.user.name}
                  </span>
                  <motion.svg
                    animate={{ rotate: isUserDropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </motion.svg>
                </button>

                <AnimatePresence>
                  {isUserDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ type: "spring", bounce: 0.25 }}
                      className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5"
                    >
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
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
                            d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Mijn Profiel
                      </Link>
                      <button
                        onClick={() => signOut()}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
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
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Uitloggen
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
