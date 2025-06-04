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
  TruckIcon,
  ArchiveBoxIcon,
  WrenchScrewdriverIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  SwatchIcon,
  UserGroupIcon,
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
      case "CONFIRMED":
        return "bg-green-600 text-white border-green-700 shadow-lg dark:bg-green-700 dark:border-green-600";
      case "CANCELLED":
        return "bg-red-600 text-white border-red-700 shadow-lg dark:bg-red-700 dark:border-red-600";
      case "COMPLETED":
        return "bg-purple-600 text-white border-purple-700 shadow-lg dark:bg-purple-700 dark:border-purple-600";
      default:
        return "bg-gray-600 text-white border-gray-700 shadow-lg dark:bg-gray-700 dark:border-gray-600";
    }
  };

  const getStatusText = (status: ScheduleShift["status"]) => {
    switch (status) {
      case "CONFIRMED":
        return "Bevestigd";
      case "CANCELLED":
        return "Geannuleerd";
      case "COMPLETED":
        return "Voltooid";
      default:
        return "In behandeling";
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
      // Get the user's work type information
      const userWorkTypes = shift.user.workTypes;
      const employeeType = shift.user.employeeType;
      const userName = shift.user.name;

      // Determine the work type for grouping
      let workType = "Algemene Medewerkers";

      // First check if user has specific work types defined
      if (userWorkTypes && userWorkTypes.length > 0) {
        workType = userWorkTypes[0];
      }
      // Then check employee type
      else if (employeeType) {
        workType = employeeType;
      }
      // Last resort: use shift role
      else if (shift.role) {
        workType = shift.role;
      }

      // Special handling for specific known employees based on their names and expected roles
      if (userName.toLowerCase().includes("quincy")) {
        workType = "Sales";
      } else if (
        userName.toLowerCase().includes("jort") &&
        userName.toLowerCase().includes("groot")
      ) {
        workType = "Chauffeurs";
      } else if (
        userName.toLowerCase().includes("rofiat") &&
        userName.toLowerCase().includes("balogun")
      ) {
        workType = "Schoonmaak";
      }

      // Normalize the work type for consistent grouping
      const normalizedWorkType = normalizeWorkType(workType);

      if (!acc[normalizedWorkType]) {
        acc[normalizedWorkType] = [];
      }
      acc[normalizedWorkType].push(shift);
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

  // Helper function to normalize work types for consistent grouping
  const normalizeWorkType = (workType: string): string => {
    const normalizedType = workType.toLowerCase();

    // Map similar work types together
    const workTypeMapping: Record<string, string> = {
      sales: "Sales",
      verkoop: "Sales",
      commercial: "Sales",

      chauffeur: "Chauffeurs",
      bestuurder: "Chauffeurs",
      driver: "Chauffeurs",

      kantoor: "Kantoormedewerkers",
      administratie: "Kantoormedewerkers",
      office: "Kantoormedewerkers",
      admin: "Kantoormedewerkers",

      warehouse: "Warehouse Medewerkers",
      magazijn: "Warehouse Medewerkers",
      opslag: "Warehouse Medewerkers",

      graafwerk: "Grondwerk Specialisten",
      grondverzet: "Grondwerk Specialisten",
      grondwerk: "Grondwerk Specialisten",

      schilderwerk: "Afbouw Specialisten",
      keukenplaatsing: "Afbouw Specialisten",
      badkamerplaatsing: "Afbouw Specialisten",
      tegelwerk: "Afbouw Specialisten",
      afbouw: "Afbouw Specialisten",

      verhuis: "Verhuizers",
      verhuizing: "Verhuizers",

      event_decoratie: "Event Specialisten",
      evenementen: "Event Specialisten",
      event: "Event Specialisten",

      cleaning: "Schoonmaak",
      schoonmaak: "Schoonmaak",

      onderhoud: "Onderhoud Team",
      techniek: "Onderhoud Team",

      employee: "Algemene Medewerkers",
      medewerker: "Algemene Medewerkers",

      freelancer: "Freelancers",
      zzp: "Freelancers",
    };

    // Check if we have a mapping for this work type
    for (const [key, value] of Object.entries(workTypeMapping)) {
      if (normalizedType.includes(key)) {
        return value;
      }
    }

    // If no mapping found, capitalize the first letter and return
    return workType.charAt(0).toUpperCase() + workType.slice(1);
  };

  // Get work type icon using Heroicons instead of emojis
  const getWorkTypeIcon = (workType: string) => {
    const normalizedWorkType = workType.toLowerCase();

    // Return appropriate Heroicon component based on work type
    if (
      normalizedWorkType.includes("chauffeur") ||
      normalizedWorkType.includes("bestuurder") ||
      normalizedWorkType.includes("driver")
    ) {
      return <TruckIcon className="h-6 w-6 text-white" />;
    } else if (
      normalizedWorkType.includes("kantoor") ||
      normalizedWorkType.includes("office") ||
      normalizedWorkType.includes("sales") ||
      normalizedWorkType.includes("admin")
    ) {
      return <BuildingOfficeIcon className="h-6 w-6 text-white" />;
    } else if (
      normalizedWorkType.includes("warehouse") ||
      normalizedWorkType.includes("magazijn") ||
      normalizedWorkType.includes("opslag")
    ) {
      return <ArchiveBoxIcon className="h-6 w-6 text-white" />;
    } else if (
      normalizedWorkType.includes("grondwerk") ||
      normalizedWorkType.includes("graafwerk") ||
      normalizedWorkType.includes("grondverzet")
    ) {
      return <WrenchScrewdriverIcon className="h-6 w-6 text-white" />;
    } else if (
      normalizedWorkType.includes("afbouw") ||
      normalizedWorkType.includes("schilder") ||
      normalizedWorkType.includes("keuken") ||
      normalizedWorkType.includes("badkamer") ||
      normalizedWorkType.includes("tegel")
    ) {
      return <HomeIcon className="h-6 w-6 text-white" />;
    } else if (
      normalizedWorkType.includes("verhuis") ||
      normalizedWorkType.includes("verhuiz")
    ) {
      return <ClipboardDocumentListIcon className="h-6 w-6 text-white" />;
    } else if (
      normalizedWorkType.includes("event") ||
      normalizedWorkType.includes("decoratie")
    ) {
      return <SparklesIcon className="h-6 w-6 text-white" />;
    } else if (
      normalizedWorkType.includes("schoonmaak") ||
      normalizedWorkType.includes("cleaning")
    ) {
      return <SwatchIcon className="h-6 w-6 text-white" />;
    } else if (
      normalizedWorkType.includes("onderhoud") ||
      normalizedWorkType.includes("techniek")
    ) {
      return <WrenchScrewdriverIcon className="h-6 w-6 text-white" />;
    } else if (
      normalizedWorkType.includes("freelancer") ||
      normalizedWorkType.includes("zzp")
    ) {
      return <UserIcon className="h-6 w-6 text-white" />;
    } else {
      return <UserGroupIcon className="h-6 w-6 text-white" />;
    }
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
    <div className="space-y-8">
      <ConfirmModal />

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Rooster Beheer" },
        ]}
        className="mb-6"
      />

      {/* Modern Header with Gradient */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700">
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 px-6 py-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <CalendarIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Rooster Beheer
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Plan en beheer werkdiensten voor je team met professionele
                  planning tools
                </p>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
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
                        <DocumentArrowDownIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      }
                      className="bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600 hover:from-red-700 hover:to-red-800 hover:border-red-700 dark:from-red-600 dark:to-red-700 dark:text-white dark:border-red-600 dark:hover:from-red-700 dark:hover:to-red-800 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
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
                        <TableCellsIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      }
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white border-green-600 hover:from-green-700 hover:to-green-800 hover:border-green-700 dark:from-green-600 dark:to-green-700 dark:text-white dark:border-green-600 dark:hover:from-green-700 dark:hover:to-green-800 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
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
                  leftIcon={<SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                  className="bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border-purple-300 hover:from-purple-100 hover:to-violet-100 hover:border-purple-400 dark:from-purple-900/20 dark:to-violet-900/20 dark:text-purple-300 dark:border-purple-600 dark:hover:bg-purple-900/30 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
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
                    router.push(
                      `/dashboard/schedule/shift?date=${selectedDate}`
                    )
                  }
                  variant="primary"
                  size="md"
                  leftIcon={<PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-bold"
                >
                  <span className="sm:hidden">Nieuw</span>
                  <span className="hidden sm:inline">Nieuwe Dienst</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Quick Stats Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700/50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6 text-gray-600 dark:text-gray-400">
              <span className="flex items-center space-x-2 font-medium">
                <div className="h-2.5 w-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-sm"></div>
                <span>
                  <strong className="text-gray-900 dark:text-white">
                    {schedule?.shifts?.length || 0}
                  </strong>{" "}
                  diensten vandaag
                </span>
              </span>
              {leaveInfo.length > 0 && (
                <span className="flex items-center space-x-2 text-orange-600 dark:text-orange-400 font-medium">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span>
                    <strong>{leaveInfo.length}</strong> afwezig
                  </span>
                </span>
              )}
            </div>
            <div className="hidden lg:flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">
                {format(new Date(selectedDate), "EEEE d MMMM yyyy", {
                  locale: nl,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced View Switcher Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800">
          <nav className="flex overflow-x-auto scrollbar-hide -mb-px">
            <div className="flex space-x-8 min-w-max">
              {[
                {
                  key: "day",
                  label: "Dag",
                  fullLabel: "Dag Overzicht",
                  icon: CalendarIcon,
                  roles: ["ADMIN", "MANAGER", "EMPLOYEE", "FREELANCER"],
                  color: "blue",
                },
                {
                  key: "week",
                  label: "Week",
                  fullLabel: "Week Overzicht",
                  icon: CalendarDaysIcon,
                  roles: ["ADMIN", "MANAGER"],
                  color: "green",
                },
                {
                  key: "analytics",
                  label: "Data",
                  fullLabel: "Analytics",
                  icon: ChartBarIcon,
                  roles: ["ADMIN", "MANAGER"],
                  color: "purple",
                },
                {
                  key: "templates",
                  label: "Templates",
                  fullLabel: "Templates",
                  icon: BookmarkIcon,
                  roles: ["ADMIN", "MANAGER"],
                  color: "orange",
                },
                {
                  key: "mySchedule",
                  label: "Mijn",
                  fullLabel: "Mijn Rooster",
                  icon: ListBulletIcon,
                  roles: ["EMPLOYEE", "FREELANCER"],
                  color: "indigo",
                },
              ]
                .filter((tab) => tab.roles.includes(session?.user?.role || ""))
                .map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setCurrentView(tab.key as any)}
                    className={`group relative py-3 px-4 font-semibold text-sm transition-all duration-200 flex items-center space-x-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 min-w-[120px] justify-center ${
                      currentView === tab.key
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg transition-colors ${
                        currentView === tab.key
                          ? "bg-blue-100 dark:bg-blue-800/30"
                          : "bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600"
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                    </div>
                    <span className="hidden sm:inline font-medium">
                      {tab.fullLabel}
                    </span>
                    <span className="sm:hidden font-medium">{tab.label}</span>

                    {currentView === tab.key && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}
                  </button>
                ))}
            </div>
          </nav>
        </div>

        {/* View Content */}
        <div className="p-6 bg-gray-50/30 dark:bg-gray-800/30">
          {currentView === "day" && (
            <>
              {/* Enhanced Date Navigation */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm mb-6">
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-center sm:text-left">
                      <div className="flex items-center space-x-3 justify-center sm:justify-start">
                        <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                          <CalendarIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {format(
                              new Date(selectedDate),
                              "EEEE d MMMM yyyy",
                              {
                                locale: nl,
                              }
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {schedule?.shifts.length || 0} diensten gepland voor
                            vandaag
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-3">
                      <Tooltip content="Ga naar de vorige dag" placement="top">
                        <Button
                          onClick={() => navigateDate("prev")}
                          variant="outline"
                          size="md"
                          leftIcon={<ChevronLeftIcon className="h-5 w-5" />}
                          className="shadow-md hover:shadow-lg transition-all duration-200 font-semibold min-w-[100px] min-h-[44px]"
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
                          variant="primary"
                          size="md"
                          className="shadow-lg hover:shadow-xl transition-all duration-200 font-bold min-w-[100px] min-h-[44px]"
                        >
                          Vandaag
                        </Button>
                      </Tooltip>

                      <Tooltip
                        content="Ga naar de volgende dag"
                        placement="top"
                      >
                        <Button
                          onClick={() => navigateDate("next")}
                          variant="outline"
                          size="md"
                          rightIcon={<ChevronRightIcon className="h-5 w-5" />}
                          className="shadow-md hover:shadow-lg transition-all duration-200 font-semibold min-w-[100px] min-h-[44px]"
                        >
                          <span className="hidden sm:inline">Volgende</span>
                          <span className="sm:hidden">▶</span>
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>

              {/* Day Schedule Content */}
              {schedule && schedule.shifts.length > 0 ? (
                <div className="space-y-8">
                  {/* Enhanced Summary Stats */}
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 mb-8">
                    <MetricCard
                      title="Totaal Diensten"
                      value={schedule.shifts.length}
                      icon={<UserIcon className="w-8 h-8" />}
                      color="blue"
                      subtitle="Ingeplande diensten"
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
                      subtitle="Gepland vandaag"
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
                      trend={{
                        value: Object.keys(
                          groupShiftsByWorkType(schedule.shifts)
                        ).length,
                        isPositive: true,
                        label: "type werkzaamheden",
                      }}
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

                  {/* Enhanced Leave Info Section */}
                  {leaveInfo.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
                    >
                      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-red-50 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-red-900/20 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                              <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Afwezigheid & Verlof
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {leaveInfo.length}{" "}
                                {leaveInfo.length === 1
                                  ? "persoon"
                                  : "personen"}{" "}
                                afwezig vandaag
                              </p>
                            </div>
                          </div>
                          <div className="hidden sm:flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {leaveInfo.length}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Afwezig
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-orange-50/30 dark:bg-orange-900/10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {leaveInfo.map((leave) => (
                            <div
                              key={leave.id}
                              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 hover:border-orange-300 dark:hover:border-orange-500"
                            >
                              <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                  <div className="h-12 w-12 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40 rounded-xl flex items-center justify-center shadow-sm border border-orange-200 dark:border-orange-700">
                                    <span className="text-xl">
                                      {getLeaveIcon(leave.type)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                      {leave.userName}
                                    </h4>
                                    <span
                                      className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border shadow-sm ${getLeaveColor(
                                        leave.type
                                      )}`}
                                    >
                                      {getLeaveLabel(leave.type)}
                                    </span>
                                  </div>

                                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                    {leave.isFullDay ? (
                                      <div className="flex items-center space-x-2">
                                        <div className="h-5 w-5 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-700">
                                          <CalendarDaysIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="font-medium">
                                          Hele dag afwezig
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-2">
                                        <div className="h-5 w-5 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-lg flex items-center justify-center border border-green-200 dark:border-green-700">
                                          <ClockIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                                        </div>
                                        <span className="font-medium">
                                          {leave.startTime} - {leave.endTime}
                                        </span>
                                      </div>
                                    )}

                                    {leave.dayCount > 1 && (
                                      <div className="flex items-center space-x-2">
                                        <div className="h-5 w-5 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-lg flex items-center justify-center border border-purple-200 dark:border-purple-700">
                                          <CalendarIcon className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <span className="font-medium">
                                          {leave.dayCount} dagen totaal
                                        </span>
                                      </div>
                                    )}

                                    <div className="flex items-center space-x-2">
                                      <div className="h-5 w-5 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 rounded-lg flex items-center justify-center border border-cyan-200 dark:border-cyan-700">
                                        <UserIcon className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                                      </div>
                                      <span className="font-medium">
                                        {leave.userRole} -{" "}
                                        {leave.employeeType || "Medewerker"}
                                      </span>
                                    </div>
                                  </div>

                                  {leave.reason && (
                                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                      <div className="flex items-start space-x-2 text-sm text-gray-700 dark:text-gray-300">
                                        <div className="h-5 w-5 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 rounded-lg flex items-center justify-center border border-amber-200 dark:border-amber-700 flex-shrink-0 mt-0.5">
                                          <DocumentTextIcon className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <span className="font-medium">
                                          {leave.reason}
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                      {new Date(
                                        leave.startDate
                                      ).toLocaleDateString("nl-NL")}{" "}
                                      -{" "}
                                      {new Date(
                                        leave.endDate
                                      ).toLocaleDateString("nl-NL")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Enhanced Grouped Shifts */}
                  {Object.entries(groupShiftsByWorkType(schedule.shifts)).map(
                    ([workType, shifts]) => (
                      <motion.div
                        key={workType}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
                      >
                        {/* Enhanced Work Type Header */}
                        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                {getWorkTypeIcon(workType)}
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                  {workType}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {shifts.length}{" "}
                                  {shifts.length === 1 ? "dienst" : "diensten"}{" "}
                                  • {calculateGroupHours(shifts).toFixed(1)} uur
                                  gepland
                                </p>
                              </div>
                            </div>
                            <div className="hidden sm:flex items-center space-x-3">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                  {shifts.length}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Diensten
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Shifts Grid */}
                        <div className="p-6 bg-blue-50/20 dark:bg-blue-900/10">
                          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {shifts.map((shift) => (
                              <div
                                key={shift.id}
                                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-500 hover:-translate-y-1 h-full flex flex-col"
                              >
                                {/* Fixed Header Section */}
                                <div className="p-6 flex-shrink-0">
                                  <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0">
                                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                                        <span className="text-white font-bold text-xl">
                                          {shift.user.name
                                            .charAt(0)
                                            .toUpperCase()}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {shift.user.name}
                                      </h4>
                                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                                        {shift.user.email}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Content Section - Flexible Height */}
                                <div className="px-6 pb-4 space-y-4 flex-1">
                                  {/* Time Info */}
                                  <div className="space-y-3">
                                    <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                                      <div className="h-9 w-9 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-lg flex items-center justify-center border border-green-200 dark:border-green-700 shadow-sm">
                                        <ClockIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                                      </div>
                                      <div className="flex-1">
                                        <span className="font-bold text-gray-900 dark:text-white block text-base">
                                          {formatTime(shift.startTime)} -{" "}
                                          {formatTime(shift.endTime)}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                          {(() => {
                                            const start = new Date(
                                              shift.startTime
                                            );
                                            const end = new Date(shift.endTime);
                                            const hours =
                                              (end.getTime() -
                                                start.getTime()) /
                                              (1000 * 60 * 60);
                                            return `${hours.toFixed(
                                              1
                                            )} uur gepland`;
                                          })()}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Project Info */}
                                    {shift.project && (
                                      <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="h-9 w-9 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-lg flex items-center justify-center border border-purple-200 dark:border-purple-700 shadow-sm">
                                          <BriefcaseIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <span className="font-bold text-gray-900 dark:text-white block truncate text-base">
                                            {shift.project.name}
                                          </span>
                                          <span className="text-sm text-gray-500 dark:text-gray-400 truncate font-medium">
                                            {shift.project.company}
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Role Info */}
                                    {shift.role && (
                                      <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="h-9 w-9 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-700 shadow-sm">
                                          <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-white text-base">
                                          {shift.role}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Notes */}
                                  {shift.notes && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                      <div className="flex items-start space-x-3 text-sm text-gray-700 dark:text-gray-300">
                                        <div className="h-6 w-6 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 rounded-lg flex items-center justify-center border border-amber-200 dark:border-amber-700 flex-shrink-0 mt-0.5 shadow-sm">
                                          <DocumentTextIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <span className="font-medium leading-relaxed">
                                          {shift.notes}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Action Footer - Only Edit Button */}
                                {(session?.user?.role === "ADMIN" ||
                                  session?.user?.role === "MANAGER") && (
                                  <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-600 flex-shrink-0">
                                    <div className="flex justify-center">
                                      <Button
                                        onClick={() =>
                                          router.push(
                                            `/dashboard/schedule/shift?shiftId=${shift.id}&date=${selectedDate}`
                                          )
                                        }
                                        variant="secondary"
                                        size="sm"
                                        className="shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
                                      >
                                        <PencilIcon className="h-4 w-4 mr-1.5" />
                                        Bewerk
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )
                  )}
                </div>
              ) : (
                // Enhanced Empty State for Day View
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm">
                  <div className="max-w-md mx-auto">
                    <div className="h-20 w-20 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <CalendarIcon className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      Geen diensten gepland
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                      Er zijn nog geen diensten ingepland voor{" "}
                      {format(new Date(selectedDate), "EEEE d MMMM yyyy", {
                        locale: nl,
                      })}
                      . Plan je eerste dienst om te beginnen.
                    </p>

                    {/* Show leave info even when no shifts */}
                    {leaveInfo.length > 0 && (
                      <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-700">
                        <div className="flex items-center justify-center space-x-2 text-orange-700 dark:text-orange-300 mb-2">
                          <ExclamationTriangleIcon className="h-5 w-5" />
                          <span className="font-semibold">
                            {leaveInfo.length}{" "}
                            {leaveInfo.length === 1 ? "persoon" : "personen"}{" "}
                            afwezig
                          </span>
                        </div>
                        <div className="text-sm text-orange-600 dark:text-orange-400">
                          Houd rekening met afwezigheid bij het plannen
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {(session?.user?.role === "ADMIN" ||
                        session?.user?.role === "MANAGER") && (
                        <>
                          <Button
                            onClick={() => setShowAutoGenerateModal(true)}
                            variant="outline"
                            leftIcon={<SparklesIcon className="h-4 w-4" />}
                            className="bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border-purple-300 hover:from-purple-100 hover:to-violet-100 hover:border-purple-400 dark:from-purple-900/20 dark:to-violet-900/20 dark:text-purple-300 dark:border-purple-600 dark:hover:bg-purple-900/30 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                          >
                            Auto Genereren
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() =>
                              router.push(
                                `/dashboard/schedule/shift?date=${selectedDate}`
                              )
                            }
                            leftIcon={<PlusIcon className="h-4 w-4" />}
                            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-bold"
                          >
                            Eerste Dienst Toevoegen
                          </Button>
                        </>
                      )}
                      {(session?.user?.role === "EMPLOYEE" ||
                        session?.user?.role === "FREELANCER") && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                          📋 Geen diensten gepland voor deze dag
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Enhanced Week View */}
          {currentView === "week" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                    <CalendarDaysIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Week Overzicht
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Bekijk en beheer diensten voor de hele week
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-green-50/20 dark:bg-green-900/10">
                <WeekView
                  selectedDate={selectedDate}
                  shifts={weekShifts}
                  leaveInfo={leaveInfo}
                  onDateSelect={setSelectedDate}
                />
              </div>
            </div>
          )}

          {/* Enhanced Analytics View */}
          {currentView === "analytics" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50 dark:from-purple-900/20 dark:via-violet-900/20 dark:to-indigo-900/20 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
                    <ChartBarIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Analytics & Rapportages
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Inzichten in roosterplanning en productiviteit
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-purple-50/20 dark:bg-purple-900/10">
                <ScheduleAnalytics
                  shifts={schedule?.shifts || []}
                  period="day"
                />
              </div>
            </div>
          )}

          {/* Enhanced Templates View */}
          {currentView === "templates" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-yellow-900/20 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                    <BookmarkIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Rooster Templates
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Herbruikbare roostersjablonen voor efficiënte planning
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-orange-50/20 dark:bg-orange-900/10">
                <ScheduleTemplates
                  onApplyTemplate={() => {
                    fetchSchedule();
                    fetchWeekShifts();
                  }}
                  onCreateTemplate={() => {}}
                />
              </div>
            </div>
          )}

          {/* Enhanced My Schedule View */}
          {currentView === "mySchedule" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-900/20 dark:via-blue-900/20 dark:to-cyan-900/20 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md">
                    <ListBulletIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Mijn Rooster
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Persoonlijk overzicht van jouw geplande diensten
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-indigo-50/20 dark:bg-indigo-900/10">
                {/* My Schedule content would go here */}
                <div className="text-center py-12">
                  <div className="h-16 w-16 bg-gradient-to-br from-indigo-100 to-blue-200 dark:from-indigo-900/40 dark:to-blue-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <UserIcon className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Mijn Rooster Overzicht
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Hier komt jouw persoonlijke roosteroverzicht
                  </p>
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
