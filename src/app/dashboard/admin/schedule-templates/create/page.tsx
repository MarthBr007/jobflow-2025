"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

export default function CreateScheduleTemplatePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    category: "DAILY",
    workingDays: [] as number[],
  });

  const [newShift, setNewShift] = useState({
    role: "",
    startTime: "09:00",
    endTime: "17:00",
    breakType: "60min" as "none" | "30min" | "60min",
    breaks: [
      { startTime: "10:00", endTime: "10:15", type: "morning", duration: 15 },
      { startTime: "12:00", endTime: "12:30", type: "lunch", duration: 30 },
      { startTime: "15:00", endTime: "15:15", type: "afternoon", duration: 15 },
    ],
    totalBreakDuration: 60,
    minPersons: 1,
    maxPersons: null,
    requirements: [],
    notes: "",
    workLocationId: "",
    projectId: "",
  });

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/schedule-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newTemplate,
          shifts: [newShift],
          workingDays: newTemplate.workingDays,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Template succesvol aangemaakt", "success");
        router.push("/dashboard/admin/schedule-templates");
      } else {
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error creating template:", error);
      showToast("Er is iets misgegaan bij het aanmaken", "error");
    } finally {
      setSaving(false);
    }
  };

  const updateBreakType = (breakType: "none" | "30min" | "60min") => {
    if (breakType === "none") {
      setNewShift({
        ...newShift,
        breakType,
        breaks: [],
        totalBreakDuration: 0,
      });
    } else if (breakType === "30min") {
      setNewShift({
        ...newShift,
        breakType,
        breaks: [
          { startTime: "12:00", endTime: "12:30", type: "lunch", duration: 30 },
        ],
        totalBreakDuration: 30,
      });
    } else {
      setNewShift({
        ...newShift,
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
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const workMinutes = totalMinutes - (breakDuration || 0);
    const hours = Math.floor(workMinutes / 60);
    const minutes = workMinutes % 60;
    return `${hours}u ${minutes > 0 ? `${minutes}m` : ""}`;
  };

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
          { label: "Nieuwe Template" },
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
              📅 Nieuwe Rooster Template
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Maak een herbruikbare rooster template aan
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleCreateTemplate} className="space-y-8">
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
                value={newTemplate.name}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, name: e.target.value })
                }
                placeholder="Bijv. Parttime Administratie, Standaard Werkdag"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categorie
                </label>
                <select
                  value={newTemplate.category}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.emoji} {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Beschrijving (optioneel)"
              value={newTemplate.description}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, description: e.target.value })
              }
              placeholder="Beschrijving van deze template..."
            />
          </div>
        </div>

        {/* Working Days Selection */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              📅 Werkdagen voor deze Template
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Selecteer de dagen waarop deze template standaard van toepassing
              is. Perfect voor parttime roosters.
            </p>
          </div>
          <div className="px-6 py-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
              {[
                { value: 1, label: "Maandag", short: "Ma" },
                { value: 2, label: "Dinsdag", short: "Di" },
                { value: 3, label: "Woensdag", short: "Wo" },
                { value: 4, label: "Donderdag", short: "Do" },
                { value: 5, label: "Vrijdag", short: "Vr" },
                { value: 6, label: "Zaterdag", short: "Za" },
                { value: 0, label: "Zondag", short: "Zo" },
              ].map((day) => {
                const isSelected = newTemplate.workingDays.includes(day.value);
                return (
                  <label
                    key={day.value}
                    className={`relative flex flex-col items-center justify-center p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                        : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const updatedDays = e.target.checked
                          ? [...newTemplate.workingDays, day.value]
                          : newTemplate.workingDays.filter(
                              (d) => d !== day.value
                            );
                        setNewTemplate({
                          ...newTemplate,
                          workingDays: updatedDays,
                        });
                      }}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="text-xl font-medium text-gray-900 dark:text-white">
                        {day.short}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {day.label}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <CheckCircleIcon className="w-6 h-6 text-blue-500" />
                      </div>
                    )}
                  </label>
                );
              })}
            </div>

            {newTemplate.workingDays.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✅ Template wordt automatisch toegepast op{" "}
                  {newTemplate.workingDays.length}{" "}
                  {newTemplate.workingDays.length === 1 ? "dag" : "dagen"} per
                  week
                </p>
              </div>
            )}

            {newTemplate.workingDays.length === 0 && (
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ Geen dagen geselecteerd. Je kunt deze template later
                  handmatig toewijzen aan specifieke dagen.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Shift Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              🕐 Dienst Informatie
            </h3>
          </div>
          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Rol/Functie"
                value={newShift.role}
                onChange={(e) =>
                  setNewShift({ ...newShift, role: e.target.value })
                }
                placeholder="Bijv. Chauffeur, Orderpicker, Administratie"
                required
              />

              <Input
                label="Min. aantal personen"
                type="number"
                value={newShift.minPersons}
                onChange={(e) =>
                  setNewShift({
                    ...newShift,
                    minPersons: parseInt(e.target.value),
                  })
                }
                min="1"
                required
              />

              <Input
                label="Start tijd"
                type="time"
                value={newShift.startTime}
                onChange={(e) =>
                  setNewShift({ ...newShift, startTime: e.target.value })
                }
                required
              />

              <Input
                label="Eind tijd"
                type="time"
                value={newShift.endTime}
                onChange={(e) =>
                  setNewShift({ ...newShift, endTime: e.target.value })
                }
                required
              />
            </div>

            {/* Work Duration Preview */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <ClockIcon className="inline h-4 w-4 mr-1" />
                <strong>Totale werktijd:</strong>{" "}
                {calculateShiftDuration(
                  newShift.startTime,
                  newShift.endTime,
                  newShift.totalBreakDuration
                )}{" "}
                (excl. pauzes)
              </p>
            </div>
          </div>
        </div>

        {/* Break Configuration */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              ☕ Pauze Configuratie
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Perfect voor parttimers die geen pauze hebben of verschillende
              pauze regelingen
            </p>
          </div>
          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => updateBreakType("none")}
                className={`p-6 rounded-lg border-2 transition-colors ${
                  newShift.breakType === "none"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-3">🚫</div>
                  <div className="font-medium">Geen Pauze</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Voor korte diensten of parttimers
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => updateBreakType("30min")}
                className={`p-6 rounded-lg border-2 transition-colors ${
                  newShift.breakType === "30min"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-3">☕</div>
                  <div className="font-medium">30 Minuten</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Alleen lunchpauze
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => updateBreakType("60min")}
                className={`p-6 rounded-lg border-2 transition-colors ${
                  newShift.breakType === "60min"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-3">🍽️</div>
                  <div className="font-medium">60 Minuten</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    3 pauzes verdeeld
                  </div>
                </div>
              </button>
            </div>

            {/* Break Details */}
            {newShift.breakType !== "none" && (
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">
                  Pauze Tijden
                </h4>

                {/* Lunch Break - always visible when breaks are enabled */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    🍽️ Lunchpauze (
                    {newShift.breakType === "30min" ? "30" : "30"} min)
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Start tijd"
                      type="time"
                      value={
                        newShift.breaks.find((b) => b.type === "lunch")
                          ?.startTime || "12:00"
                      }
                      onChange={(e) => {
                        const lunchIndex = newShift.breaks.findIndex(
                          (b) => b.type === "lunch"
                        );
                        const newBreaks = [...newShift.breaks];
                        if (lunchIndex >= 0) {
                          newBreaks[lunchIndex] = {
                            ...newBreaks[lunchIndex],
                            startTime: e.target.value,
                          };
                        }
                        setNewShift({ ...newShift, breaks: newBreaks });
                      }}
                    />
                    <Input
                      label="Eind tijd"
                      type="time"
                      value={
                        newShift.breaks.find((b) => b.type === "lunch")
                          ?.endTime || "12:30"
                      }
                      onChange={(e) => {
                        const lunchIndex = newShift.breaks.findIndex(
                          (b) => b.type === "lunch"
                        );
                        const newBreaks = [...newShift.breaks];
                        if (lunchIndex >= 0) {
                          newBreaks[lunchIndex] = {
                            ...newBreaks[lunchIndex],
                            endTime: e.target.value,
                          };
                        }
                        setNewShift({ ...newShift, breaks: newBreaks });
                      }}
                    />
                  </div>
                </div>

                {/* Morning and Afternoon breaks - only for 60min */}
                {newShift.breakType === "60min" && (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        🌅 Ochtendpauze (15 min)
                      </h5>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Start tijd"
                          type="time"
                          value={
                            newShift.breaks.find((b) => b.type === "morning")
                              ?.startTime || "10:00"
                          }
                          onChange={(e) => {
                            const morningIndex = newShift.breaks.findIndex(
                              (b) => b.type === "morning"
                            );
                            const newBreaks = [...newShift.breaks];
                            if (morningIndex >= 0) {
                              newBreaks[morningIndex] = {
                                ...newBreaks[morningIndex],
                                startTime: e.target.value,
                              };
                            }
                            setNewShift({ ...newShift, breaks: newBreaks });
                          }}
                        />
                        <Input
                          label="Eind tijd"
                          type="time"
                          value={
                            newShift.breaks.find((b) => b.type === "morning")
                              ?.endTime || "10:15"
                          }
                          onChange={(e) => {
                            const morningIndex = newShift.breaks.findIndex(
                              (b) => b.type === "morning"
                            );
                            const newBreaks = [...newShift.breaks];
                            if (morningIndex >= 0) {
                              newBreaks[morningIndex] = {
                                ...newBreaks[morningIndex],
                                endTime: e.target.value,
                              };
                            }
                            setNewShift({ ...newShift, breaks: newBreaks });
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        ☕ Middagpauze (15 min)
                      </h5>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Start tijd"
                          type="time"
                          value={
                            newShift.breaks.find((b) => b.type === "afternoon")
                              ?.startTime || "15:00"
                          }
                          onChange={(e) => {
                            const afternoonIndex = newShift.breaks.findIndex(
                              (b) => b.type === "afternoon"
                            );
                            const newBreaks = [...newShift.breaks];
                            if (afternoonIndex >= 0) {
                              newBreaks[afternoonIndex] = {
                                ...newBreaks[afternoonIndex],
                                startTime: e.target.value,
                              };
                            }
                            setNewShift({ ...newShift, breaks: newBreaks });
                          }}
                        />
                        <Input
                          label="Eind tijd"
                          type="time"
                          value={
                            newShift.breaks.find((b) => b.type === "afternoon")
                              ?.endTime || "15:15"
                          }
                          onChange={(e) => {
                            const afternoonIndex = newShift.breaks.findIndex(
                              (b) => b.type === "afternoon"
                            );
                            const newBreaks = [...newShift.breaks];
                            if (afternoonIndex >= 0) {
                              newBreaks[afternoonIndex] = {
                                ...newBreaks[afternoonIndex],
                                endTime: e.target.value,
                              };
                            }
                            setNewShift({ ...newShift, breaks: newBreaks });
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Break Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Totale pauze:</strong> {newShift.totalBreakDuration}{" "}
                minuten
                <br />
                <span className="text-xs">
                  {newShift.breakType === "none"
                    ? "Geen pauze - perfect voor korte diensten"
                    : newShift.breakType === "30min"
                    ? "Alleen lunchpauze van 30 minuten"
                    : "Verdeeld over 3 pauzes: 15 min ochtend + 30 min lunch + 15 min middag"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              📝 Extra Informatie
            </h3>
          </div>
          <div className="px-6 py-6">
            <Input
              label="Opmerkingen (optioneel)"
              value={newShift.notes}
              onChange={(e) =>
                setNewShift({ ...newShift, notes: e.target.value })
              }
              placeholder="Bijv. Parttimer, vroege dienst, specifieke vereisten..."
            />
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
            size="lg"
          >
            {saving ? "Template Aanmaken..." : "Template Aanmaken"}
          </Button>
        </div>
      </form>

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
