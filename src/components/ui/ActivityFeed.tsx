import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

export interface ActivityItem {
  id: string;
  type:
    | "user"
    | "system"
    | "schedule"
    | "contract"
    | "project"
    | "warning"
    | "success"
    | "error"
    | "info";
  action: string;
  user?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  target?: string;
  description?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  priority?: "low" | "medium" | "high" | "urgent";
  link?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
  showTimestamps?: boolean;
  showAvatars?: boolean;
  maxItems?: number;
  loading?: boolean;
  onItemClick?: (activity: ActivityItem) => void;
  className?: string;
  compact?: boolean;
  realTime?: boolean;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  title = "Recent Activity",
  showTimestamps = true,
  showAvatars = true,
  maxItems = 10,
  loading = false,
  onItemClick,
  className = "",
  compact = false,
  realTime = false,
}) => {
  const getActivityIcon = (type: string, action: string) => {
    const iconClass = compact ? "h-4 w-4" : "h-5 w-5";

    // Action-based icons
    if (action.includes("created") || action.includes("toegevoegd")) {
      return <PlusIcon className={`${iconClass} text-green-500`} />;
    }
    if (
      action.includes("updated") ||
      action.includes("bewerkt") ||
      action.includes("gewijzigd")
    ) {
      return <PencilIcon className={`${iconClass} text-blue-500`} />;
    }
    if (action.includes("deleted") || action.includes("verwijderd")) {
      return <TrashIcon className={`${iconClass} text-red-500`} />;
    }
    if (
      action.includes("completed") ||
      action.includes("voltooid") ||
      action.includes("goedgekeurd")
    ) {
      return <CheckCircleIcon className={`${iconClass} text-green-500`} />;
    }

    // Type-based icons
    switch (type) {
      case "user":
        return <UserIcon className={`${iconClass} text-blue-500`} />;
      case "schedule":
        return <CalendarIcon className={`${iconClass} text-purple-500`} />;
      case "contract":
        return <DocumentTextIcon className={`${iconClass} text-indigo-500`} />;
      case "success":
        return <CheckCircleIcon className={`${iconClass} text-green-500`} />;
      case "warning":
        return (
          <ExclamationTriangleIcon className={`${iconClass} text-amber-500`} />
        );
      case "error":
        return <XCircleIcon className={`${iconClass} text-red-500`} />;
      case "info":
        return (
          <InformationCircleIcon className={`${iconClass} text-blue-500`} />
        );
      default:
        return <ClockIcon className={`${iconClass} text-gray-500`} />;
    }
  };

  const getActivityColor = (type: string, priority?: string) => {
    if (priority === "urgent")
      return "border-red-500 bg-red-50 dark:bg-red-900/10";
    if (priority === "high")
      return "border-orange-500 bg-orange-50 dark:bg-orange-900/10";

    switch (type) {
      case "success":
        return "border-green-200 bg-green-50 dark:bg-green-900/10";
      case "warning":
        return "border-amber-200 bg-amber-50 dark:bg-amber-900/10";
      case "error":
        return "border-red-200 bg-red-50 dark:bg-red-900/10";
      case "info":
        return "border-blue-200 bg-blue-50 dark:bg-blue-900/10";
      default:
        return "border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return "zojuist";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)}m geleden`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}u geleden`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d geleden`;

    return time.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: diffInSeconds > 31536000 ? "numeric" : undefined,
    });
  };

  const displayedActivities = activities.slice(0, maxItems);

  if (loading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${
        compact ? "p-4" : "p-6"
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3
          className={`font-semibold text-gray-900 dark:text-white ${
            compact ? "text-base" : "text-lg"
          }`}
        >
          {title}
        </h3>
        {realTime && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Live
            </span>
          </div>
        )}
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        <AnimatePresence>
          {displayedActivities.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                Nog geen activiteit
              </p>
            </div>
          ) : (
            displayedActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`relative border border-l-4 rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${getActivityColor(
                  activity.type,
                  activity.priority
                )}`}
                onClick={() => onItemClick?.(activity)}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 p-1 rounded-full ${
                      compact ? "mt-0.5" : "mt-1"
                    }`}
                  >
                    {getActivityIcon(activity.type, activity.action)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Main action */}
                        <p
                          className={`font-medium text-gray-900 dark:text-white ${
                            compact ? "text-sm" : "text-base"
                          }`}
                        >
                          {activity.user && (
                            <span className="text-blue-600 dark:text-blue-400">
                              {activity.user.name}
                            </span>
                          )}{" "}
                          {activity.action}
                          {activity.target && (
                            <>
                              {" "}
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {activity.target}
                              </span>
                            </>
                          )}
                        </p>

                        {/* Description */}
                        {activity.description && (
                          <p
                            className={`text-gray-600 dark:text-gray-400 mt-1 ${
                              compact ? "text-xs" : "text-sm"
                            }`}
                          >
                            {activity.description}
                          </p>
                        )}

                        {/* Metadata */}
                        {activity.metadata &&
                          Object.keys(activity.metadata).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {Object.entries(activity.metadata)
                                .slice(0, 3)
                                .map(([key, value]) => (
                                  <span
                                    key={key}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                  >
                                    {key}: {String(value)}
                                  </span>
                                ))}
                            </div>
                          )}
                      </div>

                      {/* Timestamp */}
                      {showTimestamps && (
                        <div className="flex-shrink-0 ml-2">
                          <time
                            className={`text-gray-500 dark:text-gray-400 ${
                              compact ? "text-xs" : "text-sm"
                            }`}
                          >
                            {formatTimeAgo(activity.timestamp)}
                          </time>
                        </div>
                      )}
                    </div>

                    {/* User role badge */}
                    {activity.user?.role && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                          {activity.user.role}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Click indicator */}
                  {onItemClick && (
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Priority indicator */}
                {activity.priority === "urgent" && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Show more indicator */}
      {activities.length > maxItems && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            en nog {activities.length - maxItems} meer...
          </p>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
