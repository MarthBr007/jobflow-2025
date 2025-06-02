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
    | "filled"
    | "elevated"
    | "tonal";
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
      // Primary - High emphasis filled button (uinkits Filled Button)
      primary: cn(
        "bg-blue-600 text-white shadow-sm",
        "hover:bg-blue-700 hover:shadow-md active:bg-blue-800",
        "focus:ring-blue-500 active:scale-95",
        "dark:bg-blue-500 dark:hover:bg-blue-600 dark:active:bg-blue-700",
        "border border-blue-600 dark:border-blue-500"
      ),

      // Filled - High emphasis alternative (uinkits Filled Button variant)
      filled: cn(
        "bg-blue-600 text-white shadow-sm",
        "hover:bg-blue-700 hover:shadow-md active:bg-blue-800",
        "focus:ring-blue-500 active:scale-95",
        "dark:bg-blue-500 dark:hover:bg-blue-600 dark:active:bg-blue-700"
      ),

      // Elevated - Medium emphasis (uinkits Elevated Button)
      elevated: cn(
        "bg-white text-blue-600 shadow-md border border-gray-200",
        "hover:bg-blue-50 hover:shadow-lg hover:border-blue-300",
        "focus:ring-blue-500 active:scale-95",
        "dark:bg-gray-800 dark:text-blue-400 dark:border-gray-600",
        "dark:hover:bg-gray-700 dark:hover:border-blue-500"
      ),

      // Secondary - Medium emphasis (uinkits Filled Tonal Button)
      secondary: cn(
        "bg-blue-50 text-blue-700 border border-blue-200",
        "hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800",
        "focus:ring-blue-500 active:scale-95",
        "dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
        "dark:hover:bg-blue-900/30 dark:hover:border-blue-700"
      ),

      // Tonal - Medium emphasis alternative (uinkits Filled Tonal Button)
      tonal: cn(
        "bg-blue-50 text-blue-700 border border-blue-200",
        "hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800",
        "focus:ring-blue-500 active:scale-95",
        "dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
        "dark:hover:bg-blue-900/30 dark:hover:border-blue-700"
      ),

      // Outline - Medium emphasis (uinkits Outlined Button)
      outline: cn(
        "border-2 border-blue-600 text-blue-600 bg-transparent",
        "hover:bg-blue-600 hover:text-white hover:shadow-sm",
        "focus:ring-blue-500 active:scale-95",
        "dark:border-blue-400 dark:text-blue-400",
        "dark:hover:bg-blue-400 dark:hover:text-gray-900"
      ),

      // Tertiary - Low to medium emphasis
      tertiary: cn(
        "bg-gray-50 text-gray-700 border border-gray-200",
        "hover:bg-gray-100 hover:border-gray-300 hover:text-gray-800",
        "focus:ring-gray-500 active:scale-95",
        "dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
        "dark:hover:bg-gray-700 dark:hover:border-gray-600"
      ),

      // Text - Low emphasis (uinkits Text Button)
      text: cn(
        "text-blue-600 bg-transparent border-0",
        "hover:text-blue-700 hover:bg-blue-50 hover:shadow-none",
        "focus:ring-blue-500 active:scale-95",
        "dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
      ),

      // Icon - Low emphasis (uinkits Icon Button)
      icon: cn(
        "text-gray-500 bg-transparent border-0 rounded-full",
        "hover:text-gray-700 hover:bg-gray-100",
        "focus:ring-gray-500 active:scale-95",
        "dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
      ),

      // Ghost - Ultra minimal
      ghost: cn(
        "text-gray-600 bg-transparent border-0",
        "hover:text-gray-900 hover:bg-gray-50",
        "focus:ring-gray-500 active:scale-95",
        "dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
      ),

      // Destructive - High emphasis for dangerous actions
      destructive: cn(
        "bg-red-600 text-white shadow-sm border border-red-600",
        "hover:bg-red-700 hover:shadow-md hover:border-red-700",
        "focus:ring-red-500 active:scale-95 active:bg-red-800",
        "dark:bg-red-500 dark:border-red-500 dark:hover:bg-red-600 dark:hover:border-red-600"
      ),
    };

    const sizes = {
      xs: cn(
        "px-2 py-1 text-xs min-h-[32px] sm:min-h-[28px]",
        rounded === "full" ? "rounded-full" : `rounded-${rounded}`
      ),
      sm: cn(
        "px-3 py-2 text-xs sm:text-sm min-h-[40px] sm:min-h-[36px]",
        rounded === "full" ? "rounded-full" : `rounded-${rounded}`
      ),
      md: cn(
        "px-4 py-2.5 text-sm min-h-[48px] sm:min-h-[44px]",
        rounded === "full" ? "rounded-full" : `rounded-${rounded}`
      ),
      lg: cn(
        "px-6 py-3 text-sm sm:text-base min-h-[52px] sm:min-h-[48px]",
        rounded === "full"
          ? "rounded-full"
          : `rounded-${rounded === "md" ? "lg" : rounded}`
      ),
      xl: cn(
        "px-8 py-4 text-base sm:text-lg min-h-[56px] sm:min-h-[52px]",
        rounded === "full"
          ? "rounded-full"
          : `rounded-${rounded === "md" ? "xl" : rounded}`
      ),
    };

    const elevations = {
      none: "",
      soft: "shadow-sm hover:shadow-md",
      medium: "shadow-md hover:shadow-lg",
      strong: "shadow-lg hover:shadow-xl",
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
