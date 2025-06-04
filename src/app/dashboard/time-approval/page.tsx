"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  CalendarDaysIcon,
  UserIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TrophyIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Input from "@/components/ui/Input";
import Table from "@/components/ui/Table";
import MetricCard from "@/components/ui/MetricCard";

interface TimeEntry {
  id: string;
  description: string;
  startTime: Date;
  endTime: Date | null;
  approved: boolean;
  isWarehouse: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    company: string;
  };
  project?: {
    id: string;
    name: string;
    company: string;
  };
}

function TimeApprovalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("startTime");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    company: "",
    approved: "pending", // pending, approved, rejected, all
    dateFrom: "",
    dateTo: "",
  });

  // Check if user is admin or manager
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
      fetchTimeEntries();
    }
  }, [session, isAdminOrManager]);

  useEffect(() => {
    filterEntries();
  }, [timeEntries, filters]);

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/time-entries");
      if (response.ok) {
        const data = await response.json();
        setTimeEntries(
          data.map((entry: any) => ({
            ...entry,
            startTime: new Date(entry.startTime),
            endTime: entry.endTime ? new Date(entry.endTime) : null,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching time entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = [...timeEntries];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        (entry) =>
          entry.user.name
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          entry.user.email
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          entry.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Company filter
    if (filters.company) {
      filtered = filtered.filter(
        (entry) => entry.user.company === filters.company
      );
    }

    // Approval status filter
    if (filters.approved === "pending") {
      filtered = filtered.filter((entry) => !entry.approved);
    } else if (filters.approved === "approved") {
      filtered = filtered.filter((entry) => entry.approved);
    }

    // Date filters
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((entry) => entry.startTime >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((entry) => entry.startTime <= toDate);
    }

    setFilteredEntries(filtered);
  };

  const handleApproval = async (entryId: string, approved: boolean) => {
    try {
      const response = await fetch("/api/admin/time-entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entryId, approved }),
      });

      if (response.ok) {
        await fetchTimeEntries();
      }
    } catch (error) {
      console.error("Error updating time entry:", error);
    }
  };

  const handleBulkApproval = async (approved: boolean) => {
    try {
      await Promise.all(
        selectedRows.map((entryId) => handleApproval(entryId, approved))
      );
      setSelectedRows([]);
    } catch (error) {
      console.error("Error bulk updating time entries:", error);
    }
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDirection("asc");
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === filteredEntries.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredEntries.map((entry) => entry.id));
    }
  };

  const calculateDuration = (startTime: Date, endTime: Date | null) => {
    if (!endTime) return "Lopend";
    const duration = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  // Calculate statistics
  const pendingEntries = timeEntries.filter((entry) => !entry.approved);
  const approvedEntries = timeEntries.filter((entry) => entry.approved);
  const totalHours = timeEntries.reduce((total, entry) => {
    if (entry.endTime) {
      const duration = entry.endTime.getTime() - entry.startTime.getTime();
      return total + duration / (1000 * 60 * 60);
    }
    return total;
  }, 0);
  const uniqueEmployees = new Set(timeEntries.map((entry) => entry.user.id))
    .size;

  const tableColumns = [
    {
      key: "user",
      label: "Medewerker",
      sortable: true,
      className: "min-w-[280px]",
      render: (value: any, row: TimeEntry) => (
        <div className="flex items-center py-3">
          <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">
              {row.user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-4 min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {row.user.name}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {row.user.email}
            </div>
            <div className="flex items-center mt-1">
              <BuildingOfficeIcon className="h-3 w-3 text-gray-500 dark:text-gray-400 mr-1" />
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {row.user.company}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "description",
      label: "Beschrijving",
      className: "min-w-[250px]",
      render: (value: string, row: TimeEntry) => (
        <div className="py-3">
          <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {value}
          </div>
          {row.project && (
            <div className="flex items-center space-x-1 mb-2">
              <BriefcaseIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {row.project.name}
              </span>
            </div>
          )}
          {row.isWarehouse && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-700">
              🏭 Magazijn
            </span>
          )}
        </div>
      ),
    },
    {
      key: "startTime",
      label: "Datum & Tijd",
      sortable: true,
      className: "min-w-[200px]",
      render: (value: Date, row: TimeEntry) => (
        <div className="py-3">
          <div className="flex items-center space-x-2 mb-2">
            <CalendarDaysIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {format(value, "dd MMM yyyy", { locale: nl })}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {format(value, "HH:mm", { locale: nl })} -{" "}
              {row.endTime
                ? format(row.endTime, "HH:mm", { locale: nl })
                : "Lopend"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "duration",
      label: "Duur",
      className: "w-32 text-center",
      render: (value: any, row: TimeEntry) => (
        <div className="text-center py-3">
          <div className="inline-flex items-center justify-center space-x-1 text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 shadow-sm">
            <ClockIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span>{calculateDuration(row.startTime, row.endTime)}</span>
          </div>
        </div>
      ),
    },
    {
      key: "approved",
      label: "Status",
      className: "w-40 text-center",
      render: (value: boolean) => (
        <div className="text-center py-3">
          <span
            className={`inline-flex items-center space-x-1 px-3 py-2 rounded-full text-sm font-semibold shadow-sm ${
              value
                ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700"
                : "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700"
            }`}
          >
            {value ? (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                <span>Goedgekeurd</span>
              </>
            ) : (
              <>
                <ExclamationTriangleIcon className="h-4 w-4" />
                <span>In afwachting</span>
              </>
            )}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Acties",
      className: "w-52",
      render: (value: any, row: TimeEntry) => (
        <div className="flex items-center justify-center space-x-2 py-3">
          {!row.approved ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleApproval(row.id, true)}
                leftIcon={<CheckIcon className="h-4 w-4" />}
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
              >
                Goedkeuren
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleApproval(row.id, false)}
                leftIcon={<XMarkIcon className="h-4 w-4" />}
                className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
              >
                Afkeuren
              </Button>
            </>
          ) : (
            <div className="flex items-center space-x-1 text-sm text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
              <CheckCircleIcon className="h-4 w-4" />
              <span>Verwerkt</span>
            </div>
          )}
        </div>
      ),
    },
  ];

  if (status === "loading" || loading) {
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

  if (!session || !isAdminOrManager) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <div className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
            Geen toegang
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Je hebt geen rechten om deze pagina te bekijken.
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            variant="primary"
            size="md"
            className="mt-4"
          >
            Terug naar Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Uren Goedkeuring" },
        ]}
        className="mb-4"
      />

      {/* Modern Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 px-6 py-8 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <ClockIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Uren Goedkeuring
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Bekijk en keur uren van medewerkers goed
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-yellow-500 rounded-full"></span>
                    <span>{pendingEntries.length} In afwachting</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                    <span>{approvedEntries.length} Goedgekeurd</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                    <span>{uniqueEmployees} Medewerkers</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="In Afwachting"
          value={pendingEntries.length}
          icon={<ExclamationTriangleIcon className="w-8 h-8" />}
          color="orange"
          subtitle="Uren te beoordelen"
          trend={
            pendingEntries.length > 0
              ? {
                  value: 12,
                  isPositive: false,
                  label: "vs vorige week",
                }
              : undefined
          }
        />

        <MetricCard
          title="Goedgekeurd"
          value={approvedEntries.length}
          icon={<CheckCircleIcon className="w-8 h-8" />}
          color="green"
          subtitle="Verwerkte uren"
          trend={{
            value: 8,
            isPositive: true,
            label: "vs vorige week",
          }}
        />

        <MetricCard
          title="Totaal Uren"
          value={`${totalHours.toFixed(1)}h`}
          icon={<ClockIcon className="w-8 h-8" />}
          color="blue"
          subtitle="Deze periode"
          trend={{
            value: 15,
            isPositive: true,
            label: "vs vorige week",
          }}
        />

        <MetricCard
          title="Medewerkers"
          value={uniqueEmployees}
          icon={<UserGroupIcon className="w-8 h-8" />}
          color="purple"
          subtitle="Actieve inzenders"
          status="normal"
        />
      </div>

      {/* Advanced Filters Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            Filters
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="sm:col-span-1 lg:col-span-1">
              <Input
                placeholder="Zoek medewerkers..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                variant="outlined"
                inputSize="md"
                label="Zoeken"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Bedrijf
              </label>
              <select
                value={filters.company}
                onChange={(e) =>
                  setFilters({ ...filters, company: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Alle bedrijven</option>
                <option value="Broers Verhuur">🚛 Broers Verhuur</option>
                <option value="DCRT Event Decorations">
                  🎉 DCRT Event Decorations
                </option>
                <option value="DCRT in Building">🏢 DCRT in Building</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filters.approved}
                onChange={(e) =>
                  setFilters({ ...filters, approved: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="pending">⏳ In afwachting</option>
                <option value="approved">✅ Goedgekeurd</option>
                <option value="all">📋 Alle</option>
              </select>
            </div>

            <div>
              <Input
                type="date"
                label="Van Datum"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters({ ...filters, dateFrom: e.target.value })
                }
                variant="outlined"
                inputSize="md"
              />
            </div>

            <div>
              <Input
                type="date"
                label="Tot Datum"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters({ ...filters, dateTo: e.target.value })
                }
                variant="outlined"
                inputSize="md"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
              <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              {filteredEntries.length} van {timeEntries.length} uren
            </div>

            {(filters.search ||
              filters.company ||
              filters.dateFrom ||
              filters.dateTo ||
              filters.approved !== "pending") && (
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  setFilters({
                    search: "",
                    company: "",
                    approved: "pending",
                    dateFrom: "",
                    dateTo: "",
                  })
                }
                className="bg-gray-600 hover:bg-gray-700 text-white shadow-sm"
              >
                Filters wissen
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedRows.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrophyIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-bold text-blue-900 dark:text-blue-200">
                {selectedRows.length} uren geselecteerd
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleBulkApproval(true)}
                leftIcon={<CheckIcon className="h-4 w-4" />}
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
              >
                Alle Goedkeuren
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleBulkApproval(false)}
                leftIcon={<XMarkIcon className="h-4 w-4" />}
                className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
              >
                Alle Afkeuren
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Enhanced Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <Table
            columns={tableColumns}
            data={filteredEntries}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
            selectable={true}
            selectedRows={selectedRows}
            onSelectRow={handleSelectRow}
            onSelectAll={handleSelectAll}
            stickyHeader={true}
            emptyMessage="📭 Geen uren gevonden met de huidige filters"
            className="border-0 shadow-none"
          />
        </div>
      </div>
    </div>
  );
}

export default TimeApprovalPage;
