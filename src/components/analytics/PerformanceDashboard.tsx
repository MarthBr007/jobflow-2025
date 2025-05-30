"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import {
  getPerformanceAnalytics,
  getCoreWebVitalsScore,
} from "@/lib/performance";

interface PerformanceData {
  timestamp: number;
  lcp: number;
  fid: number;
  cls: number;
  loadTime: number;
  route: string;
}

interface MetricCard {
  name: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  trendValue: number;
  status: "good" | "warning" | "poor";
  threshold: { good: number; warning: number };
}

export default function PerformanceDashboard() {
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">(
    "24h"
  );
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [coreWebVitals, setCoreWebVitals] = useState<any>(null);
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
  }, [timeRange]);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      const endTime = Date.now();
      const startTime = endTime - getTimeRangeMs(timeRange);

      const analytics = getPerformanceAnalytics({
        start: startTime,
        end: endTime,
      });

      // Mock data for demonstration
      const mockData: PerformanceData[] = generateMockData(startTime, endTime);
      setPerformanceData(mockData);

      // Calculate Core Web Vitals
      const avgLCP =
        mockData.reduce((sum, d) => sum + d.lcp, 0) / mockData.length;
      const avgFID =
        mockData.reduce((sum, d) => sum + d.fid, 0) / mockData.length;
      const avgCLS =
        mockData.reduce((sum, d) => sum + d.cls, 0) / mockData.length;

      const vitalsScore = getCoreWebVitalsScore(avgLCP, avgFID, avgCLS);
      setCoreWebVitals(vitalsScore);

      // Generate metrics cards
      setMetrics([
        {
          name: "Page Load Time",
          value:
            mockData.reduce((sum, d) => sum + d.loadTime, 0) / mockData.length,
          unit: "ms",
          trend: "down",
          trendValue: 12,
          status: "good",
          threshold: { good: 3000, warning: 5000 },
        },
        {
          name: "Largest Contentful Paint",
          value: avgLCP,
          unit: "ms",
          trend: "up",
          trendValue: 8,
          status: avgLCP <= 2500 ? "good" : avgLCP <= 4000 ? "warning" : "poor",
          threshold: { good: 2500, warning: 4000 },
        },
        {
          name: "First Input Delay",
          value: avgFID,
          unit: "ms",
          trend: "stable",
          trendValue: 2,
          status: avgFID <= 100 ? "good" : avgFID <= 300 ? "warning" : "poor",
          threshold: { good: 100, warning: 300 },
        },
        {
          name: "Cumulative Layout Shift",
          value: avgCLS,
          unit: "",
          trend: "down",
          trendValue: 15,
          status: avgCLS <= 0.1 ? "good" : avgCLS <= 0.25 ? "warning" : "poor",
          threshold: { good: 0.1, warning: 0.25 },
        },
      ]);
    } catch (error) {
      console.error("Error loading performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeMs = (range: string): number => {
    switch (range) {
      case "1h":
        return 60 * 60 * 1000;
      case "24h":
        return 24 * 60 * 60 * 1000;
      case "7d":
        return 7 * 24 * 60 * 60 * 1000;
      case "30d":
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  };

  const generateMockData = (
    startTime: number,
    endTime: number
  ): PerformanceData[] => {
    const data: PerformanceData[] = [];
    const routes = ["/dashboard", "/schedule", "/chat", "/personnel"];

    for (let i = 0; i < 100; i++) {
      const timestamp = startTime + (endTime - startTime) * Math.random();
      data.push({
        timestamp,
        lcp: 2000 + Math.random() * 2000,
        fid: 50 + Math.random() * 150,
        cls: Math.random() * 0.3,
        loadTime: 1500 + Math.random() * 3000,
        route: routes[Math.floor(Math.random() * routes.length)],
      });
    }

    return data.sort((a, b) => a.timestamp - b.timestamp);
  };

  const formatValue = (value: number, unit: string): string => {
    if (unit === "ms") {
      return `${Math.round(value)}${unit}`;
    } else if (unit === "") {
      return value.toFixed(3);
    }
    return `${Math.round(value)}${unit}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "good":
        return "text-green-600 dark:text-green-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      case "poor":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusBgColor = (status: string): string => {
    switch (status) {
      case "good":
        return "bg-green-100 dark:bg-green-900/20";
      case "warning":
        return "bg-yellow-100 dark:bg-yellow-900/20";
      case "poor":
        return "bg-red-100 dark:bg-red-900/20";
      default:
        return "bg-gray-100 dark:bg-gray-900/20";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Performance Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor Core Web Vitals and application performance
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {["1h", "24h", "7d", "30d"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Core Web Vitals Score */}
      {coreWebVitals && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Core Web Vitals Score
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Overall performance grade based on key metrics
              </p>
            </div>
            <div className="text-right">
              <div
                className={`text-3xl font-bold ${getStatusColor(
                  coreWebVitals.grade.toLowerCase()
                )}`}
              >
                {coreWebVitals.score}
              </div>
              <div
                className={`text-sm font-medium ${getStatusColor(
                  coreWebVitals.grade.toLowerCase()
                )}`}
              >
                {coreWebVitals.grade.replace("_", " ")}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            {Object.entries(coreWebVitals.details).map(
              ([key, detail]: [string, any]) => (
                <div key={key} className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {key === "cls"
                      ? detail.value.toFixed(3)
                      : Math.round(detail.value)}
                    {key !== "cls" && "ms"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {key.toUpperCase()}
                  </div>
                  <div
                    className={`text-xs mt-1 ${getStatusColor(
                      detail.score >= 90
                        ? "good"
                        : detail.score >= 50
                        ? "warning"
                        : "poor"
                    )}`}
                  >
                    {detail.score >= 90
                      ? "Good"
                      : detail.score >= 50
                      ? "Needs Improvement"
                      : "Poor"}
                  </div>
                </div>
              )
            )}
          </div>
        </motion.div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${getStatusBgColor(
              metric.status
            )}`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`p-2 rounded-lg ${getStatusBgColor(metric.status)}`}
              >
                <ClockIcon
                  className={`h-6 w-6 ${getStatusColor(metric.status)}`}
                />
              </div>
              <div className="flex items-center space-x-1">
                {metric.trend === "up" ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />
                ) : metric.trend === "down" ? (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4" />
                )}
                <span
                  className={`text-xs ${
                    metric.trend === "up"
                      ? "text-red-500"
                      : metric.trend === "down"
                      ? "text-green-500"
                      : "text-gray-500"
                  }`}
                >
                  {metric.trendValue}%
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatValue(metric.value, metric.unit)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {metric.name}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  Good: &lt; {formatValue(metric.threshold.good, metric.unit)}
                </span>
                <span className={getStatusColor(metric.status)}>
                  {metric.status === "good"
                    ? "✓"
                    : metric.status === "warning"
                    ? "⚠"
                    : "✗"}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Performance Chart Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Performance Trends
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last {timeRange}
          </div>
        </div>

        {/* Simple chart visualization */}
        <div className="space-y-4">
          {["Page Load Time", "LCP", "FID", "CLS"].map((metricName, index) => (
            <div key={metricName} className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {metricName}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatValue(
                    metrics[index]?.value || 0,
                    metrics[index]?.unit || "ms"
                  )}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    metrics[index]?.status === "good"
                      ? "bg-green-500"
                      : metrics[index]?.status === "warning"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      ((metrics[index]?.value || 0) /
                        (metrics[index]?.threshold.warning || 100)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Route Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Route Performance
        </h3>

        <div className="space-y-4">
          {["/dashboard", "/schedule", "/chat", "/personnel"].map((route) => {
            const routeData = performanceData.filter((d) => d.route === route);
            const avgLoadTime =
              routeData.length > 0
                ? routeData.reduce((sum, d) => sum + d.loadTime, 0) /
                  routeData.length
                : 0;

            return (
              <div
                key={route}
                className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {route}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {routeData.length} requests
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {Math.round(avgLoadTime)}ms
                  </div>
                  <div
                    className={`text-sm ${
                      avgLoadTime <= 3000
                        ? "text-green-500"
                        : avgLoadTime <= 5000
                        ? "text-yellow-500"
                        : "text-red-500"
                    }`}
                  >
                    {avgLoadTime <= 3000
                      ? "Good"
                      : avgLoadTime <= 5000
                      ? "Fair"
                      : "Poor"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
