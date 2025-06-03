"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  PlusIcon,
  ClockIcon,
  UserIcon,
  BriefcaseIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  PrinterIcon,
  EnvelopeIcon,
  ChartBarIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  ListBulletIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowPathIcon,
  PauseIcon,
  PlayIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { format, addDays, subDays } from "date-fns";
import { nl } from "date-fns/locale";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Input from "@/components/ui/Input";
import WeekView from "@/components/schedule/WeekView";
import ScheduleAnalytics from "@/components/schedule/ScheduleAnalytics";
import ScheduleTemplates from "@/components/schedule/ScheduleTemplates";
import Tooltip from "@/components/ui/Tooltip";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import SpeedDial from "@/components/ui/SpeedDial";
import MetricCard from "@/components/ui/MetricCard";
import Timeline from "@/components/ui/Timeline";
import AutoScheduleGenerator from "@/components/schedule/AutoScheduleGenerator";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { useConfirm } from "@/hooks/useConfirm";
import { ExportUtils } from "@/utils/exportUtils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeType?: string;
  workTypes?: string[];
}

interface Project {
  id: string;
  name: string;
  company: string;
}

interface ScheduleShift {
  id: string;
  userId: string;
  projectId?: string;
  startTime: string;
  endTime: string;
  role?: string;
  notes?: string;
  status: "SCHEDULED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  user: User;
  project?: Project;
  breaks?: any[];
}

interface Schedule {
  id: string;
  date: string;
  title?: string;
  description?: string;
  shifts: ScheduleShift[];
}

interface LeaveInfo {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  employeeType?: string;
  type: string;
  startDate: string;
  endDate: string;
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
  description?: string;
  dayCount: number;
}

export default function SchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [leaveInfo, setLeaveInfo] = useState<LeaveInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAutoGenerateModal, setShowAutoGenerateModal] = useState(false);
  const [emailData, setEmailData] = useState({
    recipients: "",
    subject: "",
    message: "",
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [currentView, setCurrentView] = useState<
    "day" | "week" | "analytics" | "templates" | "mySchedule"
  >(
    // Default view based on role - employees see their schedule, admins/managers see day view
    session?.user?.role === "EMPLOYEE" || session?.user?.role === "FREELANCER"
      ? "mySchedule"
      : "day"
  );
  const [weekShifts, setWeekShifts] = useState<ScheduleShift[]>([]);
  const [myAssignments, setMyAssignments] = useState<any[]>([]);
  const [scheduleAssignments, setScheduleAssignments] = useState<any[]>([]);
  const [expandedBreaks, setExpandedBreaks] = useState<Set<string>>(new Set());

  const { confirm, ConfirmModal } = useConfirm();

  // Export functions - simplified with better branding
  const handleExportPDF = async () => {
    if (!schedule?.shifts || schedule.shifts.length === 0) {
      alert("Geen diensten om te exporteren");
      return;
    }

    try {
      await ExportUtils.exportScheduleToPDF(schedule.shifts, selectedDate, {
        title: `Werkrooster ${format(new Date(selectedDate), "dd MMMM yyyy", {
          locale: nl,
        })}`,
        companyName: "JobFlow Solutions",
        includeBreaks: true,
        includeNotes: true,
        theme: "professional",
      });
    } catch (error) {
      console.error("PDF export error:", error);
      alert("Fout bij het exporteren naar PDF");
    }
  };

  const handleExportExcel = () => {
    if (!schedule?.shifts || schedule.shifts.length === 0) {
      alert("Geen diensten om te exporteren");
      return;
    }

    try {
      ExportUtils.exportScheduleToExcel(schedule.shifts, selectedDate, {
        title: `Werkrooster ${format(new Date(selectedDate), "dd MMMM yyyy", {
          locale: nl,
        })}`,
        companyName: "JobFlow Solutions",
        includeBreaks: true,
        includeNotes: true,
        includeMetadata: true,
        theme: "professional",
      });
    } catch (error) {
      console.error("Excel export error:", error);
      alert("Fout bij het exporteren naar Excel");
    }
  };

  // Export functions - quick export simplified
  const handleQuickExport = (format: "pdf" | "excel") => {
    if (format === "pdf") {
      handleExportPDF();
    } else {
      handleExportExcel();
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchUsers();
      fetchProjects();
      fetchScheduleAssignments();
      if (currentView === "mySchedule") {
        fetchMyAssignments();
      }
    }
  }, [session, currentView]);

  useEffect(() => {
    if (selectedDate) {
      fetchSchedule();
      fetchLeaveInfo();
    }
  }, [selectedDate]);

  // Also fetch leave info when view changes
  useEffect(() => {
    if (selectedDate && currentView) {
      fetchLeaveInfo();
      if (currentView === "week") {
        fetchWeekShifts();
      }
    }
  }, [currentView, selectedDate]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/personnel");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.filter((p: any) => p.status === "ACTIVE"));
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchMyAssignments = async () => {
    try {
      if (!session?.user?.id) return;

      const response = await fetch(
        `/api/user-schedule-assignments?userId=${session.user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setMyAssignments(data);
      }
    } catch (error) {
      console.error("Error fetching my assignments:", error);
    }
  };

  const fetchScheduleAssignments = async () => {
    try {
      const response = await fetch("/api/user-schedule-assignments");
      if (response.ok) {
        const data = await response.json();
        setScheduleAssignments(data);
      }
    } catch (error) {
      console.error("Error fetching schedule assignments:", error);
    }
  };

  const fetchLeaveInfo = async () => {
    try {
      let url;
      if (currentView === "week") {
        // For week view, fetch leave info for the entire week
        const currentDate = new Date(selectedDate);
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Sunday

        url = `/api/schedule/leave-info?startDate=${
          weekStart.toISOString().split("T")[0]
        }&endDate=${weekEnd.toISOString().split("T")[0]}`;
      } else {
        // For day view and mySchedule, fetch for selected date
        url = `/api/schedule/leave-info?date=${selectedDate}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLeaveInfo(data);
      } else {
        setLeaveInfo([]);
      }
    } catch (error) {
      console.error("Error fetching leave info:", error);
      setLeaveInfo([]);
    }
  };

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/schedule?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
      } else if (response.status === 404) {
        setSchedule(null);
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeekShifts = async () => {
    try {
      const currentDate = new Date(selectedDate);
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Sunday

      const response = await fetch(
        `/api/schedule?startDate=${
          weekStart.toISOString().split("T")[0]
        }&endDate=${weekEnd.toISOString().split("T")[0]}`
      );
      if (response.ok) {
        const data = await response.json();
        // Extract all shifts from all days
        const allShifts = data.flatMap(
          (daySchedule: any) => daySchedule.shifts || []
        );
        setWeekShifts(allShifts);
      } else {
        setWeekShifts([]);
      }
    } catch (error) {
      console.error("Error fetching week shifts:", error);
      setWeekShifts([]);
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    const confirmed = await confirm({
      type: "danger",
      title: "Dienst verwijderen",
      message:
        "Weet je zeker dat je deze dienst wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.",
      confirmText: "Verwijderen",
      cancelText: "Annuleren",
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/schedule/shifts/${shiftId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchSchedule();
      } else {
        const data = await response.json();
        alert(data.error || "Error deleting shift");
      }
    } catch (error) {
      console.error("Error deleting shift:", error);
      alert("Error deleting shift");
    }
  };

  const handleUpdateShiftStatus = async (
    shiftId: string,
    status: ScheduleShift["status"]
  ) => {
    try {
      const response = await fetch(`/api/schedule/shifts/${shiftId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchSchedule();
      } else {
        const data = await response.json();
        alert(data.error || "Error updating shift status");
      }
    } catch (error) {
      console.error("Error updating shift status:", error);
      alert("Error updating shift status");
    }
  };

  const getStatusColor = (status: ScheduleShift["status"]) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "CONFIRMED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getStatusText = (status: ScheduleShift["status"]) => {
    switch (status) {
      case "SCHEDULED":
        return "Gepland";
      case "CONFIRMED":
        return "Bevestigd";
      case "CANCELLED":
        return "Geannuleerd";
      case "COMPLETED":
        return "Voltooid";
      default:
        return status;
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const currentDate = new Date(selectedDate);
    const newDate =
      direction === "next" ? addDays(currentDate, 1) : subDays(currentDate, 1);
    setSelectedDate(newDate.toISOString().split("T")[0]);
  };

  const formatTime = (timeString: string) => {
    // Extract just the time portion to avoid timezone conversion
    // timeString format: "2025-05-30T08:00:00"
    if (timeString.includes("T")) {
      return timeString.substring(11, 16); // Gets "08:00" from "2025-05-30T08:00:00"
    }
    // Fallback for other formats
    return timeString;
  };

  // Group shifts by work type/role
  const groupShiftsByWorkType = (shifts: ScheduleShift[]) => {
    const grouped = shifts.reduce((acc, shift) => {
      const workType = shift.role || "Geen rol";
      if (!acc[workType]) {
        acc[workType] = [];
      }
      acc[workType].push(shift);
      return acc;
    }, {} as Record<string, ScheduleShift[]>);

    // Sort each group by start time
    Object.keys(grouped).forEach((workType) => {
      grouped[workType].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });

    return grouped;
  };

  // Get work type icon
  const getWorkTypeIcon = (workType: string) => {
    const iconMap: Record<string, string> = {
      graafwerk: "G",
      schilderwerk: "S",
      keukenplaatsing: "K",
      badkamerplaatsing: "B",
      tegelwerk: "T",
      verhuis: "V",
      event_decoratie: "E",
      warehouse: "W",
      kantoor: "K",
      administratie: "A",
      cleaning: "C",
      onderhoud: "O",
    };

    return iconMap[workType.toLowerCase()] || "W";
  };

  const getLeaveIcon = (leaveType: string) => {
    const iconMap: Record<string, string> = {
      vacation: "V",
      sick_leave: "Z",
      personal_leave: "P",
      time_off_in_lieu: "T",
      doctor_visit: "D",
      dentist_visit: "T",
      special_leave: "S",
      calamity_leave: "C",
      bereavement_leave: "R",
      moving_day: "V",
      maternity_leave: "Z",
      paternity_leave: "V",
      study_leave: "S",
      emergency_leave: "N",
      unpaid_leave: "O",
      compensatory_leave: "C",
    };

    return iconMap[leaveType.toLowerCase()] || "V";
  };

  // Calculate total hours for a work type group
  const calculateGroupHours = (shifts: ScheduleShift[]) => {
    return shifts.reduce((total, shift) => {
      const start = new Date(shift.startTime);
      const end = new Date(shift.endTime);
      return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
  };

  const getLeaveLabel = (leaveType: string) => {
    const leaveLabels: Record<string, string> = {
      VACATION: "Vakantie",
      SICK_LEAVE: "Ziekteverlof",
      PERSONAL_LEAVE: "Persoonlijk verlof",
      TIME_OFF_IN_LIEU: "Tijd voor tijd opname",
      DOCTOR_VISIT: "Doktersbezoek",
      DENTIST_VISIT: "Tandarts bezoek",
      SPECIAL_LEAVE: "Bijzonder verlof",
      CALAMITY_LEAVE: "Calamiteitenverlof",
      BEREAVEMENT_LEAVE: "Rouwverlof",
      MOVING_DAY: "Verhuisdag",
      MATERNITY_LEAVE: "Zwangerschapsverlof",
      PATERNITY_LEAVE: "Vaderschapsverlof",
      STUDY_LEAVE: "Studieverlof",
      EMERGENCY_LEAVE: "Noodverlof",
      UNPAID_LEAVE: "Onbetaald verlof",
      COMPENSATORY_LEAVE: "Compensatieverlof",
    };
    return leaveLabels[leaveType] || leaveType;
  };

  const getLeaveColor = (leaveType: string) => {
    const urgentTypes = ["SICK_LEAVE", "EMERGENCY_LEAVE", "CALAMITY_LEAVE"];
    const specialTypes = [
      "MATERNITY_LEAVE",
      "PATERNITY_LEAVE",
      "BEREAVEMENT_LEAVE",
    ];

    if (urgentTypes.includes(leaveType)) {
      return "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300";
    } else if (specialTypes.includes(leaveType)) {
      return "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300";
    } else {
      return "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300";
    }
  };

  const getWorkPatternsForDate = (date: string) => {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();

    return scheduleAssignments.filter(
      (assignment) => assignment.dayOfWeek === dayOfWeek
    );
  };

  const DAYS_OF_WEEK = [
    { value: 1, label: "Ma", fullLabel: "Maandag" },
    { value: 2, label: "Di", fullLabel: "Dinsdag" },
    { value: 3, label: "Wo", fullLabel: "Woensdag" },
    { value: 4, label: "Do", fullLabel: "Donderdag" },
    { value: 5, label: "Vr", fullLabel: "Vrijdag" },
    { value: 6, label: "Za", fullLabel: "Zaterdag" },
    { value: 0, label: "Zo", fullLabel: "Zondag" },
  ];

  const toggleBreaksExpansion = (shiftId: string) => {
    const newExpanded = new Set(expandedBreaks);
    if (newExpanded.has(shiftId)) {
      newExpanded.delete(shiftId);
    } else {
      newExpanded.add(shiftId);
    }
    setExpandedBreaks(newExpanded);
  };

  const formatBreakDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    return diffMins;
  };

  const getTotalBreakTime = (breaks: any[]) => {
    if (!breaks || breaks.length === 0) return 0;
    return breaks.reduce((total, breakItem) => {
      return (
        total +
        (breakItem.duration ||
          formatBreakDuration(breakItem.startTime, breakItem.endTime))
      );
    }, 0);
  };

  if (status === "loading" || loading) {
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
    <div className="space-y-6">
      <ConfirmModal />
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Rooster" },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <Card variant="elevated" padding="lg" className="mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              Rooster Beheer
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:mt-2">
              Plan en beheer werkdiensten voor je team
            </p>
          </div>

          <div className="button-group-loose flex-wrap sm:flex-nowrap">
            {/* Export buttons - show for admin/manager when shifts exist */}
            {(session?.user?.role === "ADMIN" ||
              session?.user?.role === "MANAGER") &&
              schedule?.shifts &&
              schedule.shifts.length > 0 && (
                <>
                  <Button
                    onClick={() => handleQuickExport("pdf")}
                    variant="outline"
                    size="md"
                    leftIcon={
                      <DocumentArrowDownIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                    }
                    className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 touch-target-sm"
                    title="Exporteer als PDF"
                  >
                    <span className="sm:hidden">PDF</span>
                    <span className="hidden sm:inline">PDF Export</span>
                  </Button>
                  <Button
                    onClick={() => handleQuickExport("excel")}
                    variant="outline"
                    size="md"
                    leftIcon={
                      <TableCellsIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    }
                    className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 touch-target-sm"
                    title="Exporteer als Excel"
                  >
                    <span className="sm:hidden">Excel</span>
                    <span className="hidden sm:inline">Excel Export</span>
                  </Button>
                </>
              )}

            {/* Auto-generate button - only show for admin/manager */}
            {(session?.user?.role === "ADMIN" ||
              session?.user?.role === "MANAGER") && (
              <Button
                onClick={() => setShowAutoGenerateModal(true)}
                variant="outline"
                size="md"
                leftIcon={
                  <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                }
                className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 touch-target-sm"
              >
                <span className="sm:hidden">Auto</span>
                <span className="hidden sm:inline">Auto Genereren</span>
              </Button>
            )}

            {/* Add shift button - only show for admin/manager */}
            {(session?.user?.role === "ADMIN" ||
              session?.user?.role === "MANAGER") && (
              <Button
                onClick={() =>
                  router.push(`/dashboard/schedule/shift?date=${selectedDate}`)
                }
                variant="primary"
                size="md"
                leftIcon={<PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                className="touch-target-sm"
              >
                <span className="sm:hidden">Nieuw</span>
                <span className="hidden sm:inline">Nieuwe Dienst</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* View Switcher Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 sm:px-6 sm:py-4">
          <nav className="flex overflow-x-auto scrollbar-hide -mb-px">
            <div className="flex space-x-6 sm:space-x-8 min-w-max">
              {[
                {
                  key: "day",
                  label: "Dag",
                  fullLabel: "Dag Overzicht",
                  icon: CalendarIcon,
                  roles: ["ADMIN", "MANAGER", "EMPLOYEE", "FREELANCER"],
                },
                {
                  key: "week",
                  label: "Week",
                  fullLabel: "Week Overzicht",
                  icon: CalendarDaysIcon,
                  roles: ["ADMIN", "MANAGER"],
                },
                {
                  key: "analytics",
                  label: "Data",
                  fullLabel: "Analytics",
                  icon: ChartBarIcon,
                  roles: ["ADMIN", "MANAGER"],
                },
                {
                  key: "templates",
                  label: "Templates",
                  fullLabel: "Templates",
                  icon: BookmarkIcon,
                  roles: ["ADMIN", "MANAGER"],
                },
                {
                  key: "mySchedule",
                  label: "Mijn",
                  fullLabel: "Mijn Rooster",
                  icon: ListBulletIcon,
                  roles: ["EMPLOYEE", "FREELANCER"],
                },
              ]
                .filter((tab) => tab.roles.includes(session?.user?.role || ""))
                .map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setCurrentView(tab.key as any)}
                    className={`${
                      currentView === tab.key
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                    } whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm transition-colors duration-200 flex flex-col items-center space-y-1 sm:flex-row sm:space-y-0 sm:space-x-2 min-w-[80px] sm:min-w-0`}
                  >
                    <tab.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">
                      <span className="sm:hidden">{tab.label}</span>
                      <span className="hidden sm:inline">{tab.fullLabel}</span>
                    </span>
                  </button>
                ))}
            </div>
          </nav>
        </div>

        {/* View Content */}
        <div className="p-4 sm:p-6">
          {currentView === "day" && (
            <>
              {/* Date Navigation - only show for day view */}
              <Card variant="glass" padding="md" className="mb-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                      {format(new Date(selectedDate), "EEEE d MMMM yyyy", {
                        locale: nl,
                      })}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {schedule?.shifts.length || 0} diensten gepland
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <Tooltip content="Ga naar de vorige dag" placement="top">
                      <Button
                        onClick={() => navigateDate("prev")}
                        variant="outline"
                        size="md"
                        leftIcon={<ChevronLeftIcon className="h-5 w-5" />}
                        elevation="soft"
                        rounded="lg"
                        className="min-w-[100px] min-h-[44px] flex-1 sm:flex-none"
                      >
                        <span className="hidden sm:inline">Vorige</span>
                        <span className="sm:hidden">◀</span>
                      </Button>
                    </Tooltip>

                    <Tooltip content="Ga naar vandaag" placement="top">
                      <Button
                        onClick={() =>
                          setSelectedDate(
                            new Date().toISOString().split("T")[0]
                          )
                        }
                        variant="secondary"
                        size="md"
                        elevation="soft"
                        rounded="lg"
                        className="min-w-[80px] min-h-[44px] font-medium"
                      >
                        Vandaag
                      </Button>
                    </Tooltip>

                    <Tooltip content="Ga naar de volgende dag" placement="top">
                      <Button
                        onClick={() => navigateDate("next")}
                        variant="outline"
                        size="md"
                        rightIcon={<ChevronRightIcon className="h-5 w-5" />}
                        elevation="soft"
                        rounded="lg"
                        className="min-w-[100px] min-h-[44px] flex-1 sm:flex-none"
                      >
                        <span className="hidden sm:inline">Volgende</span>
                        <span className="sm:hidden">▶</span>
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </Card>

              {/* Day Schedule Content */}
              {schedule && schedule.shifts.length > 0 ? (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 mb-6">
                    <MetricCard
                      title="Totaal Diensten"
                      value={schedule.shifts.length}
                      icon={<UserIcon className="w-8 h-8" />}
                      color="blue"
                      trend={
                        schedule.shifts.length > 0
                          ? {
                              value: 5,
                              isPositive: true,
                              label: "vs vorige week",
                            }
                          : undefined
                      }
                    />

                    <MetricCard
                      title="Totaal Uren"
                      value={`${schedule.shifts
                        .reduce((total, shift) => {
                          const start = new Date(shift.startTime);
                          const end = new Date(shift.endTime);
                          const hours =
                            (end.getTime() - start.getTime()) /
                            (1000 * 60 * 60);
                          return total + hours;
                        }, 0)
                        .toFixed(1)}h`}
                      icon={<ClockIcon className="w-8 h-8" />}
                      color="green"
                      trend={{
                        value: 8,
                        isPositive: true,
                        label: "vs vorige week",
                      }}
                    />

                    <MetricCard
                      title="Werkzaamheden"
                      value={
                        Object.keys(groupShiftsByWorkType(schedule.shifts))
                          .length
                      }
                      icon={<BriefcaseIcon className="w-8 h-8" />}
                      color="purple"
                      subtitle="Verschillende rollen"
                    />

                    <MetricCard
                      title="Afwezig"
                      value={leaveInfo.length}
                      icon={<ExclamationTriangleIcon className="w-8 h-8" />}
                      color="orange"
                      status={leaveInfo.length > 3 ? "warning" : "normal"}
                      subtitle={leaveInfo.length === 1 ? "persoon" : "personen"}
                      trend={
                        leaveInfo.length > 0
                          ? {
                              value: 12,
                              isPositive: false,
                              label: "vs vorige week",
                            }
                          : undefined
                      }
                    />
                  </div>

                  {/* Show leave info even when no shifts */}
                  {leaveInfo.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">🚫</div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Afwezigheid & Verlof
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {leaveInfo.length}{" "}
                                {leaveInfo.length === 1
                                  ? "persoon"
                                  : "personen"}{" "}
                                afwezig vandaag
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {leaveInfo.map((leave) => (
                          <div
                            key={leave.id}
                            className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <div className="h-10 w-10 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40 rounded-xl flex items-center justify-center shadow-sm border border-orange-200 dark:border-orange-700">
                                    <span className="text-lg">
                                      {getLeaveIcon(leave.type)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                      {leave.userName}
                                    </h4>
                                    <span
                                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getLeaveColor(
                                        leave.type
                                      )}`}
                                    >
                                      {getLeaveLabel(leave.type)}
                                    </span>
                                  </div>
                                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                    {leave.isFullDay ? (
                                      <div className="flex items-center space-x-2">
                                        <div className="h-5 w-5 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-700">
                                          <CalendarDaysIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span>Hele dag afwezig</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-2">
                                        <div className="h-5 w-5 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-lg flex items-center justify-center border border-green-200 dark:border-green-700">
                                          <ClockIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                                        </div>
                                        <span>
                                          {leave.startTime} - {leave.endTime}
                                        </span>
                                      </div>
                                    )}
                                    {leave.dayCount > 1 && (
                                      <div className="flex items-center space-x-2">
                                        <div className="h-5 w-5 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-lg flex items-center justify-center border border-purple-200 dark:border-purple-700">
                                          <CalendarIcon className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <span>
                                          {leave.dayCount} dagen totaal
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex items-center space-x-2">
                                      <div className="h-5 w-5 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 rounded-lg flex items-center justify-center border border-cyan-200 dark:border-cyan-700">
                                        <UserIcon className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                                      </div>
                                      <span>
                                        {leave.userRole} -{" "}
                                        {leave.employeeType || "Medewerker"}
                                      </span>
                                    </div>
                                  </div>
                                  {leave.reason && (
                                    <div className="mt-2 flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-300">
                                      <div className="h-5 w-5 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 rounded-lg flex items-center justify-center border border-amber-200 dark:border-amber-700 flex-shrink-0 mt-0.5">
                                        <DocumentTextIcon className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                      </div>
                                      <span>{leave.reason}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {new Date(leave.startDate).toLocaleDateString(
                                    "nl-NL"
                                  )}{" "}
                                  -{" "}
                                  {new Date(leave.endDate).toLocaleDateString(
                                    "nl-NL"
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Grouped Shifts */}
                  {Object.entries(groupShiftsByWorkType(schedule.shifts)).map(
                    ([workType, shifts]) => (
                      <motion.div
                        key={workType}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                      >
                        {/* Work Type Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">
                                {getWorkTypeIcon(workType)}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {workType}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {shifts.length}{" "}
                                  {shifts.length === 1 ? "dienst" : "diensten"}{" "}
                                  • {calculateGroupHours(shifts).toFixed(1)} uur
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Shifts List */}
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {shifts.map((shift) => (
                            <div
                              key={shift.id}
                              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start space-x-4 flex-1 min-w-0">
                                  <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-xl flex items-center justify-center shadow-sm border border-blue-200 dark:border-blue-700">
                                      <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                                      <div className="flex items-center space-x-3">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                          {shift.user.name}
                                        </h4>
                                        <span
                                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${getStatusColor(
                                            shift.status
                                          )}`}
                                        >
                                          {getStatusText(shift.status)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-500 dark:text-gray-400">
                                      <div className="flex items-center space-x-2">
                                        <div className="h-6 w-6 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-lg flex items-center justify-center border border-green-200 dark:border-green-700">
                                          <ClockIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                                        </div>
                                        <span className="truncate">
                                          {formatTime(shift.startTime)} -{" "}
                                          {formatTime(shift.endTime)}
                                          <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                                            (
                                            {(
                                              (new Date(
                                                shift.endTime
                                              ).getTime() -
                                                new Date(
                                                  shift.startTime
                                                ).getTime()) /
                                              (1000 * 60 * 60)
                                            ).toFixed(1)}
                                            h)
                                          </span>
                                        </span>
                                      </div>

                                      {shift.project && (
                                        <div className="flex items-center space-x-2">
                                          <div className="h-6 w-6 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-lg flex items-center justify-center border border-purple-200 dark:border-purple-700">
                                            <BriefcaseIcon className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                          </div>
                                          <span className="truncate">
                                            {shift.project.name}
                                          </span>
                                        </div>
                                      )}

                                      {shift.project?.company && (
                                        <div className="flex items-center space-x-2">
                                          <div className="h-6 w-6 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40 rounded-lg flex items-center justify-center border border-orange-200 dark:border-orange-700">
                                            <BuildingOfficeIcon className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                                          </div>
                                          <span className="truncate">
                                            {shift.project.company}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {shift.notes && (
                                      <div className="mt-3 flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="h-6 w-6 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 rounded-lg flex items-center justify-center border border-cyan-200 dark:border-cyan-700 flex-shrink-0 mt-0.5">
                                          <DocumentTextIcon className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                                        </div>
                                        <span>{shift.notes}</span>
                                      </div>
                                    )}

                                    {shift.breaks &&
                                      Array.isArray(shift.breaks) &&
                                      shift.breaks.length > 0 && (
                                        <div className="mt-3">
                                          {/* Pauze samenvatting - klikbaar */}
                                          <div
                                            className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all duration-200"
                                            onClick={() =>
                                              toggleBreaksExpansion(shift.id)
                                            }
                                          >
                                            <div className="flex items-center space-x-3">
                                              <div className="flex-shrink-0">
                                                <div className="h-8 w-8 bg-amber-100 dark:bg-amber-800 rounded-lg flex items-center justify-center">
                                                  <PauseIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                </div>
                                              </div>
                                              <div>
                                                <div className="flex items-center space-x-2">
                                                  <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                                    {shift.breaks.length}{" "}
                                                    {shift.breaks.length === 1
                                                      ? "Pauze"
                                                      : "Pauzes"}
                                                  </span>
                                                  <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-200 dark:bg-amber-800 px-2 py-1 rounded-full">
                                                    {getTotalBreakTime(
                                                      shift.breaks
                                                    )}{" "}
                                                    min totaal
                                                  </span>
                                                </div>
                                                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                                  Klik om details te bekijken
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex-shrink-0">
                                              {expandedBreaks.has(shift.id) ? (
                                                <ChevronUpIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                              ) : (
                                                <ChevronDownIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                              )}
                                            </div>
                                          </div>

                                          {/* Uitvouwbare pauze details */}
                                          {expandedBreaks.has(shift.id) && (
                                            <div className="mt-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                              {shift.breaks.map(
                                                (breakItem, index) => (
                                                  <div
                                                    key={index}
                                                    className="flex items-center justify-between bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-lg p-3 shadow-sm"
                                                  >
                                                    <div className="flex items-center space-x-3">
                                                      <div className="flex-shrink-0">
                                                        <div className="h-6 w-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                                                          <ClockIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                      </div>
                                                      <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                          Pauze {index + 1}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                          {breakItem.startTime}{" "}
                                                          - {breakItem.endTime}
                                                        </div>
                                                      </div>
                                                    </div>
                                                    <div className="text-right">
                                                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {breakItem.duration ||
                                                          formatBreakDuration(
                                                            breakItem.startTime,
                                                            breakItem.endTime
                                                          )}{" "}
                                                        min
                                                      </div>
                                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        Duur
                                                      </div>
                                                    </div>
                                                  </div>
                                                )
                                              )}

                                              {/* Pauze statistieken */}
                                              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                                                <div className="flex items-center justify-between text-sm">
                                                  <div className="flex items-center space-x-2">
                                                    <div className="h-5 w-5 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                                                      <CheckCircleIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <span className="font-medium text-green-900 dark:text-green-100">
                                                      Totale pauzetijd
                                                    </span>
                                                  </div>
                                                  <span className="font-bold text-green-700 dark:text-green-300">
                                                    {getTotalBreakTime(
                                                      shift.breaks
                                                    )}{" "}
                                                    minuten
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                  </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex-shrink-0 mt-4 sm:mt-0">
                                  {(session?.user?.role === "ADMIN" ||
                                    session?.user?.role === "MANAGER") && (
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                      <Tooltip
                                        content="Bewerk deze dienst"
                                        placement="top"
                                      >
                                        <Button
                                          onClick={() =>
                                            router.push(
                                              `/dashboard/schedule/shift?id=${shift.id}&date=${selectedDate}`
                                            )
                                          }
                                          variant="primary"
                                          size="sm"
                                          leftIcon={
                                            <PencilIcon className="w-4 h-4" />
                                          }
                                          className="w-full min-h-[40px] sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                        >
                                          Bewerken
                                        </Button>
                                      </Tooltip>

                                      <Tooltip
                                        content="Verwijder deze dienst"
                                        placement="top"
                                      >
                                        <Button
                                          onClick={() =>
                                            handleDeleteShift(shift.id)
                                          }
                                          variant="primary"
                                          size="sm"
                                          leftIcon={
                                            <TrashIcon className="w-4 h-4" />
                                          }
                                          className="w-full min-h-[40px] sm:w-auto bg-red-600 hover:bg-red-700 text-white shadow-sm"
                                        >
                                          Verwijderen
                                        </Button>
                                      </Tooltip>
                                    </div>
                                  )}

                                  {(session?.user?.role === "EMPLOYEE" ||
                                    session?.user?.role === "FREELANCER") && (
                                    <div className="flex items-center justify-center gap-2 text-sm bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                                      <div className="text-gray-500 dark:text-gray-400 text-xs">
                                        📋 Alleen-lezen
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Show leave info even when no shifts */}
                  {leaveInfo.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">🚫</div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Afwezigheid & Verlof
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {leaveInfo.length}{" "}
                                {leaveInfo.length === 1
                                  ? "persoon"
                                  : "personen"}{" "}
                                afwezig vandaag
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {leaveInfo.map((leave) => (
                          <div
                            key={leave.id}
                            className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <div className="h-10 w-10 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40 rounded-xl flex items-center justify-center shadow-sm border border-orange-200 dark:border-orange-700">
                                    <span className="text-lg">
                                      {getLeaveIcon(leave.type)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                      {leave.userName}
                                    </h4>
                                    <span
                                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getLeaveColor(
                                        leave.type
                                      )}`}
                                    >
                                      {getLeaveLabel(leave.type)}
                                    </span>
                                  </div>
                                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                    {leave.isFullDay ? (
                                      <div className="flex items-center space-x-2">
                                        <div className="h-5 w-5 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-700">
                                          <CalendarDaysIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span>Hele dag afwezig</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-2">
                                        <div className="h-5 w-5 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-lg flex items-center justify-center border border-green-200 dark:border-green-700">
                                          <ClockIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                                        </div>
                                        <span>
                                          {leave.startTime} - {leave.endTime}
                                        </span>
                                      </div>
                                    )}
                                    {leave.dayCount > 1 && (
                                      <div className="flex items-center space-x-2">
                                        <div className="h-5 w-5 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-lg flex items-center justify-center border border-purple-200 dark:border-purple-700">
                                          <CalendarIcon className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <span>
                                          {leave.dayCount} dagen totaal
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex items-center space-x-2">
                                      <div className="h-5 w-5 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 rounded-lg flex items-center justify-center border border-cyan-200 dark:border-cyan-700">
                                        <UserIcon className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                                      </div>
                                      <span>
                                        {leave.userRole} -{" "}
                                        {leave.employeeType || "Medewerker"}
                                      </span>
                                    </div>
                                  </div>
                                  {leave.reason && (
                                    <div className="mt-2 flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-300">
                                      <div className="h-5 w-5 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 rounded-lg flex items-center justify-center border border-amber-200 dark:border-amber-700 flex-shrink-0 mt-0.5">
                                        <DocumentTextIcon className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                      </div>
                                      <span>{leave.reason}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {new Date(leave.startDate).toLocaleDateString(
                                    "nl-NL"
                                  )}{" "}
                                  -{" "}
                                  {new Date(leave.endDate).toLocaleDateString(
                                    "nl-NL"
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* No shifts message */}
                  <Card variant="default" padding="xl" className="text-center">
                    <div className="py-8 sm:py-12">
                      <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4 sm:mb-6">
                        <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Geen diensten gepland
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
                        Er zijn nog geen diensten gepland voor{" "}
                        {format(new Date(selectedDate), "EEEE d MMMM", {
                          locale: nl,
                        })}
                        .
                        {session?.user?.role === "ADMIN" ||
                        session?.user?.role === "MANAGER"
                          ? " Start met het toevoegen van je eerste dienst."
                          : " Neem contact op met je manager voor planning."}
                      </p>

                      {/* Only show add button for admin/manager */}
                      {(session?.user?.role === "ADMIN" ||
                        session?.user?.role === "MANAGER") && (
                        <Tooltip
                          content="Voeg je eerste dienst toe voor deze dag"
                          placement="top"
                        >
                          <Button
                            onClick={() => {
                              router.push(
                                `/dashboard/schedule/shift?date=${selectedDate}`
                              );
                            }}
                            leftIcon={<PlusIcon className="h-5 w-5" />}
                            variant="primary"
                            size="lg"
                            elevation="medium"
                            rounded="xl"
                            className="shadow-lg min-h-[48px] w-full sm:w-auto"
                          >
                            Eerste Dienst Toevoegen
                          </Button>
                        </Tooltip>
                      )}

                      {/* Employee message */}
                      {(session?.user?.role === "EMPLOYEE" ||
                        session?.user?.role === "FREELANCER") && (
                        <div className="text-center">
                          <div className="text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                            👤 Je hebt nog geen diensten voor deze dag
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}

          {currentView === "week" && (
            <WeekView
              selectedDate={selectedDate}
              shifts={weekShifts}
              leaveInfo={leaveInfo}
              onDateSelect={setSelectedDate}
            />
          )}

          {currentView === "analytics" && (
            <div className="space-y-6">
              <ScheduleAnalytics shifts={schedule?.shifts || []} period="day" />

              {/* Timeline Example - Recent Schedule Activity */}
              <Card variant="elevated" padding="lg">
                <CardHeader>
                  <CardTitle>📊 Recente Activiteit</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Laatste wijzigingen en events in het rooster systeem
                  </p>
                </CardHeader>
                <CardContent>
                  <Timeline
                    events={[
                      {
                        id: "1",
                        title: "Nieuwe dienst toegevoegd",
                        description: "Wasstraat dienst voor morgen gepland",
                        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                        status: "completed",
                        actor: session?.user?.name || "Admin",
                        expandableContent: (
                          <div className="text-xs space-y-2">
                            <p>
                              <strong>Project:</strong> Broers Verhuur
                            </p>
                            <p>
                              <strong>Tijd:</strong> 08:00 - 16:00
                            </p>
                            <p>
                              <strong>Medewerker:</strong> Jan Bakker
                            </p>
                          </div>
                        ),
                      },
                      {
                        id: "2",
                        title: "Verlofaanvraag goedgekeurd",
                        description: "Vakantieverlof voor volgende week",
                        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
                        status: "completed",
                        actor: "HR Manager",
                        expandableContent: (
                          <div className="text-xs space-y-2">
                            <p>
                              <strong>Type:</strong> Vakantieverlof
                            </p>
                            <p>
                              <strong>Periode:</strong> 7 dagen
                            </p>
                            <p>
                              <strong>Medewerker:</strong> Lisa de Vries
                            </p>
                          </div>
                        ),
                      },
                      {
                        id: "3",
                        title: "Dienst status gewijzigd",
                        description: "Van 'Gepland' naar 'Bevestigd'",
                        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
                        status: "info",
                        actor: "Shift Manager",
                      },
                      {
                        id: "4",
                        title: "Ziekmelding ontvangen",
                        description: "Medewerker heeft zich ziek gemeld",
                        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                        status: "warning",
                        actor: "Employee Portal",
                        expandableContent: (
                          <div className="text-xs space-y-2">
                            <p>
                              <strong>Medewerker:</strong> Peter Jansen
                            </p>
                            <p>
                              <strong>Geschatte duur:</strong> 2-3 dagen
                            </p>
                            <p>
                              <strong>Vervangingsactie:</strong> Automatisch
                              opvolger gezocht
                            </p>
                          </div>
                        ),
                      },
                      {
                        id: "5",
                        title: "Rooster template toegepast",
                        description:
                          "Standaard weekend template voor deze week",
                        timestamp: new Date(
                          Date.now() - 2 * 24 * 60 * 60 * 1000
                        ), // 2 days ago
                        status: "completed",
                        actor: "System",
                      },
                    ]}
                    variant="default"
                    expandable={true}
                    showTime={true}
                    maxHeight="max-h-96"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {currentView === "templates" && (
            <ScheduleTemplates
              onApplyTemplate={() => {}}
              onCreateTemplate={() => {}}
            />
          )}

          {currentView === "mySchedule" && (
            <div className="space-y-6">
              {/* Leave/Absence Section for My Schedule */}
              {leaveInfo.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">🚫</div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Afwezigheid & Verlof Vandaag
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {leaveInfo.length}{" "}
                            {leaveInfo.length === 1 ? "collega" : "collega's"}{" "}
                            afwezig op{" "}
                            {format(new Date(selectedDate), "EEEE d MMMM", {
                              locale: nl,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {leaveInfo.map((leave) => (
                      <div
                        key={leave.id}
                        className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40 rounded-xl flex items-center justify-center shadow-sm border border-orange-200 dark:border-orange-700">
                                <span className="text-lg">
                                  {getLeaveIcon(leave.type)}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {leave.userName}
                                  {leave.userId === session?.user?.id && (
                                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                                      (Jij)
                                    </span>
                                  )}
                                </h4>
                                <span
                                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getLeaveColor(
                                    leave.type
                                  )}`}
                                >
                                  {getLeaveLabel(leave.type)}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                {leave.isFullDay ? (
                                  <div className="flex items-center space-x-2">
                                    <div className="h-5 w-5 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-700">
                                      <CalendarDaysIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span>Hele dag afwezig</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <div className="h-5 w-5 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-lg flex items-center justify-center border border-green-200 dark:border-green-700">
                                      <ClockIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span>
                                      {leave.startTime} - {leave.endTime}
                                    </span>
                                  </div>
                                )}
                                {leave.dayCount > 1 && (
                                  <div className="flex items-center space-x-2">
                                    <div className="h-5 w-5 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-lg flex items-center justify-center border border-purple-200 dark:border-purple-700">
                                      <CalendarIcon className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <span>{leave.dayCount} dagen totaal</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-2">
                                  <div className="h-5 w-5 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 rounded-lg flex items-center justify-center border border-cyan-200 dark:border-cyan-700">
                                    <UserIcon className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                                  </div>
                                  <span>
                                    {leave.userRole} -{" "}
                                    {leave.employeeType || "Medewerker"}
                                  </span>
                                </div>
                              </div>
                              {leave.reason && (
                                <div className="mt-2 flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-300">
                                  <div className="h-5 w-5 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 rounded-lg flex items-center justify-center border border-amber-200 dark:border-amber-700 flex-shrink-0 mt-0.5">
                                    <DocumentTextIcon className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                  </div>
                                  <span>{leave.reason}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {new Date(leave.startDate).toLocaleDateString(
                                "nl-NL"
                              )}{" "}
                              -{" "}
                              {new Date(leave.endDate).toLocaleDateString(
                                "nl-NL"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* My Fixed Schedule */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Mijn Vaste Rooster
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Jouw standaard werkdagen en tijden
                    </p>
                  </div>
                </div>

                {myAssignments.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      Geen vast rooster
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Er is nog geen vast rooster voor je ingesteld. Neem
                      contact op met je manager.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      Mijn rooster functionaliteit komt binnenkort...
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Navigation for Employees */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  🔍 Andere Dagen Bekijken
                </h3>
                <div className="flex items-center justify-center gap-2">
                  <Tooltip content="Ga naar de vorige dag" placement="top">
                    <Button
                      onClick={() => navigateDate("prev")}
                      variant="outline"
                      size="md"
                      leftIcon={<ChevronLeftIcon className="h-5 w-5" />}
                      elevation="soft"
                      rounded="lg"
                      className="min-w-[100px] min-h-[44px] flex-1 sm:flex-none"
                    >
                      <span className="hidden sm:inline">Vorige</span>
                      <span className="sm:hidden">◀</span>
                    </Button>
                  </Tooltip>

                  <div className="text-center px-2 sm:px-4 flex-shrink-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {format(new Date(selectedDate), "EEE d MMM", {
                        locale: nl,
                      })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                      {leaveInfo.length} afwezig
                    </p>
                  </div>

                  <Tooltip content="Ga naar de volgende dag" placement="top">
                    <Button
                      onClick={() => navigateDate("next")}
                      variant="outline"
                      size="md"
                      rightIcon={<ChevronRightIcon className="h-5 w-5" />}
                      elevation="soft"
                      rounded="lg"
                      className="min-w-[100px] min-h-[44px] flex-1 sm:flex-none"
                    >
                      <span className="hidden sm:inline">Volgende</span>
                      <span className="sm:hidden">▶</span>
                    </Button>
                  </Tooltip>
                </div>

                <div className="flex justify-center mt-4">
                  <Button
                    onClick={() =>
                      setSelectedDate(new Date().toISOString().split("T")[0])
                    }
                    variant="secondary"
                    size="md"
                    elevation="soft"
                    rounded="lg"
                    className="font-medium min-h-[44px] w-full sm:w-auto"
                  >
                    Vandaag
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Speed Dial for Quick Actions - only for admin/manager */}
      {(session?.user?.role === "ADMIN" ||
        session?.user?.role === "MANAGER") && (
        <SpeedDial
          actions={[
            {
              id: "new-shift",
              label: "Nieuwe Dienst",
              icon: <PlusIcon className="w-5 h-5" />,
              onClick: () =>
                router.push(`/dashboard/schedule/shift?date=${selectedDate}`),
              color: "bg-blue-600 hover:bg-blue-700 text-white",
            },
            {
              id: "print-schedule",
              label: "Rooster Printen",
              icon: <PrinterIcon className="w-5 h-5" />,
              onClick: () => window.print(),
              color: "bg-green-600 hover:bg-green-700 text-white",
            },
            {
              id: "email-schedule",
              label: "Rooster Emailen",
              icon: <EnvelopeIcon className="w-5 h-5" />,
              onClick: () => setShowEmailModal(true),
              color: "bg-purple-600 hover:bg-purple-700 text-white",
            },
            {
              id: "today",
              label: "Naar Vandaag",
              icon: <CalendarIcon className="w-5 h-5" />,
              onClick: () =>
                setSelectedDate(new Date().toISOString().split("T")[0]),
              color: "bg-amber-600 hover:bg-amber-700 text-white",
            },
          ]}
          direction="up"
          size="md"
        />
      )}

      {/* Employee Speed Dial - limited actions */}
      {(session?.user?.role === "EMPLOYEE" ||
        session?.user?.role === "FREELANCER") && (
        <SpeedDial
          actions={[
            {
              id: "my-schedule",
              label: "Mijn Rooster",
              icon: <UserIcon className="w-5 h-5" />,
              onClick: () => setCurrentView("mySchedule"),
              color: "bg-blue-600 hover:bg-blue-700 text-white",
            },
            {
              id: "today",
              label: "Naar Vandaag",
              icon: <CalendarIcon className="w-5 h-5" />,
              onClick: () =>
                setSelectedDate(new Date().toISOString().split("T")[0]),
              color: "bg-green-600 hover:bg-green-700 text-white",
            },
            {
              id: "request-leave",
              label: "Verlof Aanvragen",
              icon: <CalendarDaysIcon className="w-5 h-5" />,
              onClick: () => router.push("/dashboard/leave-requests"),
              color: "bg-purple-600 hover:bg-purple-700 text-white",
            },
          ]}
          direction="up"
          size="md"
        />
      )}

      {/* Auto-Generate Schedule Modal */}
      <AutoScheduleGenerator
        isOpen={showAutoGenerateModal}
        onClose={() => setShowAutoGenerateModal(false)}
        onSuccess={() => {
          setShowAutoGenerateModal(false);
          fetchSchedule();
          fetchWeekShifts();
        }}
        currentDate={selectedDate}
      />

      {/* Email Modal */}
      {showEmailModal && (
        <Modal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          title="📧 Rooster Emailen"
          description="Verstuur het rooster naar medewerkers"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Ontvangers (gescheiden door komma's)"
              value={emailData.recipients}
              onChange={(e) =>
                setEmailData({ ...emailData, recipients: e.target.value })
              }
              placeholder="naam@bedrijf.nl, naam2@bedrijf.nl"
            />
            <Input
              label="Onderwerp"
              value={emailData.subject}
              onChange={(e) =>
                setEmailData({ ...emailData, subject: e.target.value })
              }
              placeholder={`Rooster voor ${format(
                new Date(selectedDate),
                "dd-MM-yyyy"
              )}`}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bericht
              </label>
              <textarea
                value={emailData.message}
                onChange={(e) =>
                  setEmailData({ ...emailData, message: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Optionele bericht bij het rooster..."
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEmailModal(false)}
                disabled={emailLoading}
              >
                Annuleren
              </Button>
              <Button
                onClick={async () => {
                  setEmailLoading(true);
                  try {
                    const response = await fetch("/api/schedule/email", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        ...emailData,
                        scheduleId: schedule?.id,
                        date: selectedDate,
                      }),
                    });

                    if (response.ok) {
                      alert("Email succesvol verzonden!");
                      setShowEmailModal(false);
                      setEmailData({
                        recipients: "",
                        subject: "",
                        message: "",
                      });
                    } else {
                      const data = await response.json();
                      alert(`Fout bij verzenden: ${data.error}`);
                    }
                  } catch (error) {
                    console.error("Error sending email:", error);
                    alert("Er is een fout opgetreden");
                  } finally {
                    setEmailLoading(false);
                  }
                }}
                disabled={emailLoading || !emailData.recipients}
                leftIcon={
                  emailLoading ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <EnvelopeIcon className="h-4 w-4" />
                  )
                }
              >
                {emailLoading ? "Verzenden..." : "Email Versturen"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
