"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  CalendarDaysIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Input from "@/components/ui/Input";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Timeline from "@/components/ui/Timeline";

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

interface WorkPattern {
  userId: string;
  userName: string;
  workDays: number[]; // Array of days: 0=Sunday, 1=Monday, etc.
  startTime: string;
  endTime: string;
  role: string;
}

interface ScheduleAssignment {
  id: string;
  userId: string;
  dayOfWeek: number;
  customStartTime?: string;
  customEndTime?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  template: {
    id: string;
    name: string;
    shifts: Array<{
      startTime: string;
      endTime: string;
      role: string;
    }>;
  };
}

export default function ShiftPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const shiftId = searchParams?.get("shiftId");
  const date =
    searchParams?.get("date") || new Date().toISOString().split("T")[0];
  const isEditing = !!shiftId;

  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [workType, setWorkType] = useState("");
  const [scheduleAssignments, setScheduleAssignments] = useState<
    ScheduleAssignment[]
  >([]);
  const [showWorkPatterns, setShowWorkPatterns] = useState(false);
  const [showQuickAssign, setShowQuickAssign] = useState(false);
  const [quickAssignData, setQuickAssignData] = useState({
    userId: "",
    workDays: [] as number[],
    startTime: "09:00",
    endTime: "17:00",
    role: "Standaard Werkdag",
  });

  const [shiftData, setShiftData] = useState({
    userId: "",
    projectId: "",
    startTime: "09:00",
    endTime: "17:00",
    role: "",
    notes: "",
    date: date,
    project: "",
    location: "Broers Verhuur",
  });

  const [breaks, setBreaks] = useState<
    Array<{
      startTime: string;
      endTime: string;
      type: "morning" | "lunch" | "afternoon" | "break" | "meeting" | "other";
      duration?: number;
      description?: string;
    }>
  >([]);

  useEffect(() => {
    if (!session) {
      router.push("/");
      return;
    }

    // Check if user is admin or manager
    if (session.user?.role !== "ADMIN" && session.user?.role !== "MANAGER") {
      router.push("/dashboard/schedule");
      return;
    }

    fetchUsers();
    fetchProjects();

    if (isEditing && shiftId) {
      fetchShiftData(shiftId);
    }

    fetchScheduleAssignments();
  }, [session, shiftId, isEditing, router]);

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

  const fetchShiftData = async (id: string) => {
    try {
      const response = await fetch(`/api/schedule/shifts/${id}`);
      if (response.ok) {
        const shift = await response.json();

        // Extract time portion from datetime string - avoid timezone conversion
        const startTimeStr = shift.startTime.substring(11, 16);
        const endTimeStr = shift.endTime.substring(11, 16);

        setShiftData({
          userId: shift.userId,
          projectId: shift.projectId || "",
          startTime: startTimeStr,
          endTime: endTimeStr,
          role: shift.role || "",
          notes: shift.notes || "",
          date: shift.startTime.substring(0, 10), // Extract YYYY-MM-DD
          project: shift.project?.name || "",
          location: shift.project?.company || "Broers Verhuur",
        });
        setWorkType(shift.role || "");

        // Load breaks if they exist
        if (shift.breaks && Array.isArray(shift.breaks)) {
          setBreaks(shift.breaks);
        }
      }
    } catch (error) {
      console.error("Error fetching shift data:", error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        userId: shiftData.userId,
        projectId: shiftData.projectId || null,
        date: shiftData.date,
        startTime: `${shiftData.date}T${shiftData.startTime}:00`,
        endTime: `${shiftData.date}T${shiftData.endTime}:00`,
        role: shiftData.role,
        notes: shiftData.notes,
        breaks: breaks.length > 0 ? breaks : null,
      };

      const url = isEditing
        ? `/api/schedule/shifts/${shiftId}`
        : "/api/schedule/shifts";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        router.push(`/dashboard/schedule?date=${shiftData.date}`);
      } else {
        const data = await response.json();
        alert(data.error || `Error ${isEditing ? "updating" : "adding"} shift`);
      }
    } catch (error) {
      console.error("Error submitting shift:", error);
      alert(`Error ${isEditing ? "updating" : "adding"} shift`);
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (userId: string) => {
    const selectedUser = users.find((user) => user.id === userId);
    if (selectedUser) {
      const defaultRole = selectedUser.workTypes?.[0] || "";
      setShiftData({
        ...shiftData,
        userId,
        role: defaultRole,
      });
      setWorkType(defaultRole);
    } else {
      setShiftData({
        ...shiftData,
        userId: "",
        role: "",
      });
      setWorkType("");
    }
  };

  const handleWorkTypeChange = (selectedWorkType: string) => {
    setWorkType(selectedWorkType);
    setShiftData({
      ...shiftData,
      role: selectedWorkType,
    });
  };

  const getSelectedUser = () => {
    return users.find((user) => user.id === shiftData.userId);
  };

  const isProjectBasedWork = () => {
    return (
      workType.toLowerCase().includes("op en afbouw") ||
      workType.toLowerCase().includes("monteur") ||
      workType.toLowerCase().includes("installatie") ||
      workType.toLowerCase().includes("technische dienst") ||
      workType.toLowerCase().includes("event")
    );
  };

  const addBreak = () => {
    const newBreak = {
      startTime: "12:00",
      endTime: "12:30",
      type: "lunch" as const,
      duration: 30,
    };
    setBreaks([...breaks, newBreak]);
  };

  const removeBreak = (index: number) => {
    setBreaks(breaks.filter((_, i) => i !== index));
  };

  const updateBreak = (index: number, field: string, value: string) => {
    const updatedBreaks = [...breaks];
    if (field === "startTime" || field === "endTime") {
      updatedBreaks[index] = { ...updatedBreaks[index], [field]: value };

      // Auto-calculate duration
      const start = new Date(`2000-01-01T${updatedBreaks[index].startTime}:00`);
      const end = new Date(`2000-01-01T${updatedBreaks[index].endTime}:00`);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60);
      updatedBreaks[index].duration = duration > 0 ? duration : 0;
    } else if (field === "type") {
      updatedBreaks[index] = {
        ...updatedBreaks[index],
        type: value as
          | "morning"
          | "lunch"
          | "afternoon"
          | "break"
          | "meeting"
          | "other",
      };
    } else if (field === "description") {
      updatedBreaks[index] = {
        ...updatedBreaks[index],
        description: value,
      };
    }
    setBreaks(updatedBreaks);
  };

  const getBreakTypeEmoji = (type: string) => {
    switch (type) {
      case "morning":
        return "☕";
      case "lunch":
        return "🍽️";
      case "afternoon":
        return "🫖";
      case "break":
        return "⏸️";
      case "meeting":
        return "🤝";
      case "other":
        return "📝";
      default:
        return "⏸️";
    }
  };

  const getTotalBreakDuration = (): number => {
    return breaks.reduce((total, breakItem) => {
      return total + (breakItem.duration || 0);
    }, 0);
  };

  const calculateBreakDuration = (
    startTime: string,
    endTime: string
  ): string => {
    if (!startTime || !endTime) return "0 min";

    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    if (diffMinutes < 0) return "0 min";

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (hours > 0) {
      return `${hours}u ${minutes > 0 ? `${minutes}m` : ""}`;
    }
    return `${minutes}m`;
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

  const getWorkPatternsForDate = () => {
    const selectedDate = new Date(shiftData.date);
    const dayOfWeek = selectedDate.getDay();

    return scheduleAssignments.filter(
      (assignment) => assignment.dayOfWeek === dayOfWeek
    );
  };

  const handleQuickAssignSubmit = async () => {
    const { userId, workDays, startTime, endTime, role } = quickAssignData;

    if (!userId || workDays.length === 0) {
      alert("Selecteer een medewerker en minimaal één werkdag");
      return;
    }

    // Create a basic template first (if needed)
    const templateData = {
      name: `${users.find((u) => u.id === userId)?.name} - ${role}`,
      description: `Werkpatroon voor ${DAYS_OF_WEEK.filter((d) =>
        workDays.includes(d.value)
      )
        .map((d) => d.label)
        .join(", ")}`,
      category: "WEEKLY",
      shifts: [
        {
          role,
          startTime,
          endTime,
          count: 1,
          requirements: [],
        },
      ],
    };

    try {
      // Create template
      const templateResponse = await fetch("/api/schedule-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData),
      });

      if (!templateResponse.ok) {
        throw new Error("Failed to create template");
      }

      const template = await templateResponse.json();

      // Create assignments for each selected day
      for (const dayOfWeek of workDays) {
        const assignmentData = {
          userId,
          templateId: template.id,
          dayOfWeek,
          customStartTime: startTime,
          customEndTime: endTime,
          notes: `Automatisch aangemaakt werkpatroon`,
        };

        const assignmentResponse = await fetch(
          "/api/user-schedule-assignments",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(assignmentData),
          }
        );

        if (!assignmentResponse.ok) {
          console.error(`Failed to create assignment for day ${dayOfWeek}`);
        }
      }

      // Refresh assignments
      fetchScheduleAssignments();
      setShowQuickAssign(false);
      setQuickAssignData({
        userId: "",
        workDays: [],
        startTime: "09:00",
        endTime: "17:00",
        role: "Standaard Werkdag",
      });

      alert("Werkpatroon succesvol aangemaakt!");
    } catch (error) {
      console.error("Error creating work pattern:", error);
      alert("Error bij het aanmaken van werkpatroon");
    }
  };

  const toggleWorkDay = (dayValue: number) => {
    setQuickAssignData((prev) => ({
      ...prev,
      workDays: prev.workDays.includes(dayValue)
        ? prev.workDays.filter((d) => d !== dayValue)
        : [...prev.workDays, dayValue].sort(),
    }));
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Rooster", href: "/dashboard/schedule" },
            { label: isEditing ? "Dienst Bewerken" : "Nieuwe Dienst" },
          ]}
          className="mb-6"
        />

        {/* Modern Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 px-6 py-8 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  {isEditing ? (
                    <PencilIcon className="h-6 w-6 text-white" />
                  ) : (
                    <PlusIcon className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isEditing ? "Dienst Bewerken" : "Nieuwe Dienst"}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {isEditing
                      ? "Wijzig de details van deze dienst"
                      : `Plan een nieuwe dienst voor ${format(
                          new Date(date),
                          "EEEE d MMMM yyyy",
                          { locale: nl }
                        )}`}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => router.back()}
                variant="outline"
                size="md"
                leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
                className="shadow-md hover:shadow-lg transition-all duration-200 font-semibold min-w-[120px]"
              >
                Terug
              </Button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Medewerker & Datum Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <UserIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Medewerker & Planning
                </h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Medewerker <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={shiftData.userId}
                    onChange={(e) => handleUserChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base transition-all duration-200"
                    required
                  >
                    <option value="">Selecteer medewerker</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Datum <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={shiftData.date}
                      onChange={(e) =>
                        setShiftData({ ...shiftData, date: e.target.value })
                      }
                      className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base transition-all duration-200"
                      required
                    />
                    <CalendarIcon className="h-5 w-5 text-gray-400 absolute left-4 top-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Werkzaamheden Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                  <BriefcaseIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Werkzaamheden
                </h3>
              </div>
            </div>
            <div className="p-6">
              {getSelectedUser()?.workTypes &&
              getSelectedUser()!.workTypes!.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Functie/Rol <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={workType}
                    onChange={(e) => handleWorkTypeChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base transition-all duration-200"
                    required
                  >
                    <option value="">Selecteer functie</option>
                    {getSelectedUser()?.workTypes?.map((workTypeOption) => (
                      <option key={workTypeOption} value={workTypeOption}>
                        {workTypeOption}
                      </option>
                    ))}
                  </select>
                </div>
              ) : getSelectedUser() ? (
                <div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-6 mb-6">
                    <div className="flex items-start space-x-4">
                      <div className="h-10 w-10 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 rounded-xl flex items-center justify-center border border-amber-200 dark:border-amber-700 shadow-sm flex-shrink-0">
                        <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                            Geen werkzaamheden toegewezen
                          </h4>
                          {getSelectedUser() && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.open(
                                  `/dashboard/personnel/edit/${
                                    getSelectedUser()?.id
                                  }`,
                                  "_blank"
                                );
                              }}
                              className="text-xs font-semibold"
                            >
                              Werkzaamheden toewijzen
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Deze medewerker heeft nog geen specifieke
                          werkzaamheden toegewezen. Voer handmatig een rol in of
                          wijs werkzaamheden toe.
                        </p>
                      </div>
                    </div>
                  </div>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Functie/Rol (handmatig invoeren){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={workType}
                    onChange={(e) => handleWorkTypeChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base transition-all duration-200"
                    placeholder="Bijv. schoonmaak, wasstraat, orderpicker..."
                    required
                  />
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Selecteer eerst een medewerker om werkzaamheden te kunnen
                    kiezen
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Werkpatronen Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                    <CalendarDaysIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Werkpatronen voor deze dag
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickAssign(true)}
                  leftIcon={<PlusIcon className="h-4 w-4" />}
                  className="font-semibold"
                >
                  Werkpatroon instellen
                </Button>
              </div>
            </div>
            <div className="p-6">
              {getWorkPatternsForDate().length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Medewerkers met vaste werkpatronen voor{" "}
                    {
                      DAYS_OF_WEEK.find(
                        (d) => d.value === new Date(shiftData.date).getDay()
                      )?.fullLabel
                    }
                    :
                  </p>
                  {getWorkPatternsForDate().map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center shadow-sm">
                          <UserIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {assignment.user.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {assignment.customStartTime ||
                              assignment.template.shifts[0]?.startTime ||
                              "??:??"}
                            {" - "}
                            {assignment.customEndTime ||
                              assignment.template.shifts[0]?.endTime ||
                              "??:??"}
                            {" • "}
                            {assignment.template.shifts[0]?.role ||
                              "Standaard werk"}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setShiftData((prev) => ({
                            ...prev,
                            userId: assignment.userId,
                            startTime:
                              assignment.customStartTime ||
                              assignment.template.shifts[0]?.startTime ||
                              "09:00",
                            endTime:
                              assignment.customEndTime ||
                              assignment.template.shifts[0]?.endTime ||
                              "17:00",
                            role:
                              assignment.template.shifts[0]?.role ||
                              "Standaard werk",
                          }));
                          setWorkType(
                            assignment.template.shifts[0]?.role || ""
                          );
                        }}
                        className="font-semibold"
                      >
                        Gebruik patroon
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="h-16 w-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <CalendarDaysIcon className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Geen vaste werkpatronen
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    Geen vaste werkpatronen voor{" "}
                    {
                      DAYS_OF_WEEK.find(
                        (d) => d.value === new Date(shiftData.date).getDay()
                      )?.fullLabel
                    }
                  </p>
                  <p className="text-sm text-gray-400">
                    Klik op "Werkpatroon instellen" om een vaste planning aan te
                    maken
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tijden Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                  <ClockIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Werktijden
                </h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Start Tijd <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={shiftData.startTime}
                      onChange={(e) =>
                        setShiftData({
                          ...shiftData,
                          startTime: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base transition-all duration-200"
                      required
                    />
                    <ClockIcon className="h-5 w-5 text-gray-400 absolute left-4 top-4" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Eind Tijd <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={shiftData.endTime}
                      onChange={(e) =>
                        setShiftData({ ...shiftData, endTime: e.target.value })
                      }
                      className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base transition-all duration-200"
                      required
                    />
                    <ClockIcon className="h-5 w-5 text-gray-400 absolute left-4 top-4" />
                  </div>
                </div>
              </div>

              {/* Time calculation display */}
              {shiftData.startTime && shiftData.endTime && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-700 shadow-sm">
                        <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          Totale werktijd
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Exclusief pauzes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {(() => {
                          const start = new Date(
                            `2000-01-01T${shiftData.startTime}:00`
                          );
                          const end = new Date(
                            `2000-01-01T${shiftData.endTime}:00`
                          );
                          const diffMs = end.getTime() - start.getTime();
                          const hours = Math.floor(diffMs / (1000 * 60 * 60));
                          const minutes = Math.floor(
                            (diffMs % (1000 * 60 * 60)) / (1000 * 60)
                          );
                          return hours > 0
                            ? `${hours}u ${minutes > 0 ? `${minutes}m` : ""}`
                            : `${minutes}m`;
                        })()}
                      </span>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Geplande tijd
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pauzes Section */}
          <Card variant="elevated" className="container-query">
            <CardHeader>
              <CardTitle
                size="lg"
                className="flex-responsive justify-between text-cyan-700 dark:text-cyan-300"
              >
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-3" />
                  ⏸️ Pauzes
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBreak}
                  leftIcon={<PlusIcon className="h-4 w-4" />}
                  className="text-cyan-600 border-cyan-300 hover:bg-cyan-50 dark:text-cyan-400 dark:border-cyan-600 dark:hover:bg-cyan-900/20 w-full sm:w-auto"
                >
                  Pauze Toevoegen
                </Button>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-fluid">
              {breaks.length === 0 ? (
                <div className="card-adaptive text-center text-gray-500 dark:text-gray-400">
                  <ClockIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-fluid">Geen pauzes toegevoegd</p>
                  <p className="text-fluid text-sm">
                    Klik op "Pauze Toevoegen" om te beginnen
                  </p>
                </div>
              ) : (
                <div className="auto-fit-grid">
                  {breaks.map((breakItem, index) => (
                    <div
                      key={index}
                      className="card-adaptive stack-context border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex-responsive justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {getBreakTypeEmoji(breakItem.type)}
                          </span>
                          <select
                            value={breakItem.type}
                            onChange={(e) =>
                              updateBreak(index, "type", e.target.value)
                            }
                            className="text-fluid border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-0 flex-1"
                          >
                            <option value="lunch">🍽️ Lunch</option>
                            <option value="break">☕ Pauze</option>
                            <option value="meeting">🤝 Overleg</option>
                            <option value="other">📝 Anders</option>
                          </select>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBreak(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="responsive-grid">
                        <Input
                          label="Start Tijd"
                          type="time"
                          value={breakItem.startTime}
                          onChange={(e) =>
                            updateBreak(index, "startTime", e.target.value)
                          }
                          variant="outlined"
                          inputSize="sm"
                          className="w-full"
                        />
                        <Input
                          label="Eind Tijd"
                          type="time"
                          value={breakItem.endTime}
                          onChange={(e) =>
                            updateBreak(index, "endTime", e.target.value)
                          }
                          variant="outlined"
                          inputSize="sm"
                          className="w-full"
                        />
                      </div>

                      {breakItem.type === "other" && (
                        <div className="mt-3">
                          <Input
                            label="Beschrijving"
                            value={breakItem.description || ""}
                            onChange={(e) =>
                              updateBreak(index, "description", e.target.value)
                            }
                            placeholder="Beschrijf de activiteit..."
                            variant="outlined"
                            inputSize="sm"
                            className="w-full"
                          />
                        </div>
                      )}

                      {/* Enhanced break info */}
                      <div className="enhanced-only mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        {breakItem.startTime && breakItem.endTime && (
                          <div className="text-fluid text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Duur: </span>
                            {calculateBreakDuration(
                              breakItem.startTime,
                              breakItem.endTime
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project & Locatie Section */}
          <Card
            variant="glass"
            padding="lg"
            className="border-orange-200 dark:border-orange-800"
          >
            <CardHeader>
              <CardTitle
                size="lg"
                className="flex items-center text-orange-700 dark:text-orange-300"
              >
                <BuildingOfficeIcon className="h-5 w-5 mr-3" />
                🏢 {isProjectBasedWork() ? "Project Details" : "Werklocatie"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isProjectBasedWork() ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center mb-2">
                      <BriefcaseIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Project-gebaseerd werk gedetecteerd
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Voor "{workType}" is een specifiek project vereist
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Project *
                    </label>
                    <select
                      value={shiftData.projectId}
                      onChange={(e) =>
                        setShiftData({
                          ...shiftData,
                          projectId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
                      required
                    >
                      <option value="">Selecteer project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name} - {project.company}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Kies het specifieke project voor deze werkzaamheden
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700 mb-4">
                    <div className="flex items-center mb-2">
                      <BuildingOfficeIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Vaste locatie werk
                      </span>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Voor "{workType}" wordt gewerkt op een vaste locatie
                    </p>
                  </div>

                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Werklocatie *
                  </label>
                  <select
                    value={shiftData.location}
                    onChange={(e) =>
                      setShiftData({ ...shiftData, location: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
                    required
                  >
                    <option value="Broers Verhuur">🏢 Broers Verhuur</option>
                    <option value="DCRT Event Decorations">
                      🎨 DCRT Event Decorations
                    </option>
                    <option value="DCRT in Building">
                      🏗️ DCRT in Building
                    </option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Standaard werklocatie voor deze werkzaamheden
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notities Section */}
          <Card
            variant="glass"
            padding="lg"
            className="border-pink-200 dark:border-pink-800"
          >
            <CardHeader>
              <CardTitle
                size="lg"
                className="flex items-center text-pink-700 dark:text-pink-300"
              >
                <DocumentTextIcon className="h-5 w-5 mr-3" />
                📝 Aanvullende Informatie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Notities (optioneel)
                </label>
                <textarea
                  value={shiftData.notes}
                  onChange={(e) =>
                    setShiftData({ ...shiftData, notes: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Eventuele aanvullende informatie of instructies..."
                />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Voeg eventuele instructies of opmerkingen toe voor deze dienst
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card variant="default" padding="lg">
            <div className="button-group keyline-spacing">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => router.back()}
                elevation="soft"
                rounded="lg"
                className="touch-target-lg component-padding-md"
              >
                ❌ Annuleren
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={loading}
                elevation="medium"
                rounded="lg"
                className="touch-target-lg component-padding-md"
              >
                {isEditing ? "✅ Dienst Bijwerken" : "➕ Dienst Toevoegen"}
              </Button>
            </div>
          </Card>
        </form>

        {/* Quick Assign Work Pattern Modal */}
        {showQuickAssign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <CalendarDaysIcon className="h-6 w-6 mr-3 text-indigo-600" />
                    Werkpatroon instellen
                  </h3>
                  <button
                    onClick={() => setShowQuickAssign(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Stel vaste werkdagen en tijden in voor een medewerker
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Employee Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Medewerker <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={quickAssignData.userId}
                    onChange={(e) =>
                      setQuickAssignData((prev) => ({
                        ...prev,
                        userId: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Selecteer medewerker</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Work Days Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Werkdagen *
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleWorkDay(day.value)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                          quickAssignData.workDays.includes(day.value)
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-400"
                            : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
                        }`}
                      >
                        <div className="text-center">
                          <div
                            className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center mb-1 ${
                              quickAssignData.workDays.includes(day.value)
                                ? "bg-indigo-100 dark:bg-indigo-800"
                                : "bg-gray-100 dark:bg-gray-700"
                            }`}
                          >
                            {quickAssignData.workDays.includes(day.value) ? (
                              <CheckIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <span className="text-xs font-bold">
                                {day.label}
                              </span>
                            )}
                          </div>
                          <span className="text-xs">{day.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Selecteer de dagen waarop deze medewerker standaard werkt
                  </p>
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Start tijd *
                    </label>
                    <input
                      type="time"
                      value={quickAssignData.startTime}
                      onChange={(e) =>
                        setQuickAssignData((prev) => ({
                          ...prev,
                          startTime: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Eind tijd *
                    </label>
                    <input
                      type="time"
                      value={quickAssignData.endTime}
                      onChange={(e) =>
                        setQuickAssignData((prev) => ({
                          ...prev,
                          endTime: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                {/* Role/Function */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Functie/Rol *
                  </label>
                  <input
                    type="text"
                    value={quickAssignData.role}
                    onChange={(e) =>
                      setQuickAssignData((prev) => ({
                        ...prev,
                        role: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Bijv. Standaard Werkdag, Schoonmaak, etc."
                    required
                  />
                </div>

                {/* Preview */}
                {quickAssignData.userId &&
                  quickAssignData.workDays.length > 0 && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-700">
                      <h4 className="font-medium text-indigo-800 dark:text-indigo-200 mb-2 flex items-center">
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        Voorvertoning werkpatroon:
                      </h4>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300">
                        <strong>
                          {
                            users.find((u) => u.id === quickAssignData.userId)
                              ?.name
                          }
                        </strong>{" "}
                        werkt{" "}
                        <strong>
                          {quickAssignData.workDays.length} dagen per week
                        </strong>
                        :
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {quickAssignData.workDays.sort().map((dayValue) => (
                          <span
                            key={dayValue}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100"
                          >
                            {
                              DAYS_OF_WEEK.find((d) => d.value === dayValue)
                                ?.fullLabel
                            }
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-2">
                        Tijden:{" "}
                        <strong>
                          {quickAssignData.startTime} -{" "}
                          {quickAssignData.endTime}
                        </strong>{" "}
                        • Functie: <strong>{quickAssignData.role}</strong>
                      </p>
                    </div>
                  )}
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQuickAssign(false)}
                >
                  Annuleren
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleQuickAssignSubmit}
                  disabled={
                    !quickAssignData.userId ||
                    quickAssignData.workDays.length === 0
                  }
                  leftIcon={<CheckIcon className="h-4 w-4" />}
                >
                  Werkpatroon aanmaken
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
