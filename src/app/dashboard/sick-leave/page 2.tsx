"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ExclamationTriangleIcon,
  PlusIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { nl } from "date-fns/locale";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import MetricCard from "@/components/ui/MetricCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/hooks/useToast";

interface SickLeaveEntry {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
  description?: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  dayCount: number;
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
  createdAt: string;
}

export default function SickLeavePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [sickLeaveEntries, setSickLeaveEntries] = useState<SickLeaveEntry[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newSickLeave, setNewSickLeave] = useState({
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    reason: "",
    description: "",
    isFullDay: true,
    startTime: "09:00",
    endTime: "17:00",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/");
      return;
    }
    if (session.user.role !== "FREELANCER") {
      router.push("/dashboard");
      return;
    }
    fetchSickLeaveEntries();
  }, [session, status, router]);

  const fetchSickLeaveEntries = async () => {
    try {
      const response = await fetch("/api/leave-requests?type=SICK_LEAVE");
      if (response.ok) {
        const data = await response.json();
        setSickLeaveEntries(data);
      } else {
        showToast("Fout bij ophalen ziekte registraties", "error");
      }
    } catch (error) {
      console.error("Error fetching sick leave entries:", error);
      showToast("Er is een fout opgetreden", "error");
    } finally {
      setLoading(false);
    }
  };

  const calculateDayCount = () => {
    const start = new Date(newSickLeave.startDate);
    const end = new Date(newSickLeave.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmitSickLeave = async () => {
    if (!newSickLeave.startDate || !newSickLeave.endDate) {
      showToast("Start- en einddatum zijn verplicht", "error");
      return;
    }

    if (new Date(newSickLeave.endDate) < new Date(newSickLeave.startDate)) {
      showToast("Einddatum kan niet voor startdatum liggen", "error");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SICK_LEAVE",
          startDate: newSickLeave.startDate,
          endDate: newSickLeave.endDate,
          reason: newSickLeave.reason || "Ziekte",
          description: newSickLeave.description,
          isFullDay: newSickLeave.isFullDay,
          startTime: newSickLeave.isFullDay ? null : newSickLeave.startTime,
          endTime: newSickLeave.isFullDay ? null : newSickLeave.endTime,
          dayCount: calculateDayCount(),
        }),
      });

      if (response.ok) {
        showToast("Ziekte registratie succesvol aangemaakt", "success");
        setShowCreateModal(false);
        setNewSickLeave({
          startDate: format(new Date(), "yyyy-MM-dd"),
          endDate: format(new Date(), "yyyy-MM-dd"),
          reason: "",
          description: "",
          isFullDay: true,
          startTime: "09:00",
          endTime: "17:00",
        });
        fetchSickLeaveEntries();
      } else {
        const errorData = await response.json();
        showToast(
          errorData.error || "Fout bij aanmaken ziekte registratie",
          "error"
        );
      }
    } catch (error) {
      console.error("Error submitting sick leave:", error);
      showToast("Er is een fout opgetreden", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "green";
      case "PENDING":
        return "orange";
      case "REJECTED":
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Goedgekeurd";
      case "PENDING":
        return "In behandeling";
      case "REJECTED":
        return "Afgewezen";
      default:
        return "Onbekend";
    }
  };

  if (status === "loading" || loading) {
    return (
      <LoadingSpinner
        size="lg"
        variant="bars"
        message="Ziekte registraties laden..."
        description="Ophalen van uw ziekte registraties"
        centerInParent={true}
      />
    );
  }

  // Calculate stats
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const thisMonthEntries = sickLeaveEntries.filter((entry) => {
    const entryDate = new Date(entry.startDate);
    return entryDate >= monthStart && entryDate <= monthEnd;
  });

  const totalSickDaysThisMonth = thisMonthEntries.reduce(
    (total, entry) => total + entry.dayCount,
    0
  );
  const totalSickDaysThisYear = sickLeaveEntries
    .filter((entry) => {
      const entryDate = new Date(entry.startDate);
      return entryDate.getFullYear() === currentMonth.getFullYear();
    })
    .reduce((total, entry) => total + entry.dayCount, 0);

  return (
    <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Ziekte Registratie" },
        ]}
        className="mb-6"
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-bold text-gray-900 dark:text-white">
              <ExclamationTriangleIcon className="w-8 h-8 mr-3 text-red-600" />
              Ziekte Registratie
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Registreer ziekteperiodes voor administratieve doeleinden
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            leftIcon={<PlusIcon className="h-5 w-5" />}
            className="bg-red-600 hover:bg-red-700"
          >
            Ziekte Registreren
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Deze Maand"
          value={totalSickDaysThisMonth}
          icon={<CalendarDaysIcon className="w-8 h-8" />}
          color="red"
          subtitle="Ziektedagen"
        />
        <MetricCard
          title="Dit Jaar"
          value={totalSickDaysThisYear}
          icon={<CalendarDaysIcon className="w-8 h-8" />}
          color="orange"
          subtitle="Totaal ziektedagen"
        />
        <MetricCard
          title="Totaal Registraties"
          value={sickLeaveEntries.length}
          icon={<DocumentTextIcon className="w-8 h-8" />}
          color="blue"
          subtitle="Alle registraties"
        />
        <MetricCard
          title="In Behandeling"
          value={sickLeaveEntries.filter((e) => e.status === "PENDING").length}
          icon={<ClockIcon className="w-8 h-8" />}
          color="orange"
          subtitle="Wacht op goedkeuring"
        />
      </div>

      {/* Sick Leave Entries */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🏥 Ziekte Registraties
          </h3>
        </div>

        {sickLeaveEntries.length === 0 ? (
          <div className="p-12 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Nog geen ziekte registraties
            </h3>
            <p className="mb-6 text-gray-500 dark:text-gray-400">
              Registreer uw eerste ziekteperiode voor administratieve doeleinden
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              leftIcon={<PlusIcon className="h-5 w-5" />}
              className="bg-red-600 hover:bg-red-700"
            >
              Eerste Ziekte Registreren
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Periode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Dagen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Reden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Geregistreerd
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sickLeaveEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {format(new Date(entry.startDate), "dd MMM yyyy", {
                          locale: nl,
                        })}
                        {entry.startDate !== entry.endDate && (
                          <span>
                            {" "}
                            -{" "}
                            {format(new Date(entry.endDate), "dd MMM yyyy", {
                              locale: nl,
                            })}
                          </span>
                        )}
                      </div>
                      {!entry.isFullDay && (
                        <div className="text-xs text-gray-500">
                          {entry.startTime} - {entry.endTime}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {entry.dayCount}{" "}
                        {entry.dayCount === 1 ? "dag" : "dagen"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.isFullDay ? "Hele dag" : "Gedeeltelijk"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {entry.reason || "Ziekte"}
                      </div>
                      {entry.description && (
                        <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                          {entry.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${getStatusColor(
                          entry.status
                        )}-100 text-${getStatusColor(
                          entry.status
                        )}-800 dark:bg-${getStatusColor(
                          entry.status
                        )}-900/20 dark:text-${getStatusColor(
                          entry.status
                        )}-200`}
                      >
                        {getStatusLabel(entry.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(entry.createdAt), "dd MMM yyyy", {
                        locale: nl,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Sick Leave Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="🏥 Ziekte Registreren"
        description="Registreer een ziekteperiode voor administratieve doeleinden"
        size="lg"
      >
        <div className="space-y-6">
          {/* Date Range */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Input
              type="date"
              label="Startdatum"
              value={newSickLeave.startDate}
              onChange={(e) =>
                setNewSickLeave({ ...newSickLeave, startDate: e.target.value })
              }
              required
            />
            <Input
              type="date"
              label="Einddatum"
              value={newSickLeave.endDate}
              onChange={(e) =>
                setNewSickLeave({ ...newSickLeave, endDate: e.target.value })
              }
              required
            />
          </div>

          {/* Full Day Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isFullDay"
              checked={newSickLeave.isFullDay}
              onChange={(e) =>
                setNewSickLeave({
                  ...newSickLeave,
                  isFullDay: e.target.checked,
                })
              }
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isFullDay"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Hele dag ziek
            </label>
          </div>

          {/* Time Range (if not full day) */}
          {!newSickLeave.isFullDay && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Input
                type="time"
                label="Van tijd"
                value={newSickLeave.startTime}
                onChange={(e) =>
                  setNewSickLeave({
                    ...newSickLeave,
                    startTime: e.target.value,
                  })
                }
              />
              <Input
                type="time"
                label="Tot tijd"
                value={newSickLeave.endTime}
                onChange={(e) =>
                  setNewSickLeave({ ...newSickLeave, endTime: e.target.value })
                }
              />
            </div>
          )}

          {/* Reason */}
          <Input
            label="Reden (optioneel)"
            value={newSickLeave.reason}
            onChange={(e) =>
              setNewSickLeave({ ...newSickLeave, reason: e.target.value })
            }
            placeholder="Bijv. Griep, Migraine, ..."
          />

          {/* Description */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Aanvullende informatie (optioneel)
            </label>
            <textarea
              value={newSickLeave.description}
              onChange={(e) =>
                setNewSickLeave({
                  ...newSickLeave,
                  description: e.target.value,
                })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Eventuele aanvullende informatie..."
            />
          </div>

          {/* Day Count Preview */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium text-red-900 dark:text-red-200">
                Totaal ziektedagen:
              </span>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {calculateDayCount()}{" "}
                {calculateDayCount() === 1 ? "dag" : "dagen"}
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Annuleren
            </Button>
            <Button
              onClick={handleSubmitSickLeave}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? "Registreren..." : "Ziekte Registreren"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
 