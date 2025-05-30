"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  CheckIcon,
  XMarkIcon,
  PlayIcon,
  StopIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import MetricCard from "@/components/ui/MetricCard";
import Tooltip from "@/components/ui/Tooltip";
import SpeedDial from "@/components/ui/SpeedDial";
import Timeline from "@/components/ui/Timeline";

interface TimeEntry {
  id: string;
  startTime: string;
  endTime?: string;
  project?: string;
  description?: string;
}

interface ClockState {
  isClocked: boolean;
  currentEntry?: TimeEntry;
  todayHours: number;
  weekHours: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workingToday, setWorkingToday] = useState<any[]>([]);
  const [pendingTimeEntries, setPendingTimeEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    activeProjects: 0,
    totalPersonnel: 0,
    weekHours: 0,
    myProjects: 0,
    availableProjects: 0,
    scheduledShifts: 0,
  });
  const [clockState, setClockState] = useState<ClockState>({
    isClocked: false,
    todayHours: 0,
    weekHours: 0,
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedProject, setSelectedProject] = useState("");
  const [description, setDescription] = useState("");
  const [assignedProjects, setAssignedProjects] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isWarehouse, setIsWarehouse] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard statistics
  useEffect(() => {
    if (session?.user) {
      fetchDashboardStats();
    }
  }, [session]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  // Fetch assigned projects
  useEffect(() => {
    if (session?.user) {
      fetch("/api/projects/assigned")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setAssignedProjects(data);
          } else if (data.error) {
            console.error("Error fetching projects:", data.error);
            setAssignedProjects([]);
          } else {
            setAssignedProjects([]);
          }
        })
        .catch((error) => {
          console.error("Error fetching assigned projects:", error);
          setAssignedProjects([]);
        });
    }
  }, [session]);

  // Format time as HH:MM:SS
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Calculate duration since clock in
  const calculateDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      // Fetch clock state and time entries
      fetch("/api/time-entries/current")
        .then((res) => res.json())
        .then((data) => {
          setClockState(data);
        })
        .catch((error) => {
          console.error("Error fetching clock state:", error);
        });
    }
  }, [session]);

  const handleClockInOut = async () => {
    if (!clockState.isClocked && !isWarehouse && !selectedProject) {
      alert("Selecteer een project of warehouse");
      return;
    }

    try {
      setLoading(true);
      const endpoint = clockState.isClocked
        ? "/api/time-entries/clock-out"
        : "/api/time-entries/clock-in";
      const body = clockState.isClocked
        ? {}
        : {
            projectId: isWarehouse ? "warehouse" : selectedProject,
            description: description || "Geen beschrijving",
            isWarehouse,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setClockState(data);
        if (!clockState.isClocked) {
          setSelectedProject("");
          setDescription("");
          setIsWarehouse(false);
        }
        // Show success message
        alert(
          clockState.isClocked
            ? "Je bent succesvol uitgeklokt"
            : "Je bent succesvol ingeklokt"
        );
      } else {
        // Show error message from server
        alert(data.error || "Er is iets misgegaan");
      }
    } catch (error) {
      console.error("Error during clock in/out:", error);
      alert("Er is iets misgegaan bij het in-/uitklokken");
    } finally {
      setLoading(false);
    }
  };

  // Get stats based on user role
  const getStatsForRole = () => {
    const isAdminOrManager =
      session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";

    if (isAdminOrManager) {
      return [
        {
          name: "Actieve Projecten",
          value: dashboardStats.activeProjects.toString(),
          icon: ClipboardDocumentListIcon,
          color: "bg-blue-500",
          change: "+2 deze week",
          changeType: "increase",
          description: "Projecten in uitvoering",
        },
        {
          name: "Totaal Personeel",
          value: dashboardStats.totalPersonnel.toString(),
          icon: UserGroupIcon,
          color: "bg-green-500",
          change: "+1 deze maand",
          changeType: "increase",
          description: "Geregistreerde medewerkers",
        },
        {
          name: "Uren Deze Week",
          value: dashboardStats.weekHours.toString(),
          icon: ClockIcon,
          color: "bg-purple-500",
          change: "+12%",
          changeType: "increase",
          description: "Totaal gewerkte uren",
        },
        {
          name: "Geplande Diensten",
          value: dashboardStats.scheduledShifts.toString(),
          icon: CalendarIcon,
          color: "bg-orange-500",
          change: "Deze week",
          changeType: "neutral",
          description: "Ingeplande werkdiensten",
        },
      ];
    } else {
      // Employee/Freelancer stats
      return [
        {
          name: "Mijn Projecten",
          value: dashboardStats.myProjects.toString(),
          icon: BriefcaseIcon,
          color: "bg-blue-500",
          change: "Actief",
          changeType: "neutral",
          description: "Toegewezen projecten",
        },
        {
          name: "Beschikbare Klussen",
          value: dashboardStats.availableProjects.toString(),
          icon: ClipboardDocumentListIcon,
          color: "bg-green-500",
          change: "Nieuw",
          changeType: "increase",
          description: "Openstaande projecten",
        },
        {
          name: "Uren Deze Week",
          value: clockState.weekHours.toString(),
          icon: ClockIcon,
          color: "bg-purple-500",
          change: "+5.2h vandaag",
          changeType: "increase",
          description: "Jouw gewerkte uren",
        },
        {
          name: "Beschikbaarheid",
          value: "✓",
          icon: CheckCircleIcon,
          color: "bg-orange-500",
          change: "Beschikbaar",
          changeType: "neutral",
          description: "Huidige status",
        },
      ];
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xl"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return <div className="p-8">Niet ingelogd</div>;
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: "Dashboard" }]} className="mb-1 sm:mb-4" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Welkom terug, {session.user.name}
          </p>
        </div>
        <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4">
          <div className="text-right">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {format(currentTime, "EEEE d MMMM yyyy", { locale: nl })}
            </div>
            <div className="text-lg sm:text-xl font-mono font-semibold text-gray-900 dark:text-white">
              {formatTime(currentTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-2.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {getStatsForRole().map((item, index) => (
          <MetricCard
            key={item.name}
            title={item.name}
            value={item.value}
            icon={<item.icon className="w-8 h-8" />}
            color={
              item.name.includes("Uren") || item.name.includes("Time")
                ? "green"
                : item.name.includes("Projects") ||
                  item.name.includes("Projecten")
                ? "blue"
                : item.name.includes("Shift") || item.name.includes("Dienst")
                ? "purple"
                : item.name.includes("Active") || item.name.includes("Actief")
                ? "orange"
                : "gray"
            }
            trend={
              index % 2 === 0
                ? {
                    value: Math.floor(Math.random() * 20) + 5,
                    isPositive: Math.random() > 0.5,
                    label: "vs vorige week",
                  }
                : undefined
            }
            status={
              (item.name.includes("Uren") && parseFloat(item.value) > 40) ||
              (item.name.includes("Time") && parseFloat(item.value) > 40)
                ? "warning"
                : "normal"
            }
            subtitle={
              item.name.includes("Uren")
                ? "Deze week"
                : item.name.includes("Time")
                ? "This week"
                : item.name.includes("Projects") ||
                  item.name.includes("Projecten")
                ? "Actieve projecten"
                : undefined
            }
          />
        ))}
      </div>

      {/* Clock In/Out Section - Only for employees/freelancers */}
      {session.user.role !== "ADMIN" && session.user.role !== "MANAGER" && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
              Tijd Registratie
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Klok in en uit voor je werkdag
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col items-center space-y-4 sm:space-y-6">
              <div className="text-center">
                <div className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white font-mono mb-2">
                  {formatTime(currentTime)}
                </div>
                {clockState.isClocked && clockState.currentEntry && (
                  <div className="text-sm sm:text-lg text-gray-600 dark:text-gray-300">
                    Aan het werk sinds:{" "}
                    {calculateDuration(clockState.currentEntry.startTime)}
                  </div>
                )}
              </div>

              {!clockState.isClocked && (
                <div className="w-full max-w-md space-y-3 sm:space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 sm:p-4">
                    <label className="flex items-center space-x-3 touch-manipulation">
                      <input
                        type="checkbox"
                        checked={isWarehouse}
                        onChange={(e) => {
                          setIsWarehouse(e.target.checked);
                          if (e.target.checked) {
                            setSelectedProject("");
                          }
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 touch-manipulation flex-shrink-0"
                      />
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Warehouse Werk
                        </span>
                      </div>
                    </label>
                  </div>

                  {!isWarehouse && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Selecteer Project
                      </label>
                      <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="w-full px-3 sm:px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-manipulation"
                        style={{ fontSize: "16px" }} // Prevent iOS zoom
                        disabled={isWarehouse}
                      >
                        <option value="">Kies een project...</option>
                        {assignedProjects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={handleClockInOut}
                disabled={loading}
                loading={loading}
                variant={clockState.isClocked ? "destructive" : "primary"}
                size="lg"
                leftIcon={
                  clockState.isClocked ? (
                    <StopIcon className="w-5 h-5" />
                  ) : (
                    <PlayIcon className="w-5 h-5" />
                  )
                }
                className="w-full max-w-md touch-manipulation min-h-[52px] rounded-xl shadow-lg"
              >
                {clockState.isClocked ? "Uitklokken" : "Inklokken"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin/Manager Dashboard */}
      {(session.user.role === "ADMIN" || session.user.role === "MANAGER") && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
              Beheer Overzicht
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Snelle toegang tot belangrijke beheer functies
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/dashboard/personnel")}
                className="group relative cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-blue-100 dark:hover:shadow-blue-900/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-shrink-0">
                      <div className="bg-blue-500 rounded-lg p-2.5">
                        <UserGroupIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-blue-500 dark:text-blue-400 opacity-20 group-hover:opacity-40 transition-opacity">
                      <svg
                        className="w-8 h-8"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                    Personeel
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Beheer medewerkers en freelancers
                  </p>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-indigo-600/0 group-hover:from-blue-600/5 group-hover:to-indigo-600/5 transition-all duration-300"></div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/dashboard/work-types")}
                className="group relative cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-purple-100 dark:hover:shadow-purple-900/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-shrink-0">
                      <div className="bg-purple-500 rounded-lg p-2.5">
                        <WrenchScrewdriverIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-purple-500 dark:text-purple-400 opacity-20 group-hover:opacity-40 transition-opacity">
                      <svg
                        className="w-8 h-8"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                    Werkzaamheden
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Beheer types werkzaamheden
                  </p>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/5 group-hover:to-pink-600/5 transition-all duration-300"></div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/dashboard/schedule")}
                className="group relative cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-green-100 dark:hover:shadow-green-900/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-shrink-0">
                      <div className="bg-green-500 rounded-lg p-2.5">
                        <CalendarIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-green-500 dark:text-green-400 opacity-20 group-hover:opacity-40 transition-opacity">
                      <svg
                        className="w-8 h-8"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                    Rooster
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Plan en beheer werkdiensten
                  </p>
                  <div className="absolute inset-0 bg-gradient-to-br from-green-600/0 to-emerald-600/0 group-hover:from-green-600/5 group-hover:to-emerald-600/5 transition-all duration-300"></div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/dashboard/projects")}
                className="group relative cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-700/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-orange-100 dark:hover:shadow-orange-900/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-shrink-0">
                      <div className="bg-orange-500 rounded-lg p-2.5">
                        <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-orange-500 dark:text-orange-400 opacity-20 group-hover:opacity-40 transition-opacity">
                      <svg
                        className="w-8 h-8"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                    Projecten
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Beheer klussen en opdrachten
                  </p>
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-600/0 to-red-600/0 group-hover:from-orange-600/5 group-hover:to-red-600/5 transition-all duration-300"></div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/dashboard/availability")}
                className="group relative cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-700/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-100 dark:hover:shadow-cyan-900/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-shrink-0">
                      <div className="bg-cyan-500 rounded-lg p-2.5">
                        <ChartBarIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-cyan-500 dark:text-cyan-400 opacity-20 group-hover:opacity-40 transition-opacity">
                      <svg
                        className="w-8 h-8"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                    Beschikbaarheid
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Overzicht personeel planning
                  </p>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/0 to-blue-600/0 group-hover:from-cyan-600/5 group-hover:to-blue-600/5 transition-all duration-300"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Employee/Freelancer Quick Actions */}
      {session.user.role !== "ADMIN" && session.user.role !== "MANAGER" && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
              Snelle Acties
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Veelgebruikte functies binnen handbereik
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-2.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Button
                onClick={() => router.push("/dashboard/projects")}
                variant="outline"
                size="lg"
                leftIcon={<ClipboardDocumentListIcon className="w-5 h-5" />}
                className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 touch-manipulation rounded-xl"
              >
                <span className="font-medium text-sm sm:text-base">
                  Mijn Projecten
                </span>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Bekijk toegewezen klussen
                </span>
              </Button>

              <Button
                onClick={() => router.push("/dashboard/availability")}
                variant="outline"
                size="lg"
                leftIcon={<CalendarIcon className="w-5 h-5" />}
                className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 touch-manipulation rounded-xl"
              >
                <span className="font-medium text-sm sm:text-base">
                  Beschikbaarheid
                </span>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Stel je beschikbaarheid in
                </span>
              </Button>

              <Button
                onClick={() => router.push("/dashboard/schedule")}
                variant="outline"
                size="lg"
                leftIcon={<ClockIcon className="w-5 h-5" />}
                className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 touch-manipulation rounded-xl"
              >
                <span className="font-medium text-sm sm:text-base">
                  Mijn Rooster
                </span>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Bekijk geplande diensten
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
            Recente Activiteit
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Laatste updates en wijzigingen in het systeem
          </p>
        </div>
        <div className="p-4 sm:p-6">
          <div className="space-y-2.5 sm:space-y-4">
            <AnimatePresence>
              {session.user.role === "ADMIN" ||
              session.user.role === "MANAGER" ? (
                // Admin/Manager activities
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl touch-manipulation"
                  >
                    <div className="flex-shrink-0">
                      <div className="bg-blue-100 dark:bg-blue-900/20 rounded-xl p-2">
                        <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                        Nieuwe diensten ingepland
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        3 diensten toegevoegd voor deze week
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl touch-manipulation"
                  >
                    <div className="flex-shrink-0">
                      <div className="bg-green-100 dark:bg-green-900/20 rounded-xl p-2">
                        <ClipboardDocumentListIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                        Project status bijgewerkt
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        2 projecten gemarkeerd als voltooid
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl touch-manipulation"
                  >
                    <div className="flex-shrink-0">
                      <div className="bg-purple-100 dark:bg-purple-900/20 rounded-xl p-2">
                        <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                        Beschikbaarheid bijgewerkt
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        5 medewerkers hebben hun planning aangepast
                      </p>
                    </div>
                  </motion.div>
                </>
              ) : (
                // Employee/Freelancer activities
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                  >
                    <div className="flex-shrink-0">
                      <div className="bg-blue-100 dark:bg-blue-900/20 rounded-xl p-2">
                        <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Tijdsregistratie bijgewerkt
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {clockState.isClocked
                          ? "Momenteel ingeklokt"
                          : "Laatste sessie: 8.5 uur"}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                  >
                    <div className="flex-shrink-0">
                      <div className="bg-green-100 dark:bg-green-900/20 rounded-xl p-2">
                        <ClipboardDocumentListIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Nieuwe projecten beschikbaar
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {dashboardStats.availableProjects} nieuwe klussen om
                        interesse voor te tonen
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                  >
                    <div className="flex-shrink-0">
                      <div className="bg-orange-100 dark:bg-orange-900/20 rounded-xl p-2">
                        <CalendarIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Beschikbaarheid ingesteld
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Planning bijgewerkt voor komende week
                      </p>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Speed Dial for Quick Actions */}
      {session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER" ? (
        <SpeedDial
          actions={[
            {
              id: "schedule",
              label: "Rooster Beheer",
              icon: <CalendarIcon className="w-5 h-5" />,
              onClick: () => router.push("/dashboard/schedule"),
              color: "bg-blue-600 hover:bg-blue-700 text-white",
            },
            {
              id: "personnel",
              label: "Personeel",
              icon: <UserGroupIcon className="w-5 h-5" />,
              onClick: () => router.push("/dashboard/personnel"),
              color: "bg-green-600 hover:bg-green-700 text-white",
            },
            {
              id: "projects",
              label: "Projecten",
              icon: <BriefcaseIcon className="w-5 h-5" />,
              onClick: () => router.push("/dashboard/projects"),
              color: "bg-purple-600 hover:bg-purple-700 text-white",
            },
            {
              id: "reports",
              label: "Tijd Goedkeuring",
              icon: <DocumentTextIcon className="w-5 h-5" />,
              onClick: () => router.push("/dashboard/time-approval"),
              color: "bg-orange-600 hover:bg-orange-700 text-white",
            },
          ]}
          direction="up"
          size="md"
        />
      ) : (
        <SpeedDial
          actions={[
            {
              id: "time-tracking",
              label: "Tijd Registratie",
              icon: <ClockIcon className="w-5 h-5" />,
              onClick: () => router.push("/dashboard/time-tracking"),
              color: "bg-blue-600 hover:bg-blue-700 text-white",
            },
            {
              id: "my-schedule",
              label: "Mijn Rooster",
              icon: <CalendarIcon className="w-5 h-5" />,
              onClick: () => router.push("/dashboard/schedule"),
              color: "bg-green-600 hover:bg-green-700 text-white",
            },
            {
              id: "leave-request",
              label: "Verlof Aanvragen",
              icon: <DocumentTextIcon className="w-5 h-5" />,
              onClick: () => router.push("/dashboard/leave-requests"),
              color: "bg-purple-600 hover:bg-purple-700 text-white",
            },
            {
              id: "colleagues",
              label: "Collega's",
              icon: <UserGroupIcon className="w-5 h-5" />,
              onClick: () => router.push("/dashboard/colleagues"),
              color: "bg-orange-600 hover:bg-orange-700 text-white",
            },
          ]}
          direction="up"
          size="md"
        />
      )}

      {/* User Actions */}
      <div className="flex items-center space-x-4">
        <Tooltip content="Bekijk en bewerk je profiel" placement="bottom">
          <Button
            onClick={() => router.push("/dashboard/settings")}
            variant="outline"
            size="sm"
            leftIcon={<Cog6ToothIcon className="h-4 w-4" />}
            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          >
            Instellingen
          </Button>
        </Tooltip>

        {(session?.user?.role === "ADMIN" ||
          session?.user?.role === "MANAGER") && (
          <Tooltip
            content="Bekijk systeem status en analytics"
            placement="bottom"
          >
            <Button
              onClick={() => router.push("/dashboard/admin/system-settings")}
              variant="secondary"
              size="sm"
              leftIcon={<ChartBarIcon className="h-4 w-4" />}
            >
              Systeem
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
