"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  CalendarDaysIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { Toast, useToast } from "@/components/ui/Toast";

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

export default function LeaveRequests() {
  const { data: session } = useSession();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const [formData, setFormData] = useState({
    type: "",
    startDate: "",
    endDate: "",
    reason: "",
    description: "",
    isFullDay: true,
    startTime: "",
    endTime: "",
  });

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

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

  const handleCreateLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch("/api/leave-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setLeaveRequests((prev) => [data, ...prev]);
        setShowCreateModal(false);
        setFormData({
          type: "",
          startDate: "",
          endDate: "",
          reason: "",
          description: "",
          isFullDay: true,
          startTime: "",
          endTime: "",
        });
        showToast("Verlofaanvraag succesvol ingediend", "success");
      } else {
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error creating leave request:", error);
      showToast(
        "Er is iets misgegaan bij het indienen van de verlofaanvraag",
        "error"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze verlofaanvraag wilt annuleren?")) {
      return;
    }

    try {
      const response = await fetch(`/api/leave-requests/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "cancel" }),
      });

      const data = await response.json();

      if (response.ok) {
        setLeaveRequests((prev) =>
          prev.map((req) => (req.id === id ? data : req))
        );
        showToast("Verlofaanvraag geannuleerd", "success");
      } else {
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error cancelling leave request:", error);
      showToast("Er is iets misgegaan bij het annuleren", "error");
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
          { label: "Verlofaanvragen" },
        ]}
        className="mb-1 sm:mb-4"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            🏖️ Mijn Verlofaanvragen
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Bekijk je verlofaanvragen en dien nieuwe aanvragen in
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          variant="primary"
          size="md"
          leftIcon={<PlusIcon className="h-4 w-4" />}
        >
          Nieuwe Aanvraag
        </Button>
      </div>

      {/* Leave Requests List */}
      <div className="space-y-2.5 sm:space-y-4">
        {leaveRequests.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Geen verlofaanvragen
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Je hebt nog geen verlofaanvragen ingediend.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="primary"
                size="md"
                leftIcon={<PlusIcon className="h-4 w-4" />}
              >
                Eerste Aanvraag Indienen
              </Button>
            </div>
          </div>
        ) : (
          leaveRequests.map((request) => (
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
                      <Button
                        onClick={() => handleCancelRequest(request.id)}
                        variant="outline"
                        size="sm"
                        leftIcon={<XCircleIcon className="h-4 w-4" />}
                        className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
                      >
                        Annuleren
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Leave Request Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nieuwe Verlofaanvraag"
        size="lg"
      >
        <form onSubmit={handleCreateLeaveRequest} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type verlof
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">Selecteer type verlof</option>
                {LEAVE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.emoji} {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Startdatum"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                variant="outlined"
                inputSize="md"
                required
              />
              <Input
                label="Einddatum"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                variant="outlined"
                inputSize="md"
                required
              />
            </div>

            {/* Full Day Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isFullDay"
                checked={formData.isFullDay}
                onChange={(e) =>
                  setFormData({ ...formData, isFullDay: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="isFullDay"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                Hele dag(en)
              </label>
            </div>

            {/* Time Range (if not full day) */}
            {!formData.isFullDay && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Starttijd"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  variant="outlined"
                  inputSize="md"
                />
                <Input
                  label="Eindtijd"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  variant="outlined"
                  inputSize="md"
                />
              </div>
            )}

            {/* Reason */}
            <Input
              label="Reden"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              variant="outlined"
              inputSize="md"
              placeholder="Korte reden voor het verlof"
            />

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Beschrijving (optioneel)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Aanvullende informatie over je verlofaanvraag"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              onClick={() => setShowCreateModal(false)}
              variant="outline"
              size="md"
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={creating}
              leftIcon={
                creating ? undefined : <CheckCircleIcon className="h-4 w-4" />
              }
            >
              {creating ? "Indienen..." : "Aanvraag Indienen"}
            </Button>
          </div>
        </form>
      </Modal>

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
