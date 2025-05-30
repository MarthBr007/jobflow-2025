import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: "default" | "filled" | "outlined";
  inputSize?: "sm" | "md" | "lg";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = "outlined",
      inputSize = "md",
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "w-full transition-all duration-200 focus:outline-none touch-manipulation";

    const variants = {
      default: cn(
        "border-0 border-b-2 border-gray-200 bg-transparent",
        "focus:border-blue-500 focus:ring-0",
        "hover:border-gray-300",
        "dark:border-gray-600 dark:focus:border-blue-400 dark:hover:border-gray-500 dark:text-white",
        error &&
          "border-red-500 focus:border-red-500 dark:border-red-400 dark:focus:border-red-400"
      ),
      filled: cn(
        "border-0 bg-gray-50 rounded-lg",
        "focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20",
        "hover:bg-gray-100",
        "dark:bg-gray-700 dark:focus:bg-gray-600 dark:hover:bg-gray-600 dark:text-white dark:focus:ring-blue-400",
        error &&
          "bg-red-50 focus:bg-red-50 focus:ring-red-500 dark:bg-red-900/20 dark:focus:bg-red-900/30 dark:focus:ring-red-400"
      ),
      outlined: cn(
        "border border-gray-300 bg-white rounded-lg shadow-sm",
        "focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20",
        "hover:border-gray-400 hover:shadow-md",
        "dark:border-gray-600 dark:bg-gray-800 dark:focus:border-blue-400 dark:hover:border-gray-500 dark:text-white dark:focus:ring-blue-400",
        error &&
          "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400"
      ),
    };

    const sizes = {
      sm: "px-3 py-2.5 text-sm min-h-[44px] sm:min-h-[36px] sm:py-2",
      md: "px-4 py-3 text-base min-h-[48px] sm:min-h-[40px] sm:py-2.5",
      lg: "px-5 py-4 text-lg min-h-[52px] sm:min-h-[44px] sm:py-3",
    };

    const iconSizes = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    };

    // Prevent iOS zoom by ensuring font-size is at least 16px
    const inputStyle = {
      fontSize: "16px",
      ...style,
    };

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            className={cn(
              "block text-sm font-medium mb-2",
              error
                ? "text-red-700 dark:text-red-400"
                : "text-gray-700 dark:text-gray-300",
              disabled && "text-gray-400 dark:text-gray-500"
            )}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div
              className={cn(
                "absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none flex-shrink-0",
                error
                  ? "text-red-500 dark:text-red-400"
                  : "text-gray-400 dark:text-gray-500",
                iconSizes[inputSize]
              )}
            >
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            type={type}
            className={cn(
              baseStyles,
              variants[variant],
              sizes[inputSize],
              leftIcon && "pl-10 sm:pl-11",
              rightIcon && "pr-10 sm:pr-11",
              disabled &&
                "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700",
              className
            )}
            style={inputStyle}
            ref={ref}
            disabled={disabled}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div
              className={cn(
                "absolute right-3 top-1/2 transform -translate-y-1/2 flex-shrink-0",
                error
                  ? "text-red-500 dark:text-red-400"
                  : "text-gray-400 dark:text-gray-500",
                iconSizes[inputSize]
              )}
            >
              {rightIcon}
            </div>
          )}
        </div>

        {/* Helper Text or Error */}
        {(helperText || error) && (
          <p
            className={cn(
              "mt-2 text-xs sm:text-sm",
              error
                ? "text-red-600 dark:text-red-400"
                : "text-gray-500 dark:text-gray-400"
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
