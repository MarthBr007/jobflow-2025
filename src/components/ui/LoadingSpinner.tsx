import React from "react";
import { motion } from "framer-motion";

export type LoadingSpinnerSize = "sm" | "md" | "lg" | "xl";
export type LoadingSpinnerVariant =
  | "default"
  | "dots"
  | "pulse"
  | "bars"
  | "ring";

interface LoadingSpinnerProps {
  size?: LoadingSpinnerSize;
  variant?: LoadingSpinnerVariant;
  message?: string;
  description?: string;
  progress?: number; // For determinate spinners (0-100)
  showProgress?: boolean;
  className?: string;
  centerInParent?: boolean;
  overlay?: boolean;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  variant = "default",
  message = "Laden...",
  description,
  progress,
  showProgress = false,
  className = "",
  centerInParent = false,
  overlay = false,
}) => {
  const sizeClass = sizeClasses[size];

  const determinate = progress !== undefined && showProgress;

  const renderSpinner = () => {
    switch (variant) {
      case "dots":
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`bg-blue-600 rounded-full ${
                  size === "sm"
                    ? "w-1 h-1"
                    : size === "md"
                    ? "w-2 h-2"
                    : size === "lg"
                    ? "w-3 h-3"
                    : "w-4 h-4"
                }`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        );

      case "pulse":
        return (
          <motion.div
            className={`${sizeClass} bg-blue-600 rounded-full`}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          />
        );

      case "bars":
        return (
          <div className="flex items-end space-x-1">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={`bg-blue-600 ${
                  size === "sm"
                    ? "w-1"
                    : size === "md"
                    ? "w-1.5"
                    : size === "lg"
                    ? "w-2"
                    : "w-3"
                }`}
                style={{ height: `${20 + i * 5}%` }}
                animate={{
                  scaleY: [1, 1.5, 1],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        );

      case "ring":
        return (
          <div className={`${sizeClass} relative`}>
            <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <motion.div
              className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        );

      default:
        return (
          <motion.div
            className={`${sizeClass} border-4 border-gray-200 dark:border-gray-600 border-t-blue-600 rounded-full`}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        );
    }
  };

  const content = (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      {/* Spinner */}
      <div className="flex items-center justify-center">{renderSpinner()}</div>

      {/* Progress bar for determinate loading */}
      {determinate && (
        <div className="w-full max-w-xs">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-blue-600 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
            {Math.round(progress!)}% voltooid
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className="text-center">
          <p
            className={`font-medium text-gray-900 dark:text-white ${
              size === "sm"
                ? "text-xs"
                : size === "md"
                ? "text-sm"
                : size === "lg"
                ? "text-base"
                : "text-lg"
            }`}
          >
            {message}
          </p>
          {description && (
            <p
              className={`text-gray-500 dark:text-gray-400 mt-1 ${
                size === "sm"
                  ? "text-xs"
                  : size === "md"
                  ? "text-xs"
                  : size === "lg"
                  ? "text-sm"
                  : "text-base"
              }`}
            >
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
          {content}
        </div>
      </div>
    );
  }

  if (centerInParent) {
    return (
      <div className="flex items-center justify-center h-full w-full py-12">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
