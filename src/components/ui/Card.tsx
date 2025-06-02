"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outlined" | "elevated" | "glass" | "gradient";
  elevation?: "none" | "soft" | "medium" | "strong" | "dramatic";
  hover?: boolean;
  interactive?: boolean;
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  border?: boolean;
  backdrop?: boolean;
  onClick?: () => void;
  motionProps?: any;
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  variant = "default",
  elevation = "soft",
  hover = false,
  interactive = false,
  rounded = "xl",
  padding = "md",
  border = true,
  backdrop = false,
  onClick,
  motionProps = {},
}) => {
  const variants = {
    default: cn(
      "bg-white dark:bg-gray-800",
      border && "border border-gray-200 dark:border-gray-700"
    ),
    outlined: cn(
      "bg-white dark:bg-gray-800",
      "border-2 border-gray-300 dark:border-gray-600"
    ),
    elevated: cn(
      "bg-white dark:bg-gray-800",
      border && "border border-gray-100 dark:border-gray-750"
    ),
    glass: cn(
      "bg-white/70 dark:bg-gray-800/70",
      "backdrop-blur-xl border border-white/20 dark:border-gray-700/50",
      "shadow-soft"
    ),
    gradient: cn(
      "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
      border && "border border-gray-200/50 dark:border-gray-700/50"
    ),
  };

  const elevations = {
    none: "",
    soft: "shadow-soft",
    medium: "shadow-medium",
    strong: "shadow-strong",
    dramatic: "shadow-xl",
  };

  const hoverEffects = {
    none: "",
    soft: "hover:shadow-medium hover:-translate-y-1",
    medium: "hover:shadow-strong hover:-translate-y-1",
    strong: "hover:shadow-xl hover:-translate-y-2",
    dramatic: "hover:shadow-2xl hover:-translate-y-2",
  };

  const roundedStyles = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
  };

  const paddingStyles = {
    none: "",
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-6",
    lg: "p-5 sm:p-8",
    xl: "p-6 sm:p-10",
  };

  const baseClasses = cn(
    "relative transition-all duration-300 ease-out",
    variants[variant],
    elevations[elevation],
    hover && hoverEffects[elevation],
    roundedStyles[rounded],
    paddingStyles[padding],
    interactive && "cursor-pointer touch-manipulation",
    backdrop && "backdrop-blur-sm",
    onClick &&
      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    className
  );

  const defaultMotionProps = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: "easeOut" },
    ...motionProps,
  };

  const Component = onClick || interactive ? motion.div : motion.div;

  return (
    <Component
      className={baseClasses}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
      whileHover={
        hover || interactive
          ? { scale: 1.02, transition: { duration: 0.2 } }
          : undefined
      }
      whileTap={
        onClick || interactive
          ? { scale: 0.98, transition: { duration: 0.1 } }
          : undefined
      }
      {...defaultMotionProps}
    >
      {children}
    </Component>
  );
};

export default Card;

// Sub-components for common card patterns
export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={cn("flex items-center justify-between mb-4", className)}>
    {children}
  </div>
);

export const CardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}> = ({ children, className = "", size = "md" }) => {
  const sizeStyles = {
    sm: "text-sm font-medium",
    md: "text-base font-semibold",
    lg: "text-lg font-semibold",
    xl: "text-xl font-bold",
  };

  return (
    <h3
      className={cn(
        "text-gray-900 dark:text-white",
        sizeStyles[size],
        className
      )}
    >
      {children}
    </h3>
  );
};

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={cn("text-gray-600 dark:text-gray-300", className)}>
    {children}
  </div>
);

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div
    className={cn(
      "mt-4 pt-4 border-t border-gray-200 dark:border-gray-700",
      className
    )}
  >
    {children}
  </div>
);

export const CardActions: React.FC<{
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right" | "between";
}> = ({ children, className = "", align = "right" }) => {
  const alignStyles = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between",
  };

  return (
    <div
      className={cn(
        "flex items-center space-x-2",
        alignStyles[align],
        className
      )}
    >
      {children}
    </div>
  );
};
