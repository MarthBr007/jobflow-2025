import React from "react";
import Link from "next/link";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  maxItems?: number;
}

export default function Breadcrumbs({
  items,
  className,
  showHome = true,
  maxItems = 4,
}: BreadcrumbsProps) {
  // Add home item if requested
  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: "Home", href: "/dashboard" }, ...items]
    : items;

  // Truncate items if they exceed maxItems (keep first and last, truncate middle)
  let displayItems = allItems;
  if (allItems.length > maxItems) {
    const firstItems = allItems.slice(0, 1);
    const lastItems = allItems.slice(-2);
    displayItems = [
      ...firstItems,
      { label: "...", href: undefined },
      ...lastItems,
    ];
  }

  return (
    <nav
      className={cn(
        "flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 py-2 sm:py-3 px-1 sm:px-0",
        className
      )}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1 sm:space-x-2">
        {displayItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500 mx-1 sm:mx-2 flex-shrink-0" />
            )}

            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors font-medium truncate max-w-[120px] sm:max-w-none"
                title={item.label}
              >
                {index === 0 && showHome ? (
                  <div className="flex items-center">
                    <HomeIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </div>
                ) : (
                  <span>{item.label}</span>
                )}
              </Link>
            ) : (
              <span
                className={cn(
                  "truncate max-w-[120px] sm:max-w-none",
                  index === displayItems.length - 1
                    ? "text-gray-900 dark:text-gray-100 font-medium"
                    : "text-gray-500 dark:text-gray-400"
                )}
                title={item.label}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
