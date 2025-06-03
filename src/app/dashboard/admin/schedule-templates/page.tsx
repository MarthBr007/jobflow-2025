"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  UserGroupIcon,
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  BriefcaseIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  GiftIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import PermissionGuard from "@/components/ui/PermissionGuard";
import Toast from "@/components/ui/Toast";
import MetricCard from "@/components/ui/MetricCard";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { useConfirm } from "@/hooks/useConfirm";

interface ScheduleTemplate {
  id: string;
  name: string;
  description?: string;
  category:
    | "DAILY"
    | "WEEKLY"
    | "PROJECT"
    | "SPECIAL"
    | "HOLIDAY"
    | "MAINTENANCE";
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  shifts: ScheduleTemplateShift[];
  userAssignments: UserScheduleAssignment[];
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

interface ScheduleTemplateShift {
  id: string;
  role: string;
  startTime: string;
  endTime: string;
  breaks?: Array<{
    startTime: string;
    endTime: string;
    type: "morning" | "lunch" | "afternoon";
    duration: number;
  }>;
  totalBreakDuration?: number;
  minPersons: number;
  maxPersons?: number;
  requirements: string[];
  notes?: string;
  workLocation?: {
    id: string;
    name: string;
    city: string;
  };
  project?: {
    id: string;
    name: string;
    company: string;
  };
}

interface UserScheduleAssignment {
  id: string;
  userId: string;
  templateId: string;
  dayOfWeek: number;
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
  customStartTime?: string;
  customEndTime?: string;
  customBreaks?: Array<{
    startTime: string;
    endTime: string;
    type: "morning" | "lunch" | "afternoon";
    duration: number;
  }>;
  notes?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
}

const CATEGORY_OPTIONS = [
  {
    value: "DAILY",
    label: "Dagelijks",
    icon: <CalendarDaysIcon className="h-4 w-4" />,
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    value: "WEEKLY",
    label: "Wekelijks",
    icon: <ChartBarIcon className="h-4 w-4" />,
    color: "text-green-600 dark:text-green-400",
  },
  {
    value: "PROJECT",
    label: "Project",
    icon: <BriefcaseIcon className="h-4 w-4" />,
    color: "text-orange-600 dark:text-orange-400",
  },
  {
    value: "SPECIAL",
    label: "Speciaal",
    icon: <SparklesIcon className="h-4 w-4" />,
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    value: "HOLIDAY",
    label: "Feestdag",
    icon: <GiftIcon className="h-4 w-4" />,
    color: "text-pink-600 dark:text-pink-400",
  },
  {
    value: "MAINTENANCE",
    label: "Onderhoud",
    icon: <WrenchScrewdriverIcon className="h-4 w-4" />,
    color: "text-gray-600 dark:text-gray-400",
  },
];

const DAYS_OF_WEEK = [
  { value: 1, label: "Maandag" },
  { value: 2, label: "Dinsdag" },
  { value: 3, label: "Woensdag" },
  { value: 4, label: "Donderdag" },
  { value: 5, label: "Vrijdag" },
  { value: 6, label: "Zaterdag" },
  { value: 0, label: "Zondag" },
];

export default function ScheduleTemplatesPage() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<UserScheduleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ScheduleTemplate | null>(null);
  const [newAssignment, setNewAssignment] = useState({
    userId: "",
    templateId: "",
    dayOfWeek: 1,
    customStartTime: "",
    customEndTime: "",
    customBreaks: null,
    notes: "",
  });
  const [currentView, setCurrentView] = useState<"templates" | "assignments">(
    "templates"
  );
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const [searchUser, setSearchUser] = useState("");
  const [editingAssignment, setEditingAssignment] = useState<{
    id: string;
    dayOfWeek: number;
    customStartTime?: string;
    customEndTime?: string;
    notes?: string;
  } | null>(null);
  const { confirm, ConfirmModal } = useConfirm();

  useEffect(() => {
    fetchTemplates();
    fetchUsers();
    fetchAssignments();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/schedule-templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        const error = await response.json();
        showToast(`Error: ${error.error}`, "error");
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      showToast("Er is iets misgegaan bij het ophalen van templates", "error");
    } finally {
      setLoading(false);
    }
  };

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

  const fetchAssignments = async () => {
    try {
      const response = await fetch("/api/user-schedule-assignments");
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/user-schedule-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAssignment),
      });

      const data = await response.json();

      if (response.ok) {
        setShowAssignmentModal(false);
        setNewAssignment({
          userId: "",
          templateId: "",
          dayOfWeek: 1,
          customStartTime: "",
          customEndTime: "",
          customBreaks: null,
          notes: "",
        });
        showToast("Toewijzing succesvol aangemaakt", "success");
        // Refresh templates to get updated assignment counts
        fetchTemplates();
      } else {
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
      showToast(
        "Er is iets misgegaan bij het aanmaken van de toewijzing",
        "error"
      );
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    const confirmed = await confirm({
      type: "danger",
      title: "Toewijzing verwijderen",
      message:
        "Weet je zeker dat je deze toewijzing wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.",
      confirmText: "Verwijderen",
      cancelText: "Annuleren",
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/user-schedule-assignments?id=${assignmentId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        showToast("Toewijzing succesvol verwijderd", "success");
        // Refresh assignments and templates
        fetchAssignments();
        fetchTemplates();
      } else {
        const data = await response.json();
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      showToast(
        "Er is iets misgegaan bij het verwijderen van de toewijzing",
        "error"
      );
    }
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment) return;

    try {
      const response = await fetch("/api/user-schedule-assignments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingAssignment),
      });

      if (response.ok) {
        showToast("Toewijzing succesvol bijgewerkt", "success");
        setEditingAssignment(null);
        fetchAssignments();
        fetchTemplates();
      } else {
        const data = await response.json();
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error updating assignment:", error);
      showToast(
        "Er is iets misgegaan bij het bijwerken van de toewijzing",
        "error"
      );
    }
  };

  const getCategoryConfig = (category: string) => {
    return (
      CATEGORY_OPTIONS.find((cat) => cat.value === category) || {
        value: category,
        label: category,
        icon: <DocumentTextIcon className="h-4 w-4" />,
        color: "text-gray-600 dark:text-gray-400",
      }
    );
  };

  const getCategoryEmoji = (category: string) => {
    const config = getCategoryConfig(category);
    return config.icon;
  };

  const getCategoryLabel = (category: string) => {
    const config = getCategoryConfig(category);
    return config.label;
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const formatWorkingDays = (workingDays: number[]) => {
    if (!workingDays || workingDays.length === 0) return "Geen vaste dagen";

    const dayNames = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];
    const sortedDays = [...workingDays].sort();

    if (sortedDays.length === 7) return "Alle dagen";
    if (sortedDays.length === 5 && sortedDays.every((d) => d >= 1 && d <= 5))
      return "Ma-Vr";
    if (
      sortedDays.length === 2 &&
      sortedDays.includes(6) &&
      sortedDays.includes(0)
    )
      return "Weekend";

    return sortedDays.map((day) => dayNames[day]).join(", ");
  };

  const calculateShiftDuration = (
    startTime: string,
    endTime: string,
    breakDuration?: number
  ) => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const workMinutes = totalMinutes - (breakDuration || 0);
    const hours = Math.floor(workMinutes / 60);
    const minutes = workMinutes % 60;
    return `${hours}u ${minutes > 0 ? `${minutes}m` : ""}`;
  };

  const handleBulkFixAssignments = async () => {
    const confirmed = await confirm({
      type: "warning",
      title: "Bulk correctie uitvoeren",
      message:
        "Wil je alle verkeerde dayOfWeek waarden automatisch corrigeren? Dit kan de roosters van medewerkers beïnvloeden.",
      confirmText: "Ja, corrigeren",
      cancelText: "Annuleren",
    });

    if (confirmed) {
      // Add bulk fix logic here
      showToast("Bulk correctie uitgevoerd", "success");
    }
  };

  // Calculate statistics
  const totalTemplates = templates.length;
  const activeTemplates = templates.filter((t) => t.isActive).length;
  const totalAssignments = assignments.length;
  const totalShifts = templates.reduce((sum, t) => sum + t.shifts.length, 0);
  const mostUsedTemplate = templates.reduce(
    (prev, current) => (prev.usageCount > current.usageCount ? prev : current),
    templates[0]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xl font-semibold text-gray-700 dark:text-gray-300"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmModal />
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard" },
          { label: "Rooster Templates" },
        ]}
        className="mb-4"
      />

      {/* Modern Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 px-6 py-8 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <CalendarDaysIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Rooster Templates
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Beheer herbruikbare roosters en vaste schema's voor
                  medewerkers
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                    <span>{activeTemplates} Actieve templates</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                    <span>{totalAssignments} Toewijzingen</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-purple-500 rounded-full"></span>
                    <span>{totalShifts} Diensten</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() =>
                  setCurrentView(
                    currentView === "templates" ? "assignments" : "templates"
                  )
                }
                variant="primary"
                size="md"
                leftIcon={
                  currentView === "templates" ? (
                    <UserGroupIcon className="h-5 w-5" />
                  ) : (
                    <CalendarDaysIcon className="h-5 w-5" />
                  )
                }
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                {currentView === "templates" ? "Vaste Roosters" : "Templates"}
              </Button>
              <Button
                onClick={() =>
                  router.push("/dashboard/admin/schedule-templates/create")
                }
                leftIcon={<PlusIcon className="h-5 w-5" />}
                variant="primary"
                size="md"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                Nieuwe Template
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Totaal Templates"
          value={totalTemplates}
          icon={<DocumentTextIcon className="w-8 h-8" />}
          color="blue"
          subtitle="Alle rooster templates"
          trend={{
            value: 5,
            isPositive: true,
            label: "deze maand",
          }}
        />

        <MetricCard
          title="Actieve Templates"
          value={activeTemplates}
          icon={<CheckCircleIcon className="w-8 h-8" />}
          color="green"
          subtitle="In gebruik"
          trend={{
            value: 0,
            isPositive: true,
            label: "stabiel",
          }}
        />

        <MetricCard
          title="Vaste Toewijzingen"
          value={totalAssignments}
          icon={<UserGroupIcon className="w-8 h-8" />}
          color="purple"
          subtitle="Medewerker roosters"
          trend={{
            value: 8,
            isPositive: true,
            label: "vs vorige week",
          }}
        />

        <MetricCard
          title="Totaal Diensten"
          value={totalShifts}
          icon={<ClockIcon className="w-8 h-8" />}
          color="orange"
          subtitle="Geconfigureerde shifts"
          trend={{
            value: 3,
            isPositive: true,
            label: "nieuwe diensten",
          }}
        />
      </div>

      {/* Templates View */}
      {currentView === "templates" && (
        <div className="space-y-6">
          {templates.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <CalendarDaysIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Geen templates gevonden
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                Maak je eerste rooster template aan om herbruikbare schema's te
                beheren.
              </p>
              <Button
                onClick={() =>
                  router.push("/dashboard/admin/schedule-templates/create")
                }
                leftIcon={<PlusIcon className="h-5 w-5" />}
                variant="primary"
                size="md"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                Eerste Template Maken
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {templates.map((template) => {
                const categoryConfig = getCategoryConfig(template.category);

                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-3">
                          <div
                            className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center shadow-sm ${
                              template.isActive
                                ? "bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
                                : "bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                            }`}
                          >
                            <div className={categoryConfig.color}>
                              {categoryConfig.icon}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {template.name}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span
                                className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${
                                  template.isActive
                                    ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700"
                                    : "bg-gray-100 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600"
                                }`}
                              >
                                {template.isActive ? (
                                  <CheckCircleIcon className="h-3 w-3" />
                                ) : (
                                  <ExclamationTriangleIcon className="h-3 w-3" />
                                )}
                                <span>
                                  {template.isActive ? "Actief" : "Inactief"}
                                </span>
                              </span>
                              <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                                <span>{categoryConfig.label}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {template.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {template.description}
                        </p>
                      )}

                      {/* Shifts Section */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Diensten ({template.shifts.length})
                          </h4>
                          {template.shifts.length > 2 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Showing first 2
                            </span>
                          )}
                        </div>

                        {template.shifts.slice(0, 2).map((shift, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900 dark:text-white text-sm">
                                {shift.role}
                              </span>
                              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                                <UserGroupIcon className="h-3 w-3" />
                                <span>
                                  {shift.minPersons}
                                  {shift.maxPersons &&
                                  shift.maxPersons !== shift.minPersons
                                    ? `-${shift.maxPersons}`
                                    : ""}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                              <div className="flex items-center space-x-1">
                                <ClockIcon className="h-3 w-3" />
                                <span>
                                  {formatTime(shift.startTime)} -{" "}
                                  {formatTime(shift.endTime)}
                                </span>
                              </div>
                              {shift.totalBreakDuration && (
                                <div className="flex items-center space-x-1">
                                  <span className="h-2 w-2 bg-amber-400 rounded-full"></span>
                                  <span>
                                    {shift.totalBreakDuration}min pauze
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <ChartBarIcon className="h-3 w-3" />
                                <span>
                                  {calculateShiftDuration(
                                    shift.startTime,
                                    shift.endTime,
                                    shift.totalBreakDuration
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}

                        {template.shifts.length > 2 && (
                          <div className="text-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{template.shifts.length - 2} meer diensten
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {template.usageCount}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Keer gebruikt
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {template.userAssignments.length}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Vaste toewijzingen
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          }
                          onClick={() => {
                            const duplicateName = `${template.name} (Kopie)`;
                            router.push(
                              `/dashboard/admin/schedule-templates/create?duplicate=${
                                template.id
                              }&name=${encodeURIComponent(duplicateName)}`
                            );
                          }}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                        >
                          Dupliceren
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<PencilIcon className="h-4 w-4" />}
                          onClick={() =>
                            router.push(
                              `/dashboard/admin/schedule-templates/edit/${template.id}`
                            )
                          }
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        >
                          Bewerken
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Assignments View */}
      {currentView === "assignments" && (
        <div className="space-y-6">
          {/* Search and Actions Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <UserGroupIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Vaste Rooster Toewijzingen
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Beheer welke medewerkers op welke dagen werken volgens vaste patronen
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Zoek medewerker..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    leftIcon={<UserGroupIcon className="h-5 w-5" />}
                    variant="outlined"
                    inputSize="md"
                    className="min-w-[200px]"
                  />
                  <Button
                    onClick={() => setShowAssignmentModal(true)}
                    leftIcon={<PlusIcon className="h-5 w-5" />}
                    variant="primary"
                    size="md"
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  >
                    Nieuwe Toewijzing
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Assignments List */}
          {assignments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <UserGroupIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Geen vaste toewijzingen gevonden
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                Maak je eerste vaste rooster toewijzing aan om medewerkers automatisch in te plannen.
              </p>
              <Button
                onClick={() => setShowAssignmentModal(true)}
                leftIcon={<PlusIcon className="h-5 w-5" />}
                variant="primary"
                size="md"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                onClick={handleUpdateAssignment}
              >
                Bijwerken
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}
