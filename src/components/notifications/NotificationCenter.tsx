"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  BriefcaseIcon,
  CalendarIcon,
  TrashIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import { useWebSocket } from "@/lib/websocket";

interface Notification {
  id: string;
  type:
    | "INFO"
    | "SUCCESS"
    | "WARNING"
    | "ERROR"
    | "SCHEDULE"
    | "PROJECT"
    | "TIME_TRACKING";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  userId: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function NotificationCenter({
  isOpen,
  onClose,
  userId,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<
    Notification[]
  >([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<
    Set<string>
  >(new Set());
  const webSocketClient = useWebSocket();

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);

      // Show browser notification if permission granted
      if (Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
          tag: notification.id,
        });
      }
    };

    const handleNotificationUpdate = (updatedNotification: Notification) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === updatedNotification.id ? updatedNotification : n
        )
      );
    };

    if (webSocketClient.isConnected) {
      webSocketClient.on("new_notification", handleNewNotification);
      webSocketClient.on("notification_updated", handleNotificationUpdate);

      return () => {
        webSocketClient.off("new_notification", handleNewNotification);
        webSocketClient.off("notification_updated", handleNotificationUpdate);
      };
    }
  }, [webSocketClient.isConnected]);

  useEffect(() => {
    applyFilters();
  }, [notifications, filter, categoryFilter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notifications?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = notifications;

    // Apply read/unread filter
    if (filter === "unread") {
      filtered = filtered.filter((n) => !n.read);
    } else if (filter === "read") {
      filtered = filtered.filter((n) => n.read);
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((n) => n.category === categoryFilter);
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`/api/notifications/mark-all-read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleBulkAction = async (action: "read" | "delete") => {
    const notificationIds = Array.from(selectedNotifications);

    try {
      const response = await fetch(`/api/notifications/bulk-${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        if (action === "read") {
          setNotifications((prev) =>
            prev.map((n) =>
              selectedNotifications.has(n.id) ? { ...n, read: true } : n
            )
          );
        } else {
          setNotifications((prev) =>
            prev.filter((n) => !selectedNotifications.has(n.id))
          );
        }
        setSelectedNotifications(new Set());
      }
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "ERROR":
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case "WARNING":
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case "SCHEDULE":
        return <CalendarIcon className="h-5 w-5 text-blue-500" />;
      case "PROJECT":
        return <BriefcaseIcon className="h-5 w-5 text-purple-500" />;
      case "TIME_TRACKING":
        return <ClockIcon className="h-5 w-5 text-indigo-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "border-l-red-500 bg-red-50 dark:bg-red-900/10";
      case "HIGH":
        return "border-l-orange-500 bg-orange-50 dark:bg-orange-900/10";
      case "MEDIUM":
        return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10";
      default:
        return "border-l-gray-300 bg-gray-50 dark:bg-gray-900/10";
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now.getTime() - notificationTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const categories = [
    "all",
    ...Array.from(new Set(notifications.map((n) => n.category))),
  ];
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BellIcon className="h-6 w-6 text-gray-900 dark:text-white" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {unreadCount} unread
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Filters */}
          <div className="mt-4 space-y-3">
            <div className="flex space-x-2">
              {["all", "unread", "read"].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption as any)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === filterOption
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </button>
              ))}
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedNotifications.size > 0 && (
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => handleBulkAction("read")}
                className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
              >
                Mark Read ({selectedNotifications.size})
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
              >
                Delete ({selectedNotifications.size})
              </button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-3 flex justify-between">
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Mark all as read
            </button>
            <button
              onClick={() => setSelectedNotifications(new Set())}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
            >
              Clear selection
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center p-8">
              <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No notifications
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                You're all caught up!
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className={`border-l-4 p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    !notification.read ? "bg-blue-50 dark:bg-blue-900/10" : ""
                  } ${getPriorityColor(notification.priority)}`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedNotifications);
                        if (e.target.checked) {
                          newSet.add(notification.id);
                        } else {
                          newSet.delete(notification.id);
                        }
                        setSelectedNotifications(newSet);
                      }}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {getTimeAgo(notification.timestamp)}
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                              {notification.category}
                            </span>
                            {notification.priority !== "LOW" && (
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  notification.priority === "URGENT"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                    : notification.priority === "HIGH"
                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                }`}
                              >
                                {notification.priority}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              title="Mark as read"
                            >
                              <CheckIcon className="h-4 w-4 text-gray-500" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      </div>

                      {/* Action Button */}
                      {notification.actionUrl && (
                        <button
                          onClick={() => {
                            // Navigate to action URL
                            window.location.href = notification.actionUrl!;
                          }}
                          className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                        >
                          View Details →
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
