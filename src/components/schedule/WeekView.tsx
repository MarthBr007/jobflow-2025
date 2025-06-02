"use client";

import React from "react";
import { motion } from "framer-motion";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { nl } from "date-fns/locale";
import {
  ClockIcon,
  UserIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface ScheduleShift {
  id: string;
  userId: string;
  projectId?: string;
  startTime: string;
  endTime: string;
  role?: string;
  notes?: string;
  status: "SCHEDULED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  project?: {
    id: string;
    name: string;
    company: string;
  };
}

interface LeaveInfo {
  id: string;
  userId: string;
  userName: string;
  type: string;
  startDate: string;
  endDate: string;
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
}

interface WeekViewProps {
  selectedDate: string;
  shifts: ScheduleShift[];
  leaveInfo?: LeaveInfo[];
  onDateSelect: (date: string) => void;
}

export default function WeekView({
  selectedDate,
  shifts,
  leaveInfo = [],
  onDateSelect,
}: WeekViewProps) {
  const currentDate = new Date(selectedDate);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getShiftsForDay = (date: Date) => {
    return shifts.filter((shift) => isSameDay(new Date(shift.startTime), date));
  };

  const getLeaveForDay = (date: Date) => {
    return leaveInfo.filter((leave) => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      return date >= leaveStart && date <= leaveEnd;
    });
  };

  const getLeaveEmoji = (leaveType: string) => {
    const leaveTypes: Record<string, string> = {
      VACATION: "🏖️",
      SICK_LEAVE: "🤒",
      PERSONAL_LEAVE: "👤",
      TIME_OFF_IN_LIEU: "⏰",
      DOCTOR_VISIT: "👨‍⚕️",
      DENTIST_VISIT: "🦷",
      SPECIAL_LEAVE: "✨",
      CALAMITY_LEAVE: "🚨",
      BEREAVEMENT_LEAVE: "🖤",
      MOVING_DAY: "📦",
      MATERNITY_LEAVE: "🤱",
      PATERNITY_LEAVE: "👨‍👶",
      STUDY_LEAVE: "📚",
      EMERGENCY_LEAVE: "🆘",
      UNPAID_LEAVE: "💸",
      COMPENSATORY_LEAVE: "⚖️",
    };
    return leaveTypes[leaveType] || "📝";
  };

  const getStatusColor = (status: ScheduleShift["status"]) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-500";
      case "CONFIRMED":
        return "bg-green-500";
      case "CANCELLED":
        return "bg-red-500";
      case "COMPLETED":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const formatTime = (timeString: string) => {
    // Extract just the time portion to avoid timezone conversion
    // timeString format: "2025-05-30T08:00:00"
    if (timeString.includes("T")) {
      return timeString.substring(11, 16); // Gets "08:00" from "2025-05-30T08:00:00"
    }
    // Fallback for other formats
    return timeString;
  };

  const calculateDayHours = (dayShifts: ScheduleShift[]) => {
    return dayShifts.reduce((total, shift) => {
      const start = new Date(shift.startTime);
      const end = new Date(shift.endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);
  };

  const getTotalWeekHours = () => {
    return weekDays.reduce((total, day) => {
      const dayShifts = getShiftsForDay(day);
      return total + calculateDayHours(dayShifts);
    }, 0);
  };

  const getTotalWeekLeave = () => {
    const uniqueUserIds = new Set();
    weekDays.forEach((day) => {
      const dayLeave = getLeaveForDay(day);
      dayLeave.forEach((leave) => uniqueUserIds.add(leave.userId));
    });
    return uniqueUserIds.size;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      {/* Week Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Week van {format(weekStart, "d MMMM", { locale: nl })} -{" "}
              {format(addDays(weekStart, 6), "d MMMM yyyy", { locale: nl })}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span>
                {shifts.length} diensten • {getTotalWeekHours().toFixed(1)} uur
                totaal
              </span>
              {getTotalWeekLeave() > 0 && (
                <span className="flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1 text-orange-500" />
                  {getTotalWeekLeave()}{" "}
                  {getTotalWeekLeave() === 1 ? "persoon" : "personen"} afwezig
                </span>
              )}
            </div>
          </div>
          <CalendarDaysIcon className="h-6 w-6 text-gray-400" />
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-0">
        {weekDays.map((day, index) => {
          const dayShifts = getShiftsForDay(day);
          const dayLeave = getLeaveForDay(day);
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, currentDate);
          const dayHours = calculateDayHours(dayShifts);

          return (
            <motion.div
              key={day.toISOString()}
              whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
              onClick={() => onDateSelect(day.toISOString().split("T")[0])}
              className={`
                p-3 border-r border-b border-gray-200 dark:border-gray-700 cursor-pointer min-h-[160px]
                ${index === 6 ? "border-r-0" : ""}
                ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""}
                ${isToday ? "ring-2 ring-blue-500 ring-inset" : ""}
              `}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div
                    className={`text-sm font-medium ${
                      isToday
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {format(day, "EEE", { locale: nl })}
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      isToday
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                </div>
                <div className="text-right">
                  {dayShifts.length > 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {dayHours.toFixed(1)}h
                    </div>
                  )}
                  {dayLeave.length > 0 && (
                    <div className="text-xs text-orange-600 dark:text-orange-400 flex items-center">
                      <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                      {dayLeave.length}
                    </div>
                  )}
                </div>
              </div>

              {/* Leave for this day */}
              {dayLeave.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">
                    Afwezig:
                  </div>
                  <div className="space-y-1">
                    {dayLeave.slice(0, 2).map((leave) => (
                      <div
                        key={leave.id}
                        className="text-xs p-1 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                      >
                        <div className="flex items-center space-x-1">
                          <span className="text-sm">
                            {getLeaveEmoji(leave.type)}
                          </span>
                          <span className="text-orange-700 dark:text-orange-300 truncate font-medium">
                            {leave.userName.split(" ")[0]}{" "}
                            {/* First name only */}
                          </span>
                        </div>
                        {!leave.isFullDay &&
                          leave.startTime &&
                          leave.endTime && (
                            <div className="text-orange-600 dark:text-orange-400 text-xs">
                              {leave.startTime} - {leave.endTime}
                            </div>
                          )}
                      </div>
                    ))}
                    {dayLeave.length > 2 && (
                      <div className="text-xs text-orange-500 dark:text-orange-400 text-center">
                        +{dayLeave.length - 2} meer
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Shifts for this day */}
              <div className="space-y-1">
                {dayShifts
                  .slice(0, dayLeave.length > 0 ? 2 : 3)
                  .map((shift) => (
                    <div
                      key={shift.id}
                      className="text-xs p-1 rounded bg-gray-100 dark:bg-gray-700"
                    >
                      <div className="flex items-center space-x-1">
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusColor(
                            shift.status
                          )}`}
                        />
                        <span className="text-gray-700 dark:text-gray-300 truncate">
                          {shift.user.name.split(" ")[0]}{" "}
                          {/* First name only */}
                        </span>
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">
                        {formatTime(shift.startTime)} -{" "}
                        {formatTime(shift.endTime)}
                      </div>
                      {shift.role && (
                        <div className="text-gray-500 dark:text-gray-400 truncate">
                          {shift.role}
                        </div>
                      )}
                    </div>
                  ))}

                {dayShifts.length > (dayLeave.length > 0 ? 2 : 3) && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    +{dayShifts.length - (dayLeave.length > 0 ? 2 : 3)} meer
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
