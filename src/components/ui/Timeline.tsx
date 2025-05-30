"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: Date | string;
  status?: "pending" | "completed" | "error" | "warning" | "info";
  icon?: React.ReactNode;
  expandableContent?: React.ReactNode;
  actor?: string; // Who performed the action
  metadata?: Record<string, any>;
}

interface TimelineProps {
  events: TimelineEvent[];
  variant?: "default" | "alternating" | "compact";
  showTime?: boolean;
  expandable?: boolean;
  className?: string;
  maxHeight?: string;
  onEventClick?: (event: TimelineEvent) => void;
}

export default function Timeline({
  events,
  variant = "default",
  showTime = true,
  expandable = false,
  className = "",
  maxHeight,
  onEventClick,
}: TimelineProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const toggleExpand = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return {
          bg: "bg-green-100 dark:bg-green-900/20",
          border: "border-green-300 dark:border-green-700",
          dot: "bg-green-500",
          text: "text-green-700 dark:text-green-300",
        };
      case "error":
        return {
          bg: "bg-red-100 dark:bg-red-900/20",
          border: "border-red-300 dark:border-red-700",
          dot: "bg-red-500",
          text: "text-red-700 dark:text-red-300",
        };
      case "warning":
        return {
          bg: "bg-amber-100 dark:bg-amber-900/20",
          border: "border-amber-300 dark:border-amber-700",
          dot: "bg-amber-500",
          text: "text-amber-700 dark:text-amber-300",
        };
      case "pending":
        return {
          bg: "bg-blue-100 dark:bg-blue-900/20",
          border: "border-blue-300 dark:border-blue-700",
          dot: "bg-blue-500",
          text: "text-blue-700 dark:text-blue-300",
        };
      case "info":
        return {
          bg: "bg-gray-100 dark:bg-gray-800",
          border: "border-gray-300 dark:border-gray-600",
          dot: "bg-gray-500",
          text: "text-gray-700 dark:text-gray-300",
        };
      default:
        return {
          bg: "bg-gray-50 dark:bg-gray-800",
          border: "border-gray-200 dark:border-gray-700",
          dot: "bg-gray-400",
          text: "text-gray-600 dark:text-gray-400",
        };
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case "error":
        return <XCircleIcon className="w-4 h-4 text-red-600" />;
      case "warning":
        return <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />;
      case "pending":
        return <ClockIcon className="w-4 h-4 text-blue-600" />;
      case "info":
        return <InformationCircleIcon className="w-4 h-4 text-gray-600" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-400" />;
    }
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("nl-NL", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString("nl-NL", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getEventPosition = (index: number) => {
    if (variant === "alternating") {
      return index % 2 === 0 ? "left" : "right";
    }
    return "right";
  };

  const containerClass = maxHeight ? `overflow-y-auto ${maxHeight}` : "";

  return (
    <div className={`relative ${containerClass} ${className}`}>
      {/* Timeline Line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

      {/* Timeline Events */}
      <div className="space-y-6">
        {events.map((event, index) => {
          const colors = getStatusColor(event.status);
          const isExpanded = expandedEvents.has(event.id);
          const position = getEventPosition(index);
          const isClickable =
            onEventClick || (expandable && event.expandableContent);

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: position === "left" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`relative flex items-start ${
                variant === "alternating" && position === "left"
                  ? "flex-row-reverse"
                  : ""
              }`}
            >
              {/* Timeline Dot */}
              <div className="relative flex-shrink-0 z-10">
                <div
                  className={`
                  w-4 h-4 rounded-full ${colors.dot} 
                  border-4 border-white dark:border-gray-900
                  shadow-sm
                `}
                />

                {/* Status Icon Overlay */}
                <div className="absolute -top-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-0.5">
                  {event.icon || getStatusIcon(event.status)}
                </div>
              </div>

              {/* Event Content */}
              <div
                className={`
                  flex-1 min-w-0 
                  ${
                    variant === "alternating" && position === "left"
                      ? "mr-6"
                      : "ml-6"
                  }
                  ${variant === "compact" ? "ml-4" : ""}
                `}
              >
                <div
                  onClick={() => {
                    if (onEventClick) onEventClick(event);
                    if (expandable && event.expandableContent) {
                      toggleExpand(event.id);
                    }
                  }}
                  className={`
                    ${colors.bg} ${colors.border}
                    border rounded-lg p-4 shadow-sm
                    ${
                      isClickable
                        ? "cursor-pointer hover:shadow-md transition-shadow duration-200"
                        : ""
                    }
                  `}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-medium ${colors.text} text-sm`}>
                        {event.title}
                      </h3>

                      {event.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {event.description}
                        </p>
                      )}

                      {event.actor && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          door {event.actor}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-3">
                      {showTime && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatTime(event.timestamp)}
                        </span>
                      )}

                      {expandable && event.expandableContent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(event.id);
                          }}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUpIcon className="w-4 h-4" />
                          ) : (
                            <ChevronDownIcon className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Content */}
                  <AnimatePresence>
                    {isExpanded && event.expandableContent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600"
                      >
                        {event.expandableContent}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {events.length === 0 && (
        <div className="text-center py-12">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Geen gebeurtenissen
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Er zijn nog geen gebeurtenissen om te tonen.
          </p>
        </div>
      )}
    </div>
  );
}
