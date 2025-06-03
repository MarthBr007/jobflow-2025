"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive?: boolean;
    label?: string;
  };
  color?: "blue" | "green" | "red" | "orange" | "purple" | "gray";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  loading?: boolean;
  status?: "normal" | "warning" | "error" | "success";
  subtitle?: string;
}

export default function MetricCard({
  title,
  value,
  icon,
  trend,
  color = "blue",
  size = "md",
  className = "",
  onClick,
  loading = false,
  status = "normal",
  subtitle,
}: MetricCardProps) {
  const colorStyles = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-700",
      icon: "text-blue-600 dark:text-blue-400",
      text: "text-blue-900 dark:text-blue-100",
      accent: "bg-blue-600",
    },
    green: {
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-200 dark:border-green-700",
      icon: "text-green-600 dark:text-green-400",
      text: "text-green-900 dark:text-green-100",
      accent: "bg-green-600",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-700",
      icon: "text-red-600 dark:text-red-400",
      text: "text-red-900 dark:text-red-100",
      accent: "bg-red-600",
    },
    orange: {
      bg: "bg-orange-50 dark:bg-orange-900/20",
      border: "border-orange-200 dark:border-orange-700",
      icon: "text-orange-600 dark:text-orange-400",
      text: "text-orange-900 dark:text-orange-100",
      accent: "bg-orange-600",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/20",
      border: "border-purple-200 dark:border-purple-700",
      icon: "text-purple-600 dark:text-purple-400",
      text: "text-purple-900 dark:text-purple-100",
      accent: "bg-purple-600",
    },
    gray: {
      bg: "bg-gray-50 dark:bg-gray-800",
      border: "border-gray-200 dark:border-gray-700",
      icon: "text-gray-600 dark:text-gray-400",
      text: "text-gray-900 dark:text-gray-100",
      accent: "bg-gray-600",
    },
  };

  const sizeStyles = {
    sm: {
      padding: "p-3 sm:p-4",
      iconSize: "h-5 w-5 sm:h-6 sm:w-6",
      valueText: "text-lg sm:text-xl",
      titleText: "text-xs sm:text-sm",
      trendText: "text-xs",
    },
    md: {
      padding: "p-4 sm:p-6",
      iconSize: "h-6 w-6 sm:h-8 sm:w-8",
      valueText: "text-xl sm:text-2xl",
      titleText: "text-xs sm:text-sm",
      trendText: "text-xs",
    },
    lg: {
      padding: "p-6 sm:p-8",
      iconSize: "h-8 w-8 sm:h-10 sm:w-10",
      valueText: "text-2xl sm:text-3xl",
      titleText: "text-sm sm:text-base",
      trendText: "text-xs sm:text-sm",
    },
  };

  const getStatusIcon = () => {
    switch (status) {
      case "warning":
        return <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />;
      case "error":
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case "success":
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;

    if (trend.value === 0) {
      return <MinusIcon className="h-3 w-3" />;
    }

    return trend.isPositive ? (
      <ArrowUpIcon className="h-3 w-3" />
    ) : (
      <ArrowDownIcon className="h-3 w-3" />
    );
  };

  const getTrendColor = () => {
    if (!trend) return "";

    if (trend.value === 0) {
      return "text-gray-500 dark:text-gray-400";
    }

    return trend.isPositive
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
  };

  const containerProps = onClick
    ? {
        whileHover: { scale: 1.02, y: -2 },
        whileTap: { scale: 0.98 },
        onClick,
        role: "button",
        tabIndex: 0,
        className: `cursor-pointer ${className}`,
      }
    : {
        className,
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...containerProps}
    >
      <div
        className={`
        ${colorStyles[color].bg}
        ${colorStyles[color].border}
        ${sizeStyles[size].padding}
        border rounded-xl shadow-sm hover:shadow-md transition-all duration-200
        relative overflow-hidden
      `}
      >
        {/* Status indicator */}
        {status !== "normal" && (
          <div className="absolute top-3 right-3">{getStatusIcon()}</div>
        )}

        {/* Accent bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 ${colorStyles[color].accent}`}
        />

        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Title and subtitle */}
            <div className="mb-3">
              <h3
                className={`${sizeStyles[size].titleText} font-medium ${colorStyles[color].text} mb-1`}
              >
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Value */}
            <div className="mb-2">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
                </div>
              ) : (
                <p
                  className={`${sizeStyles[size].valueText} font-bold ${colorStyles[color].text}`}
                >
                  {typeof value === "number" ? value.toLocaleString() : value}
                </p>
              )}
            </div>

            {/* Trend */}
            <div className="h-6 flex items-center">
              {trend && !loading ? (
                <div
                  className={`flex items-center space-x-1 ${getTrendColor()}`}
                >
                  {getTrendIcon()}
                  <span className={`${sizeStyles[size].trendText} font-medium`}>
                    {Math.abs(trend.value)}%
                  </span>
                  {trend.label && (
                    <span
                      className={`${sizeStyles[size].trendText} text-gray-500 dark:text-gray-400`}
                    >
                      {trend.label}
                    </span>
                  )}
                </div>
              ) : (
                <div className="h-4"></div>
              )}
            </div>
          </div>

          {/* Icon */}
          {icon && (
            <div
              className={`${colorStyles[color].icon} ${sizeStyles[size].iconSize} flex-shrink-0 ml-3`}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Interactive overlay */}
        {onClick && (
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-white dark:bg-gray-800 opacity-0 pointer-events-none"
            style={{ mixBlendMode: "overlay" }}
          />
        )}
      </div>
    </motion.div>
  );
}
