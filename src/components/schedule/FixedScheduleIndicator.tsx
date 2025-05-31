"use client";

import { useState, useEffect } from "react";
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  SparklesIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { format, getDay } from "date-fns";
import { nl } from "date-fns/locale";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface FixedScheduleAssignment {
  id: string;
  userId: string;
  dayOfWeek: number;
  customStartTime?: string;
  customEndTime?: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  template: {
    id: string;
    name: string;
    shifts: Array<{
      id: string;
      role: string;
      startTime: string;
      endTime: string;
      project?: {
        name: string;
        company: string;
      };
    }>;
  };
}

interface FixedScheduleIndicatorProps {
  selectedDate: string;
  onGeneratePressed: () => void;
}

export default function FixedScheduleIndicator({
  selectedDate,
  onGeneratePressed,
}: FixedScheduleIndicatorProps) {
  const [assignments, setAssignments] = useState<FixedScheduleAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFixedScheduleAssignments();
  }, [selectedDate]);

  const fetchFixedScheduleAssignments = async () => {
    try {
      const dayOfWeek = getDay(new Date(selectedDate));
      const response = await fetch(
        `/api/user-schedule-assignments?dayOfWeek=${dayOfWeek}`
      );
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error("Error fetching fixed schedule assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = [
      "Zondag",
      "Maandag",
      "Dinsdag",
      "Woensdag",
      "Donderdag",
      "Vrijdag",
      "Zaterdag",
    ];
    return days[dayOfWeek];
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  if (loading) {
    return (
      <Card variant="default" padding="md" className="animate-pulse">
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </Card>
    );
  }

  if (assignments.length === 0) {
    return null; // Don't show anything if no fixed schedules for this day
  }

  return (
    <Card variant="default" padding="lg" className="border-l-4 border-blue-500">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-3">
            <CalendarDaysIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              📋 Vaste Rooster Patronen
            </h3>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {assignments.length} medewerkers hebben een vast patroon voor{" "}
            {getDayName(getDay(new Date(selectedDate)))} -{" "}
            {format(new Date(selectedDate), "d MMMM", { locale: nl })}
          </p>

          <div className="space-y-3">
            {assignments.slice(0, 3).map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {assignment.user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {assignment.template.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300">
                  <ClockIcon className="h-3 w-3" />
                  {assignment.template.shifts.map((shift, index) => (
                    <span key={index}>
                      {formatTime(
                        assignment.customStartTime || shift.startTime
                      )}
                      -{formatTime(assignment.customEndTime || shift.endTime)}
                      {index < assignment.template.shifts.length - 1 && ", "}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {assignments.length > 3 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                + {assignments.length - 3} meer...
              </div>
            )}
          </div>
        </div>

        <div className="ml-4 flex-shrink-0">
          <Button
            onClick={onGeneratePressed}
            leftIcon={<SparklesIcon className="h-4 w-4" />}
            variant="primary"
            size="sm"
            className="whitespace-nowrap"
          >
            Automatisch Toevoegen
          </Button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
        <div className="flex items-start">
          <SparklesIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-xs text-yellow-800 dark:text-yellow-200">
            <strong>💡 Tip:</strong> Deze medewerkers hebben vaste werkpatronen.
            Klik op "Automatisch Toevoegen" om hun diensten automatisch aan te
            maken op basis van hun vaste rooster.
          </div>
        </div>
      </div>
    </Card>
  );
}
