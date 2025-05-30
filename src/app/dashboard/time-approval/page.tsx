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
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Input from "@/components/ui/Input";
import Table from "@/components/ui/Table";

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

  const tableColumns = [
    {
      key: "user",
      label: "Medewerker",
      sortable: true,
      className: "min-w-[280px]",
      render: (value: any, row: TimeEntry) => (
        <div className="flex items-center py-2">
          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="ml-4 min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {row.user.name}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
              {row.user.email}
            </div>
            <div className="flex items-center mt-1">
              <BuildingOfficeIcon className="h-3 w-3 text-gray-500 dark:text-gray-400 mr-1" />
              <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
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
        <div className="py-2">
          <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {value}
          </div>
          {row.project && (
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
              📋 {row.project.name}
            </div>
          )}
          {row.isWarehouse && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
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
        <div className="py-2">
          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            📅 {format(value, "dd MMM yyyy", { locale: nl })}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            🕐 {format(value, "HH:mm", { locale: nl })} -{" "}
            {row.endTime
              ? format(row.endTime, "HH:mm", { locale: nl })
              : "Lopend"}
          </div>
        </div>
      ),
    },
    {
      key: "duration",
      label: "Duur",
      className: "w-28 text-center",
      render: (value: any, row: TimeEntry) => (
        <div className="text-center py-2">
          <div className="text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
            ⏱️ {calculateDuration(row.startTime, row.endTime)}
          </div>
        </div>
      ),
    },
    {
      key: "approved",
      label: "Status",
      className: "w-36 text-center",
      render: (value: boolean) => (
        <div className="text-center py-2">
          <span
            className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold ${
              value
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700"
                : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700"
            }`}
          >
            {value ? "✅ Goedgekeurd" : "⏳ In afwachting"}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Acties",
      className: "w-48",
      render: (value: any, row: TimeEntry) => (
        <div className="flex items-center justify-center space-x-2 py-2">
          {!row.approved ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleApproval(row.id, true)}
                leftIcon={<CheckIcon className="h-4 w-4" />}
                className="text-xs"
              >
                Goedkeuren
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleApproval(row.id, false)}
                leftIcon={<XMarkIcon className="h-4 w-4" />}
                className="text-xs"
              >
                Afkeuren
              </Button>
            </>
          ) : (
            <span className="text-sm text-gray-500 font-medium">
              ✅ Verwerkt
            </span>
          )}
        </div>
      ),
    },
  ];

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xl font-semibold text-gray-700"
        >
          ⏳ Loading...
        </motion.div>
      </div>
    );
  }

  if (!session || !isAdminOrManager) {
    return (
      <div className="p-8 text-center">
        <div className="text-xl font-semibold text-red-600">
          �� Geen toegang
        </div>
        <p className="text-gray-600 mt-2">
          Je hebt geen rechten om deze pagina te bekijken.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Uren Goedkeuring" },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ⏰ Uren Goedkeuring
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Bekijk en keur uren van medewerkers goed
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🔍 Filters
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="col-span-2">
            <Input
              placeholder="Zoek medewerkers..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
              variant="outlined"
              inputSize="md"
              className="w-full"
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
              <option value="Broers Verhuur">Broers Verhuur</option>
              <option value="DCRT Event Decorations">
                DCRT Event Decorations
              </option>
              <option value="DCRT in Building">DCRT in Building</option>
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
              label="Van datum"
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
              label="Tot datum"
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
            <FunnelIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            📊 {filteredEntries.length} van {timeEntries.length} uren
          </div>

          {filters.search ||
          filters.company ||
          filters.dateFrom ||
          filters.dateTo ||
          filters.approved !== "pending" ? (
            <Button
              variant="outline"
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
            >
              🗑️ Filters wissen
            </Button>
          ) : null}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedRows.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-blue-900 dark:text-blue-200">
              📋 {selectedRows.length} uren geselecteerd
            </span>
            <div className="flex items-center space-x-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleBulkApproval(true)}
                leftIcon={<CheckIcon className="h-4 w-4" />}
              >
                ✅ Alle Goedkeuren
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkApproval(false)}
                leftIcon={<XMarkIcon className="h-4 w-4" />}
              >
                ❌ Alle Afkeuren
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
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
            emptyMessage="📭 Geen uren gevonden"
            className="border-0 shadow-none"
          />
        </div>
      </div>
    </div>
  );
}

export default TimeApprovalPage;
