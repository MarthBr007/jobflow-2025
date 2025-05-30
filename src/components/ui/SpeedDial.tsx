"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface SpeedDialAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}

interface SpeedDialProps {
  actions: SpeedDialAction[];
  direction?: "up" | "down" | "left" | "right";
  className?: string;
  buttonColor?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  tooltipPlacement?: "left" | "right" | "top" | "bottom";
}

export default function SpeedDial({
  actions,
  direction = "up",
  className = "",
  buttonColor = "bg-blue-600 hover:bg-blue-700",
  size = "md",
  disabled = false,
  tooltipPlacement = "left",
}: SpeedDialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const sizeStyles = {
    sm: {
      main: "w-12 h-12",
      action: "w-10 h-10",
      icon: "w-4 h-4",
      spacing: 60,
    },
    md: {
      main: "w-14 h-14",
      action: "w-12 h-12",
      icon: "w-5 h-5",
      spacing: 70,
    },
    lg: {
      main: "w-16 h-16",
      action: "w-14 h-14",
      icon: "w-6 h-6",
      spacing: 80,
    },
  };

  const getActionPosition = (index: number) => {
    const spacing = sizeStyles[size].spacing;
    const offset = (index + 1) * spacing;

    switch (direction) {
      case "up":
        return { x: 0, y: -offset };
      case "down":
        return { x: 0, y: offset };
      case "left":
        return { x: -offset, y: 0 };
      case "right":
        return { x: offset, y: 0 };
      default:
        return { x: 0, y: -offset };
    }
  };

  const handleMainClick = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  const handleActionClick = (action: SpeedDialAction) => {
    if (action.disabled) return;
    action.onClick();
    setIsOpen(false);
  };

  const getTooltipPosition = () => {
    switch (tooltipPlacement) {
      case "left":
        return "-left-2 transform -translate-x-full";
      case "right":
        return "-right-2 transform translate-x-full";
      case "top":
        return "-top-2 transform -translate-y-full";
      case "bottom":
        return "-bottom-2 transform translate-y-full";
      default:
        return "-left-2 transform -translate-x-full";
    }
  };

  return (
    <div
      ref={containerRef}
      className={`fixed bottom-6 right-6 z-50 ${className}`}
    >
      {/* Backdrop overlay when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-20 -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Speed Dial Actions */}
      <AnimatePresence>
        {isOpen && (
          <>
            {actions.map((action, index) => {
              const position = getActionPosition(index);
              return (
                <motion.div
                  key={action.id}
                  initial={{
                    opacity: 0,
                    scale: 0,
                    x: 0,
                    y: 0,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: position.x,
                    y: position.y,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0,
                    x: 0,
                    y: 0,
                  }}
                  transition={{
                    type: "spring",
                    damping: 20,
                    stiffness: 300,
                    delay: index * 0.05,
                  }}
                  className="absolute bottom-0 right-0"
                >
                  {/* Action Button */}
                  <button
                    onClick={() => handleActionClick(action)}
                    onMouseEnter={() => setHoveredAction(action.id)}
                    onMouseLeave={() => setHoveredAction(null)}
                    disabled={action.disabled}
                    className={`
                      ${sizeStyles[size].action}
                      ${action.color || "bg-white hover:bg-gray-50"}
                      ${
                        action.disabled
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:scale-110"
                      }
                      rounded-full shadow-lg border border-gray-200 dark:border-gray-700
                      flex items-center justify-center transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    `}
                  >
                    <span
                      className={`${sizeStyles[size].icon} text-gray-700 dark:text-gray-300`}
                    >
                      {action.icon}
                    </span>
                  </button>

                  {/* Tooltip */}
                  <AnimatePresence>
                    {hoveredAction === action.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={`
                          absolute top-1/2 -translate-y-1/2 ${getTooltipPosition()}
                          bg-gray-900 dark:bg-gray-700 text-white text-sm font-medium
                          px-3 py-2 rounded-lg shadow-lg whitespace-nowrap mr-3
                          pointer-events-none z-10
                        `}
                      >
                        {action.label}
                        <div className="absolute top-1/2 -translate-y-1/2 right-0 transform translate-x-full">
                          <div className="w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </>
        )}
      </AnimatePresence>

      {/* Main Speed Dial Button */}
      <motion.button
        onClick={handleMainClick}
        disabled={disabled}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        className={`
          ${sizeStyles[size].main}
          ${buttonColor}
          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "shadow-lg hover:shadow-xl"
          }
          rounded-full flex items-center justify-center
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          transition-all duration-200 relative overflow-hidden
        `}
      >
        {/* Background animation */}
        <motion.div
          initial={false}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center"
        >
          {isOpen ? (
            <XMarkIcon className={`${sizeStyles[size].icon} text-white`} />
          ) : (
            <PlusIcon className={`${sizeStyles[size].icon} text-white`} />
          )}
        </motion.div>

        {/* Ripple effect */}
        <motion.div
          initial={false}
          animate={
            isOpen ? { scale: 1.5, opacity: 0 } : { scale: 0, opacity: 0.3 }
          }
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-white rounded-full"
        />
      </motion.button>
    </div>
  );
}
