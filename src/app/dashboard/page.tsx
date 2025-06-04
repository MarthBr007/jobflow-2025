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
  ExclamationTriangleIcon,
  EyeIcon,
  ComputerDesktopIcon,
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
import ContractViewer from "@/components/ui/ContractViewer";
import ActivityFeed, { ActivityItem } from "@/components/ui/ActivityFeed";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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

  // New contract state for widget
  const [contractInfo, setContractInfo] = useState<{
    hasContract: boolean;
    contractStatus?: string;
    latestContract?: {
      id: string;
      title: string;
      status: string;
      signedDate?: string;
      endDate?: string;
    };
  } | null>(null);
  const [showContractViewer, setShowContractViewer] = useState(false);

  // Sample activities for the enhanced feed
  const sampleActivities: ActivityItem[] = [
    {
      id: "1",
      type: "schedule",
      action: "heeft het rooster bijgewerkt voor",
      target: "Week 6, 2025",
      user: { name: "Manager", role: "MANAGER" },
      description: "Nieuwe werknemers toegevoegd en tijden aangepast",
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      priority: "medium",
      metadata: { changes: 3, affected_employees: 5 },
    },
    {
      id: "2",
      type: "contract",
      action: "heeft een nieuw contract ondertekend",
      user: {
        name: session?.user?.name || "Medewerker",
        role: session?.user?.role || "EMPLOYEE",
      },
      description: "Arbeidsovereenkomst voor onbepaalde tijd geactiveerd",
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      priority: "high",
    },
    {
      id: "3",
      type: "success",
      action: "heeft zich ingeklokt om",
      target: "09:00",
      user: { name: "Quincy Bakker", role: "EMPLOYEE" },
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      metadata: { location: "Hoofdkantoor" },
    },
    {
      id: "4",
      type: "project",
      action: "heeft project voltooid:",
      target: "Website Redesign Q1",
      user: { name: "Sarah de Vries", role: "FREELANCER" },
      description: "Alle deliverables zijn opgeleverd en goedgekeurd",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      priority: "high",
    },
  ];

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
      // Fetch contract info for employees/freelancers
      if (
        session.user.role === "EMPLOYEE" ||
        session.user.role === "FREELANCER"
      ) {
        fetchContractInfo();
      }
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

  const fetchContractInfo = async () => {
    try {
      const response = await fetch("/api/contracts");
      if (response.ok) {
        const contracts = await response.json();
        if (contracts.length > 0) {
          // Get the most recent contract
          const latest = contracts.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];

          setContractInfo({
            hasContract: true,
            contractStatus: latest.status,
            latestContract: {
              id: latest.id,
              title: latest.title,
              status: latest.status,
              signedDate: latest.signedDate,
              endDate: latest.endDate,
            },
          });
        } else {
          setContractInfo({
            hasContract: false,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching contract info:", error);
      setContractInfo({
        hasContract: false,
      });
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
      <LoadingSpinner
        size="xl"
        variant="dots"
        message="Dashboard laden..."
        description="We bereiden je persoonlijke overzicht voor"
        overlay={true}
      />
    );
  }

  if (!session) {
    return <div className="p-8">Niet ingelogd</div>;
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: "Dashboard" }]} className="mb-6" />

      {/* Modern Header with Gradient */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700">
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 px-6 py-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <ChartBarIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Welkom terug, {session.user.name} - Overzicht van je werk en
                  activiteiten
                </p>
              </div>
            </div>

            {/* Enhanced Time Display */}
            <div className="flex items-center space-x-4">
              <div className="text-center lg:text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {format(currentTime, "EEEE d MMMM yyyy", { locale: nl })}
                </div>
                <div className="text-xl font-mono font-bold text-gray-900 dark:text-white bg-white/70 dark:bg-gray-700/70 px-3 py-1 rounded-lg shadow-sm">
                  {formatTime(currentTime)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Stats Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700/50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6 text-gray-600 dark:text-gray-400">
              <span className="flex items-center space-x-2 font-medium">
                <div className="h-2.5 w-2.5 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-sm"></div>
                <span>
                  Status:{" "}
                  <strong className="text-gray-900 dark:text-white">
                    Actief
                  </strong>
                </span>
              </span>
              <span className="flex items-center space-x-2 font-medium">
                <div className="h-2.5 w-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-sm"></div>
                <span>
                  Rol:{" "}
                  <strong className="text-gray-900 dark:text-white">
                    {session.user.role}
                  </strong>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatsForRole().map((item, index) => (
          <div key={item.name} className="h-full">
            <MetricCard
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
                  : item.name.includes("Shift") || item.name.includes("Dienst")
                  ? "Geplande diensten"
                  : undefined
              }
              className="h-full"
            />
          </div>
        ))}
      </div>

      {/* Contract Status Widget - Only for employees/freelancers */}
      {session.user.role !== "ADMIN" &&
        session.user.role !== "MANAGER" &&
        contractInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                Mijn Contract
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Huidige contract status en details
              </p>
            </div>
            <div className="p-4 sm:p-6">
              {contractInfo.hasContract && contractInfo.latestContract ? (
                <div className="space-y-4">
                  {/* Contract Status - Mobile Optimized */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      {contractInfo.latestContract.status === "ACTIVE" ? (
                        <CheckCircleIcon className="h-8 w-8 text-green-500 flex-shrink-0" />
                      ) : contractInfo.latestContract.status ===
                        "PENDING_SIGNATURE" ? (
                        <ClockIcon className="h-8 w-8 text-amber-500 flex-shrink-0" />
                      ) : (
                        <ExclamationTriangleIcon className="h-8 w-8 text-red-500 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                          {contractInfo.latestContract.status === "ACTIVE"
                            ? "Actief Contract"
                            : contractInfo.latestContract.status ===
                              "PENDING_SIGNATURE"
                            ? "Wacht op Ondertekening"
                            : "Contract Actie Vereist"}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {contractInfo.latestContract.title}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<EyeIcon className="h-4 w-4" />}
                      onClick={() => setShowContractViewer(true)}
                      className="w-full sm:w-auto touch-manipulation min-h-[48px] sm:min-h-[auto]"
                    >
                      Bekijken
                    </Button>
                  </div>

                  {/* Contract Details - Mobile Stacked */}
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {contractInfo.latestContract.signedDate && (
                      <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                        <div className="flex items-center space-x-2">
                          <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-green-900 dark:text-green-100">
                            Ondertekend op
                          </span>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          {new Date(
                            contractInfo.latestContract.signedDate
                          ).toLocaleDateString("nl-NL")}
                        </p>
                      </div>
                    )}

                    {contractInfo.latestContract.endDate && (
                      <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Geldig tot
                          </span>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          {new Date(
                            contractInfo.latestContract.endDate
                          ).toLocaleDateString("nl-NL")}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action needed notification - Mobile Enhanced */}
                  {contractInfo.latestContract.status ===
                    "PENDING_SIGNATURE" && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                      <div className="flex items-start space-x-3">
                        <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="text-sm font-medium text-amber-900 dark:text-amber-100">
                            Ondertekening Vereist
                          </h5>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            Je contract wacht nog op ondertekening. Klik op
                            "Bekijken" om het contract te ondertekenen.
                          </p>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setShowContractViewer(true)}
                            className="mt-3 w-full sm:w-auto touch-manipulation min-h-[44px]"
                          >
                            Contract Ondertekenen
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* No contract state - Mobile Enhanced */
                <div className="text-center py-6 sm:py-8">
                  <ExclamationTriangleIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Geen Contract Gevonden
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 px-4">
                    Er is nog geen actief contract voor jouw account.
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 px-4">
                    Neem contact op met HR voor meer informatie.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

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

      {/* Enhanced Admin/Manager Dashboard */}
      {(session.user.role === "ADMIN" || session.user.role === "MANAGER") && (
        <div className="overflow-hidden bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-900/20 dark:via-blue-900/20 dark:to-cyan-900/20 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md">
                <Cog6ToothIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Beheer Overzicht
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Snelle toegang tot belangrijke beheer functies en
                  systeembeheer
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-indigo-50/30 dark:bg-indigo-900/10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/dashboard/personnel")}
                className="group relative cursor-pointer h-full"
              >
                <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-500 h-full flex flex-col min-h-[160px]">
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <UserGroupIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-blue-500 dark:text-blue-400 opacity-20 group-hover:opacity-40 transition-opacity">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Personeel
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        Beheer medewerkers en freelancers, contracten en
                        personeelsinformatie
                      </p>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">
                        {dashboardStats.totalPersonnel} personen
                      </span>
                      <span className="text-blue-500 dark:text-blue-400 font-semibold">
                        Beheren →
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/dashboard/work-types")}
                className="group relative cursor-pointer h-full"
              >
                <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-500 h-full flex flex-col min-h-[160px]">
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <WrenchScrewdriverIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-purple-500 dark:text-purple-400 opacity-20 group-hover:opacity-40 transition-opacity">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        Werkzaamheden
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        Beheer types werkzaamheden, vaardigheden en
                        specialisaties
                      </p>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Werk types</span>
                      <span className="text-purple-500 dark:text-purple-400 font-semibold">
                        Beheren →
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/dashboard/schedule")}
                className="group relative cursor-pointer h-full"
              >
                <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 hover:border-green-300 dark:hover:border-green-500 h-full flex flex-col min-h-[160px]">
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <CalendarIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-green-500 dark:text-green-400 opacity-20 group-hover:opacity-40 transition-opacity">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        Rooster
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        Plan en beheer werkdiensten, shifts en roostertemplates
                      </p>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">
                        {dashboardStats.scheduledShifts} diensten
                      </span>
                      <span className="text-green-500 dark:text-green-400 font-semibold">
                        Plannen →
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/dashboard/projects")}
                className="group relative cursor-pointer h-full"
              >
                <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 hover:border-orange-300 dark:hover:border-orange-500 h-full flex flex-col min-h-[160px]">
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-orange-500 dark:text-orange-400 opacity-20 group-hover:opacity-40 transition-opacity">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        Projecten
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        Beheer klussen en opdrachten, deadlines en voortgang
                      </p>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">
                        {dashboardStats.activeProjects} actief
                      </span>
                      <span className="text-orange-500 dark:text-orange-400 font-semibold">
                        Beheren →
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/dashboard/availability")}
                className="group relative cursor-pointer h-full"
              >
                <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 hover:border-cyan-300 dark:hover:border-cyan-500 h-full flex flex-col min-h-[160px]">
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <ChartBarIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-cyan-500 dark:text-cyan-400 opacity-20 group-hover:opacity-40 transition-opacity">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        Beschikbaarheid
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        Overzicht personeel planning en beschikbaarheid beheer
                      </p>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Planning</span>
                      <span className="text-cyan-500 dark:text-cyan-400 font-semibold">
                        Bekijken →
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/dashboard/kiosk")}
                className="group relative cursor-pointer h-full"
              >
                <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-500 h-full flex flex-col min-h-[160px]">
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <ComputerDesktopIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-indigo-500 dark:text-indigo-400 opacity-20 group-hover:opacity-40 transition-opacity">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        Kiosk Dashboard
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        Inklok systeem voor medewerkers en real-time status
                      </p>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Kiosk modus</span>
                      <span className="text-indigo-500 dark:text-indigo-400 font-semibold">
                        Openen →
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Employee/Freelancer Quick Actions */}
      {session.user.role !== "ADMIN" && session.user.role !== "MANAGER" && (
        <div className="overflow-hidden bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Snelle Acties
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Veelgebruikte functies binnen handbereik voor jouw werkdag
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-green-50/30 dark:bg-green-900/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Button
                onClick={() => router.push("/dashboard/projects")}
                variant="outline"
                size="lg"
                leftIcon={<ClipboardDocumentListIcon className="w-5 h-5" />}
                className="h-20 flex-col space-y-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300 group"
              >
                <span className="font-bold text-base text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Mijn Projecten
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Bekijk toegewezen klussen
                </span>
              </Button>

              <Button
                onClick={() => router.push("/dashboard/availability")}
                variant="outline"
                size="lg"
                leftIcon={<CalendarIcon className="w-5 h-5" />}
                className="h-20 flex-col space-y-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-500 hover:shadow-lg transition-all duration-300 group"
              >
                <span className="font-bold text-base text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  Beschikbaarheid
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Stel je beschikbaarheid in
                </span>
              </Button>

              <Button
                onClick={() => router.push("/dashboard/schedule")}
                variant="outline"
                size="lg"
                leftIcon={<ClockIcon className="w-5 h-5" />}
                className="h-20 flex-col space-y-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-lg transition-all duration-300 group"
              >
                <span className="font-bold text-base text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Mijn Rooster
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Bekijk geplande diensten
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Activity Feed */}
      <ActivityFeed
        activities={sampleActivities}
        title="🚀 Live Activiteit"
        showTimestamps={true}
        showAvatars={true}
        maxItems={6}
        loading={false}
        onItemClick={(activity) => {
          // Handle activity click - could navigate to relevant page
          if (activity.link) {
            router.push(activity.link);
          }
        }}
        className="shadow-sm"
        compact={false}
        realTime={true}
      />

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

      {/* Contract Viewer Modal - Only for employees/freelancers */}
      {session.user.role !== "ADMIN" &&
        session.user.role !== "MANAGER" &&
        contractInfo && (
          <ContractViewer
            isOpen={showContractViewer}
            onClose={() => setShowContractViewer(false)}
            userId={session.user.id}
            userName={session.user.name || ""}
            viewMode="employee"
          />
        )}
    </div>
  );
}
