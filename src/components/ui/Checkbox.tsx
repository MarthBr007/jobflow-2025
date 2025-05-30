import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon } from "@heroicons/react/24/outline";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  description?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "card";
  indeterminate?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      description,
      error,
      size = "md",
      variant = "default",
      indeterminate = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    };

    const checkboxClasses = cn(
      "rounded border-2 transition-all duration-200 focus:ring-2 focus:ring-offset-2",
      sizeClasses[size],
      hasError
        ? "border-red-500 dark:border-red-400 text-red-600 focus:ring-red-500"
        : "border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500",
      "bg-white dark:bg-gray-800",
      "checked:bg-blue-600 checked:border-blue-600 dark:checked:bg-blue-500 dark:checked:border-blue-500",
      "hover:border-gray-400 dark:hover:border-gray-500",
      disabled && "opacity-50 cursor-not-allowed",
      className
    );

    const labelClasses = cn(
      "font-medium",
      size === "sm" ? "text-sm" : size === "lg" ? "text-base" : "text-sm",
      hasError
        ? "text-red-700 dark:text-red-400"
        : "text-gray-900 dark:text-white",
      disabled && "opacity-50 cursor-not-allowed"
    );

    const descriptionClasses = cn(
      "text-sm text-gray-600 dark:text-gray-400",
      disabled && "opacity-50"
    );

    if (variant === "card") {
      return (
        <div
          className={cn(
            "relative rounded-lg border-2 p-4 transition-all duration-200",
            hasError
              ? "border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20"
              : props.checked
              ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                ref={ref}
                type="checkbox"
                className={checkboxClasses}
                disabled={disabled}
                {...props}
              />
            </div>
            <div className="ml-3 text-sm">
              {label && <label className={labelClasses}>{label}</label>}
              {description && (
                <p className={cn(descriptionClasses, label && "mt-1")}>
                  {description}
                </p>
              )}
            </div>
          </div>
          {hasError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="checkbox"
            className={checkboxClasses}
            disabled={disabled}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="ml-3 text-sm">
            {label && (
              <label
                className={cn(labelClasses, !disabled && "cursor-pointer")}
                onClick={() => {
                  if (!disabled && ref && "current" in ref && ref.current) {
                    ref.current.click();
                  }
                }}
              >
                {label}
              </label>
            )}
            {description && (
              <p className={cn(descriptionClasses, label && "mt-1")}>
                {description}
              </p>
            )}
            {hasError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
