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
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import PermissionGuard from "@/components/ui/PermissionGuard";
import Toast from "@/components/ui/Toast";
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
  { value: "VACATION", label: "Vakantie", emoji: "🏖️" },
  { value: "SICK_LEAVE", label: "Ziekteverlof", emoji: "🤒" },
  { value: "PERSONAL_LEAVE", label: "Persoonlijk verlof", emoji: "👤" },
  { value: "TIME_OFF_IN_LIEU", label: "Tijd voor tijd opname", emoji: "⏰" },
  { value: "DOCTOR_VISIT", label: "Doktersbezoek", emoji: "👨‍⚕️" },
  { value: "DENTIST_VISIT", label: "Tandarts bezoek", emoji: "🦷" },
  { value: "SPECIAL_LEAVE", label: "Bijzonder verlof", emoji: "✨" },
  { value: "CALAMITY_LEAVE", label: "Calamiteitenverlof", emoji: "🚨" },
  { value: "BEREAVEMENT_LEAVE", label: "Rouwverlof", emoji: "🖤" },
  { value: "MOVING_DAY", label: "Verhuisdag", emoji: "📦" },
  { value: "MATERNITY_LEAVE", label: "Zwangerschapsverlof", emoji: "🤱" },
  { value: "PATERNITY_LEAVE", label: "Vaderschapsverlof", emoji: "👨‍👶" },
  { value: "STUDY_LEAVE", label: "Studieverlof", emoji: "📚" },
  { value: "EMERGENCY_LEAVE", label: "Noodverlof", emoji: "🆘" },
  { value: "UNPAID_LEAVE", label: "Onbetaald verlof", emoji: "💸" },
  { value: "COMPENSATORY_LEAVE", label: "Compensatieverlof", emoji: "⚖️" },
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
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
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

  const getLeaveTypeEmoji = (type: string) => {
    const leaveType = LEAVE_TYPES.find((lt) => lt.value === type);
    return leaveType ? leaveType.emoji : "📝";
  };

  const getLeaveTypeLabel = (type: string) => {
    const leaveType = LEAVE_TYPES.find((lt) => lt.value === type);
    return leaveType ? leaveType.label : type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString?.substring(0, 5) || "";
  };

  const getPendingCount = () => {
    return leaveRequests.filter((req) => req.status === "PENDING").length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xl"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard" },
          { label: "Verlof Beheer" },
        ]}
        className="mb-1 sm:mb-4"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            🏖️ Verlofaanvragen Beheer
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Bekijk en beheer alle verlofaanvragen van medewerkers
          </p>
        </div>
        {getPendingCount() > 0 && (
          <div className="bg-yellow-100 dark:bg-yellow-900 px-3 py-2 rounded-lg">
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {getPendingCount()} aanvragen wachten op goedkeuring
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            placeholder="Zoek op naam, email of reden..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
            variant="outlined"
            inputSize="md"
          />

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Alle statussen</option>
              <option value="PENDING">In behandeling</option>
              <option value="APPROVED">Goedgekeurd</option>
              <option value="REJECTED">Afgekeurd</option>
              <option value="CANCELLED">Geannuleerd</option>
            </select>
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Alle types</option>
              {LEAVE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.emoji} {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 sm:p-6">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {leaveRequests.length}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Totaal aanvragen
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 sm:p-6">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {leaveRequests.filter((req) => req.status === "PENDING").length}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Wachten op goedkeuring
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 sm:p-6">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
              {leaveRequests.filter((req) => req.status === "APPROVED").length}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Goedgekeurd
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 sm:p-6">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
              {leaveRequests.filter((req) => req.status === "REJECTED").length}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Afgekeurd
            </div>
          </div>
        </div>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 sm:p-6">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {
                leaveRequests.filter(
                  (req) => req.type === "VACATION" && req.status === "APPROVED"
                ).length
              }
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              🏖️ Vakantiedagen goedgekeurd
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 sm:p-6">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
              {
                leaveRequests.filter(
                  (req) =>
                    req.type === "SICK_LEAVE" && req.status === "APPROVED"
                ).length
              }
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              🤒 Ziekteverlof goedgekeurd
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 sm:p-6">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
              {leaveRequests.reduce((total, req) => {
                if (req.status === "APPROVED" && req.dayCount) {
                  return total + req.dayCount;
                }
                return total;
              }, 0)}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Totaal verlof dagen
            </div>
          </div>
        </div>
      </div>

      {/* Leave Requests List */}
      <div className="space-y-2.5 sm:space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Geen verlofaanvragen gevonden
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter || typeFilter
                ? "Pas je filters aan om meer resultaten te zien."
                : "Er zijn nog geen verlofaanvragen ingediend."}
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="p-3.5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 text-2xl">
                      {getLeaveTypeEmoji(request.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                          {getLeaveTypeLabel(request.type)}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {getStatusIcon(request.status)}
                          <span className="ml-1">
                            {getStatusText(request.status)}
                          </span>
                        </span>
                      </div>

                      {/* Employee Info */}
                      <div className="flex items-center space-x-2 mb-3">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {request.user.name}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({request.user.email})
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Periode:</span>{" "}
                          {formatDate(request.startDate)} -{" "}
                          {formatDate(request.endDate)}
                        </div>
                        {request.dayCount && (
                          <div>
                            <span className="font-medium">Dagen:</span>{" "}
                            {request.dayCount}
                          </div>
                        )}
                        {!request.isFullDay && (
                          <div>
                            <span className="font-medium">Tijd:</span>{" "}
                            {formatTime(request.startTime || "")} -{" "}
                            {formatTime(request.endTime || "")}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Aangevraagd:</span>{" "}
                          {formatDate(request.createdAt)}
                        </div>
                      </div>

                      {request.reason && (
                        <div className="mt-3">
                          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                            Reden:
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {request.reason}
                          </p>
                        </div>
                      )}

                      {request.description && (
                        <div className="mt-3">
                          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                            Beschrijving:
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {request.description}
                          </p>
                        </div>
                      )}

                      {request.approver && (
                        <div className="mt-3">
                          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                            {request.status === "APPROVED"
                              ? "Goedgekeurd door:"
                              : "Behandeld door:"}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {request.approver.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {request.status === "PENDING" && (
                      <>
                        <Button
                          onClick={() => handleApproveRequest(request.id)}
                          variant="outline"
                          size="sm"
                          leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                          className="text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-900/20"
                        >
                          Goedkeuren
                        </Button>
                        <Button
                          onClick={() => handleRejectRequest(request.id)}
                          variant="outline"
                          size="sm"
                          leftIcon={<XCircleIcon className="h-4 w-4" />}
                          className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
                        >
                          Afkeuren
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
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
