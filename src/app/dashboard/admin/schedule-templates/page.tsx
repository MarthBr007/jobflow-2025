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
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Toast, useToast } from "@/components/ui/Toast";
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
  { value: "DAILY", label: "Dagelijks", emoji: "📅" },
  { value: "WEEKLY", label: "Wekelijks", emoji: "🗓️" },
  { value: "PROJECT", label: "Project", emoji: "🚧" },
  { value: "SPECIAL", label: "Speciaal", emoji: "✨" },
  { value: "HOLIDAY", label: "Feestdag", emoji: "🎉" },
  { value: "MAINTENANCE", label: "Onderhoud", emoji: "🔧" },
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

  const getCategoryEmoji = (category: string) => {
    const cat = CATEGORY_OPTIONS.find((c) => c.value === category);
    return cat ? cat.emoji : "📋";
  };

  const getCategoryLabel = (category: string) => {
    const cat = CATEGORY_OPTIONS.find((c) => c.value === category);
    return cat ? cat.label : category;
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

  if (loading) {
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

  return (
    <div className="space-y-3 sm:space-y-6">
      <ConfirmModal />
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard" },
          { label: "Rooster Templates" },
        ]}
        className="mb-1 sm:mb-4"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            📅 Rooster Templates
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Beheer herbruikbare roosters en vaste schema's voor medewerkers
          </p>
        </div>
        <Button
          onClick={() =>
            router.push("/dashboard/admin/schedule-templates/create")
          }
          leftIcon={<PlusIcon className="h-5 w-5" />}
          variant="primary"
          size="md"
        >
          Nieuwe Template
        </Button>
      </div>

      {/* View Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setCurrentView("templates")}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === "templates"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            📋 Templates
          </button>
          <button
            onClick={() => setCurrentView("assignments")}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === "assignments"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            👥 Vaste Roosters
          </button>
        </div>
      </div>

      {/* Templates View */}
      {currentView === "templates" && (
        <div className="space-y-4">
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Geen templates gevonden
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Maak je eerste rooster template aan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {templates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">
                        {getCategoryEmoji(template.category)}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {template.name}
                        </h3>
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          {getCategoryLabel(template.category)}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<DocumentDuplicateIcon className="h-4 w-4" />}
                        onClick={() => {
                          // Create duplicate with modified name
                          const duplicateName = `${template.name} (Kopie)`;
                          router.push(
                            `/dashboard/admin/schedule-templates/create?duplicate=${
                              template.id
                            }&name=${encodeURIComponent(duplicateName)}`
                          );
                        }}
                      >
                        Dupliceren
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<PencilIcon className="h-4 w-4" />}
                        onClick={() =>
                          router.push(
                            `/dashboard/admin/schedule-templates/edit/${template.id}`
                          )
                        }
                      >
                        Bewerken
                      </Button>
                    </div>
                  </div>

                  {template.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {template.description}
                    </p>
                  )}

                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Diensten ({template.shifts.length})
                    </div>
                    {template.shifts.map((shift, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {shift.role}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {shift.minPersons}
                            {shift.maxPersons &&
                            shift.maxPersons !== shift.minPersons
                              ? `-${shift.maxPersons}`
                              : ""}{" "}
                            personen
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="h-4 w-4" />
                            <span>
                              {formatTime(shift.startTime)} -{" "}
                              {formatTime(shift.endTime)}
                            </span>
                          </div>
                          {shift.totalBreakDuration && (
                            <div>
                              Pauzes: {shift.totalBreakDuration}min
                              {shift.breaks && shift.breaks.length > 0 && (
                                <span className="text-xs ml-1">
                                  (
                                  {shift.breaks
                                    .map((b) => `${b.duration}min`)
                                    .join(" + ")}
                                  )
                                </span>
                              )}
                            </div>
                          )}
                          <div>
                            {calculateShiftDuration(
                              shift.startTime,
                              shift.endTime,
                              shift.totalBreakDuration
                            )}
                          </div>
                        </div>

                        {shift.notes && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            {shift.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>Gebruikt: {template.usageCount} keer</span>
                      <span>
                        Actieve toewijzingen: {template.userAssignments.length}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignments View */}
      {currentView === "assignments" && (
        <div className="space-y-6">
          {/* Search and Filter */}
          <Card variant="elevated" padding="lg">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Vaste Rooster Toewijzingen
              </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Beheer welke medewerkers op welke dagen werken volgens vaste
                  patronen
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Zoek medewerker..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              <Button
                onClick={() => setShowAssignmentModal(true)}
                leftIcon={<PlusIcon className="h-5 w-5" />}
                variant="primary"
                size="md"
              >
                Nieuwe Toewijzing
              </Button>
            </div>
            </div>
          </Card>

          {/* Current Assignments */}
          <Card variant="elevated" padding="lg">
            {assignments.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>Nog geen vaste rooster toewijzingen aangemaakt.</p>
                <p className="mt-2">
                  Wijs templates toe aan medewerkers voor hun standaard
                  werkdagen.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Show total statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {assignments.filter((a) => a.isActive).length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Actieve toewijzingen
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {new Set(assignments.map((a) => a.userId)).size}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Medewerkers met patronen
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {new Set(assignments.map((a) => a.templateId)).size}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Gebruikte templates
                    </div>
                  </div>
                </div>

                {/* Debug info voor dayOfWeek mapping */}
                <details className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <summary className="cursor-pointer text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    🔍 Debug: dayOfWeek mapping (klik om uit te klappen)
                  </summary>
                  <div className="mt-2 space-y-2 text-xs">
                    <div className="text-yellow-700 dark:text-yellow-300">
                      <strong>JavaScript getDay() mapping:</strong>
                      <div className="grid grid-cols-7 gap-2 mt-1">
                        {[
                          { jsDay: 0, name: "Zondag" },
                          { jsDay: 1, name: "Maandag" },
                          { jsDay: 2, name: "Dinsdag" },
                          { jsDay: 3, name: "Woensdag" },
                          { jsDay: 4, name: "Donderdag" },
                          { jsDay: 5, name: "Vrijdag" },
                          { jsDay: 6, name: "Zaterdag" },
                        ].map((day) => (
                          <div
                            key={day.jsDay}
                            className="text-center p-1 bg-white dark:bg-gray-800 rounded"
                          >
                            <div className="font-medium">{day.jsDay}</div>
                            <div>{day.name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-yellow-700 dark:text-yellow-300">
                      <strong>Onze DAYS_OF_WEEK configuratie:</strong>
                      <div className="grid grid-cols-7 gap-2 mt-1">
                        {DAYS_OF_WEEK.map((day) => (
                          <div
                            key={day.value}
                            className="text-center p-1 bg-white dark:bg-gray-800 rounded"
                          >
                            <div className="font-medium">{day.value}</div>
                            <div>{day.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-yellow-700 dark:text-yellow-300">
                      <strong>Vandaag is:</strong>{" "}
                      {new Date().toLocaleDateString("nl-NL", {
                        weekday: "long",
                      })}{" "}
                      (getDay() = {new Date().getDay()})
                    </div>
                  </div>
                </details>

                {/* Quick Actions for common issues */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
                    🛠️ Veelvoorkomende problemen oplossen
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                        <strong>Probleem:</strong> Quincy komt op maandag
                        terwijl zijn patroon Di-Za is
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const quincyAssignments = assignments.filter(
                            (a) =>
                              a.user.name.toLowerCase().includes("quincy") &&
                              a.dayOfWeek === 1
                          );
                          if (quincyAssignments.length > 0) {
                            const msg = `Gevonden ${quincyAssignments.length} assignment(s) voor Quincy op maandag. Wil je deze verwijderen?`;
                            const confirmed = await confirm({
                              type: "danger",
                              title: "Quincy maandag assignments verwijderen",
                              message: msg,
                              confirmText: "Verwijderen",
                              cancelText: "Annuleren",
                            });

                            if (confirmed) {
                              quincyAssignments.forEach((assignment) =>
                                handleDeleteAssignment(assignment.id)
                              );
                            }
                          } else {
                            await confirm({
                              type: "info",
                              title: "Geen assignments gevonden",
                              message:
                                "Geen assignments voor Quincy op maandag gevonden.",
                              confirmText: "OK",
                              cancelText: undefined,
                            });
                          }
                        }}
                        className="text-blue-600 border-blue-300 hover:bg-blue-100"
                      >
                        Fix Quincy Maandag
                      </Button>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                        <strong>Alle assignments tonen per gebruiker:</strong>
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const summary = assignments.reduce(
                            (acc, assignment) => {
                              const userName = assignment.user.name;
                              if (!acc[userName]) acc[userName] = [];
                              acc[userName].push(assignment.dayOfWeek);
                              return acc;
                            },
                            {} as Record<string, number[]>
                          );

                          const report = Object.entries(summary)
                            .map(
                              ([name, days]) =>
                                `${name}: dagen ${days.sort().join(", ")}`
                            )
                            .join("\n");

                          await confirm({
                            type: "info",
                            title: "Assignments Overzicht",
                            message: `Overzicht van alle rooster assignments:\n\n${report}`,
                            confirmText: "Sluiten",
                            cancelText: undefined,
                          });
                        }}
                        className="text-blue-600 border-blue-300 hover:bg-blue-100"
                      >
                        Toon Overzicht
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Group assignments by user */}
                {Object.entries(
                  assignments
                    .filter(
                      (assignment) =>
                        !searchUser ||
                        assignment.user.name
                          .toLowerCase()
                          .includes(searchUser.toLowerCase()) ||
                        assignment.user.email
                          .toLowerCase()
                          .includes(searchUser.toLowerCase())
                    )
                    .reduce((acc, assignment) => {
                    const userKey = assignment.user.id;
                    if (!acc[userKey]) {
                      acc[userKey] = {
                        user: assignment.user,
                        assignments: [],
                      };
                    }
                    acc[userKey].assignments.push(assignment);
                    return acc;
                  }, {} as Record<string, { user: any; assignments: UserScheduleAssignment[] }>)
                ).map(([userId, { user, assignments: userAssignments }]) => (
                  <div
                    key={userId}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {user.name || user.email}
                        </h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email} • {userAssignments.length} werkdagen
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                          {userAssignments.filter((a) => a.isActive).length}{" "}
                          actief
                        </span>
                        {userAssignments.some((a) => !a.isActive) && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {userAssignments.filter((a) => !a.isActive).length}{" "}
                            inactief
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                      {/* Show all days of the week */}
                      {DAYS_OF_WEEK.map((day) => {
                        const assignment = userAssignments.find(
                          (a) => a.dayOfWeek === day.value
                        );
                        const template = assignment
                          ? templates.find(
                              (t) => t.id === assignment.templateId
                            )
                          : null;

                          return (
                            <div
                            key={day.value}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              assignment
                                ? assignment.isActive
                                  ? "border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20"
                                  : "border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700"
                                : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                            }`}
                          >
                            <div className="text-center">
                              <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                                {day.label}
                              </div>

                              {assignment ? (
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                    {template
                                      ? `${getCategoryEmoji(
                                          template.category
                                        )} ${template.name}`
                                      : "Template verwijderd"}
                                </div>

                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {assignment.customStartTime ||
                                      template?.shifts[0]?.startTime}{" "}
                                    -{" "}
                                    {assignment.customEndTime ||
                                      template?.shifts[0]?.endTime}
                                  </div>

                                  {assignment.notes && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 italic truncate">
                                      {assignment.notes}
                                    </div>
                                  )}

                                  <button
                                    onClick={() =>
                                      handleDeleteAssignment(assignment.id)
                                    }
                                    className="text-xs text-red-500 hover:text-red-700 mt-1"
                                    title="Verwijderen"
                                  >
                                    🗑️
                                  </button>
                                  <button
                                    onClick={() =>
                                      setEditingAssignment({
                                        id: assignment.id,
                                        dayOfWeek: assignment.dayOfWeek,
                                        customStartTime:
                                          assignment.customStartTime || "",
                                        customEndTime:
                                          assignment.customEndTime || "",
                                        notes: assignment.notes || "",
                                      })
                                    }
                                    className="text-xs text-blue-500 hover:text-blue-700 mt-1 ml-2"
                                    title="Bewerken"
                                  >
                                    ✏️
                                  </button>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                  Geen patroon
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Assign Template Modal */}
      <Modal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        title="Rooster Toewijzing Aanmaken"
        description="Wijs een rooster template toe aan een medewerker voor specifieke dagen"
        size="lg"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Medewerker *
              </label>
              <select
                value={newAssignment.userId}
                onChange={(e) =>
                  setNewAssignment({ ...newAssignment, userId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Selecteer medewerker...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rooster Template *
              </label>
              <select
                value={newAssignment.templateId}
                onChange={(e) =>
                  setNewAssignment({
                    ...newAssignment,
                    templateId: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Selecteer template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {getCategoryEmoji(template.category)} {template.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dag van de Week *
            </label>
            <select
              value={newAssignment.dayOfWeek}
              onChange={(e) =>
                setNewAssignment({
                  ...newAssignment,
                  dayOfWeek: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            >
              {DAYS_OF_WEEK.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                Aangepaste Tijden (optioneel)
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Voor parttimers of afwijkende uren
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Aangepaste start tijd"
                type="time"
                value={newAssignment.customStartTime}
                onChange={(e) =>
                  setNewAssignment({
                    ...newAssignment,
                    customStartTime: e.target.value,
                  })
                }
                placeholder="Laat leeg voor template tijd"
              />

              <Input
                label="Aangepaste eind tijd"
                type="time"
                value={newAssignment.customEndTime}
                onChange={(e) =>
                  setNewAssignment({
                    ...newAssignment,
                    customEndTime: e.target.value,
                  })
                }
                placeholder="Laat leeg voor template tijd"
              />
            </div>

            {(newAssignment.customStartTime || newAssignment.customEndTime) && (
              <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ <strong>Let op:</strong> Aangepaste tijden overschrijven de
                  template tijden voor deze medewerker op deze dag.
                  {newAssignment.customStartTime &&
                    newAssignment.customEndTime && (
                      <>
                        <br />
                        <span className="text-xs">
                          Nieuwe werktijd:{" "}
                          {calculateShiftDuration(
                            newAssignment.customStartTime,
                            newAssignment.customEndTime,
                            60
                          )}{" "}
                          (excl. pauzes)
                        </span>
                      </>
                    )}
                </p>
              </div>
            )}
          </div>

          <Input
            label="Opmerkingen (optioneel)"
            value={newAssignment.notes}
            onChange={(e) =>
              setNewAssignment({ ...newAssignment, notes: e.target.value })
            }
            placeholder="Bijv. Parttime, vroege dienst, etc."
          />

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAssignmentModal(false)}
            >
              Annuleren
            </Button>
            <Button type="submit" variant="primary">
              Toewijzing Aanmaken
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Assignment Modal */}
      <Modal
        isOpen={!!editingAssignment}
        onClose={() => setEditingAssignment(null)}
        title="Rooster Toewijzing Bewerken"
        description="Pas de details van deze toewijzing aan"
        size="md"
      >
        {editingAssignment && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dag van de Week *
              </label>
              <select
                value={editingAssignment.dayOfWeek}
                onChange={(e) =>
                  setEditingAssignment({
                    ...editingAssignment,
                    dayOfWeek: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Start Tijd
                </label>
                <input
                  type="time"
                  value={editingAssignment.customStartTime || ""}
                  onChange={(e) =>
                    setEditingAssignment({
                      ...editingAssignment,
                      customStartTime: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Eind Tijd
                </label>
                <input
                  type="time"
                  value={editingAssignment.customEndTime || ""}
                  onChange={(e) =>
                    setEditingAssignment({
                      ...editingAssignment,
                      customEndTime: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notities
              </label>
              <textarea
                value={editingAssignment.notes || ""}
                onChange={(e) =>
                  setEditingAssignment({
                    ...editingAssignment,
                    notes: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Optionele notities..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setEditingAssignment(null)}
              >
                Annuleren
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
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
