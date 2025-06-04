"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  ClockIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowPathIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { nl } from "date-fns/locale";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Modal from "@/components/ui/Modal";

interface AttendanceOverview {
  totalEmployees: number;
  currentlyWorking: number;
  onLeave: number;
  compensationRequests: number;
  employees: EmployeeAttendance[];
}

interface EmployeeAttendance {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "WORKING" | "ON_LEAVE" | "OFFLINE" | "SICK";
  currentBalance: number;
  totalAccrued: number;
  totalUsed: number;
  pendingRequests: number;
  lastActivity?: string;
  workingHoursToday?: number;
  workingHoursWeek?: number;
  expectedHoursWeek?: number;
}

interface CompensationRequest {
  id: string;
  employeeName: string;
  employeeEmail: string;
  date: string;
  hours: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  type: "FULL_DAY" | "HALF_DAY" | "CUSTOM";
}

export default function AttendancePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] =
    useState<AttendanceOverview | null>(null);
  const [compensationRequests, setCompensationRequests] = useState<
    CompensationRequest[]
  >([]);
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeAttendance | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    if (session?.user?.id) {
      fetchAttendanceData();
      fetchCompensationRequests();
    }
  }, [session, selectedPeriod]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/attendance/overview?period=${selectedPeriod}`
      );
      const data = await response.json();

      if (data.success) {
        setAttendanceData(data.data);
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompensationRequests = async () => {
    try {
      const response = await fetch("/api/attendance/compensation-requests");
      const data = await response.json();

      if (data.success) {
        setCompensationRequests(data.data);
      }
    } catch (error) {
      console.error("Error fetching compensation requests:", error);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await fetch(
        `/api/attendance/compensation-requests/${requestId}/approve`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        fetchCompensationRequests();
        fetchAttendanceData();
      }
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch(
        `/api/attendance/compensation-requests/${requestId}/reject`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        fetchCompensationRequests();
        fetchAttendanceData();
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const formatDuration = (hours: number): string => {
    const h = Math.floor(Math.abs(hours));
    const m = Math.round((Math.abs(hours) - h) * 60);
    const sign = hours < 0 ? "-" : "";
    return `${sign}${h}u ${m}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "WORKING":
        return "bg-green-100 text-green-800 border-green-200";
      case "ON_LEAVE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SICK":
        return "bg-red-100 text-red-800 border-red-200";
      case "OFFLINE":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "WORKING":
        return "Aan het werk";
      case "ON_LEAVE":
        return "Met verlof";
      case "SICK":
        return "Ziek";
      case "OFFLINE":
        return "Offline";
      default:
        return "Onbekend";
    }
  };

  const filteredEmployees =
    attendanceData?.employees.filter((emp) => {
      if (filterStatus === "all") return true;
      return emp.status === filterStatus;
    }) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Aan- en Afwezigheid" },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 dark:from-green-900/20 dark:via-blue-900/20 dark:to-purple-900/20 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <UserGroupIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Aan- en Afwezigheid Beheer
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Overzicht van alle medewerkers, aanwezigheid en compensatie
                  uren
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="current_week">Deze week</option>
                <option value="current_month">Deze maand</option>
                <option value="last_month">Vorige maand</option>
                <option value="last_3_months">Laatste 3 maanden</option>
              </select>
              <Button
                onClick={fetchAttendanceData}
                variant="outline"
                size="md"
                leftIcon={<ArrowPathIcon className="h-4 w-4" />}
              >
                Vernieuwen
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {attendanceData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <UserGroupIcon className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Totaal Medewerkers
                </h3>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {attendanceData.totalEmployees}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Actieve medewerkers
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <ClockIcon className="h-5 w-5 text-green-600" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Aan het Werk
                </h3>
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {attendanceData.currentlyWorking}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Nu actief
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Met Verlof
                </h3>
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {attendanceData.onLeave}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Afwezig
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Aanvragen
                </h3>
              </div>
            </div>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {attendanceData.compensationRequests}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Te behandelen
            </div>
          </div>
        </div>
      )}

      {/* Compensation Requests */}
      {compensationRequests.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-500" />
              Compensatie Aanvragen (
              {
                compensationRequests.filter((r) => r.status === "PENDING")
                  .length
              }
              )
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Aanvragen voor tijd-voor-tijd verlof die goedkeuring nodig hebben
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {compensationRequests
                .filter((r) => r.status === "PENDING")
                .map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {request.employeeName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(request.date), "dd MMM yyyy", {
                            locale: nl,
                          })}{" "}
                          • {formatDuration(request.hours)}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {request.reason || "Geen reden opgegeven"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectRequest(request.id)}
                        leftIcon={<XCircleIcon className="h-4 w-4" />}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Afwijzen
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApproveRequest(request.id)}
                        leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                      >
                        Goedkeuren
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Employee List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-blue-500" />
              Medewerker Overzicht
            </h3>
            <div className="flex items-center space-x-3">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="all">Alle statussen</option>
                <option value="WORKING">Aan het werk</option>
                <option value="ON_LEAVE">Met verlof</option>
                <option value="SICK">Ziek</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-6">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Geen medewerkers gevonden
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Er zijn geen medewerkers die voldoen aan de geselecteerde
                filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {employee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {employee.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {employee.role}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(
                          employee.status
                        )}`}
                      >
                        {getStatusText(employee.status)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setShowEmployeeModal(true);
                        }}
                        leftIcon={<EyeIcon className="h-4 w-4" />}
                      >
                        Details
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Compensatie balans:
                      </span>
                      <div
                        className={`font-medium ${
                          employee.currentBalance > 0
                            ? "text-green-600 dark:text-green-400"
                            : employee.currentBalance < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {formatDuration(employee.currentBalance)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Deze week:
                      </span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatDuration(employee.workingHoursWeek || 0)} /{" "}
                        {formatDuration(employee.expectedHoursWeek || 40)}
                      </div>
                    </div>
                  </div>

                  {employee.pendingRequests > 0 && (
                    <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
                      <div className="text-xs text-yellow-800 dark:text-yellow-200">
                        {formatDuration(employee.pendingRequests)} in
                        behandeling
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Employee Detail Modal */}
      <Modal
        isOpen={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        title={`${selectedEmployee?.name} - Tijd voor Tijd Overzicht`}
        size="lg"
      >
        {selectedEmployee && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Huidige Balans
                </h4>
                <div
                  className={`text-2xl font-bold ${
                    selectedEmployee.currentBalance > 0
                      ? "text-green-600 dark:text-green-400"
                      : selectedEmployee.currentBalance < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {formatDuration(selectedEmployee.currentBalance)}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Status
                </h4>
                <span
                  className={`px-3 py-1 text-sm rounded-full border ${getStatusColor(
                    selectedEmployee.status
                  )}`}
                >
                  {getStatusText(selectedEmployee.status)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatDuration(selectedEmployee.totalAccrued)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Opgebouwd
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatDuration(selectedEmployee.totalUsed)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Opgenomen
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatDuration(selectedEmployee.pendingRequests)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  In behandeling
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowEmployeeModal(false)}
              >
                Sluiten
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  window.open(
                    `/dashboard/personnel/edit/${selectedEmployee.id}?tab=tijd-voor-tijd`,
                    "_blank"
                  )
                }
              >
                Volledig Profiel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
