"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  maxDate?: Date;
  minDate?: Date;
  className?: string;
}

const MONTHS = [
  "Januari",
  "Februari",
  "Maart",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Augustus",
  "September",
  "Oktober",
  "November",
  "December",
];

const DAYS = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];

export default function DateRangePicker({
  value,
  onChange,
  placeholder = "Selecteer periode",
  maxDate,
  minDate,
  className = "",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStartDateChange = (date: string) => {
    const newStartDate = date ? new Date(date) : null;
    onChange({
      ...value,
      startDate: newStartDate,
      // Reset end date if it's before the new start date
      endDate:
        value.endDate && newStartDate && value.endDate < newStartDate
          ? null
          : value.endDate,
    });
  };

  const handleEndDateChange = (date: string) => {
    const newEndDate = date ? new Date(date) : null;
    onChange({
      ...value,
      endDate: newEndDate,
    });
  };

  const clearRange = () => {
    onChange({ startDate: null, endDate: null });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return format(date, "dd MMM yyyy", { locale: nl });
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
  };

  const hasValue = value.startDate || value.endDate;

  return (
    <div className={`relative ${className}`}>
      {/* Display Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left flex items-center justify-between transition-colors ${
          hasValue
            ? "text-gray-900 dark:text-white"
            : "text-gray-500 dark:text-gray-400"
        }`}
      >
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm">
            {hasValue ? (
              <>
                {value.startDate && formatDate(value.startDate)}
                {value.startDate && value.endDate && " - "}
                {value.endDate && formatDate(value.endDate)}
              </>
            ) : (
              placeholder
            )}
          </span>
        </div>
        {hasValue && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearRange();
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
          >
            <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Startdatum
                </label>
                <input
                  type="date"
                  value={formatDateForInput(value.startDate)}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  max={maxDate ? formatDateForInput(maxDate) : undefined}
                  min={minDate ? formatDateForInput(minDate) : undefined}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Einddatum
                </label>
                <input
                  type="date"
                  value={formatDateForInput(value.endDate)}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  max={maxDate ? formatDateForInput(maxDate) : undefined}
                  min={
                    value.startDate
                      ? formatDateForInput(value.startDate)
                      : minDate
                      ? formatDateForInput(minDate)
                      : undefined
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>

              {/* Quick Presets */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Snelle Selectie
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: "Laatste 7 dagen",
                      getRange: () => ({
                        startDate: new Date(
                          Date.now() - 7 * 24 * 60 * 60 * 1000
                        ),
                        endDate: new Date(),
                      }),
                    },
                    {
                      label: "Laatste 30 dagen",
                      getRange: () => ({
                        startDate: new Date(
                          Date.now() - 30 * 24 * 60 * 60 * 1000
                        ),
                        endDate: new Date(),
                      }),
                    },
                    {
                      label: "Deze maand",
                      getRange: () => {
                        const now = new Date();
                        return {
                          startDate: new Date(
                            now.getFullYear(),
                            now.getMonth(),
                            1
                          ),
                          endDate: new Date(
                            now.getFullYear(),
                            now.getMonth() + 1,
                            0
                          ),
                        };
                      },
                    },
                    {
                      label: "Vorige maand",
                      getRange: () => {
                        const now = new Date();
                        return {
                          startDate: new Date(
                            now.getFullYear(),
                            now.getMonth() - 1,
                            1
                          ),
                          endDate: new Date(
                            now.getFullYear(),
                            now.getMonth(),
                            0
                          ),
                        };
                      },
                    },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        onChange(preset.getRange());
                        setIsOpen(false);
                      }}
                      className="px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={clearRange}
                  className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Wissen
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
