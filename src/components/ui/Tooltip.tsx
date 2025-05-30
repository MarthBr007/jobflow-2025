"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  placement?: "top" | "bottom" | "left" | "right" | "auto";
  delay?: number;
  className?: string;
  disabled?: boolean;
}

export default function Tooltip({
  content,
  children,
  placement = "auto",
  delay = 500,
  className = "",
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPlacement, setActualPlacement] = useState(placement);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Intelligent positioning based on viewport
  const calculatePlacement = () => {
    if (!triggerRef.current || placement !== "auto") {
      setActualPlacement(placement);
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Check space availability
    const spaceTop = rect.top;
    const spaceBottom = viewportHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = viewportWidth - rect.right;

    // Priority: top > bottom > right > left
    if (spaceTop >= 60) {
      setActualPlacement("top");
    } else if (spaceBottom >= 60) {
      setActualPlacement("bottom");
    } else if (spaceRight >= 200) {
      setActualPlacement("right");
    } else if (spaceLeft >= 200) {
      setActualPlacement("left");
    } else {
      setActualPlacement("top"); // Fallback
    }
  };

  const showTooltip = () => {
    if (disabled) return;

    calculatePlacement();
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Immediate show on focus (accessibility)
  const handleFocus = () => {
    if (disabled) return;
    calculatePlacement();
    setIsVisible(true);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTooltipStyles = () => {
    const baseStyles =
      "absolute z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg whitespace-nowrap max-w-xs";

    switch (actualPlacement) {
      case "top":
        return `${baseStyles} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      case "bottom":
        return `${baseStyles} top-full left-1/2 transform -translate-x-1/2 mt-2`;
      case "left":
        return `${baseStyles} right-full top-1/2 transform -translate-y-1/2 mr-2`;
      case "right":
        return `${baseStyles} left-full top-1/2 transform -translate-y-1/2 ml-2`;
      default:
        return `${baseStyles} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
    }
  };

  const getArrowStyles = () => {
    const baseArrow =
      "absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45";

    switch (actualPlacement) {
      case "top":
        return `${baseArrow} top-full left-1/2 -translate-x-1/2 -mt-1`;
      case "bottom":
        return `${baseArrow} bottom-full left-1/2 -translate-x-1/2 -mb-1`;
      case "left":
        return `${baseArrow} left-full top-1/2 -translate-y-1/2 -ml-1`;
      case "right":
        return `${baseArrow} right-full top-1/2 -translate-y-1/2 -mr-1`;
      default:
        return `${baseArrow} top-full left-1/2 -translate-x-1/2 -mt-1`;
    }
  };

  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={handleFocus}
      onBlur={hideTooltip}
      tabIndex={0}
      role="button"
      aria-describedby={isVisible ? "tooltip" : undefined}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            id="tooltip"
            role="tooltip"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={getTooltipStyles()}
            style={{ pointerEvents: "none" }}
          >
            {content}
            <div className={getArrowStyles()} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
