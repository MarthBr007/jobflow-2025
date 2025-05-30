import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  className?: string;
  type?: "default" | "warning" | "error" | "success" | "info";
  preventClose?: boolean;
  disableAutoFocus?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  showCloseButton = true,
  className = "",
  type = "default",
  preventClose = false,
  disableAutoFocus = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const hasSetInitialFocus = useRef(false);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !preventClose) {
        onClose();
      }
    };

    // Tab trap implementation
    const handleTabKey = (event: KeyboardEvent) => {
      // Only handle actual Tab key presses, not during normal typing
      if (
        event.key === "Tab" &&
        !event.ctrlKey &&
        !event.altKey &&
        modalRef.current
      ) {
        const focusableElements = modalRef.current.querySelectorAll(
          'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]):not([tabindex="-1"]):not([aria-label="Sluiten"]), [href]:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const elementsArray = Array.from(focusableElements) as HTMLElement[];
        const firstElement = elementsArray[0];
        const lastElement = elementsArray[elementsArray.length - 1];

        if (event.shiftKey) {
          // Shift + Tab - going backwards
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab - going forwards
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("keydown", handleTabKey);
      document.body.style.overflow = "hidden";

      // Improved focus management for accessibility - only on initial open
      if (
        modalRef.current &&
        !disableAutoFocus &&
        !hasSetInitialFocus.current
      ) {
        setTimeout(() => {
          const focusableElements = modalRef.current?.querySelectorAll(
            'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]):not([tabindex="-1"]):not([aria-label="Sluiten"]), [href]:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
          );

          if (focusableElements && focusableElements.length > 0) {
            const firstInput = Array.from(focusableElements).find(
              (el) =>
                el.tagName.toLowerCase() === "input" &&
                (el as HTMLInputElement).type !== "hidden" &&
                (el as HTMLInputElement).type !== "checkbox"
            ) as HTMLElement;

            const elementToFocus =
              firstInput || (focusableElements[0] as HTMLElement);
            elementToFocus?.focus();
            hasSetInitialFocus.current = true;
          }
        }, 100);
      }
    } else {
      // Reset the flag when modal closes
      hasSetInitialFocus.current = false;
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTabKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, preventClose, disableAutoFocus]);

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && !preventClose) {
      onClose();
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "max-w-sm w-full mx-4 sm:mx-auto";
      case "lg":
        return "max-w-2xl w-full mx-4 sm:mx-auto";
      case "xl":
        return "max-w-4xl w-full mx-4 sm:mx-auto";
      case "full":
        return "max-w-full w-full m-2 sm:m-4";
      default:
        return "max-w-md w-full mx-4 sm:mx-auto";
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case "warning":
        return {
          headerBg:
            "bg-yellow-50 dark:bg-yellow-900/20 border-b-yellow-200 dark:border-b-yellow-700",
          titleColor: "text-yellow-800 dark:text-yellow-200",
          iconColor: "text-yellow-600 dark:text-yellow-400",
        };
      case "error":
        return {
          headerBg:
            "bg-red-50 dark:bg-red-900/20 border-b-red-200 dark:border-b-red-700",
          titleColor: "text-red-800 dark:text-red-200",
          iconColor: "text-red-600 dark:text-red-400",
        };
      case "success":
        return {
          headerBg:
            "bg-green-50 dark:bg-green-900/20 border-b-green-200 dark:border-b-green-700",
          titleColor: "text-green-800 dark:text-green-200",
          iconColor: "text-green-600 dark:text-green-400",
        };
      case "info":
        return {
          headerBg:
            "bg-blue-50 dark:bg-blue-900/20 border-b-blue-200 dark:border-b-blue-700",
          titleColor: "text-blue-800 dark:text-blue-200",
          iconColor: "text-blue-600 dark:text-blue-400",
        };
      default:
        return {
          headerBg:
            "bg-white dark:bg-gray-800 border-b-gray-200 dark:border-b-gray-700",
          titleColor: "text-gray-900 dark:text-white",
          iconColor: "text-gray-400 dark:text-gray-500",
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          aria-describedby={description ? "modal-description" : undefined}
        >
          <div
            className="flex min-h-screen items-end sm:items-center justify-center p-0 sm:p-4 text-center"
            onClick={handleBackdropClick}
          >
            {/* Enhanced Dark Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Modal Panel */}
            <motion.div
              ref={modalRef}
              initial={{
                opacity: 0,
                scale: 0.95,
                y: window.innerWidth < 640 ? 100 : 0, // Slide up on mobile
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: window.innerWidth < 640 ? 100 : 0,
              }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 100,
                duration: 0.3,
              }}
              className={`
                relative transform text-left shadow-xl transition-all
                ${getSizeClass()} 
                ${className}
                sm:rounded-lg rounded-t-lg
                bg-white dark:bg-gray-800
                max-h-[95vh] sm:max-h-[90vh]
                flex flex-col
              `}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile handle bar */}
              <div className="sm:hidden flex justify-center pt-2 pb-1">
                <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              </div>

              {/* Header */}
              {(title || showCloseButton) && (
                <div
                  className={`
                    px-4 sm:px-6 py-3 sm:py-4 border-b 
                    ${typeStyles.headerBg}
                    ${size === "full" ? "sticky top-0 z-10" : ""}
                    rounded-t-lg sm:rounded-t-lg
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {title && (
                        <h3
                          id="modal-title"
                          className={`text-base sm:text-lg font-semibold leading-6 ${typeStyles.titleColor} truncate`}
                        >
                          {title}
                        </h3>
                      )}
                      {description && (
                        <p
                          id="modal-description"
                          className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400"
                        >
                          {description}
                        </p>
                      )}
                    </div>
                    {showCloseButton && (
                      <button
                        type="button"
                        className={`
                          ml-3 flex-shrink-0 rounded-md p-1.5 sm:p-2 transition-colors 
                          hover:bg-gray-100 dark:hover:bg-gray-700 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                          touch-manipulation min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]
                          flex items-center justify-center
                          ${typeStyles.iconColor}
                        `}
                        onClick={onClose}
                        aria-label="Sluiten"
                        disabled={preventClose}
                      >
                        <span className="sr-only">Sluiten</span>
                        <XMarkIcon
                          className="h-5 w-5 sm:h-6 sm:w-6"
                          aria-hidden="true"
                        />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Content */}
              <div
                className={`
                  px-4 sm:px-6 py-4 sm:py-6 
                  flex-1 overflow-y-auto
                  ${size === "full" ? "h-full" : ""}
                `}
              >
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
