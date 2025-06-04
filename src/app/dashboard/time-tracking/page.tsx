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
  UserIcon,
  ChartBarIcon,
  PlayIcon,
  StopIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ClockIcon as TimeIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import MetricCard from "@/components/ui/MetricCard";

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
      <div className="flex items-center justify-center min-h-screen">
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
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tijdsregistratie Beheer" },
        ]}
        className="mb-4"
      />

      {/* Modern Header Card */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
        <div className="px-6 py-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 dark:border-gray-700">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <ClockIcon className="text-white h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Tijdsregistratie Beheer
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Overzicht van alle tijdsregistraties en real-time monitoring
                </p>
                <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>{clockedInUsers.length} Ingeklokt</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span>{forgottenClockOuts.length} Vergeten</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>{pendingApprovals.length} Ter goedkeuring</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() =>
                  (window.location.href = "/dashboard/time-tracking/personal")
                }
                variant="outline"
                size="md"
                leftIcon={<UserIcon className="w-4 h-4" />}
                className="font-semibold text-white bg-gray-700 border-gray-600 shadow-sm hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 dark:border-gray-500 dark:text-white"
              >
                Mijn Tijdsregistratie
              </Button>
              <Button
                onClick={() =>
                  (window.location.href = "/dashboard/time-approval")
                }
                variant="primary"
                size="md"
                leftIcon={<CheckCircleIcon className="w-4 h-4" />}
                className="font-semibold text-white bg-blue-600 shadow-md hover:bg-blue-700"
              >
                Uren Goedkeuring
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Ingeklokt Nu"
          value={clockedInUsers.length}
          icon={<PlayIcon className="w-8 h-8" />}
          color="green"
          subtitle="Momenteel werkend"
          trend={
            clockedInUsers.length > 0
              ? {
                  value: 15,
                  isPositive: true,
                  label: "vs gisteren",
                }
              : undefined
          }
        />

        <MetricCard
          title="Vergeten Uitklokken"
          value={forgottenClockOuts.length}
          icon={<ExclamationTriangleIcon className="w-8 h-8" />}
          color="orange"
          subtitle="Actie vereist"
          trend={
            forgottenClockOuts.length > 0
              ? {
                  value: forgottenClockOuts.length,
                  isPositive: false,
                  label: "open items",
                }
              : undefined
          }
        />

        <MetricCard
          title="Te Goedkeuren"
          value={pendingApprovals.length}
          icon={<CheckCircleIcon className="w-8 h-8" />}
          color="blue"
          subtitle="Wachten op review"
          trend={{
            value: 8,
            isPositive: true,
            label: "nieuw vandaag",
          }}
        />

        <MetricCard
          title="Vandaag Gewerkt"
          value={recentEntries.length}
          icon={<UserGroupIcon className="w-8 h-8" />}
          color="purple"
          subtitle="Voltooide entries"
          trend={{
            value: 25,
            isPositive: true,
            label: "vs vorige week",
          }}
        />
      </div>

      {/* Currently Clocked In Users */}
      {clockedInUsers.length > 0 && (
        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600">
            <h3 className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
              <PlayIcon className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
              Momenteel Ingeklokt
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                {clockedInUsers.length}
              </span>
            </h3>
          </div>
          <div className="p-6">
            <div className="grid gap-4">
              {clockedInUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col justify-between p-4 transition-shadow border border-green-200 shadow-sm sm:flex-row sm:items-center bg-green-50 dark:bg-green-900/20 rounded-xl dark:border-green-700 hover:shadow-md"
                >
                  <div className="flex items-center flex-1 min-w-0 space-x-4">
                    <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 shadow-sm bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                      <span className="text-lg font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {user.name}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.email}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-lg dark:bg-gray-700 dark:text-gray-200">
                          <TimeIcon className="w-3 h-3 mr-1" />
                          Sinds:{" "}
                          {format(new Date(user.startTime), "HH:mm", {
                            locale: nl,
                          })}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-lg dark:bg-blue-900/20 dark:text-blue-200">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {formatDuration(user.duration)}
                        </span>
                        {user.project && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-lg dark:bg-purple-900/20 dark:text-purple-200">
                            <BriefcaseIcon className="w-3 h-3 mr-1" />
                            {user.project}
                          </span>
                        )}
                        {user.isWarehouse && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-800 bg-orange-100 rounded-lg dark:bg-orange-900/20 dark:text-orange-200">
                            <BuildingOfficeIcon className="w-3 h-3 mr-1" />
                            Magazijn
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 mt-3 sm:mt-0 sm:ml-4">
                    <Button
                      onClick={() => handleForceClockOut(user.id)}
                      variant="primary"
                      size="sm"
                      leftIcon={<StopIcon className="w-4 h-4" />}
                      className="w-full text-white bg-red-600 shadow-sm sm:w-auto hover:bg-red-700"
                    >
                      Uitklokken
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
        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600">
            <h3 className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
              Vergeten Uit Te Klokken
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200">
                {forgottenClockOuts.length}
              </span>
            </h3>
          </div>
          <div className="p-6">
            <div className="grid gap-4">
              {forgottenClockOuts.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col justify-between p-4 transition-shadow border border-orange-200 shadow-sm sm:flex-row sm:items-center bg-orange-50 dark:bg-orange-900/20 rounded-xl dark:border-orange-700 hover:shadow-md"
                >
                  <div className="flex items-center flex-1 min-w-0 space-x-4">
                    <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 shadow-sm bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                      <span className="text-lg font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {user.name}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.email}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-lg dark:bg-gray-700 dark:text-gray-200">
                          <CalendarDaysIcon className="w-3 h-3 mr-1" />
                          Laatste:{" "}
                          {format(new Date(user.lastClockIn), "dd/MM HH:mm", {
                            locale: nl,
                          })}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-lg dark:bg-red-900/20 dark:text-red-200">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {formatDuration(user.duration)}
                        </span>
                        {user.project && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-lg dark:bg-purple-900/20 dark:text-purple-200">
                            <BriefcaseIcon className="w-3 h-3 mr-1" />
                            {user.project}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 mt-3 sm:mt-0 sm:ml-4">
                    <Button
                      onClick={() => handleForceClockOut(user.id)}
                      variant="primary"
                      size="sm"
                      leftIcon={<StopIcon className="w-4 h-4" />}
                      className="w-full text-white bg-orange-600 shadow-sm sm:w-auto hover:bg-orange-700"
                    >
                      Uitklokken
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Time Entries List */}
      <div className="bg-white rounded-lg shadow dark:bg-gray-800">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="mb-4 text-lg font-medium leading-6 text-gray-900 dark:text-white">
            Recente Tijdsregistraties
          </h3>
          {recentEntries.length === 0 ? (
            <p className="py-4 text-center text-gray-500 dark:text-gray-400">
              Geen recente tijdsregistraties
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Medewerker
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Start Tijd
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Eind Tijd
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Project
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Duur
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
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
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap dark:text-white">
                          {format(
                            new Date(entry.startTime),
                            "dd MMM yyyy HH:mm",
                            {
                              locale: nl,
                            }
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap dark:text-white">
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
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap dark:text-white">
                          {entry.isWarehouse
                            ? "Warehouse"
                            : entry.project || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap dark:text-white">
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
      <div className="bg-white rounded-lg shadow dark:bg-gray-800">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="flex items-center mb-4 text-lg font-medium leading-6 text-gray-900 dark:text-white">
            <ClockIcon className="w-5 h-5 mr-2 text-blue-500" />
            Uren Te Goedkeuren ({pendingApprovals.length})
          </h3>
          {pendingApprovals.length === 0 ? (
            <p className="py-4 text-center text-gray-500 dark:text-gray-400">
              Geen uren wachtend op goedkeuring
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Medewerker
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Datum
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Tijd
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Duur
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Project
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
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
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap dark:text-white">
                        {format(new Date(entry.startTime), "dd MMM yyyy", {
                          locale: nl,
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap dark:text-white">
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
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap dark:text-white">
                        {entry.duration ? formatDuration(entry.duration) : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap dark:text-white">
                        {entry.isWarehouse
                          ? "Warehouse"
                          : entry.project || "Geen project"}
                      </td>
                      <td className="px-6 py-4 space-x-2 text-sm font-medium whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showEntryDetails(entry)}
                          leftIcon={<EyeIcon className="w-4 h-4" />}
                          className="font-semibold text-blue-700 border-blue-300 shadow-sm hover:bg-blue-50 hover:border-blue-400 dark:text-blue-300 dark:border-blue-600 dark:hover:bg-blue-900/20"
                        >
                          Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveTimeEntry(entry.id)}
                          leftIcon={<CheckCircleIcon className="w-4 h-4" />}
                          className="font-semibold text-green-600 border-green-300 shadow-sm hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-900/20"
                        >
                          Goedkeuren
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectTimeEntry(entry.id)}
                          leftIcon={<XCircleIcon className="w-4 h-4" />}
                          className="font-semibold text-red-600 border-red-300 shadow-sm hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
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

            <div className="flex justify-end pt-4 space-x-3 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
                className="font-semibold text-gray-700 border-gray-300 shadow-sm hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700/50"
              >
                Sluiten
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleApproveTimeEntry(selectedEntry.id);
                  setShowDetailsModal(false);
                }}
                leftIcon={<CheckCircleIcon className="w-4 h-4" />}
                className="font-semibold text-green-600 border-green-300 shadow-sm hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-900/20"
              >
                Goedkeuren
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleRejectTimeEntry(selectedEntry.id);
                  setShowDetailsModal(false);
                }}
                leftIcon={<XCircleIcon className="w-4 h-4" />}
                className="font-semibold text-red-600 border-red-300 shadow-sm hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
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
