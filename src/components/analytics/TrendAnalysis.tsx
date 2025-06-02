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

  useEffect(() => {
    fetchTrendData();
  }, [selectedPeriod, dateRange]);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrendData();
    setRefreshing(false);
  };

  const handleExport = () => {
    if (trendData.length === 0) {
      alert("Geen data om te exporteren");
      return;
    }

    const exportData = trendData.map((item) => ({
      Datum: format(parseISO(item.date), "dd-MM-yyyy", { locale: nl }),
      "Totaal Uren": item.totalHours,
      "Aantal Diensten": item.totalShifts,
      "Unieke Medewerkers": item.uniqueEmployees,
      "Productiviteit (%)": item.productivity,
    }));

    try {
      ExportUtils.exportTrendAnalysisToExcel(exportData, {
        start: trendData[0]?.date || "",
        end: trendData[trendData.length - 1]?.date || "",
      });
    } catch (error) {
      console.error("Export error:", error);
      alert("Export mislukt");
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            📈 Trend Analyse
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Werkuren en productiviteit trends over tijd
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(["week", "month", "quarter"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  selectedPeriod === period
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
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

          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            leftIcon={
              <ArrowPathIcon
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            }
            disabled={refreshing}
          >
            Vernieuwen
          </Button>

          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            leftIcon={<DocumentArrowDownIcon className="h-4 w-4" />}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
