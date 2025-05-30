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
                      >
                        Dupliceren
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<PencilIcon className="h-4 w-4" />}
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
          {/* Current Assignments */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Vaste Rooster Toewijzingen
              </h3>
              <Button
                onClick={() => setShowAssignmentModal(true)}
                leftIcon={<PlusIcon className="h-5 w-5" />}
                variant="primary"
                size="md"
              >
                Nieuwe Toewijzing
              </Button>
            </div>

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
              <div className="space-y-4">
                {/* Group assignments by user */}
                {Object.entries(
                  assignments.reduce((acc, assignment) => {
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
                          Actief
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {userAssignments
                        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                        .map((assignment) => {
                          const template = templates.find(
                            (t) => t.id === assignment.templateId
                          );
                          const dayName = DAYS_OF_WEEK.find(
                            (d) => d.value === assignment.dayOfWeek
                          )?.label;

                          return (
                            <div
                              key={assignment.id}
                              className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {dayName}
                                </span>
                                <button className="text-gray-400 hover:text-red-500">
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="space-y-1 text-sm">
                                <div className="flex items-center space-x-1">
                                  <span className="text-gray-500 dark:text-gray-400">
                                    Template:
                                  </span>
                                  <span className="text-gray-900 dark:text-white">
                                    {template ? (
                                      <>
                                        {getCategoryEmoji(template.category)}{" "}
                                        {template.name}
                                      </>
                                    ) : (
                                      "Onbekend"
                                    )}
                                  </span>
                                </div>

                                {(assignment.customStartTime ||
                                  assignment.customEndTime) && (
                                  <div className="flex items-center space-x-1">
                                    <ClockIcon className="h-4 w-4 text-amber-500" />
                                    <span className="text-amber-700 dark:text-amber-300 font-medium">
                                      {assignment.customStartTime || "??:??"}
                                      {" - "}
                                      {assignment.customEndTime || "??:??"}
                                    </span>
                                  </div>
                                )}

                                {template &&
                                  template.shifts.length > 0 &&
                                  !assignment.customStartTime && (
                                    <div className="flex items-center space-x-1">
                                      <ClockIcon className="h-4 w-4 text-gray-400" />
                                      <span className="text-gray-600 dark:text-gray-400">
                                        {formatTime(
                                          template.shifts[0].startTime
                                        )}
                                        {" - "}
                                        {formatTime(template.shifts[0].endTime)}
                                      </span>
                                    </div>
                                  )}

                                {assignment.notes && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                                    {assignment.notes}
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
          </div>
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
