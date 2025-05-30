import React, { useState, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import Button from "./Button";
import Avatar from "./Avatar";

export type NotificationPriority = "urgent" | "high" | "normal" | "low";
export type NotificationType =
  | "TIME_TRACKING"
  | "PROJECT"
  | "TEAM"
  | "SYSTEM"
  | "MESSAGE";

interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
  userData?: {
    name: string;
    avatar?: string;
  };
  projectData?: {
    name: string;
    id: string;
  };
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  className = "",
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | NotificationType>(
    "all"
  );

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications/advanced");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (
    type: NotificationType,
    priority: NotificationPriority
  ) => {
    const iconProps = {
      className: `h-5 w-5 ${
        priority === "urgent"
          ? "text-red-500"
          : priority === "high"
          ? "text-orange-500"
          : priority === "normal"
          ? "text-blue-500"
          : "text-gray-500"
      }`,
    };

    switch (type) {
      case "TIME_TRACKING":
        return <ClockIcon {...iconProps} />;
      case "PROJECT":
        return <DocumentTextIcon {...iconProps} />;
      case "TEAM":
        return <UserGroupIcon {...iconProps} />;
      case "SYSTEM":
        return priority === "urgent" ? (
          <ExclamationTriangleIcon {...iconProps} />
        ) : (
          <InformationCircleIcon {...iconProps} />
        );
      case "MESSAGE":
        return <BellIcon {...iconProps} />;
      default:
        return <BellIcon {...iconProps} />;
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    const badges = {
      urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      normal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badges[priority]}`}
      >
        {priority === "urgent"
          ? "Urgent"
          : priority === "high"
          ? "Hoog"
          : priority === "normal"
          ? "Normaal"
          : "Laag"}
      </span>
    );
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.read;
    return notification.type === filter;
  });

  const groupedNotifications = filteredNotifications.reduce(
    (groups, notification) => {
      const today = new Date();
      const notificationDate = new Date(notification.createdAt);
      const isToday = notificationDate.toDateString() === today.toDateString();
      const isYesterday =
        new Date(today.getTime() - 24 * 60 * 60 * 1000).toDateString() ===
        notificationDate.toDateString();

      const group = isToday ? "Vandaag" : isYesterday ? "Gisteren" : "Eerder";

      if (!groups[group]) groups[group] = [];
      groups[group].push(notification);
      return groups;
    },
    {} as Record<string, Notification[]>
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notificaties
            </h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                Alle lezen
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "Alle" },
              { key: "unread", label: "Ongelezen" },
              { key: "TIME_TRACKING", label: "Tijd" },
              { key: "PROJECT", label: "Projecten" },
              { key: "TEAM", label: "Team" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === key
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : Object.keys(groupedNotifications).length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <BellIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Geen notificaties
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Je bent helemaal bij!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {Object.entries(groupedNotifications).map(
                ([group, notifications]) => (
                  <div key={group}>
                    <div className="sticky top-0 bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {group}
                      </h3>
                    </div>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          !notification.read
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : ""
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Icon or Avatar */}
                          <div className="flex-shrink-0">
                            {notification.userData?.avatar ? (
                              <Avatar
                                src={notification.userData.avatar}
                                name={notification.userData.name}
                                size="sm"
                              />
                            ) : (
                              <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-600">
                                {getNotificationIcon(
                                  notification.type,
                                  notification.priority
                                )}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {notification.title}
                              </p>
                              <div className="flex items-center space-x-2">
                                {getPriorityBadge(notification.priority)}
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(
                                  new Date(notification.createdAt),
                                  {
                                    addSuffix: true,
                                    locale: nl,
                                  }
                                )}
                              </p>
                              <div className="flex items-center space-x-2">
                                {notification.actionUrl && (
                                  <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                    {notification.actionLabel || "Bekijken"}
                                  </button>
                                )}
                                {!notification.read && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    deleteNotification(notification.id)
                                  }
                                  className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
