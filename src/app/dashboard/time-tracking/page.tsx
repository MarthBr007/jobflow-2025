"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  ClockIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

interface TimeEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  startTime: string;
  endTime?: string;
  project?: string;
  description: string;
  isWarehouse?: boolean;
  approved: boolean;
  duration?: number;
}

interface ClockedInUser {
  id: string;
  name: string;
  email: string;
  startTime: string;
  project?: string;
  isWarehouse?: boolean;
  duration: number;
}

interface ForgottenClockOut {
  id: string;
  name: string;
  email: string;
  lastClockIn: string;
  duration: number;
  project?: string;
}

export default function TimeTrackingAdmin() {
  const { data: session } = useSession();
  const [clockedInUsers, setClockedInUsers] = useState<ClockedInUser[]>([]);
  const [forgottenClockOuts, setForgottenClockOuts] = useState<
    ForgottenClockOut[]
  >([]);
  const [pendingApprovals, setPendingApprovals] = useState<TimeEntry[]>([]);
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER") {
      fetchAdminTimeData();
      // Auto refresh every 30 seconds for real-time updates
      const interval = setInterval(fetchAdminTimeData, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchAdminTimeData = async () => {
    try {
      // For now, set dummy data until APIs are created
      setClockedInUsers([]);
      setForgottenClockOuts([]);
      setPendingApprovals([]);
      setRecentEntries([]);

      // TODO: Implement these API calls
      // const [clockedResponse, forgottenResponse, approvalsResponse, entriesResponse] = await Promise.all([
      //   fetch("/api/admin/time-tracking/clocked-in"),
      //   fetch("/api/admin/time-tracking/forgotten-clockouts"),
      //   fetch("/api/admin/time-tracking/pending-approvals"),
      //   fetch("/api/admin/time-tracking/recent-entries")
      // ]);
    } catch (error) {
      console.error("Error fetching admin time data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTimeEntry = async (entryId: string) => {
    try {
      const response = await fetch(
        `/api/admin/time-tracking/approve/${entryId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: true }),
        }
      );

      if (response.ok) {
        fetchAdminTimeData(); // Refresh data
      } else {
        alert("Er is een fout opgetreden bij het goedkeuren");
      }
    } catch (error) {
      console.error("Error approving time entry:", error);
      alert("Er is een fout opgetreden bij het goedkeuren");
    }
  };

  const handleRejectTimeEntry = async (entryId: string) => {
    try {
      const response = await fetch(
        `/api/admin/time-tracking/approve/${entryId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: false }),
        }
      );

      if (response.ok) {
        fetchAdminTimeData(); // Refresh data
      } else {
        alert("Er is een fout opgetreden bij het afwijzen");
      }
    } catch (error) {
      console.error("Error rejecting time entry:", error);
      alert("Er is een fout opgetreden bij het afwijzen");
    }
  };

  const handleForceClockOut = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/admin/time-tracking/force-clockout/${userId}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        fetchAdminTimeData(); // Refresh data
        alert("Gebruiker succesvol uitgeklokt");
      } else {
        alert("Er is een fout opgetreden bij het uitklokken");
      }
    } catch (error) {
      console.error("Error forcing clock out:", error);
      alert("Er is een fout opgetreden bij het uitklokken");
    }
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}u ${m}m`;
  };

  const showEntryDetails = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  // Redirect non-admins to regular time tracking
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MANAGER") {
    window.location.href = "/dashboard/time-tracking/personal";
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tijdsregistratie Beheer" },
        ]}
        className="mb-2 sm:mb-4"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            ⏰ Tijdsregistratie Beheer
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Overzicht van alle tijdsregistraties en goedkeuringen
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={() =>
              (window.location.href = "/dashboard/time-tracking/personal")
            }
            variant="outline"
            size="md"
            className="w-full sm:w-auto touch-manipulation"
          >
            <span className="sm:hidden">Mijn Tijden</span>
            <span className="hidden sm:inline">Mijn Tijdsregistratie</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <div className="ml-4 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Ingeklokt
                  </dt>
                  <dd className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {clockedInUsers.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
              </div>
              <div className="ml-4 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Vergeten uit te klokken
                  </dt>
                  <dd className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {forgottenClockOuts.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <div className="ml-4 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Wacht op goedkeuring
                  </dt>
                  <dd className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {pendingApprovals.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
              <div className="ml-4 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Vandaag gewerkt
                  </dt>
                  <dd className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {recentEntries.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Currently Clocked In Users */}
      {clockedInUsers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <ClockIcon className="h-5 w-5 text-green-600 mr-2" />
              Momenteel ingeklokt ({clockedInUsers.length})
            </h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid gap-3 sm:gap-4">
              {clockedInUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                          <span className="text-gray-600 dark:text-gray-300">
                            Sinds:{" "}
                            {format(new Date(user.startTime), "HH:mm", {
                              locale: nl,
                            })}
                          </span>
                          <span className="text-gray-600 dark:text-gray-300">
                            Duur: {formatDuration(user.duration)}
                          </span>
                          {user.project && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                              {user.project}
                            </span>
                          )}
                          {user.isWarehouse && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">
                              Warehouse
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-4 flex-shrink-0">
                    <Button
                      onClick={() => handleForceClockOut(user.id)}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto touch-manipulation"
                    >
                      <span className="sm:hidden">Uitklokken</span>
                      <span className="hidden sm:inline">
                        Forceer uitklokken
                      </span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Forgotten Clock Outs */}
      {forgottenClockOuts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 text-yellow-600 mr-2" />
              Vergeten uit te klokken ({forgottenClockOuts.length})
            </h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid gap-3 sm:gap-4">
              {forgottenClockOuts.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3 flex-shrink-0"></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                          <span className="text-gray-600 dark:text-gray-300">
                            Laatste klok in:{" "}
                            {format(new Date(user.lastClockIn), "dd/MM HH:mm", {
                              locale: nl,
                            })}
                          </span>
                          <span className="text-gray-600 dark:text-gray-300">
                            Duur: {formatDuration(user.duration)}
                          </span>
                          {user.project && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                              {user.project}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-4 flex-shrink-0">
                    <Button
                      onClick={() => handleForceClockOut(user.id)}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto touch-manipulation"
                    >
                      <span className="sm:hidden">Uitklokken</span>
                      <span className="hidden sm:inline">
                        Forceer uitklokken
                      </span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Time Entries List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
            Recente Tijdsregistraties
          </h3>
          {recentEntries.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Geen recente tijdsregistraties
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Medewerker
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Start Tijd
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Eind Tijd
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Duur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {recentEntries.map((entry) => {
                    const duration =
                      entry.duration ||
                      (entry.endTime
                        ? (new Date(entry.endTime).getTime() -
                            new Date(entry.startTime).getTime()) /
                          (1000 * 60 * 60)
                        : 0);

                    return (
                      <tr key={entry.id}>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {format(
                            new Date(entry.startTime),
                            "dd MMM yyyy HH:mm",
                            {
                              locale: nl,
                            }
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {entry.endTime
                            ? format(
                                new Date(entry.endTime),
                                "dd MMM yyyy HH:mm",
                                {
                                  locale: nl,
                                }
                              )
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {entry.isWarehouse
                            ? "Warehouse"
                            : entry.project || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {duration ? formatDuration(duration) : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              entry.approved
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            }`}
                          >
                            {entry.approved ? "Goedgekeurd" : "Wachtend"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-blue-500" />
            Uren Te Goedkeuren ({pendingApprovals.length})
          </h3>
          {pendingApprovals.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Geen uren wachtend op goedkeuring
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Medewerker
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Datum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tijd
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Duur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {pendingApprovals.map((entry) => (
                    <tr key={entry.id}>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {format(new Date(entry.startTime), "dd MMM yyyy", {
                          locale: nl,
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {format(new Date(entry.startTime), "HH:mm", {
                          locale: nl,
                        })}{" "}
                        -&nbsp;
                        {entry.endTime
                          ? format(new Date(entry.endTime), "HH:mm", {
                              locale: nl,
                            })
                          : "Lopend"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {entry.duration ? formatDuration(entry.duration) : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {entry.isWarehouse
                          ? "Warehouse"
                          : entry.project || "Geen project"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showEntryDetails(entry)}
                          leftIcon={<EyeIcon className="h-4 w-4" />}
                        >
                          Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveTimeEntry(entry.id)}
                          leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                          className="text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-900/20"
                        >
                          Goedkeuren
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectTimeEntry(entry.id)}
                          leftIcon={<XCircleIcon className="h-4 w-4" />}
                          className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
                        >
                          Afwijzen
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Time Entry Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Tijdsregistratie Details"
        size="md"
      >
        {selectedEntry && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Medewerker
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {selectedEntry.userName} ({selectedEntry.userEmail})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start Tijd
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {format(
                    new Date(selectedEntry.startTime),
                    "dd MMM yyyy HH:mm",
                    { locale: nl }
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Eind Tijd
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {selectedEntry.endTime
                    ? format(
                        new Date(selectedEntry.endTime),
                        "dd MMM yyyy HH:mm",
                        { locale: nl }
                      )
                    : "Nog niet uitgeklokt"}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Project/Locatie
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {selectedEntry.isWarehouse
                  ? "Warehouse werk"
                  : selectedEntry.project || "Geen project toegewezen"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Beschrijving
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {selectedEntry.description || "Geen beschrijving"}
              </p>
            </div>

            {selectedEntry.duration && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Totale Duur
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDuration(selectedEntry.duration)}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
              >
                Sluiten
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleApproveTimeEntry(selectedEntry.id);
                  setShowDetailsModal(false);
                }}
                leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                className="text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-900/20"
              >
                Goedkeuren
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleRejectTimeEntry(selectedEntry.id);
                  setShowDetailsModal(false);
                }}
                leftIcon={<XCircleIcon className="h-4 w-4" />}
                className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
              >
                Afwijzen
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
