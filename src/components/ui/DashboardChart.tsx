import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

export type ChartType = "line" | "bar" | "doughnut";

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }>;
}

interface DashboardChartProps {
  type: ChartType;
  data: ChartData;
  title?: string;
  height?: number;
  options?: any;
  className?: string;
}

const DashboardChart: React.FC<DashboardChartProps> = ({
  type,
  data,
  title,
  height = 300,
  options = {},
  className = "",
}) => {
  // Default options for better appearance
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          color: "#6B7280", // gray-500
        },
      },
      title: {
        display: !!title,
        text: title,
        color: "#374151", // gray-700
        font: {
          size: 16,
          weight: "600",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#E5E7EB",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        mode: "index" as const,
        intersect: false,
      },
    },
    scales:
      type !== "doughnut"
        ? {
            x: {
              grid: {
                color: "rgba(0, 0, 0, 0.1)",
                drawOnChartArea: true,
              },
              ticks: {
                color: "#6B7280",
              },
            },
            y: {
              grid: {
                color: "rgba(0, 0, 0, 0.1)",
                drawOnChartArea: true,
              },
              ticks: {
                color: "#6B7280",
              },
              beginAtZero: true,
            },
          }
        : {},
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
    ...options,
  };

  const renderChart = () => {
    switch (type) {
      case "line":
        return <Line data={data} options={defaultOptions} />;
      case "bar":
        return <Bar data={data} options={defaultOptions} />;
      case "doughnut":
        return <Doughnut data={data} options={defaultOptions} />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      <div style={{ height: `${height}px` }}>{renderChart()}</div>
    </div>
  );
};

// Predefined chart configurations for common use cases
export const TimeTrackingChart = ({
  data,
  title = "Uren per Week",
}: {
  data: ChartData;
  title?: string;
}) => (
  <DashboardChart
    type="line"
    data={{
      ...data,
      datasets: data.datasets.map((dataset) => ({
        ...dataset,
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      })),
    }}
    title={title}
    options={{
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Uren",
          },
        },
      },
    }}
  />
);

export const ProjectStatusChart = ({
  data,
  title = "Project Status",
}: {
  data: ChartData;
  title?: string;
}) => (
  <DashboardChart
    type="doughnut"
    data={{
      ...data,
      datasets: data.datasets.map((dataset) => ({
        ...dataset,
        backgroundColor: [
          "#10B981", // green-500 - Completed
          "#3B82F6", // blue-500 - Active
          "#F59E0B", // amber-500 - Pending
          "#EF4444", // red-500 - Cancelled
        ],
        borderWidth: 0,
      })),
    }}
    title={title}
    height={250}
    options={{
      cutout: "60%",
      plugins: {
        legend: {
          position: "right" as const,
        },
      },
    }}
  />
);

export const TeamProductivityChart = ({
  data,
  title = "Team Productiviteit",
}: {
  data: ChartData;
  title?: string;
}) => (
  <DashboardChart
    type="bar"
    data={{
      ...data,
      datasets: data.datasets.map((dataset) => ({
        ...dataset,
        backgroundColor: "rgba(99, 102, 241, 0.8)",
        borderColor: "rgb(99, 102, 241)",
        borderWidth: 1,
      })),
    }}
    title={title}
    options={{
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Uren",
          },
        },
        x: {
          title: {
            display: true,
            text: "Team Leden",
          },
        },
      },
    }}
  />
);

export default DashboardChart;
