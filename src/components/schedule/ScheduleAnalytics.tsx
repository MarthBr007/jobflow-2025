"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ClockIcon,
  UserGroupIcon,
  CurrencyEuroIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import TrendAnalysis from "@/components/analytics/TrendAnalysis";

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

interface ScheduleAnalyticsProps {
  shifts: ScheduleShift[];
  period: "day" | "week" | "month";
}

export default function ScheduleAnalytics({
  shifts,
  period,
}: ScheduleAnalyticsProps) {
  const calculateTotalHours = () => {
    return shifts.reduce((total, shift) => {
      const start = new Date(shift.startTime);
      const end = new Date(shift.endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);
  };

  const getUniqueWorkers = () => {
    const uniqueUserIds = new Set(shifts.map((shift) => shift.userId));
    return uniqueUserIds.size;
  };

  const getStatusStats = () => {
    const stats = {
      SCHEDULED: 0,
      CONFIRMED: 0,
      CANCELLED: 0,
      COMPLETED: 0,
    };

    shifts.forEach((shift) => {
      stats[shift.status]++;
    });

    return stats;
  };

  const getWorkTypeDistribution = () => {
    const distribution: Record<string, number> = {};

    shifts.forEach((shift) => {
      const workType = shift.role || "Geen rol";
      distribution[workType] = (distribution[workType] || 0) + 1;
    });

    return Object.entries(distribution).map(([role, count]) => ({
      role,
      count,
      percentage: (count / shifts.length) * 100,
    }));
  };

  const getEstimatedCosts = () => {
    // Estimated hourly rates per work type
    const hourlyRates: Record<string, number> = {
      chauffeur: 22,
      wasstraat: 18,
      orderpicker: 20,
      "op en afbouw werkzaamheden": 25,
      magazijn: 19,
      administratie: 24,
      klantenservice: 21,
      "technische dienst": 28,
      beveiliging: 23,
      schoonmaak: 17,
    };

    let totalCost = 0;
    let totalHours = 0;

    shifts.forEach((shift) => {
      const start = new Date(shift.startTime);
      const end = new Date(shift.endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      const rate = hourlyRates[shift.role?.toLowerCase() || ""] || 20; // Default rate

      totalHours += hours;
      totalCost += hours * rate;
    });

    return {
      totalCost,
      averageRate: totalHours > 0 ? totalCost / totalHours : 0,
    };
  };

  const getBusyTimes = () => {
    const hourCounts: Record<number, number> = {};

    shifts.forEach((shift) => {
      const start = new Date(shift.startTime);
      const startHour = start.getHours();
      hourCounts[startHour] = (hourCounts[startHour] || 0) + 1;
    });

    const sortedHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
        timeSlot: `${hour.padStart(2, "0")}:00 - ${(parseInt(hour) + 1)
          .toString()
          .padStart(2, "0")}:00`,
      }));

    return sortedHours;
  };

  const totalHours = calculateTotalHours();
  const uniqueWorkers = getUniqueWorkers();
  const statusStats = getStatusStats();
  const workTypeDistribution = getWorkTypeDistribution();
  const { totalCost, averageRate } = getEstimatedCosts();
  const busyTimes = getBusyTimes();

  const getPeriodText = () => {
    switch (period) {
      case "day":
        return "vandaag";
      case "week":
        return "deze week";
      case "month":
        return "deze maand";
      default:
        return period;
    }
  };

  const cards = [
    {
      title: "Totale Uren",
      value: totalHours.toFixed(1),
      unit: "uur",
      icon: ClockIcon,
      color: "blue",
      trend:
        "+12% vs vorige " +
        (period === "day" ? "dag" : period === "week" ? "week" : "maand"),
    },
    {
      title: "Actieve Medewerkers",
      value: uniqueWorkers,
      unit: "personen",
      icon: UserGroupIcon,
      color: "green",
      trend: `${uniqueWorkers} van beschikbare team`,
    },
    {
      title: "Geschatte Kosten",
      value: `€${Math.round(totalCost)}`,
      unit: `(€${averageRate.toFixed(2)}/u gem.)`,
      icon: CurrencyEuroIcon,
      color: "purple",
      trend: "Incl. loonkosten en overhead",
    },
    {
      title: "Bevestigd",
      value: statusStats.CONFIRMED,
      unit: `van ${shifts.length} diensten`,
      icon: CheckCircleIcon,
      color: statusStats.CONFIRMED / shifts.length > 0.8 ? "green" : "yellow",
      trend: `${Math.round(
        (statusStats.CONFIRMED / shifts.length) * 100
      )}% bevestigd`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Rooster Analytics - {getPeriodText()}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Inzichten en statistieken over je roosterplanning
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center">
              <div
                className={`p-3 rounded-lg ${
                  card.color === "blue"
                    ? "bg-blue-100 dark:bg-blue-900/20"
                    : card.color === "green"
                    ? "bg-green-100 dark:bg-green-900/20"
                    : card.color === "purple"
                    ? "bg-purple-100 dark:bg-purple-900/20"
                    : card.color === "yellow"
                    ? "bg-yellow-100 dark:bg-yellow-900/20"
                    : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                <card.icon
                  className={`h-6 w-6 ${
                    card.color === "blue"
                      ? "text-blue-600 dark:text-blue-400"
                      : card.color === "green"
                      ? "text-green-600 dark:text-green-400"
                      : card.color === "purple"
                      ? "text-purple-600 dark:text-purple-400"
                      : card.color === "yellow"
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {card.title}
                </p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {card.value}
                  </p>
                  <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    {card.unit}
                  </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {card.trend}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Type Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Verdeling per Werktype
          </h4>
          <div className="space-y-3">
            {workTypeDistribution.slice(0, 5).map((item) => (
              <div
                key={item.role}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.role}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Status Overzicht
          </h4>
          <div className="space-y-4">
            {Object.entries(statusStats).map(([status, count]) => {
              const percentage =
                shifts.length > 0 ? (count / shifts.length) * 100 : 0;
              const statusConfig = {
                SCHEDULED: { label: "Gepland", color: "blue" },
                CONFIRMED: { label: "Bevestigd", color: "green" },
                CANCELLED: { label: "Geannuleerd", color: "red" },
                COMPLETED: { label: "Voltooid", color: "gray" },
              };

              const config = statusConfig[status as keyof typeof statusConfig];

              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        config.color === "blue"
                          ? "bg-blue-500"
                          : config.color === "green"
                          ? "bg-green-500"
                          : config.color === "red"
                          ? "bg-red-500"
                          : "bg-gray-500"
                      }`}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {percentage.toFixed(0)}%
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Busy Times */}
        {busyTimes.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Drukste Tijden
            </h4>
            <div className="space-y-3">
              {busyTimes.map((time, index) => (
                <div
                  key={time.hour}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        index === 0
                          ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          : index === 1
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {time.timeSlot}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {time.count} diensten
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Aanbevelingen
          </h4>
          <div className="space-y-3">
            {statusStats.SCHEDULED > statusStats.CONFIRMED && (
              <div className="flex items-start space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Bevestig openstaande diensten
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {statusStats.SCHEDULED} diensten wachten nog op bevestiging
                  </p>
                </div>
              </div>
            )}

            {totalHours < 40 && period === "week" && (
              <div className="flex items-start space-x-2">
                <ArrowTrendingUpIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Meer uren inplannen
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Huidige week heeft minder uren dan gemiddeld
                  </p>
                </div>
              </div>
            )}

            {uniqueWorkers < 5 && (
              <div className="flex items-start space-x-2">
                <UserGroupIcon className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Meer medewerkers inzetten
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Overweeg meer teamleden in te roosteren
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trend Analysis Section */}
      <div className="mt-8">
        <TrendAnalysis />
      </div>
    </div>
  );
}
