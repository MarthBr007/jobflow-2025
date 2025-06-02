"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { format, subDays, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ExportUtils } from "@/utils/exportUtils";

interface TrendData {
  date: string;
  totalHours: number;
  totalShifts: number;
  uniqueEmployees: number;
  productivity: number;
}

interface TrendAnalysisProps {
  dateRange?: {
    start: string;
    end: string;
  };
}

export default function TrendAnalysis({ dateRange }: TrendAnalysisProps) {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "quarter"
  >("week");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchTrendData();
  }, [selectedPeriod, dateRange, refreshKey]);

  const fetchTrendData = async () => {
    setLoading(true);
    try {
      const mockData = generateMockTrendData();
      setTrendData(mockData);
    } catch (error) {
      console.error("Error fetching trend data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockTrendData = (): TrendData[] => {
    const days =
      selectedPeriod === "week" ? 7 : selectedPeriod === "month" ? 30 : 90;
    const data: TrendData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      const baseHours = 40 + Math.random() * 20;
      const shifts = Math.floor(5 + Math.random() * 10);

      data.push({
        date,
        totalHours: Math.round(baseHours * 10) / 10,
        totalShifts: shifts,
        uniqueEmployees: Math.floor(3 + Math.random() * 8),
        productivity: Math.round((80 + Math.random() * 20) * 10) / 10,
      });
    }

    return data;
  };

  const calculateTrend = (data: TrendData[], key: keyof TrendData) => {
    if (data.length < 2) return 0;
    const recent =
      data.slice(-7).reduce((sum, item) => sum + (item[key] as number), 0) / 7;
    const previous =
      data
        .slice(-14, -7)
        .reduce((sum, item) => sum + (item[key] as number), 0) / 7;
    return ((recent - previous) / previous) * 100;
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleExport = () => {
    // Simple CSV export functionality
    const csvData = trendData.map((item) => ({
      Date: item.date,
      Hours: item.totalHours,
      Productivity: item.productivity,
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trend-analysis-${selectedPeriod}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalHoursTrend = calculateTrend(trendData, "totalHours");
  const totalShiftsTrend = calculateTrend(trendData, "totalShifts");
  const productivityTrend = calculateTrend(trendData, "productivity");

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <LoadingSpinner
            size="lg"
            variant="dots"
            message="Trend analyse laden..."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
            📈 Trend Analyse
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Werkuren en productiviteit trends over tijd
          </p>
        </div>

        <div className="button-group-tight">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-full sm:w-auto">
            {(["week", "month", "quarter"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 touch-target-sm ${
                  selectedPeriod === period
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {period === "week"
                  ? "Week"
                  : period === "month"
                  ? "Maand"
                  : "Kwartaal"}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            className="component-padding-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors touch-target-sm"
            title="Gegevens verversen"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>

          <button
            onClick={handleExport}
            className="component-padding-sm bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors touch-target-sm"
            title="Exporteer trend data"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="elevated" padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Totaal Uren Trend
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {trendData
                    .reduce((sum, item) => sum + item.totalHours, 0)
                    .toFixed(1)}
                  h
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    totalHoursTrend >= 0
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  {totalHoursTrend >= 0 ? (
                    <ArrowTrendingUpIcon className="h-3 w-3" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-3 w-3" />
                  )}
                  {Math.abs(totalHoursTrend).toFixed(1)}%
                </div>
                <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-xl flex items-center justify-center">
                  <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="elevated" padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Diensten Trend
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {trendData.reduce((sum, item) => sum + item.totalShifts, 0)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    totalShiftsTrend >= 0
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  {totalShiftsTrend >= 0 ? (
                    <ArrowTrendingUpIcon className="h-3 w-3" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-3 w-3" />
                  )}
                  {Math.abs(totalShiftsTrend).toFixed(1)}%
                </div>
                <div className="h-10 w-10 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-xl flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="elevated" padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Productiviteit Trend
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {(
                    trendData.reduce(
                      (sum, item) => sum + item.productivity,
                      0
                    ) / trendData.length
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    productivityTrend >= 0
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  {productivityTrend >= 0 ? (
                    <ArrowTrendingUpIcon className="h-3 w-3" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-3 w-3" />
                  )}
                  {Math.abs(productivityTrend).toFixed(1)}%
                </div>
                <div className="h-10 w-10 bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 rounded-xl flex items-center justify-center">
                  <ChartBarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Werkuren Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {trendData.map((item, index) => {
                const maxHours = Math.max(
                  ...trendData.map((d) => d.totalHours)
                );
                const height = (item.totalHours / maxHours) * 100;

                return (
                  <motion.div
                    key={item.date}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: index * 0.05, duration: 0.5 }}
                    className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm min-h-[4px] relative group"
                  >
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {format(parseISO(item.date), "dd MMM", { locale: nl })}:{" "}
                      {item.totalHours}h
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex justify-between mt-4 text-xs text-gray-500 dark:text-gray-400">
              <span>
                {format(parseISO(trendData[0]?.date || ""), "dd MMM", {
                  locale: nl,
                })}
              </span>
              <span>
                {format(
                  parseISO(trendData[trendData.length - 1]?.date || ""),
                  "dd MMM",
                  { locale: nl }
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
