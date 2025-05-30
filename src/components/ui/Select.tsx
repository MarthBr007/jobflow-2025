import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: "default" | "filled" | "outlined";
  inputSize?: "sm" | "md" | "lg";
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      variant = "default",
      inputSize = "md",
      options,
      placeholder,
      disabled,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    const sizeClasses = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-3 text-sm",
      lg: "px-4 py-4 text-base",
    };

    const variantClasses = {
      default: cn(
        "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
        "focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20",
        "hover:border-gray-400 dark:hover:border-gray-500",
        hasError &&
          "border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500"
      ),
      filled: cn(
        "border-0 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white",
        "focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20",
        "hover:bg-gray-200 dark:hover:bg-gray-600",
        hasError &&
          "bg-red-50 dark:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20 focus:ring-red-500"
      ),
      outlined: cn(
        "border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
        "focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:focus:ring-blue-400",
        "hover:border-gray-400 dark:hover:border-gray-500",
        hasError &&
          "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500 dark:focus:ring-red-400"
      ),
    };

    const disabledClasses = disabled
      ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-500"
      : "";

    return (
      <div className="w-full">
        {label && (
          <label
            className={cn(
              "block text-sm font-medium mb-2",
              hasError
                ? "text-red-700 dark:text-red-400"
                : "text-gray-700 dark:text-gray-300"
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div
              className={cn(
                "absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none",
                hasError
                  ? "text-red-500 dark:text-red-400"
                  : "text-gray-500 dark:text-gray-500"
              )}
            >
              {leftIcon}
            </div>
          )}

          <select
            ref={ref}
            className={cn(
              "w-full rounded-lg shadow-sm transition-all duration-200 appearance-none",
              sizeClasses[inputSize],
              variantClasses[variant],
              disabledClasses,
              leftIcon && "pl-10",
              rightIcon ? "pr-10" : "pr-8",
              className
            )}
            disabled={disabled}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            {rightIcon || (
              <ChevronDownIcon
                className={cn(
                  "h-5 w-5",
                  hasError
                    ? "text-red-500 dark:text-red-400"
                    : "text-gray-500 dark:text-gray-500"
                )}
              />
            )}
          </div>
        </div>

        {(helperText || error) && (
          <p
            className={cn(
              "mt-2 text-sm",
              hasError
                ? "text-red-600 dark:text-red-400"
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
