"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ChartBarIcon,
  HeartIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  ShieldExclamationIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import PermissionGuard from "@/components/ui/PermissionGuard";
import Toast from "@/components/ui/Toast";
import MetricCard from "@/components/ui/MetricCard";
import { useToast } from "@/hooks/useToast";

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
  description?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
  dayCount?: number;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  user: {
    id: string;
    name: string;
    email: string;
    company: string;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  };
}

const LEAVE_TYPES = [
  {
    value: "VACATION",
    label: "Vakantie",
    icon: <CalendarDaysIcon className="h-4 w-4" />,
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    value: "SICK_LEAVE",
    label: "Ziekteverlof",
    icon: <HeartIcon className="h-4 w-4" />,
    color: "text-red-600 dark:text-red-400",
  },
  {
    value: "PERSONAL_LEAVE",
    label: "Persoonlijk verlof",
    icon: <UserIcon className="h-4 w-4" />,
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    value: "TIME_OFF_IN_LIEU",
    label: "Tijd voor tijd opname",
    icon: <ClockIcon className="h-4 w-4" />,
    color: "text-green-600 dark:text-green-400",
  },
  {
    value: "DOCTOR_VISIT",
    label: "Doktersbezoek",
    icon: <HeartIcon className="h-4 w-4" />,
    color: "text-pink-600 dark:text-pink-400",
  },
  {
    value: "DENTIST_VISIT",
    label: "Tandarts bezoek",
    icon: <HeartIcon className="h-4 w-4" />,
    color: "text-pink-600 dark:text-pink-400",
  },
  {
    value: "SPECIAL_LEAVE",
    label: "Bijzonder verlof",
    icon: <DocumentTextIcon className="h-4 w-4" />,
    color: "text-indigo-600 dark:text-indigo-400",
  },
  {
    value: "CALAMITY_LEAVE",
    label: "Calamiteitenverlof",
    icon: <ShieldExclamationIcon className="h-4 w-4" />,
    color: "text-red-600 dark:text-red-400",
  },
  {
    value: "BEREAVEMENT_LEAVE",
    label: "Rouwverlof",
    icon: <HeartIcon className="h-4 w-4" />,
    color: "text-gray-600 dark:text-gray-400",
  },
  {
    value: "MOVING_DAY",
    label: "Verhuisdag",
    icon: <HomeIcon className="h-4 w-4" />,
    color: "text-orange-600 dark:text-orange-400",
  },
  {
    value: "MATERNITY_LEAVE",
    label: "Zwangerschapsverlof",
    icon: <HeartIcon className="h-4 w-4" />,
    color: "text-pink-600 dark:text-pink-400",
  },
  {
    value: "PATERNITY_LEAVE",
    label: "Vaderschapsverlof",
    icon: <UserIcon className="h-4 w-4" />,
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    value: "STUDY_LEAVE",
    label: "Studieverlof",
    icon: <AcademicCapIcon className="h-4 w-4" />,
    color: "text-yellow-600 dark:text-yellow-400",
  },
  {
    value: "EMERGENCY_LEAVE",
    label: "Noodverlof",
    icon: <ExclamationTriangleIcon className="h-4 w-4" />,
    color: "text-red-600 dark:text-red-400",
  },
  {
    value: "UNPAID_LEAVE",
    label: "Onbetaald verlof",
    icon: <DocumentTextIcon className="h-4 w-4" />,
    color: "text-gray-600 dark:text-gray-400",
  },
  {
    value: "COMPENSATORY_LEAVE",
    label: "Compensatieverlof",
    icon: <CheckCircleIcon className="h-4 w-4" />,
    color: "text-green-600 dark:text-green-400",
  },
];

export default function AdminLeaveRequests() {
  const { data: session } = useSession();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [leaveRequests, searchTerm, statusFilter, typeFilter]);

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch("/api/leave-requests");
      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data);
      } else {
        const error = await response.json();
        showToast(`Error: ${error.error}`, "error");
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      showToast(
        "Er is iets misgegaan bij het ophalen van verlofaanvragen",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...leaveRequests];

    if (searchTerm) {
      filtered = filtered.filter(
        (request) =>
          request.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    if (typeFilter) {
      filtered = filtered.filter((request) => request.type === typeFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleApproveRequest = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze verlofaanvraag wilt goedkeuren?")) {
      return;
    }

    try {
      const response = await fetch(`/api/leave-requests/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "approve" }),
      });

      const data = await response.json();

      if (response.ok) {
        setLeaveRequests((prev) =>
          prev.map((req) => (req.id === id ? data : req))
        );
        showToast("Verlofaanvraag goedgekeurd", "success");
      } else {
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error approving leave request:", error);
      showToast("Er is iets misgegaan bij het goedkeuren", "error");
    }
  };

  const handleRejectRequest = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze verlofaanvraag wilt afkeuren?")) {
      return;
    }

    try {
      const response = await fetch(`/api/leave-requests/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "reject" }),
      });

      const data = await response.json();

      if (response.ok) {
        setLeaveRequests((prev) =>
          prev.map((req) => (req.id === id ? data : req))
        );
        showToast("Verlofaanvraag afgekeurd", "success");
      } else {
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error rejecting leave request:", error);
      showToast("Er is iets misgegaan bij het afkeuren", "error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700";
      case "REJECTED":
        return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700";
      case "CANCELLED":
        return "bg-gray-100 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600";
      default:
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "In behandeling";
      case "APPROVED":
        return "Goedgekeurd";
      case "REJECTED":
        return "Afgekeurd";
      case "CANCELLED":
        return "Geannuleerd";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "REJECTED":
        return <XCircleIcon className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getLeaveTypeConfig = (type: string) => {
    return (
      LEAVE_TYPES.find((t) => t.value === type) || {
        value: type,
        label: type,
        icon: <DocumentTextIcon className="h-4 w-4" />,
        color: "text-gray-600 dark:text-gray-400",
      }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString?.substring(0, 5) || "";
  };

  // Calculate statistics
  const pendingCount = leaveRequests.filter(
    (req) => req.status === "PENDING"
  ).length;
  const approvedCount = leaveRequests.filter(
    (req) => req.status === "APPROVED"
  ).length;
  const rejectedCount = leaveRequests.filter(
    (req) => req.status === "REJECTED"
  ).length;
  const totalDays = leaveRequests.reduce((total, req) => {
    if (req.status === "APPROVED" && req.dayCount) {
      return total + req.dayCount;
    }
    return total;
  }, 0);
  const uniqueEmployees = new Set(leaveRequests.map((req) => req.user.id)).size;

  if (loading) {
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

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard" },
          { label: "Verlof Beheer" },
        ]}
        className="mb-4"
      />

      {/* Modern Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 px-6 py-8 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <CalendarDaysIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Verlofaanvragen Beheer
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Bekijk en beheer alle verlofaanvragen van medewerkers
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-yellow-500 rounded-full"></span>
                    <span>{pendingCount} In behandeling</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                    <span>{approvedCount} Goedgekeurd</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                    <span>{uniqueEmployees} Medewerkers</span>
                  </span>
                </div>
              </div>
            </div>
            {pendingCount > 0 && (
              <div className="bg-yellow-100 dark:bg-yellow-900/20 px-4 py-3 rounded-xl border border-yellow-200 dark:border-yellow-700">
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    {pendingCount} aanvragen wachten op goedkeuring
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard
          title="Totaal Aanvragen"
          value={leaveRequests.length}
          icon={<DocumentTextIcon className="w-8 h-8" />}
          color="blue"
          subtitle="Alle verlofaanvragen"
        />

        <MetricCard
          title="In Behandeling"
          value={pendingCount}
          icon={<ClockIcon className="w-8 h-8" />}
          color="orange"
          subtitle="Wachten op goedkeuring"
          trend={
            pendingCount > 0
              ? {
                  value: 2,
                  isPositive: false,
                  label: "vs vorige week",
                }
              : undefined
          }
        />

        <MetricCard
          title="Goedgekeurd"
          value={approvedCount}
          icon={<CheckCircleIcon className="w-8 h-8" />}
          color="green"
          subtitle="Toegekende verloven"
          trend={{
            value: 12,
            isPositive: true,
            label: "vs vorige week",
          }}
        />

        <MetricCard
          title="Afgekeurd"
          value={rejectedCount}
          icon={<XCircleIcon className="w-8 h-8" />}
          color="red"
          subtitle="Geweigerde aanvragen"
        />

        <MetricCard
          title="Totaal Dagen"
          value={totalDays}
          icon={<CalendarDaysIcon className="w-8 h-8" />}
          color="purple"
          subtitle="Goedgekeurde dagen"
          trend={{
            value: 8,
            isPositive: true,
            label: "vs vorige week",
          }}
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              placeholder="Zoek op naam, email of reden..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
              variant="outlined"
              inputSize="md"
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Alle statussen</option>
                <option value="PENDING">In behandeling</option>
                <option value="APPROVED">Goedgekeurd</option>
                <option value="REJECTED">Afgekeurd</option>
                <option value="CANCELLED">Geannuleerd</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Type Verlof
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Alle types</option>
                {LEAVE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
              <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              {filteredRequests.length} van {leaveRequests.length} aanvragen
            </div>

            {(searchTerm || statusFilter || typeFilter) && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setTypeFilter("");
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white shadow-sm"
              >
                Filters wissen
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Leave Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <CalendarDaysIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Geen verlofaanvragen gevonden
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {searchTerm || statusFilter || typeFilter
                ? "Pas je filters aan om meer resultaten te zien."
                : "Er zijn nog geen verlofaanvragen ingediend."}
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const typeConfig = getLeaveTypeConfig(request.type);

            return (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Type Icon */}
                      <div
                        className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center shadow-sm ${
                          request.status === "APPROVED"
                            ? "bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-700"
                            : request.status === "REJECTED"
                            ? "bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-700"
                            : "bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
                        }`}
                      >
                        <div className={typeConfig.color}>
                          {typeConfig.icon}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {typeConfig.label}
                            </h3>
                            <span
                              className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                request.status
                              )}`}
                            >
                              {getStatusIcon(request.status)}
                              <span>{getStatusText(request.status)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Employee Info */}
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {request.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {request.user.name}
                              </span>
                              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                <span>{request.user.email}</span>
                                {request.user.company && (
                                  <>
                                    <span>•</span>
                                    <span>{request.user.company}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Request Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2 text-sm">
                            <CalendarDaysIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                Periode:
                              </span>
                              <div className="text-gray-600 dark:text-gray-400">
                                {formatDate(request.startDate)} -{" "}
                                {formatDate(request.endDate)}
                              </div>
                            </div>
                          </div>

                          {request.dayCount && (
                            <div className="flex items-center space-x-2 text-sm">
                              <ClockIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  Dagen:
                                </span>
                                <div className="text-gray-600 dark:text-gray-400">
                                  {request.dayCount}{" "}
                                  {request.dayCount === 1 ? "dag" : "dagen"}
                                </div>
                              </div>
                            </div>
                          )}

                          {!request.isFullDay &&
                            request.startTime &&
                            request.endTime && (
                              <div className="flex items-center space-x-2 text-sm">
                                <ClockIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <div>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    Tijd:
                                  </span>
                                  <div className="text-gray-600 dark:text-gray-400">
                                    {formatTime(request.startTime)} -{" "}
                                    {formatTime(request.endTime)}
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Reason & Description */}
                        {request.reason && (
                          <div className="mb-3">
                            <div className="flex items-start space-x-2">
                              <DocumentTextIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                              <div>
                                <span className="font-medium text-sm text-gray-900 dark:text-white">
                                  Reden:
                                </span>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {request.reason}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {request.description && (
                          <div className="mb-3">
                            <div className="flex items-start space-x-2">
                              <DocumentTextIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                              <div>
                                <span className="font-medium text-sm text-gray-900 dark:text-white">
                                  Beschrijving:
                                </span>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {request.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Approver Info */}
                        {request.approver && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                              <UserIcon className="h-4 w-4" />
                              <span>
                                {request.status === "APPROVED"
                                  ? "Goedgekeurd door:"
                                  : "Behandeld door:"}{" "}
                                {request.approver.name}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-shrink-0 ml-4">
                      {request.status === "PENDING" ? (
                        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                          <Button
                            onClick={() => handleApproveRequest(request.id)}
                            variant="primary"
                            size="sm"
                            leftIcon={<CheckIcon className="h-4 w-4" />}
                            className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                          >
                            Goedkeuren
                          </Button>
                          <Button
                            onClick={() => handleRejectRequest(request.id)}
                            variant="primary"
                            size="sm"
                            leftIcon={<XMarkIcon className="h-4 w-4" />}
                            className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
                          >
                            Afkeuren
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm text-center">
                          <div
                            className={`inline-flex items-center space-x-1 px-3 py-2 rounded-lg font-medium ${
                              request.status === "APPROVED"
                                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                            }`}
                          >
                            {getStatusIcon(request.status)}
                            <span>Verwerkt</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatDate(request.createdAt)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

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
