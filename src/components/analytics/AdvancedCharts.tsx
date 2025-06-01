"use client";

import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from "chart.js";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Color schemes
const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#6366f1",
  purple: "#8b5cf6",
  pink: "#ec4899",
  teal: "#14b8a6",
  gray: "#6b7280",
  slate: "#64748b",
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.purple,
  COLORS.pink,
  COLORS.teal,
  COLORS.info,
  COLORS.danger,
];

interface ChartProps {
  data: any;
  title?: string;
  height?: number;
  className?: string;
}

// Revenue Chart Component
export function RevenueChart({
  data,
  title = "Revenue Overview",
  height = 300,
  className,
}: ChartProps) {
  const chartData: ChartData<"line"> = {
    labels: data?.labels || [],
    datasets: [
      {
        label: "Revenue (€)",
        data: data?.revenue || [],
        borderColor: COLORS.success,
        backgroundColor: `${COLORS.success}20`,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: COLORS.success,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
      },
      {
        label: "Target (€)",
        data: data?.target || [],
        borderColor: COLORS.primary,
        backgroundColor: "transparent",
        borderDash: [5, 5],
        pointRadius: 0,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: !!title,
        text: title,
        font: { size: 16, weight: "bold" },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: COLORS.primary,
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            return `${
              context.dataset.label
            }: €${context.parsed.y?.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `€${Number(value).toLocaleString()}`,
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border ${className}`}>
      <div style={{ height: height }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

// Workforce Distribution Chart
export function WorkforceChart({
  data,
  title = "Workforce Distribution",
  height = 300,
  className,
}: ChartProps) {
  const chartData: ChartData<"doughnut"> = {
    labels: data?.labels || [],
    datasets: [
      {
        data: data?.values || [],
        backgroundColor: CHART_COLORS,
        borderColor: "#fff",
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: !!title,
        text: title,
        font: { size: 16, weight: "bold" },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
    cutout: "60%",
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border ${className}`}>
      <div style={{ height: height }}>
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}

// Project Performance Chart
export function ProjectPerformanceChart({
  data,
  title = "Project Performance",
  height = 300,
  className,
}: ChartProps) {
  const chartData: ChartData<"bar"> = {
    labels: data?.labels || [],
    datasets: [
      {
        label: "Completed",
        data: data?.completed || [],
        backgroundColor: COLORS.success,
        borderRadius: 4,
      },
      {
        label: "In Progress",
        data: data?.inProgress || [],
        backgroundColor: COLORS.warning,
        borderRadius: 4,
      },
      {
        label: "Planned",
        data: data?.planned || [],
        backgroundColor: COLORS.info,
        borderRadius: 4,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: !!title,
        text: title,
        font: { size: 16, weight: "bold" },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border ${className}`}>
      <div style={{ height: height }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

// Time Tracking Chart
export function TimeTrackingChart({
  data,
  title = "Time Tracking",
  height = 300,
  className,
}: ChartProps) {
  const chartData: ChartData<"line"> = {
    labels: data?.labels || [],
    datasets: [
      {
        label: "Productive Hours",
        data: data?.productive || [],
        borderColor: COLORS.success,
        backgroundColor: `${COLORS.success}20`,
        fill: "+1",
        tension: 0.4,
      },
      {
        label: "Break Time",
        data: data?.breaks || [],
        borderColor: COLORS.warning,
        backgroundColor: `${COLORS.warning}20`,
        fill: "+1",
        tension: 0.4,
      },
      {
        label: "Overtime",
        data: data?.overtime || [],
        borderColor: COLORS.danger,
        backgroundColor: `${COLORS.danger}20`,
        fill: "origin",
        tension: 0.4,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: !!title,
        text: title,
        font: { size: 16, weight: "bold" },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        mode: "index",
        intersect: false,
        callbacks: {
          label: (context) => {
            const hours = Math.floor(context.parsed.y);
            const minutes = Math.round((context.parsed.y - hours) * 60);
            return `${context.dataset.label}: ${hours}h ${minutes}m`;
          },
        },
      },
    },
    scales: {
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: (value) => `${value}h`,
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border ${className}`}>
      <div style={{ height: height }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

// Performance Metrics Chart
export function PerformanceMetricsChart({
  data,
  title = "Performance Metrics",
  height = 300,
  className,
}: ChartProps) {
  const chartData: ChartData<"bar"> = {
    labels: data?.labels || [],
    datasets: [
      {
        label: "Efficiency %",
        data: data?.efficiency || [],
        backgroundColor: COLORS.primary,
        borderRadius: 4,
        yAxisID: "y",
      },
      {
        label: "Satisfaction %",
        data: data?.satisfaction || [],
        backgroundColor: COLORS.success,
        borderRadius: 4,
        yAxisID: "y",
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: !!title,
        text: title,
        font: { size: 16, weight: "bold" },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
        max: 100,
        ticks: {
          callback: (value) => `${value}%`,
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: (value) => `${value}`,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border ${className}`}>
      <div style={{ height: height }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

// Real-time chart update hook
export function useRealtimeCharts(refreshInterval: number = 30000) {
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        // Trigger chart data refresh
        window.dispatchEvent(new CustomEvent("refreshCharts"));
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval]);

  return {
    refreshCharts: () => window.dispatchEvent(new CustomEvent("refreshCharts")),
  };
}
