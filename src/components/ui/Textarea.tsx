import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  variant?: "default" | "filled" | "outlined";
  resize?: "none" | "vertical" | "horizontal" | "both";
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      variant = "default",
      resize = "vertical",
      disabled,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    const resizeClasses = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize",
    };

    const variantClasses = {
      default: cn(
        "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
        "focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:focus:ring-blue-400",
        "hover:border-gray-400 dark:hover:border-gray-500",
        hasError &&
          "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500 dark:focus:ring-red-400"
      ),
      filled: cn(
        "border-0 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white",
        "focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:focus:ring-blue-400",
        "hover:bg-gray-200 dark:hover:bg-gray-600",
        hasError &&
          "bg-red-50 dark:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20 focus:ring-red-500 dark:focus:ring-red-400"
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

        <textarea
          ref={ref}
          className={cn(
            "w-full px-4 py-3 rounded-lg shadow-sm transition-all duration-200",
            "placeholder-gray-500 dark:placeholder-gray-400",
            resizeClasses[resize],
            variantClasses[variant],
            disabledClasses,
            className
          )}
          disabled={disabled}
          {...props}
        />

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

Textarea.displayName = "Textarea";

export default Textarea;
