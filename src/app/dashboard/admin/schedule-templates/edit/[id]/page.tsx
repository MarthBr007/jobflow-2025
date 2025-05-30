"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  CalendarDaysIcon,
  ClockIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Toast, useToast } from "@/components/ui/Toast";

const CATEGORY_OPTIONS = [
  { value: "DAILY", label: "Dagelijks", emoji: "📅" },
  { value: "WEEKLY", label: "Wekelijks", emoji: "🗓️" },
  { value: "PROJECT", label: "Project", emoji: "🚧" },
  { value: "SPECIAL", label: "Speciaal", emoji: "✨" },
  { value: "HOLIDAY", label: "Feestdag", emoji: "🎉" },
  { value: "MAINTENANCE", label: "Onderhoud", emoji: "🔧" },
];

interface ScheduleTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
  shifts: Array<{
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
  }>;
}

export default function EditScheduleTemplatePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();

  const [template, setTemplate] = useState<ScheduleTemplate | null>(null);
  const [editTemplate, setEditTemplate] = useState({
    name: "",
    description: "",
    category: "DAILY",
    isActive: true,
  });

  const [editShift, setEditShift] = useState({
    role: "",
    startTime: "09:00",
    endTime: "17:00",
    breakType: "60min" as "none" | "30min" | "60min",
    breaks: [] as Array<{
      startTime: string;
      endTime: string;
      type: "morning" | "lunch" | "afternoon";
      duration: number;
    }>,
    totalBreakDuration: 60,
    minPersons: 1,
    maxPersons: null as number | null,
    requirements: [],
    notes: "",
  });

  useEffect(() => {
    if (params?.id) {
      fetchTemplate(params.id as string);
    }
  }, [params?.id]);

  const fetchTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/schedule-templates/${id}`);
      if (response.ok) {
        const data = await response.json();
        setTemplate(data);

        // Populate edit form with existing data
        setEditTemplate({
          name: data.name,
          description: data.description || "",
          category: data.category,
          isActive: data.isActive,
        });

        // If there's a shift, populate the shift form
        if (data.shifts && data.shifts.length > 0) {
          const shift = data.shifts[0];
          const breakDuration = shift.totalBreakDuration || 0;
          let breakType: "none" | "30min" | "60min" = "none";

          if (breakDuration === 30) breakType = "30min";
          else if (breakDuration >= 60) breakType = "60min";

          setEditShift({
            role: shift.role,
            startTime: shift.startTime,
            endTime: shift.endTime,
            breakType,
            breaks: shift.breaks || [],
            totalBreakDuration: breakDuration,
            minPersons: shift.minPersons,
            maxPersons: shift.maxPersons,
            requirements: shift.requirements || [],
            notes: shift.notes || "",
          });
        }
      } else {
        showToast("Template niet gevonden", "error");
        router.push("/dashboard/admin/schedule-templates");
      }
    } catch (error) {
      console.error("Error fetching template:", error);
      showToast("Er is iets misgegaan bij het laden", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/schedule-templates/${params?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editTemplate,
          shifts: [editShift],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Template succesvol bijgewerkt", "success");
        router.push("/dashboard/admin/schedule-templates");
      } else {
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error updating template:", error);
      showToast("Er is iets misgegaan bij het bijwerken", "error");
    } finally {
      setSaving(false);
    }
  };

  const updateBreakType = (breakType: "none" | "30min" | "60min") => {
    if (breakType === "none") {
      setEditShift({
        ...editShift,
        breakType,
        breaks: [],
        totalBreakDuration: 0,
      });
    } else if (breakType === "30min") {
      setEditShift({
        ...editShift,
        breakType,
        breaks: [
          { startTime: "12:00", endTime: "12:30", type: "lunch", duration: 30 },
        ],
        totalBreakDuration: 30,
      });
    } else {
      setEditShift({
        ...editShift,
        breakType,
        breaks: [
          {
            startTime: "10:00",
            endTime: "10:15",
            type: "morning",
            duration: 15,
          },
          { startTime: "12:00", endTime: "12:30", type: "lunch", duration: 30 },
          {
            startTime: "15:00",
            endTime: "15:15",
            type: "afternoon",
            duration: 15,
          },
        ],
        totalBreakDuration: 60,
      });
    }
  };

  const calculateShiftDuration = (
    startTime: string,
    endTime: string,
    breakDuration?: number
  ) => {
    // Validate input
    if (!startTime || !endTime) {
      return "-- u --m";
    }

    try {
      // Ensure time format is correct (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        return "-- u --m";
      }

      const start = new Date(`2000-01-01T${startTime}:00`);
      const end = new Date(`2000-01-01T${endTime}:00`);

      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "-- u --m";
      }

      let totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

      // Handle overnight shifts
      if (totalMinutes < 0) {
        totalMinutes += 24 * 60; // Add 24 hours for overnight shifts
      }

      const workMinutes = Math.max(0, totalMinutes - (breakDuration || 0));
      const hours = Math.floor(workMinutes / 60);
      const minutes = Math.round(workMinutes % 60);

      return `${hours}u ${minutes > 0 ? `${minutes}m` : ""}`.trim();
    } catch (error) {
      console.error("Error calculating shift duration:", error);
      return "-- u --m";
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Template laden...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Template niet gevonden
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard" },
          {
            label: "Rooster Templates",
            href: "/dashboard/admin/schedule-templates",
          },
          { label: `${template.name} bewerken` },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/admin/schedule-templates")}
            leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
            size="md"
          >
            Terug naar Templates
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              📅 Template Bewerken
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Bewerk "{template.name}"
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleUpdateTemplate} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Basis Informatie
            </h3>
          </div>
          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Template Naam"
                value={editTemplate.name}
                onChange={(e) =>
                  setEditTemplate({ ...editTemplate, name: e.target.value })
                }
                placeholder="Bijv. Parttime Administratie, Standaard Werkdag"
                required
                variant="outlined"
                inputSize="md"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categorie
                </label>
                <select
                  value={editTemplate.category}
                  onChange={(e) =>
                    setEditTemplate({
                      ...editTemplate,
                      category: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.emoji} {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Beschrijving (optioneel)
              </label>
              <textarea
                value={editTemplate.description}
                onChange={(e) =>
                  setEditTemplate({
                    ...editTemplate,
                    description: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Beschrijf waar deze template voor gebruikt wordt..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={editTemplate.isActive}
                onChange={(e) =>
                  setEditTemplate({
                    ...editTemplate,
                    isActive: e.target.checked,
                  })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isActive"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                Template actief (beschikbaar voor gebruik)
              </label>
            </div>
          </div>
        </div>

        {/* Shift Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Dienst Informatie
            </h3>
          </div>
          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Input
                label="Rol/Functie"
                value={editShift.role}
                onChange={(e) =>
                  setEditShift({ ...editShift, role: e.target.value })
                }
                placeholder="Algemeen Medewerker"
                required
                variant="outlined"
                inputSize="md"
              />

              <Input
                label="Starttijd"
                type="time"
                value={editShift.startTime}
                onChange={(e) =>
                  setEditShift({ ...editShift, startTime: e.target.value })
                }
                required
                variant="outlined"
                inputSize="md"
              />

              <Input
                label="Eindtijd"
                type="time"
                value={editShift.endTime}
                onChange={(e) =>
                  setEditShift({ ...editShift, endTime: e.target.value })
                }
                required
                variant="outlined"
                inputSize="md"
              />
            </div>

            {/* Break Configuration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Pauze Configuratie
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    value: "none",
                    label: "Geen pauzes",
                    description: "Korte diensten",
                  },
                  {
                    value: "30min",
                    label: "30 min pauze",
                    description: "Lunch (30m)",
                  },
                  {
                    value: "60min",
                    label: "60 min pauzes",
                    description: "Ochtend (15m) + Lunch (30m) + Middag (15m)",
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`relative flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      editShift.breakType === option.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="breakType"
                      value={option.value}
                      checked={editShift.breakType === option.value}
                      onChange={(e) =>
                        updateBreakType(
                          e.target.value as "none" | "30min" | "60min"
                        )
                      }
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {option.description}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Personnel Requirements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Minimum Personen"
                type="number"
                min="1"
                value={editShift.minPersons}
                onChange={(e) =>
                  setEditShift({
                    ...editShift,
                    minPersons: parseInt(e.target.value) || 1,
                  })
                }
                required
                variant="outlined"
                inputSize="md"
              />

              <Input
                label="Maximum Personen (optioneel)"
                type="number"
                min="1"
                value={editShift.maxPersons?.toString() || ""}
                onChange={(e) =>
                  setEditShift({
                    ...editShift,
                    maxPersons: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                variant="outlined"
                inputSize="md"
                placeholder="Onbeperkt"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notities (optioneel)
              </label>
              <textarea
                value={editShift.notes}
                onChange={(e) =>
                  setEditShift({ ...editShift, notes: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Bijzondere opmerkingen over deze dienst..."
              />
            </div>

            {/* Duration Preview */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Werkduur Preview:
                </span>
                <span className="text-blue-700 dark:text-blue-300">
                  {calculateShiftDuration(
                    editShift.startTime,
                    editShift.endTime,
                    editShift.totalBreakDuration
                  )}
                </span>
                {editShift.totalBreakDuration > 0 && (
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    (inclusief {editShift.totalBreakDuration}min pauze)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/admin/schedule-templates")}
            size="lg"
          >
            Annuleren
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            loading={saving}
            leftIcon={<CheckCircleIcon className="h-5 w-5" />}
            size="lg"
          >
            {saving ? "Bijwerken..." : "Template Bijwerken"}
          </Button>
        </div>
      </form>

      {/* Toast */}
      {toast && toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          isVisible={true}
        />
      )}
    </div>
  );
}
