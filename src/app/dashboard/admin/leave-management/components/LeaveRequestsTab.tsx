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
  HeartIcon,
  AcademicCapIcon,
  ShieldExclamationIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
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

export default function LeaveRequestsTab() {
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
    let filtered = leaveRequests;

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
    try {
      const response = await fetch(`/api/leave-requests/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "APPROVED",
        }),
      });

      if (response.ok) {
        showToast("Verlofaanvraag goedgekeurd", "success");
        fetchLeaveRequests();
      } else {
        const error = await response.json();
        showToast(`Error: ${error.error}`, "error");
      }
    } catch (error) {
      console.error("Error approving leave request:", error);
      showToast("Er is iets misgegaan bij het goedkeuren", "error");
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      const response = await fetch(`/api/leave-requests/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "REJECTED",
        }),
      });

      if (response.ok) {
        showToast("Verlofaanvraag afgewezen", "success");
        fetchLeaveRequests();
      } else {
        const error = await response.json();
        showToast(`Error: ${error.error}`, "error");
      }
    } catch (error) {
      console.error("Error rejecting leave request:", error);
      showToast("Er is iets misgegaan bij het afwijzen", "error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Goedgekeurd";
      case "REJECTED":
        return "Afgewezen";
      case "PENDING":
        return "In behandeling";
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
      case "PENDING":
        return <ClockIcon className="h-4 w-4" />;
      case "CANCELLED":
        return <XMarkIcon className="h-4 w-4" />;
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
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString?.slice(0, 5) || "";
  };

  // Calculate statistics
  const pendingCount = leaveRequests.filter(
    (r) => r.status === "PENDING"
  ).length;
  const approvedCount = leaveRequests.filter(
    (r) => r.status === "APPROVED"
  ).length;
  const rejectedCount = leaveRequests.filter(
    (r) => r.status === "REJECTED"
  ).length;
  const totalCount = leaveRequests.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Verlofaanvragen Beheer
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Bekijk, goedkeuren en afwijzen van verlofaanvragen
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={fetchLeaveRequests}
          disabled={loading}
        >
          Vernieuwen
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Totaal Aanvragen"
          value={totalCount.toString()}
          icon={<DocumentTextIcon className="h-6 w-6" />}
          color="blue"
        />
        <MetricCard
          title="In Behandeling"
          value={pendingCount.toString()}
          icon={<ClockIcon className="h-6 w-6" />}
          color="orange"
        />
        <MetricCard
          title="Goedgekeurd"
          value={approvedCount.toString()}
          icon={<CheckCircleIcon className="h-6 w-6" />}
          color="green"
        />
        <MetricCard
          title="Afgewezen"
          value={rejectedCount.toString()}
          icon={<XCircleIcon className="h-6 w-6" />}
          color="red"
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Zoek medewerker, reden..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Alle statussen</option>
            <option value="PENDING">In behandeling</option>
            <option value="APPROVED">Goedgekeurd</option>
            <option value="REJECTED">Afgewezen</option>
            <option value="CANCELLED">Geannuleerd</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Alle types</option>
            {LEAVE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <FunnelIcon className="h-4 w-4" />
            <span>
              {filteredRequests.length} van {totalCount} aanvragen
            </span>
          </div>
        </div>
      </div>

      {/* Leave Requests List */}
      {filteredRequests.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Medewerker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type & Periode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Reden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Aangemaakt
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRequests.map((request) => {
                  const typeConfig = getLeaveTypeConfig(request.type);
                  return (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {request.user.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {request.user.email}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {request.user.company}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className={typeConfig.color}>
                            {typeConfig.icon}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {typeConfig.label}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(request.startDate)}
                              {request.endDate !== request.startDate &&
                                ` - ${formatDate(request.endDate)}`}
                            </div>
                            {!request.isFullDay && (
                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                {formatTime(request.startTime || "")} -{" "}
                                {formatTime(request.endTime || "")}
                              </div>
                            )}
                            {request.dayCount && (
                              <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                {request.dayCount}{" "}
                                {request.dayCount === 1 ? "dag" : "dagen"}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {request.reason && (
                            <div className="font-medium mb-1">
                              {request.reason}
                            </div>
                          )}
                          {request.description && (
                            <div className="text-gray-500 dark:text-gray-400 text-xs max-w-xs truncate">
                              {request.description}
                            </div>
                          )}
                          {!request.reason && !request.description && (
                            <span className="text-gray-400 dark:text-gray-500 italic">
                              Geen reden opgegeven
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {getStatusIcon(request.status)}
                          <span className="ml-1">
                            {getStatusText(request.status)}
                          </span>
                        </span>
                        {request.approver && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            door {request.approver.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {request.status === "PENDING" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveRequest(request.id)}
                              leftIcon={<CheckIcon className="h-4 w-4" />}
                              className="text-green-600 hover:text-green-500 border-green-300 hover:border-green-500"
                            >
                              Goedkeuren
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectRequest(request.id)}
                              leftIcon={<XMarkIcon className="h-4 w-4" />}
                              className="text-red-600 hover:text-red-500 border-red-300 hover:border-red-500"
                            >
                              Afwijzen
                            </Button>
                          </>
                        )}
                        {request.status !== "PENDING" && (
                          <span className="text-gray-400 dark:text-gray-500 text-sm">
                            Verwerkt
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Geen verlofaanvragen gevonden
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter || typeFilter
              ? "Geen verlofaanvragen gevonden met de huidige filters."
              : "Er zijn nog geen verlofaanvragen ingediend."}
          </p>
        </div>
      )}
    </div>
  );
}
