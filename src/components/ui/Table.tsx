import React from "react";
import { cn } from "@/lib/utils";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  className?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAll?: (selected: boolean) => void;
  stickyHeader?: boolean;
  dense?: boolean;
  className?: string;
  emptyMessage?: string;
}

const Table: React.FC<TableProps> = ({
  columns,
  data,
  sortBy,
  sortDirection,
  onSort,
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  stickyHeader = false,
  dense = false,
  className,
  emptyMessage = "Geen data beschikbaar",
}) => {
  const allSelected = data.length > 0 && selectedRows.length === data.length;
  const someSelected =
    selectedRows.length > 0 && selectedRows.length < data.length;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm",
        className
      )}
    >
      <div className="overflow-x-auto mobile-scroll">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {/* Table Header */}
          <thead
            className={cn(
              "bg-gray-50 dark:bg-gray-700",
              stickyHeader && "sticky top-0 z-10"
            )}
          >
            <tr>
              {/* Selection Column */}
              {selectable && (
                <th className="w-10 sm:w-12 px-3 sm:px-6 py-2 sm:py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 touch-manipulation"
                  />
                </th>
              )}

              {/* Data Columns */}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-3 sm:px-6 py-2 sm:py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.sortable &&
                      "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none touch-manipulation",
                    dense ? "py-1.5 sm:py-2" : "py-2 sm:py-3",
                    column.className
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && onSort?.(column.key)}
                >
                  <div
                    className={cn(
                      "flex items-center",
                      column.align === "center" && "justify-center",
                      column.align === "right" && "justify-end"
                    )}
                  >
                    <span className="truncate">{column.label}</span>
                    {column.sortable && (
                      <div className="ml-1 sm:ml-2 flex flex-col flex-shrink-0">
                        <ChevronUpIcon
                          className={cn(
                            "h-3 w-3",
                            sortBy === column.key && sortDirection === "asc"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-400 dark:text-gray-500"
                          )}
                        />
                        <ChevronDownIcon
                          className={cn(
                            "h-3 w-3 -mt-1",
                            sortBy === column.key && sortDirection === "desc"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-400 dark:text-gray-500"
                          )}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  <div className="flex flex-col items-center">
                    <div className="text-sm sm:text-base">{emptyMessage}</div>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const isSelected = selectedRows.includes(row.id);

                return (
                  <tr
                    key={row.id || index}
                    className={cn(
                      "hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 touch-manipulation",
                      isSelected &&
                        "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    )}
                  >
                    {/* Selection Column */}
                    {selectable && (
                      <td className="w-10 sm:w-12 px-3 sm:px-6 py-3 sm:py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectRow?.(row.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 touch-manipulation"
                        />
                      </td>
                    )}

                    {/* Data Columns */}
                    {columns.map((column) => {
                      const value = row[column.key];
                      const displayValue = column.render
                        ? column.render(value, row)
                        : value;

                      return (
                        <td
                          key={column.key}
                          className={cn(
                            "px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100",
                            column.align === "center" && "text-center",
                            column.align === "right" && "text-right",
                            dense ? "py-2 sm:py-2" : "py-3 sm:py-4",
                            column.className
                          )}
                        >
                          <div className="min-w-0">{displayValue}</div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
