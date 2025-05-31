"use client";

import { useState, useRef, useEffect } from "react";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface DatePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  variant?: "docked" | "modal" | "inline";
  helperText?: string;
  error?: string;
  showTimeSelect?: boolean;
  size?: "sm" | "md" | "lg";
  context?: "near-future" | "far-future" | "past" | "any";
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

// Quick date presets based on context
const getQuickPresets = (context: string) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const nextMonth = new Date(today);
  nextMonth.setMonth(today.getMonth() + 1);

  switch (context) {
    case "near-future":
      return [
        { label: "Vandaag", date: today },
        { label: "Morgen", date: tomorrow },
        { label: "Volgende week", date: nextWeek },
      ];
    case "far-future":
      return [
        { label: "Over 1 maand", date: nextMonth },
        {
          label: "Over 3 maanden",
          date: new Date(
            today.getFullYear(),
            today.getMonth() + 3,
            today.getDate()
          ),
        },
        {
          label: "Over 6 maanden",
          date: new Date(
            today.getFullYear(),
            today.getMonth() + 6,
            today.getDate()
          ),
        },
      ];
    default:
      return [
        { label: "Vandaag", date: today },
        { label: "Morgen", date: tomorrow },
        { label: "Volgende week", date: nextWeek },
      ];
  }
};

export default function DatePicker({
  value,
  onChange,
  placeholder = "Selecteer datum",
  label,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  className = "",
  variant = "docked",
  helperText,
  error,
  showTimeSelect = false,
  size = "md",
  context = "any",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    value ? value.getMonth() : new Date().getMonth()
  );
  const [currentYear, setCurrentYear] = useState(
    value ? value.getFullYear() : new Date().getFullYear()
  );
  const [inputValue, setInputValue] = useState(value ? formatDate(value) : "");
  const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days");

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      setInputValue(formatDate(value));
      setCurrentMonth(value.getMonth());
      setCurrentYear(value.getFullYear());
    } else {
      setInputValue("");
    }
  }, [value]);

  function formatDate(date: Date): string {
    if (showTimeSelect) {
      return date.toLocaleString("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function parseDate(dateString: string): Date | null {
    const parts = dateString.split(/[-\/\s:]/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const hour = parts[3] ? parseInt(parts[3], 10) : 0;
      const minute = parts[4] ? parseInt(parts[4], 10) : 0;

      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month, day, hour, minute);
        if (
          date.getDate() === day &&
          date.getMonth() === month &&
          date.getFullYear() === year
        ) {
          return date;
        }
      }
    }
    return null;
  }

  function getDaysInMonth(month: number, year: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(month: number, year: number): number {
    return new Date(year, month, 1).getDay();
  }

  function isDateDisabled(date: Date): boolean {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  }

  function handleDateSelect(day: number) {
    const selectedDate = new Date(currentYear, currentMonth, day);
    if (showTimeSelect && value) {
      selectedDate.setHours(value.getHours(), value.getMinutes());
    }
    if (!isDateDisabled(selectedDate)) {
      onChange(selectedDate);
      if (!showTimeSelect) {
        setIsOpen(false);
      }
    }
  }

  function handlePresetSelect(presetDate: Date) {
    if (!isDateDisabled(presetDate)) {
      onChange(presetDate);
      setIsOpen(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (newValue === "") {
      onChange(null);
      return;
    }

    const parsedDate = parseDate(newValue);
    if (parsedDate && !isDateDisabled(parsedDate)) {
      onChange(parsedDate);
      setCurrentMonth(parsedDate.getMonth());
      setCurrentYear(parsedDate.getFullYear());
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown" && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    }
  }

  function navigateMonth(direction: "prev" | "next") {
    if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  }

  function handleMonthSelect(month: number) {
    setCurrentMonth(month);
    setViewMode("days");
  }

  function handleYearSelect(year: number) {
    setCurrentYear(year);
    setViewMode("months");
  }

  function renderMonthView() {
    return (
      <div className="grid grid-cols-3 gap-2 p-2">
        {MONTHS.map((month, index) => (
          <button
            key={month}
            type="button"
            onClick={() => handleMonthSelect(index)}
            className={`
              px-3 py-2 text-sm rounded-md transition-colors duration-200
              ${
                index === currentMonth
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }
            `}
          >
            {month.substring(0, 3)}
          </button>
        ))}
      </div>
    );
  }

  function renderYearView() {
    const yearRange = Array.from(
      { length: 21 },
      (_, i) => currentYear - 10 + i
    );
    return (
      <div className="grid grid-cols-3 gap-2 p-2 max-h-48 overflow-y-auto">
        {yearRange.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => handleYearSelect(year)}
            className={`
              px-3 py-2 text-sm rounded-md transition-colors duration-200
              ${
                year === currentYear
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }
            `}
          >
            {year}
          </button>
        ))}
      </div>
    );
  }

  function renderCalendar() {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isSelected =
        value &&
        date.getDate() === value.getDate() &&
        date.getMonth() === value.getMonth() &&
        date.getFullYear() === value.getFullYear();
      const isDisabled = isDateDisabled(date);
      const isToday =
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear();

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(day)}
          disabled={isDisabled}
          className={`
            w-8 h-8 text-sm rounded-md transition-colors duration-200 flex items-center justify-center
            ${isMobile ? "w-10 h-10 text-base" : "w-8 h-8 text-sm"}
            ${
              isSelected
                ? "bg-blue-600 text-white font-semibold shadow-lg"
                : isToday
                ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-medium ring-2 ring-blue-300 dark:ring-blue-700"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }
            ${
              isDisabled
                ? "text-gray-300 dark:text-gray-600 cursor-not-allowed hover:bg-transparent"
                : "cursor-pointer hover:scale-105"
            }
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  }

  const sizeClasses = {
    sm: "px-2 py-1.5 text-sm",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-base",
  };

  const inputClasses = `
    w-full pr-10 border rounded-lg shadow-sm transition-all duration-200
    ${sizeClasses[size]}
    ${
      error
        ? "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
    }
    focus:ring-2 focus:ring-opacity-20 outline-none
    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
    placeholder-gray-500 dark:placeholder-gray-400
    ${disabled ? "bg-gray-50 dark:bg-gray-800 cursor-not-allowed" : ""}
    ${isMobile ? "text-base" : ""}
    ${className}
  `;

  // Mobile modal or desktop dropdown
  const calendarContent = (
    <div
      className={`
      ${
        variant === "modal" || (isMobile && variant === "docked")
          ? "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          : "absolute z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
      }
    `}
    >
      <div
        className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-xl
        ${
          variant === "modal" || (isMobile && variant === "docked")
            ? "w-full max-w-sm mx-auto"
            : "min-w-[320px]"
        }
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigateMonth("prev")}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() =>
                setViewMode(viewMode === "months" ? "days" : "months")
              }
              className="text-sm font-medium bg-transparent text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
            >
              {MONTHS[currentMonth]}
            </button>

            <button
              type="button"
              onClick={() =>
                setViewMode(viewMode === "years" ? "days" : "years")
              }
              className="text-sm font-medium bg-transparent text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
            >
              {currentYear}
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigateMonth("next")}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>

          {(variant === "modal" || (isMobile && variant === "docked")) && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors ml-2"
            >
              <XMarkIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>

        <div className="p-4">
          {viewMode === "days" && (
            <>
              {/* Days of week */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="w-8 h-8 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center justify-center"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {renderCalendar()}
              </div>
            </>
          )}

          {viewMode === "months" && renderMonthView()}
          {viewMode === "years" && renderYearView()}

          {/* Quick presets for context-aware selection */}
          {viewMode === "days" && context !== "any" && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Snelle selectie
              </p>
              <div className="flex flex-wrap gap-2">
                {getQuickPresets(context).map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetSelect(preset.date)}
                    disabled={isDateDisabled(preset.date)}
                    className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Today button */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                if (!isDateDisabled(today)) {
                  onChange(today);
                  setIsOpen(false);
                }
              }}
              disabled={isDateDisabled(new Date())}
              className="w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <ClockIcon className="h-4 w-4" />
              <span>Vandaag</span>
            </button>
          </div>

          {/* Time selector for datetime picker */}
          {showTimeSelect && value && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Tijd:
                </label>
                <input
                  type="time"
                  value={value.toTimeString().slice(0, 5)}
                  onChange={(e) => {
                    if (value) {
                      const [hours, minutes] = e.target.value.split(":");
                      const newDate = new Date(value);
                      newDate.setHours(parseInt(hours), parseInt(minutes));
                      onChange(newDate);
                    }
                  }}
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div ref={containerRef} className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClasses}
            autoComplete="off"
          />

          <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
            {value && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                  setIsOpen(false);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => !disabled && setIsOpen(!isOpen)}
              disabled={disabled}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:cursor-not-allowed"
            >
              <CalendarIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Calendar */}
        {isOpen && calendarContent}
      </div>

      {/* Helper text or error */}
      {(helperText || error) && (
        <p
          className={`text-xs ${
            error
              ? "text-red-600 dark:text-red-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
