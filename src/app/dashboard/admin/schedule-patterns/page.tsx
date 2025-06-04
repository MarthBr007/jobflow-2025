"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ClockIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  CogIcon,
  Squares2X2Icon,
  UserIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { format, addDays, startOfWeek } from "date-fns";
import { nl } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import MetricCard from "@/components/ui/MetricCard";
import PermissionGuard from "@/components/ui/PermissionGuard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Toast from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";

interface WorkPattern {
  id: string;
  name: string;
  description: string;
  type: "FULLTIME" | "PARTTIME" | "SHIFT" | "FLEXIBLE" | "WEEKEND" | "CUSTOM";
  isActive: boolean;
  workDays: WorkDay[];
  totalHoursPerWeek: number;
  createdAt: string;
  updatedAt: string;
  assignedEmployees: number;
  color: string;
  icon: string;
  // Time-for-time compensation settings
  timeForTimeSettings?: {
    enabled: boolean; // Enable tijd-voor-tijd for this pattern
    overtimeThreshold: number; // Daily overtime threshold (e.g., after 8 hours)
    weeklyOvertimeThreshold: number; // Weekly overtime threshold (e.g., after 40 hours)
    compensationMultiplier: number; // 1.0 = 1:1, 1.5 = 1.5:1 compensation
    maxAccrualHours: number; // Maximum hours that can be accrued
    autoApprovalThreshold: number; // Auto-approve compensation up to X hours
    weekendCompensation: boolean; // Enable weekend time compensation
    eveningCompensation: boolean; // Enable evening time compensation
    nightCompensation: boolean; // Enable night time compensation
    holidayCompensation: boolean; // Enable holiday time compensation
  };
}

interface WorkDay {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  isWorkingDay: boolean;
  startTime?: string;
  endTime?: string;
  breakDuration?: number; // in minutes
  notes?: string;
  alternateWeeks?: {
    week1: { startTime: string; endTime: string; breakDuration?: number };
    week2: { startTime: string; endTime: string; breakDuration?: number };
  };
}

interface Employee {
  id: string;
  name: string;
  email: string;
  employeeType: string;
  currentPattern?: WorkPattern;
  profileImage?: string;
  role: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Maandag", short: "Ma" },
  { value: 2, label: "Dinsdag", short: "Di" },
  { value: 3, label: "Woensdag", short: "Wo" },
  { value: 4, label: "Donderdag", short: "Do" },
  { value: 5, label: "Vrijdag", short: "Vr" },
  { value: 6, label: "Zaterdag", short: "Za" },
  { value: 0, label: "Zondag", short: "Zo" },
];

const PATTERN_TYPES = [
  {
    value: "FULLTIME",
    label: "Fulltime (40u)",
    icon: "👔",
    color: "blue",
    description: "Standaard 40-urige werkweek",
  },
  {
    value: "PARTTIME",
    label: "Parttime",
    icon: "⏰",
    color: "green",
    description: "Minder dan 40 uur per week",
  },
  {
    value: "SHIFT",
    label: "Ploegendienst",
    icon: "🔄",
    color: "purple",
    description: "Wisselende diensten (ochtend/middag/nacht)",
  },
  {
    value: "FLEXIBLE",
    label: "Flexibel",
    icon: "🎯",
    color: "orange",
    description: "Variabele werktijden",
  },
  {
    value: "WEEKEND",
    label: "Weekend",
    icon: "🏖️",
    color: "teal",
    description: "Alleen weekenden",
  },
  {
    value: "CUSTOM",
    label: "Aangepast",
    icon: "⚡",
    color: "pink",
    description: "Volledig aangepaste regeling",
  },
];

export default function SchedulePatternsPage() {
  return (
    <PermissionGuard permission="canManageShifts">
      <SchedulePatternsContent />
    </PermissionGuard>
  );
}

function SchedulePatternsContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();

  const [patterns, setPatterns] = useState<WorkPattern[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<WorkPattern | null>(
    null
  );
  const [editingPattern, setEditingPattern] = useState<WorkPattern | null>(
    null
  );

  const [newPattern, setNewPattern] = useState<Partial<WorkPattern>>({
    name: "",
    description: "",
    type: "FULLTIME",
    isActive: true,
    workDays: DAYS_OF_WEEK.map((day) => ({
      dayOfWeek: day.value,
      isWorkingDay: day.value >= 1 && day.value <= 5, // Default: Monday-Friday
      startTime: "09:00",
      endTime: "17:00",
      breakDuration: 60,
    })),
    color: "blue",
    icon: "👔",
    timeForTimeSettings: {
      enabled: true,
      overtimeThreshold: 8, // Daily overtime after 8 hours
      weeklyOvertimeThreshold: 40, // Weekly overtime after 40 hours
      compensationMultiplier: 1.0, // 1:1 compensation
      maxAccrualHours: 80, // Max 80 hours accrual
      autoApprovalThreshold: 8, // Auto-approve up to 8 hours
      weekendCompensation: true,
      eveningCompensation: true,
      nightCompensation: true,
      holidayCompensation: true,
    },
  });

  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  useEffect(() => {
    fetchPatterns();
    fetchEmployees();
  }, []);

  const fetchPatterns = async () => {
    try {
      const response = await fetch("/api/admin/schedule-patterns");
      if (response.ok) {
        const data = await response.json();
        setPatterns(data);
      }
    } catch (error) {
      console.error("Error fetching patterns:", error);
      showToast("Fout bij ophalen patronen", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/personnel?includePatterns=true");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const calculateTotalHours = (workDays: WorkDay[]) => {
    return workDays.reduce((total, day) => {
      if (!day.isWorkingDay || !day.startTime || !day.endTime) return total;

      const start = new Date(`1970-01-01 ${day.startTime}`);
      const end = new Date(`1970-01-01 ${day.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      const breakHours = (day.breakDuration || 0) / 60;

      return total + Math.max(0, hours - breakHours);
    }, 0);
  };

  const handleCreatePattern = async () => {
    try {
      const totalHours = calculateTotalHours(newPattern.workDays || []);

      const response = await fetch("/api/admin/schedule-patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPattern,
          totalHoursPerWeek: totalHours,
        }),
      });

      if (response.ok) {
        showToast("Werkpatroon succesvol aangemaakt!", "success");
        setShowCreateModal(false);
        setNewPattern({
          name: "",
          description: "",
          type: "FULLTIME",
          isActive: true,
          workDays: DAYS_OF_WEEK.map((day) => ({
            dayOfWeek: day.value,
            isWorkingDay: day.value >= 1 && day.value <= 5,
            startTime: "09:00",
            endTime: "17:00",
            breakDuration: 60,
          })),
          color: "blue",
          icon: "👔",
        });
        fetchPatterns();
      } else {
        throw new Error("Failed to create pattern");
      }
    } catch (error) {
      console.error("Error creating pattern:", error);
      showToast("Fout bij aanmaken patroon", "error");
    }
  };

  const handleAssignPattern = async () => {
    if (!selectedPattern || selectedEmployees.length === 0) return;

    try {
      const response = await fetch("/api/admin/schedule-patterns/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patternId: selectedPattern.id,
          employeeIds: selectedEmployees,
        }),
      });

      if (response.ok) {
        showToast(
          `Patroon toegewezen aan ${selectedEmployees.length} medewerkers`,
          "success"
        );
        setShowAssignModal(false);
        setSelectedEmployees([]);
        fetchEmployees();
        fetchPatterns();
      }
    } catch (error) {
      console.error("Error assigning pattern:", error);
      showToast("Fout bij toewijzen patroon", "error");
    }
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const getPatternTypeConfig = (type: string) => {
    return PATTERN_TYPES.find((t) => t.value === type) || PATTERN_TYPES[0];
  };

  const updateWorkDay = (dayIndex: number, updates: Partial<WorkDay>) => {
    const updatedWorkDays = [...(newPattern.workDays || [])];
    updatedWorkDays[dayIndex] = { ...updatedWorkDays[dayIndex], ...updates };
    setNewPattern({ ...newPattern, workDays: updatedWorkDays });
  };

  const getPatternStats = () => {
    const total = patterns.length;
    const active = patterns.filter((p) => p.isActive).length;
    const totalAssigned = patterns.reduce(
      (sum, p) => sum + p.assignedEmployees,
      0
    );
    const avgHours =
      patterns.length > 0
        ? patterns.reduce((sum, p) => sum + p.totalHoursPerWeek, 0) /
          patterns.length
        : 0;

    return { total, active, totalAssigned, avgHours };
  };

  const stats = getPatternStats();

  if (loading) {
    return (
      <LoadingSpinner
        size="lg"
        variant="bars"
        message="Werkpatronen laden..."
        description="Ophalen van werkpatronen en toewijzingen"
        centerInParent={true}
      />
    );
  }

  return (
    <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard" },
          { label: "Werkpatronen" },
        ]}
        className="mb-6"
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-bold text-gray-900 dark:text-white">
              <Squares2X2Icon className="w-8 h-8 mr-3 text-indigo-600" />
              Werkpatronen
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Beheer flexibele werkpatronen voor verschillende types medewerkers
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/admin/schedule-templates")}
              leftIcon={<CalendarDaysIcon className="h-5 w-5" />}
            >
              Rooster Templates
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              leftIcon={<PlusIcon className="h-5 w-5" />}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Nieuw Patroon
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Totaal Patronen"
          value={stats.total}
          icon={<Squares2X2Icon className="w-8 h-8" />}
          color="blue"
          subtitle="Beschikbare patronen"
        />
        <MetricCard
          title="Actieve Patronen"
          value={stats.active}
          icon={<CheckCircleIcon className="w-8 h-8" />}
          color="green"
          subtitle="In gebruik"
        />
        <MetricCard
          title="Toegewezen"
          value={stats.totalAssigned}
          icon={<UserGroupIcon className="w-8 h-8" />}
          color="purple"
          subtitle="Medewerkers met patroon"
        />
        <MetricCard
          title="Gem. Uren/Week"
          value={Math.round(stats.avgHours)}
          icon={<ClockIcon className="w-8 h-8" />}
          color="orange"
          subtitle="Gemiddelde werkuren"
        />
      </div>

      {/* Patterns List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Beschikbare Werkpatronen
          </h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {patterns.length} patronen gevonden
          </div>
        </div>

        {patterns.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <Squares2X2Icon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Nog geen werkpatronen
              </h3>
              <p className="mb-6 text-gray-500 dark:text-gray-400">
                Maak je eerste werkpatroon aan om flexibele roosters te kunnen
                toewijzen
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                leftIcon={<PlusIcon className="h-5 w-5" />}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Eerste Patroon Aanmaken
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-hidden">
              {/* Desktop Table Header - hidden on mobile */}
              <div className="hidden md:block bg-gray-50 dark:bg-gray-700/30 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="col-span-3">Patroon</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-3">Werkdagen</div>
                  <div className="col-span-2">Uren/Week</div>
                  <div className="col-span-1">Toegewezen</div>
                  <div className="col-span-1">Acties</div>
                </div>
              </div>

              {/* Pattern Rows */}
              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                {patterns.map((pattern) => {
                  const typeConfig = getPatternTypeConfig(pattern.type);
                  const workingDays = pattern.workDays.filter(
                    (d) => d.isWorkingDay
                  );

                  return (
                    <motion.div
                      key={pattern.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors duration-150"
                    >
                      {/* Desktop Layout */}
                      <div className="hidden md:block px-6 py-4">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Pattern Name & Description */}
                          <div className="col-span-3">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`p-2 rounded-lg bg-${typeConfig.color}-100 dark:bg-${typeConfig.color}-900/20 flex-shrink-0`}
                              >
                                <span className="text-lg">{pattern.icon}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {pattern.name}
                                  </h3>
                                  {pattern.isActive ? (
                                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                                  ) : (
                                    <XCircleIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {pattern.description}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Type */}
                          <div className="col-span-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-${typeConfig.color}-100 text-${typeConfig.color}-800 dark:bg-${typeConfig.color}-900/20 dark:text-${typeConfig.color}-200`}
                            >
                              {typeConfig.label}
                            </span>
                          </div>

                          {/* Working Days Preview */}
                          <div className="col-span-3">
                            <div className="flex items-center space-x-1">
                              {DAYS_OF_WEEK.map((day) => {
                                const workDay = pattern.workDays.find(
                                  (wd) => wd.dayOfWeek === day.value
                                );
                                const isWorking = workDay?.isWorkingDay;

                                return (
                                  <div
                                    key={day.value}
                                    className={`w-6 h-6 text-xs font-medium rounded-full flex items-center justify-center ${
                                      isWorking
                                        ? `bg-${typeConfig.color}-100 text-${typeConfig.color}-800 dark:bg-${typeConfig.color}-900/20 dark:text-${typeConfig.color}-200`
                                        : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                                    }`}
                                    title={`${day.label}${
                                      isWorking
                                        ? ` (${workDay?.startTime}-${workDay?.endTime})`
                                        : " (vrij)"
                                    }`}
                                  >
                                    {day.short.charAt(0)}
                                  </div>
                                );
                              })}
                              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                {workingDays.length} dagen
                              </span>
                            </div>
                          </div>

                          {/* Hours per Week */}
                          <div className="col-span-2">
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                {pattern.totalHoursPerWeek}u
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                per week
                              </div>
                            </div>
                          </div>

                          {/* Assigned Employees */}
                          <div className="col-span-1">
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <UserIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {pattern.assignedEmployees}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="col-span-1">
                            <div className="flex items-center justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPattern(pattern);
                                  setShowAssignModal(true);
                                }}
                                className="p-1.5"
                                title="Toewijzen aan medewerkers"
                              >
                                <UserGroupIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingPattern(pattern)}
                                className="p-1.5"
                                title="Bewerken"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  /* Handle duplicate */
                                }}
                                className="p-1.5"
                                title="Dupliceren"
                              >
                                <DocumentDuplicateIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Layout */}
                      <div className="block md:hidden p-4">
                        <div className="space-y-4">
                          {/* Header with icon, name and status */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div
                                className={`p-2 rounded-lg bg-${typeConfig.color}-100 dark:bg-${typeConfig.color}-900/20 flex-shrink-0`}
                              >
                                <span className="text-lg">{pattern.icon}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {pattern.name}
                                  </h3>
                                  {pattern.isActive ? (
                                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                                  ) : (
                                    <XCircleIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                  {pattern.description}
                                </p>
                              </div>
                            </div>

                            {/* Mobile actions */}
                            <div className="flex items-center space-x-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPattern(pattern);
                                  setShowAssignModal(true);
                                }}
                                className="p-2"
                              >
                                <UserGroupIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingPattern(pattern)}
                                className="p-2"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Type badge */}
                          <div>
                            <span
                              className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-${typeConfig.color}-100 text-${typeConfig.color}-800 dark:bg-${typeConfig.color}-900/20 dark:text-${typeConfig.color}-200`}
                            >
                              {typeConfig.label}
                            </span>
                          </div>

                          {/* Stats grid */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Uren per week
                              </div>
                              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                {pattern.totalHoursPerWeek}u
                              </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Toegewezen
                              </div>
                              <div className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <UserIcon className="w-4 h-4 mr-1 text-gray-400" />
                                {pattern.assignedEmployees}
                              </div>
                            </div>
                          </div>

                          {/* Working days */}
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                              Werkdagen ({workingDays.length} dagen)
                            </div>
                            <div className="flex items-center space-x-1">
                              {DAYS_OF_WEEK.map((day) => {
                                const workDay = pattern.workDays.find(
                                  (wd) => wd.dayOfWeek === day.value
                                );
                                const isWorking = workDay?.isWorkingDay;

                                return (
                                  <div
                                    key={day.value}
                                    className={`w-8 h-8 text-xs font-medium rounded-full flex items-center justify-center ${
                                      isWorking
                                        ? `bg-${typeConfig.color}-100 text-${typeConfig.color}-800 dark:bg-${typeConfig.color}-900/20 dark:text-${typeConfig.color}-200`
                                        : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                                    }`}
                                    title={`${day.label}${
                                      isWorking
                                        ? ` (${workDay?.startTime}-${workDay?.endTime})`
                                        : " (vrij)"
                                    }`}
                                  >
                                    {day.short.charAt(0)}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Create Pattern Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="🎯 Nieuw Werkpatroon"
        description="Maak een flexibel werkpatroon voor verschillende types medewerkers"
        size="xl"
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Input
              label="Naam van het patroon"
              value={newPattern.name}
              onChange={(e) =>
                setNewPattern({ ...newPattern, name: e.target.value })
              }
              placeholder="Bijv. Parttime 24u, Fulltime Standard..."
              required
            />
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Type patroon
              </label>
              <select
                value={newPattern.type}
                onChange={(e) => {
                  const selectedType = e.target.value as any;
                  const typeConfig = getPatternTypeConfig(selectedType);
                  setNewPattern({
                    ...newPattern,
                    type: selectedType,
                    color: typeConfig.color,
                    icon: typeConfig.icon,
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {PATTERN_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Beschrijving
            </label>
            <textarea
              value={newPattern.description}
              onChange={(e) =>
                setNewPattern({ ...newPattern, description: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Beschrijf voor welke medewerkers dit patroon geschikt is..."
            />
          </div>

          {/* Time-for-Time Compensation Settings */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <ClockIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  ⏰ Tijd-voor-Tijd Instellingen
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configureer overwerk compensatie en tijd-voor-tijd regels
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Enable Time-for-Time */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Tijd-voor-Tijd Inschakelen
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Activeer compensatie uren voor overwerk
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={newPattern.timeForTimeSettings?.enabled || false}
                  onChange={(e) =>
                    setNewPattern({
                      ...newPattern,
                      timeForTimeSettings: {
                        ...newPattern.timeForTimeSettings!,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
              </div>

              {newPattern.timeForTimeSettings?.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Daily Overtime Threshold */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dagelijkse Overwerk Drempel
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={
                          newPattern.timeForTimeSettings?.overtimeThreshold || 8
                        }
                        onChange={(e) =>
                          setNewPattern({
                            ...newPattern,
                            timeForTimeSettings: {
                              ...newPattern.timeForTimeSettings!,
                              overtimeThreshold:
                                parseFloat(e.target.value) || 8,
                            },
                          })
                        }
                        min="4"
                        max="12"
                        step="0.5"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <span className="text-sm text-gray-500">uur per dag</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Na hoeveel uur per dag begint overwerk
                    </p>
                  </div>

                  {/* Weekly Overtime Threshold */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Wekelijkse Overwerk Drempel
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={
                          newPattern.timeForTimeSettings
                            ?.weeklyOvertimeThreshold || 40
                        }
                        onChange={(e) =>
                          setNewPattern({
                            ...newPattern,
                            timeForTimeSettings: {
                              ...newPattern.timeForTimeSettings!,
                              weeklyOvertimeThreshold:
                                parseFloat(e.target.value) || 40,
                            },
                          })
                        }
                        min="20"
                        max="60"
                        step="1"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <span className="text-sm text-gray-500">
                        uur per week
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Na hoeveel uur per week begint overwerk
                    </p>
                  </div>

                  {/* Compensation Multiplier */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Compensatie Verhouding
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={
                          newPattern.timeForTimeSettings
                            ?.compensationMultiplier || 1.0
                        }
                        onChange={(e) =>
                          setNewPattern({
                            ...newPattern,
                            timeForTimeSettings: {
                              ...newPattern.timeForTimeSettings!,
                              compensationMultiplier:
                                parseFloat(e.target.value) || 1.0,
                            },
                          })
                        }
                        min="1.0"
                        max="2.0"
                        step="0.1"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <span className="text-sm text-gray-500">
                        :1 verhouding
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      1.0 = 1:1, 1.5 = 1.5:1 compensatie
                    </p>
                  </div>

                  {/* Max Accrual Hours */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Maximum Opbouw Uren
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={
                          newPattern.timeForTimeSettings?.maxAccrualHours || 80
                        }
                        onChange={(e) =>
                          setNewPattern({
                            ...newPattern,
                            timeForTimeSettings: {
                              ...newPattern.timeForTimeSettings!,
                              maxAccrualHours: parseInt(e.target.value) || 80,
                            },
                          })
                        }
                        min="20"
                        max="200"
                        step="10"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <span className="text-sm text-gray-500">
                        uur maximaal
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Maximaal op te bouwen compensatie uren
                    </p>
                  </div>

                  {/* Auto Approval Threshold */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Auto-Goedkeuring Drempel
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={
                          newPattern.timeForTimeSettings
                            ?.autoApprovalThreshold || 8
                        }
                        onChange={(e) =>
                          setNewPattern({
                            ...newPattern,
                            timeForTimeSettings: {
                              ...newPattern.timeForTimeSettings!,
                              autoApprovalThreshold:
                                parseInt(e.target.value) || 8,
                            },
                          })
                        }
                        min="0"
                        max="24"
                        step="1"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <span className="text-sm text-gray-500">
                        uur auto-approve
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Automatisch goedkeuren tot X uur per aanvraag
                    </p>
                  </div>

                  {/* Compensation Types */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Extra Compensatie Types
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <label className="flex items-center space-x-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input
                          type="checkbox"
                          checked={
                            newPattern.timeForTimeSettings
                              ?.weekendCompensation || false
                          }
                          onChange={(e) =>
                            setNewPattern({
                              ...newPattern,
                              timeForTimeSettings: {
                                ...newPattern.timeForTimeSettings!,
                                weekendCompensation: e.target.checked,
                              },
                            })
                          }
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          🏖️ Weekend
                        </span>
                      </label>

                      <label className="flex items-center space-x-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input
                          type="checkbox"
                          checked={
                            newPattern.timeForTimeSettings
                              ?.eveningCompensation || false
                          }
                          onChange={(e) =>
                            setNewPattern({
                              ...newPattern,
                              timeForTimeSettings: {
                                ...newPattern.timeForTimeSettings!,
                                eveningCompensation: e.target.checked,
                              },
                            })
                          }
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          🌅 Avond
                        </span>
                      </label>

                      <label className="flex items-center space-x-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input
                          type="checkbox"
                          checked={
                            newPattern.timeForTimeSettings?.nightCompensation ||
                            false
                          }
                          onChange={(e) =>
                            setNewPattern({
                              ...newPattern,
                              timeForTimeSettings: {
                                ...newPattern.timeForTimeSettings!,
                                nightCompensation: e.target.checked,
                              },
                            })
                          }
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          🌙 Nacht
                        </span>
                      </label>

                      <label className="flex items-center space-x-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input
                          type="checkbox"
                          checked={
                            newPattern.timeForTimeSettings
                              ?.holidayCompensation || false
                          }
                          onChange={(e) =>
                            setNewPattern({
                              ...newPattern,
                              timeForTimeSettings: {
                                ...newPattern.timeForTimeSettings!,
                                holidayCompensation: e.target.checked,
                              },
                            })
                          }
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          🎉 Feestdag
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Work Days Configuration */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              📅 Werkdagen Configuratie
            </h4>
            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day, index) => {
                const workDay = newPattern.workDays?.[index];

                return (
                  <div
                    key={day.value}
                    className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="w-20">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={workDay?.isWorkingDay || false}
                          onChange={(e) =>
                            updateWorkDay(index, {
                              isWorkingDay: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {day.label}
                        </span>
                      </label>
                    </div>

                    {workDay?.isWorkingDay && (
                      <>
                        <div className="flex items-center space-x-2">
                          <input
                            type="time"
                            value={workDay.startTime || "09:00"}
                            onChange={(e) =>
                              updateWorkDay(index, {
                                startTime: e.target.value,
                              })
                            }
                            className="px-3 py-1 text-sm border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                          <span className="text-gray-500">tot</span>
                          <input
                            type="time"
                            value={workDay.endTime || "17:00"}
                            onChange={(e) =>
                              updateWorkDay(index, { endTime: e.target.value })
                            }
                            className="px-3 py-1 text-sm border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <ClockIcon className="w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            value={workDay.breakDuration || 60}
                            onChange={(e) =>
                              updateWorkDay(index, {
                                breakDuration: parseInt(e.target.value),
                              })
                            }
                            min="0"
                            max="480"
                            step="15"
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                          <span className="text-sm text-gray-500">
                            min pauze
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-indigo-900 dark:text-indigo-200">
                  Totaal uren per week:
                </span>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {Math.round(
                    calculateTotalHours(newPattern.workDays || []) * 10
                  ) / 10}
                  u
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Annuleren
            </Button>
            <Button
              onClick={handleCreatePattern}
              disabled={!newPattern.name}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Patroon Aanmaken
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Pattern Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedEmployees([]);
        }}
        title="👥 Patroon Toewijzen"
        description={`Wijs het patroon "${selectedPattern?.name}" toe aan medewerkers`}
        size="xl"
      >
        {selectedPattern && (
          <div className="space-y-6">
            {/* Pattern Summary */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">{selectedPattern.icon}</span>
                <div>
                  <h4 className="font-semibold text-indigo-900 dark:text-indigo-200">
                    {selectedPattern.name}
                  </h4>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">
                    {selectedPattern.totalHoursPerWeek}u per week •{" "}
                    {
                      selectedPattern.workDays.filter((d) => d.isWorkingDay)
                        .length
                    }{" "}
                    werkdagen
                  </p>
                </div>
              </div>
            </div>

            {/* Employee Selection */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Selecteer Medewerkers
              </h4>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    onClick={() => toggleEmployeeSelection(employee.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedEmployees.includes(employee.id)
                        ? "border-indigo-300 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-900/20"
                        : "border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {employee.profileImage ? (
                          <img
                            src={employee.profileImage}
                            alt={employee.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {employee.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {selectedEmployees.includes(employee.id) && (
                          <CheckCircleIcon className="absolute -bottom-1 -right-1 w-5 h-5 text-indigo-600 bg-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {employee.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {employee.employeeType}
                        </p>
                      </div>
                    </div>
                    {employee.currentPattern && (
                      <div className="text-right">
                        <p className="text-xs text-orange-600 dark:text-orange-400">
                          Huidige: {employee.currentPattern.name}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedEmployees.length} medewerkers geselecteerd
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedEmployees([]);
                  }}
                >
                  Annuleren
                </Button>
                <Button
                  onClick={handleAssignPattern}
                  disabled={selectedEmployees.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Patroon Toewijzen
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
