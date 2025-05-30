import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  placement?: "top" | "right" | "bottom" | "left";
  showTip?: boolean;
  className?: string;
}

export default function Popover({
  trigger,
  content,
  placement = "bottom",
  showTip = true,
  className = "",
}: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPlacementStyles = () => {
    switch (placement) {
      case "top":
        return "bottom-full mb-2";
      case "right":
        return "left-full ml-2";
      case "left":
        return "right-full mr-2";
      default:
        return "top-full mt-2";
    }
  };

  const getTipStyles = () => {
    if (!showTip) return "";

    switch (placement) {
      case "top":
        return "bottom-[-8px] left-1/2 transform -translate-x-1/2 border-t-8 border-x-8 border-x-transparent";
      case "right":
        return "left-[-8px] top-1/2 transform -translate-y-1/2 border-r-8 border-y-8 border-y-transparent";
      case "left":
        return "right-[-8px] top-1/2 transform -translate-y-1/2 border-l-8 border-y-8 border-y-transparent";
      default:
        return "top-[-8px] left-1/2 transform -translate-x-1/2 border-b-8 border-x-8 border-x-transparent";
    }
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={`absolute z-50 ${getPlacementStyles()} ${className}`}
          >
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              {showTip && (
                <div
                  className={`absolute w-0 h-0 border-white dark:border-gray-800 ${getTipStyles()}`}
                />
              )}
              <div className="p-4">{content}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
