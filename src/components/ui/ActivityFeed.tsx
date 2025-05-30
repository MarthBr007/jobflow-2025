import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import {
  ClockIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  UserPlusIcon,
  FolderPlusIcon,
} from "@heroicons/react/24/outline";
import Avatar from "./Avatar";

export type ActivityType =
  | "TIME_START"
  | "TIME_END"
  | "TIME_BREAK_START"
  | "TIME_BREAK_END"
  | "PROJECT_ASSIGNED"
  | "PROJECT_COMPLETED"
  | "PROJECT_CREATED"
  | "USER_JOINED"
  | "STATUS_CHANGE";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description?: string;
  metadata?: {
    projectName?: string;
    duration?: string;
    location?: string;
  };
  timestamp: string;
  isImportant?: boolean;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
  maxItems?: number;
  onRefresh?: () => void;
  className?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  loading = false,
  maxItems = 10,
  onRefresh,
  className = "",
}) => {
  const [displayActivities, setDisplayActivities] = useState<ActivityItem[]>(
    []
  );

  useEffect(() => {
    setDisplayActivities(activities.slice(0, maxItems));
  }, [activities, maxItems]);

  const getActivityIcon = (type: ActivityType) => {
    const iconProps = { className: "h-4 w-4" };

    switch (type) {
      case "TIME_START":
        return <PlayIcon {...iconProps} className="h-4 w-4 text-green-500" />;
      case "TIME_END":
        return <PauseIcon {...iconProps} className="h-4 w-4 text-red-500" />;
      case "TIME_BREAK_START":
        return <PauseIcon {...iconProps} className="h-4 w-4 text-yellow-500" />;
      case "TIME_BREAK_END":
        return <PlayIcon {...iconProps} className="h-4 w-4 text-blue-500" />;
      case "PROJECT_ASSIGNED":
        return (
          <ArrowRightIcon {...iconProps} className="h-4 w-4 text-blue-500" />
        );
      case "PROJECT_COMPLETED":
        return (
          <CheckCircleIcon {...iconProps} className="h-4 w-4 text-green-500" />
        );
      case "PROJECT_CREATED":
        return (
          <FolderPlusIcon {...iconProps} className="h-4 w-4 text-indigo-500" />
        );
      case "USER_JOINED":
        return (
          <UserPlusIcon {...iconProps} className="h-4 w-4 text-green-500" />
        );
      default:
        return <ClockIcon {...iconProps} className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Recente Activiteit
          </h3>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Vernieuwen
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {displayActivities.length === 0 ? (
          <div className="p-8 text-center">
            <ClockIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Geen recente activiteit
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {displayActivities.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <Avatar
                    src={activity.userAvatar}
                    name={activity.userName}
                    size="sm"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getActivityIcon(activity.type)}
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                          locale: nl,
                        })}
                      </span>
                    </div>

                    {activity.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {activity.description}
                      </p>
                    )}

                    {activity.metadata?.projectName && (
                      <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                        {activity.metadata.projectName}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
