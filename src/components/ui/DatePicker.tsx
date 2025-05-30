"use client";

import { useState, useRef, useEffect } from "react";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
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
  variant?: "docked" | "modal";
  helperText?: string;
  error?: string;
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
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    value ? value.getMonth() : new Date().getMonth()
  );
  const [currentYear, setCurrentYear] = useState(
    value ? value.getFullYear() : new Date().getFullYear()
  );
  const [inputValue, setInputValue] = useState(value ? formatDate(value) : "");

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    return date.toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function parseDate(dateString: string): Date | null {
    const parts = dateString.split(/[-\/]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);

      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month, day);
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
    if (!isDateDisabled(selectedDate)) {
      onChange(selectedDate);
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
            ${
              isSelected
                ? "bg-blue-600 text-white font-semibold"
                : isToday
                ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-medium"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }
            ${
              isDisabled
                ? "text-gray-300 dark:text-gray-600 cursor-not-allowed hover:bg-transparent"
                : "cursor-pointer"
            }
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  }

  const inputClasses = `
    w-full px-3 py-2 pr-10 border rounded-lg shadow-sm transition-colors duration-200
    ${
      error
        ? "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
    }
    focus:ring-2 focus:ring-opacity-20 outline-none
    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
    placeholder-gray-500 dark:placeholder-gray-400
    ${disabled ? "bg-gray-50 dark:bg-gray-800 cursor-not-allowed" : ""}
    ${className}
  `;

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

        {/* Calendar Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => navigateMonth("prev")}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>

              <div className="flex items-center space-x-2">
                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                  className="text-sm font-medium bg-transparent text-gray-900 dark:text-white border-none outline-none cursor-pointer"
                >
                  {MONTHS.map((month, index) => (
                    <option
                      key={month}
                      value={index}
                      className="bg-white dark:bg-gray-800"
                    >
                      {month}
                    </option>
                  ))}
                </select>

                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                  className="text-sm font-medium bg-transparent text-gray-900 dark:text-white border-none outline-none cursor-pointer"
                >
                  {Array.from(
                    { length: 21 },
                    (_, i) => currentYear - 10 + i
                  ).map((year) => (
                    <option
                      key={year}
                      value={year}
                      className="bg-white dark:bg-gray-800"
                    >
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => navigateMonth("next")}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

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
            <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>

            {/* Today button */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  if (!isDateDisabled(today)) {
                    onChange(today);
                    setIsOpen(false);
                  }
                }}
                className="w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
              >
                Vandaag
              </button>
            </div>
          </div>
        )}
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
