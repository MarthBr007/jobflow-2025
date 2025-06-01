"use client";

import { useState, useEffect } from "react";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/Button";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Activity,
  Database,
  Download,
  RefreshCw,
  Filter,
  Eye,
  Target,
  Zap,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalProjects: number;
    completedShifts: number;
    averageUtilization: number;
    revenue: number;
    trends: {
      users: number;
      projects: number;
      shifts: number;
      revenue: number;
    };
  };
  workforce: {
    byType: Array<{ name: string; value: number; color: string }>;
    byRole: Array<{ name: string; value: number; percentage: number }>;
  };
  projects: {
    status: Array<{ name: string; value: number; color: string }>;
    timeline: Array<{
      month: string;
      started: number;
      completed: number;
      revenue: number;
    }>;
  };
  system: {
    performance: {
      avgResponseTime: number;
      uptime: number;
      errors: number;
      cacheHitRate: number;
    };
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    // Mock data for demonstration - replace with real API call
    const mockData: AnalyticsData = {
      overview: {
        totalUsers: 156,
        activeUsers: 89,
        totalProjects: 23,
        completedShifts: 342,
        averageUtilization: 78.5,
        revenue: 125000,
        trends: {
          users: 12.5,
          projects: 8.3,
          shifts: -2.1,
          revenue: 15.7,
        },
      },
      workforce: {
        byType: [
          { name: "Fulltime", value: 78, color: "#3b82f6" },
          { name: "Parttime", value: 45, color: "#10b981" },
          { name: "Freelance", value: 33, color: "#f59e0b" },
        ],
        byRole: [
          { name: "Developers", value: 45, percentage: 28.8 },
          { name: "Designers", value: 23, percentage: 14.7 },
          { name: "Managers", value: 12, percentage: 7.7 },
          { name: "Support", value: 76, percentage: 48.8 },
        ],
      },
      projects: {
        status: [
          { name: "Active", value: 15, color: "#10b981" },
          { name: "Planning", value: 5, color: "#f59e0b" },
          { name: "Completed", value: 3, color: "#6b7280" },
        ],
        timeline: [
          { month: "Jan", started: 8, completed: 5, revenue: 45000 },
          { month: "Feb", started: 12, completed: 8, revenue: 52000 },
          { month: "Mar", started: 6, completed: 10, revenue: 48000 },
          { month: "Apr", started: 9, completed: 7, revenue: 55000 },
        ],
      },
      system: {
        performance: {
          avgResponseTime: 245,
          uptime: 99.8,
          errors: 12,
          cacheHitRate: 87.3,
        },
      },
    };

    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 500);

    if (autoRefresh) {
      const interval = setInterval(() => {
        // Refresh data logic here
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedPeriod, autoRefresh]);

  const exportData = async (format: "pdf" | "excel") => {
    try {
      // Export functionality placeholder
      console.log(`Exporting data as ${format} for period ${selectedPeriod}`);
    } catch (error) {
      console.error("Failed to export data:", error);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive insights into your workforce and projects
          </p>
        </div>

        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-green-50 text-green-700" : ""}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`}
            />
            Auto Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportData("excel")}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Users"
          value={data.overview.totalUsers}
          trend={data.overview.trends.users}
          icon={Users}
          color="blue"
        />
        <KPICard
          title="Active Projects"
          value={data.overview.totalProjects}
          trend={data.overview.trends.projects}
          icon={Target}
          color="green"
        />
        <KPICard
          title="Completed Shifts"
          value={data.overview.completedShifts}
          trend={data.overview.trends.shifts}
          icon={CheckCircle}
          color="purple"
        />
        <KPICard
          title="Revenue"
          value={`€${(data.overview.revenue / 1000).toFixed(0)}k`}
          trend={data.overview.trends.revenue}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workforce">Workforce</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Workforce Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.workforce.byType.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.projects.status.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workforce" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.workforce.byRole.map((role, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{role.name}</span>
                      <span className="text-gray-600">
                        {role.value} ({role.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${role.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.projects.timeline.map((month, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{month.month}</span>
                      <div className="text-sm text-gray-600">
                        Started: {month.started} | Completed: {month.completed}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Revenue: €{(month.revenue / 1000).toFixed(0)}k
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Avg Response Time</p>
                    <p className="text-2xl font-bold">
                      {data.system.performance.avgResponseTime}ms
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Uptime</p>
                    <p className="text-2xl font-bold">
                      {data.system.performance.uptime}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Errors</p>
                    <p className="text-2xl font-bold">
                      {data.system.performance.errors}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Cache Hit Rate</p>
                    <p className="text-2xl font-bold">
                      {data.system.performance.cacheHitRate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string | number;
  trend: number;
  icon: React.ComponentType<any>;
  color: "blue" | "green" | "purple" | "orange";
}

function KPICard({ title, value, trend, icon: Icon, color }: KPICardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };

  const isPositive = trend > 0;

  return (
    <Card className={`border ${colorClasses[color]}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-75">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <div className="flex items-center mt-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span
                className={`text-sm ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {Math.abs(trend)}%
              </span>
            </div>
          </div>
          <Icon className="h-8 w-8 opacity-75" />
        </div>
      </CardContent>
    </Card>
  );
}
