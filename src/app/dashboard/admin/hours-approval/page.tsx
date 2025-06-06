"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format, startOfWeek, endOfWeek, parseISO, isWeekend } from "date-fns";
import { nl } from "date-fns/locale";
import {
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  UserIcon,
  ChartBarIcon,
  DocumentTextIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ClockIcon as TimeIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Input from "@/components/ui/Input";
import MetricCard from "@/components/ui/MetricCard";
import Modal from "@/components/ui/Modal";

interface WorkDay {
  dayOfWeek: number;
  isWorkingDay: boolean;
  startTime?: string;
  endTime?: string;
  breakDuration?: number;
}

interface WorkPattern {
  id: string;
  name: string;
  description: string;
  totalHoursPerWeek: number;
  workDays: WorkDay[];
}

interface WorkPatternAssignment {
  id: string;
  userId: string;
  patternId: string;
  startDate: string;
  endDate?: string;
  pattern: WorkPattern;
}

interface HoursApprovalEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  employeeType: string;
  contractType: string;
  weekStart: string;
  weekEnd: string;
  plannedHours: number;
  actualHours: number;
  overtime: number;
  undertime: number;
  weeklyOvertime: number;
  weeklyOvertimeThreshold: number;
  compensationHours: number;
  hasDiscrepancy: boolean;
  timeEntries: Array<{
    id: string;
    date: string;
    startTime: string;
    endTime?: string;
    hoursWorked: number;
    plannedDayHours: number;
    dayDiscrepancy: number;
    approved: boolean;
  }>;
  currentPattern?: WorkPattern;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export default function HoursApprovalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hoursEntries, setHoursEntries] = useState<HoursApprovalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<HoursApprovalEntry[]>(
    []
  );
  const [selectedWeek, setSelectedWeek] = useState(
    format(new Date(), "yyyy-'W'ww")
  );
  const [filters, setFilters] = useState({
    search: "",
    status: "all", // all, pending, discrepancies, approved
    employeeType: "all", // all, PERMANENT, FLEX_WORKER, FREELANCER
  });

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<HoursApprovalEntry | null>(
    null
  );
  const [bulkApprovalMode, setBulkApprovalMode] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);

  const isAdminOrManager =
    session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (session && !isAdminOrManager) {
      router.push("/dashboard");
    }
  }, [status, session, isAdminOrManager, router]);

  useEffect(() => {
    if (session && isAdminOrManager) {
      fetchHoursData();
    }
  }, [session, isAdminOrManager, selectedWeek]);

  useEffect(() => {
    filterEntries();
  }, [hoursEntries, filters]);

  const fetchHoursData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/hours-approval?week=${selectedWeek}`
      );
      if (response.ok) {
        const data = await response.json();
        setHoursEntries(data.entries || []);
      }
    } catch (error) {
      console.error("Error fetching hours data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = [...hoursEntries];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        (entry) =>
          entry.userName.toLowerCase().includes(filters.search.toLowerCase()) ||
          entry.userEmail.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Status filter
    if (filters.status === "pending") {
      filtered = filtered.filter((entry) => entry.status === "PENDING");
    } else if (filters.status === "discrepancies") {
      filtered = filtered.filter((entry) => entry.hasDiscrepancy);
    } else if (filters.status === "approved") {
      filtered = filtered.filter((entry) => entry.status === "APPROVED");
    }

    // Employee type filter
    if (filters.employeeType !== "all") {
      filtered = filtered.filter(
        (entry) => entry.employeeType === filters.employeeType
      );
    }

    setFilteredEntries(filtered);
  };

  const handleApproval = async (
    entryId: string,
    approved: boolean,
    compensationHours?: number
  ) => {
    try {
      const response = await fetch("/api/admin/hours-approval", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: entryId,
          approved,
          compensationHours: compensationHours || 0,
        }),
      });

      if (response.ok) {
        await fetchHoursData();
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error("Error updating hours approval:", error);
    }
  };

  const handleBulkApproval = async (approved: boolean) => {
    try {
      await Promise.all(
        selectedEntryIds.map((entryId) => handleApproval(entryId, approved))
      );
      setSelectedEntryIds([]);
      setBulkApprovalMode(false);
    } catch (error) {
      console.error("Error bulk updating hours:", error);
    }
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(Math.abs(hours));
    const m = Math.round((Math.abs(hours) - h) * 60);
    const sign = hours < 0 ? "-" : "";
    return `${sign}${h}u ${m}m`;
  };

  const getStatusBadge = (entry: HoursApprovalEntry) => {
    if (entry.status === "APPROVED") {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Goedgekeurd
        </span>
      );
    }

    if (entry.hasDiscrepancy) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Afwijking
        </span>
      );
    }

    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        In behandeling
      </span>
    );
  };

  const pendingCount = hoursEntries.filter(
    (e) => e.status === "PENDING"
  ).length;
  const discrepancyCount = hoursEntries.filter((e) => e.hasDiscrepancy).length;
  const approvedCount = hoursEntries.filter(
    (e) => e.status === "APPROVED"
  ).length;
  const totalOvertimeHours = hoursEntries.reduce(
    (sum, e) => sum + Math.max(0, e.overtime),
    0
  );
  const totalWeeklyOvertimeHours = hoursEntries.reduce(
    (sum, e) => sum + Math.max(0, e.weeklyOvertime || 0),
    0
  );

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Admin", href: "/dashboard/admin" },
            { label: "Uren Goedkeuring" },
          ]}
          className="mb-6"
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Uren Goedkeuring
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Controleer en keur gewerkte uren goed voor vaste medewerkers
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="In Behandeling"
            value={pendingCount.toString()}
            description="Wachtend op goedkeuring"
            icon={<ClockIcon className="h-6 w-6" />}
            trend={
              pendingCount > 0
                ? { value: pendingCount, isPositive: false }
                : undefined
            }
          />
          <MetricCard
            title="Afwijkingen"
            value={discrepancyCount.toString()}
            description="Te weinig/veel gewerkt"
            icon={<ExclamationTriangleIcon className="h-6 w-6" />}
            trend={
              discrepancyCount > 0
                ? { value: discrepancyCount, isPositive: false }
                : undefined
            }
          />
          <MetricCard
            title="Goedgekeurd"
            value={approvedCount.toString()}
            description="Deze week goedgekeurd"
            icon={<CheckCircleIcon className="h-6 w-6" />}
          />
          <MetricCard
            title="Patroon Overuren"
            value={formatDuration(totalOvertimeHours)}
            description="Versus werkpatroon"
            icon={<ClockIcon className="h-6 w-6" />}
          />
          <MetricCard
            title="Wekelijkse Overuren"
            value={formatDuration(totalWeeklyOvertimeHours)}
            description="Boven contracturen"
            icon={<CalendarDaysIcon className="h-6 w-6" />}
          />
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Week Selectie
                </label>
                <Input
                  type="week"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Zoeken
                </label>
                <Input
                  type="text"
                  placeholder="Zoek medewerker..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status Filter
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">Alle</option>
                  <option value="pending">In Behandeling</option>
                  <option value="discrepancies">Afwijkingen</option>
                  <option value="approved">Goedgekeurd</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type Filter
                </label>
                <select
                  value={filters.employeeType}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      employeeType: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">Alle Types</option>
                  <option value="PERMANENT">Vaste Medewerkers</option>
                  <option value="FLEX_WORKER">Oproepkrachten</option>
                  <option value="FREELANCER">Freelancers</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {bulkApprovalMode && selectedEntryIds.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-800 dark:text-blue-200">
                    {selectedEntryIds.length} items geselecteerd
                  </span>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkApproval(true)}
                      className="text-green-600 border-green-300 hover:bg-green-50"
                    >
                      Goedkeuren
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkApproval(false)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Afwijzen
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBulkApprovalMode(false);
                        setSelectedEntryIds([]);
                      }}
                    >
                      Annuleren
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hours Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Uren Overzicht
              </h3>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkApprovalMode(!bulkApprovalMode)}
                  className={
                    bulkApprovalMode ? "bg-blue-50 border-blue-300" : ""
                  }
                >
                  Bulk Bewerken
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {bulkApprovalMode && (
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedEntryIds.length === filteredEntries.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEntryIds(
                              filteredEntries.map((entry) => entry.id)
                            );
                          } else {
                            setSelectedEntryIds([]);
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Medewerker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Gepland / Gewerkt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Patroon Verschil
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Wekelijkse Overuren
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {bulkApprovalMode && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedEntryIds.includes(entry.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEntryIds((prev) => [
                                ...prev,
                                entry.id,
                              ]);
                            } else {
                              setSelectedEntryIds((prev) =>
                                prev.filter((id) => id !== entry.id)
                              );
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {entry.userName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {entry.userEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {entry.employeeType === "PERMANENT"
                          ? "Vast"
                          : entry.employeeType === "FLEX_WORKER"
                          ? "Oproep"
                          : "Freelancer"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDuration(entry.plannedHours)} /{" "}
                        {formatDuration(entry.actualHours)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium ${
                          Math.abs(entry.overtime + entry.undertime) > 0.5
                            ? entry.overtime > 0
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-red-600 dark:text-red-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {entry.overtime > 0 &&
                          `+${formatDuration(entry.overtime)}`}
                        {entry.undertime > 0 &&
                          `-${formatDuration(entry.undertime)}`}
                        {Math.abs(entry.overtime + entry.undertime) <= 0.5 &&
                          "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium ${
                          entry.weeklyOvertime > 0
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {entry.weeklyOvertime > 0
                          ? `+${formatDuration(entry.weeklyOvertime)}`
                          : "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(entry)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEntry(entry);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          Details
                        </Button>
                        {entry.status === "PENDING" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproval(entry.id, true)}
                              className="text-green-600 border-green-300 hover:bg-green-50"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproval(entry.id, false)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredEntries.length === 0 && (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  Geen uren gevonden
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Er zijn geen uren voor de geselecteerde filters.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="Uren Detail"
          size="lg"
        >
          {selectedEntry && (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Medewerker Informatie
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Naam:
                    </span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {selectedEntry.userName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Type:
                    </span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {selectedEntry.employeeType === "PERMANENT"
                        ? "Vaste Medewerker"
                        : selectedEntry.employeeType === "FLEX_WORKER"
                        ? "Oproepkracht"
                        : "Freelancer"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Week:
                    </span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {format(parseISO(selectedEntry.weekStart), "dd MMM", {
                        locale: nl,
                      })}{" "}
                      -{" "}
                      {format(parseISO(selectedEntry.weekEnd), "dd MMM yyyy", {
                        locale: nl,
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Werkpatroon:
                    </span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {selectedEntry.currentPattern?.name || "Geen patroon"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hours Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatDuration(selectedEntry.plannedHours)}
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    Gepland
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatDuration(selectedEntry.actualHours)}
                  </div>
                  <div className="text-sm text-green-800 dark:text-green-200">
                    Gewerkt
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div
                    className={`text-2xl font-bold ${
                      selectedEntry.overtime > 0
                        ? "text-blue-600 dark:text-blue-400"
                        : selectedEntry.undertime > 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {selectedEntry.overtime > 0 &&
                      `+${formatDuration(selectedEntry.overtime)}`}
                    {selectedEntry.undertime > 0 &&
                      `-${formatDuration(selectedEntry.undertime)}`}
                    {Math.abs(
                      selectedEntry.overtime + selectedEntry.undertime
                    ) <= 0.5 && "—"}
                  </div>
                  <div className="text-sm text-orange-800 dark:text-orange-200">
                    Verschil
                  </div>
                </div>
              </div>

              {/* Daily Breakdown */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Dagelijks Overzicht
                </h4>
                <div className="space-y-2">
                  {selectedEntry.timeEntries.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {format(parseISO(entry.date), "EEEE dd MMMM", {
                            locale: nl,
                          })}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {entry.startTime} - {entry.endTime || "Lopend"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDuration(entry.hoursWorked)} /{" "}
                          {formatDuration(entry.plannedDayHours)}
                        </div>
                        {Math.abs(entry.dayDiscrepancy) > 0.25 && (
                          <div
                            className={`text-sm font-medium ${
                              entry.dayDiscrepancy > 0
                                ? "text-blue-600"
                                : "text-red-600"
                            }`}
                          >
                            {entry.dayDiscrepancy > 0 ? "+" : ""}
                            {formatDuration(entry.dayDiscrepancy)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compensation Info */}
              {selectedEntry.compensationHours > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Tijd-voor-Tijd Compensatie
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Deze medewerker heeft{" "}
                    {formatDuration(selectedEntry.compensationHours)} overuren
                    gemaakt die omgezet kunnen worden naar compensatieverlof.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailModal(false)}
                >
                  Sluiten
                </Button>
                {selectedEntry.status === "PENDING" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleApproval(selectedEntry.id, false)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Afwijzen
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() =>
                        handleApproval(
                          selectedEntry.id,
                          true,
                          selectedEntry.compensationHours
                        )
                      }
                    >
                      Goedkeuren
                      {selectedEntry.compensationHours > 0 && (
                        <span className="ml-1">
                          (+{formatDuration(selectedEntry.compensationHours)}{" "}
                          compensatie)
                        </span>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
