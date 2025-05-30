import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "text"
    | "tertiary"
    | "icon"
    | "destructive"
    | "ghost"
    | "gradient";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  elevation?: "none" | "soft" | "medium" | "strong";
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      leftIcon,
      rightIcon,
      loading = false,
      disabled,
      elevation = "soft",
      rounded = "md",
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation relative overflow-hidden group";

    const variants = {
      // Primary - High emphasis with modern gradient and glow
      primary: cn(
        "bg-gradient-to-r from-blue-600 to-blue-700 text-white",
        "hover:from-blue-700 hover:to-blue-800 hover:scale-105",
        "focus:ring-blue-500 active:scale-95",
        "dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent",
        "before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
      ),

      // Secondary - Medium emphasis with subtle elevation
      secondary: cn(
        "bg-gray-100 text-gray-900 border border-gray-300",
        "hover:bg-gray-200 hover:border-gray-400 hover:scale-105",
        "focus:ring-gray-500 active:scale-95",
        "dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
        "dark:hover:bg-gray-600 dark:hover:border-gray-500"
      ),

      // Outline - Modern outline with hover fill effect
      outline: cn(
        "border-2 border-blue-600 text-blue-600 bg-transparent",
        "hover:bg-blue-600 hover:text-white hover:scale-105",
        "focus:ring-blue-500 active:scale-95",
        "dark:border-blue-400 dark:text-blue-400",
        "dark:hover:bg-blue-400 dark:hover:text-gray-900",
        "transition-all duration-300"
      ),

      // Text - Minimal with hover background
      text: cn(
        "text-blue-600 bg-transparent",
        "hover:text-blue-700 hover:bg-blue-50 hover:scale-105",
        "focus:ring-blue-500 active:scale-95",
        "dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
      ),

      // Tertiary - Subtle background with nice hover
      tertiary: cn(
        "bg-blue-50 text-blue-700 border border-blue-200",
        "hover:bg-blue-100 hover:border-blue-300 hover:scale-105",
        "focus:ring-blue-500 active:scale-95",
        "dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
        "dark:hover:bg-blue-900/30 dark:hover:border-blue-700"
      ),

      // Icon - Circular icon button
      icon: cn(
        "text-gray-500 bg-transparent rounded-full",
        "hover:text-gray-700 hover:bg-gray-100 hover:scale-110",
        "focus:ring-gray-500 active:scale-95",
        "dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
      ),

      // Destructive - High emphasis for dangerous actions
      destructive: cn(
        "bg-gradient-to-r from-red-600 to-red-700 text-white",
        "hover:from-red-700 hover:to-red-800 hover:scale-105",
        "focus:ring-red-500 active:scale-95",
        "dark:from-red-500 dark:to-red-600 dark:hover:from-red-600 dark:hover:to-red-700"
      ),

      // Ghost - Ultra minimal
      ghost: cn(
        "text-gray-600 bg-transparent",
        "hover:text-gray-900 hover:bg-gray-50 hover:scale-105",
        "focus:ring-gray-500 active:scale-95",
        "dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
      ),

      // Gradient - Eye-catching gradient button
      gradient: cn(
        "bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 text-white",
        "hover:from-purple-600 hover:via-blue-600 hover:to-indigo-600 hover:scale-105",
        "focus:ring-purple-500 active:scale-95",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent",
        "before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
      ),
    };

    const sizes = {
      xs: cn(
        "px-2 py-1 text-xs min-h-[28px] sm:min-h-[24px]",
        rounded === "full" ? "rounded-full" : `rounded-${rounded}`
      ),
      sm: cn(
        "px-3 py-2 text-xs sm:text-sm min-h-[36px] sm:min-h-[32px]",
        rounded === "full" ? "rounded-full" : `rounded-${rounded}`
      ),
      md: cn(
        "px-4 py-2.5 text-sm min-h-[44px] sm:min-h-[40px]",
        rounded === "full" ? "rounded-full" : `rounded-${rounded}`
      ),
      lg: cn(
        "px-6 py-3 text-sm sm:text-base min-h-[48px] sm:min-h-[44px]",
        rounded === "full"
          ? "rounded-full"
          : `rounded-${rounded === "md" ? "lg" : rounded}`
      ),
      xl: cn(
        "px-8 py-4 text-base sm:text-lg min-h-[52px] sm:min-h-[48px]",
        rounded === "full"
          ? "rounded-full"
          : `rounded-${rounded === "md" ? "xl" : rounded}`
      ),
    };

    const elevations = {
      none: "",
      soft: "shadow-soft hover:shadow-medium",
      medium: "shadow-medium hover:shadow-strong",
      strong: "shadow-strong hover:shadow-xl",
    };

    const iconSizes = {
      xs: "h-3 w-3",
      sm: "h-4 w-4",
      md: "h-4 w-4 sm:h-5 sm:w-5",
      lg: "h-5 w-5",
      xl: "h-6 w-6",
    };

    const buttonClasses = cn(
      baseStyles,
      variants[variant],
      sizes[size],
      elevations[elevation],
      className
    );

    return (
      <button
        className={buttonClasses}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
          </div>
        )}

        <div
          className={`flex items-center justify-center space-x-2 ${
            loading ? "opacity-0" : "opacity-100"
          } transition-opacity duration-200`}
        >
          {leftIcon && (
            <span className={cn("flex-shrink-0", iconSizes[size])}>
              {leftIcon}
            </span>
          )}
          {children && <span className="font-medium">{children}</span>}
          {rightIcon && (
            <span className={cn("flex-shrink-0", iconSizes[size])}>
              {rightIcon}
            </span>
          )}
        </div>
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
