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
  HeartIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  HomeIcon,
  BookOpenIcon,
  FaceSmileIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import MetricCard from "@/components/ui/MetricCard";
import PermissionGuard from "@/components/ui/PermissionGuard";
import Toast from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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
    icon: <FaceSmileIcon className="w-4 h-4" />,
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    value: "SICK_LEAVE",
    label: "Ziekteverlof",
    icon: <HeartIcon className="w-4 h-4" />,
    color: "text-red-600 dark:text-red-400",
  },
  {
    value: "PERSONAL_LEAVE",
    label: "Persoonlijk verlof",
    icon: <UserGroupIcon className="w-4 h-4" />,
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    value: "TIME_OFF_IN_LIEU",
    label: "Tijd voor tijd opname",
    icon: <ClockIcon className="w-4 h-4" />,
    color: "text-green-600 dark:text-green-400",
  },
  {
    value: "DOCTOR_VISIT",
    label: "Doktersbezoek",
    icon: <HeartIcon className="w-4 h-4" />,
    color: "text-red-600 dark:text-red-400",
  },
  {
    value: "DENTIST_VISIT",
    label: "Tandarts bezoek",
    icon: <HeartIcon className="w-4 h-4" />,
    color: "text-red-600 dark:text-red-400",
  },
  {
    value: "SPECIAL_LEAVE",
    label: "Bijzonder verlof",
    icon: <ExclamationTriangleIcon className="w-4 h-4" />,
    color: "text-orange-600 dark:text-orange-400",
  },
  {
    value: "CALAMITY_LEAVE",
    label: "Calamiteitenverlof",
    icon: <ExclamationTriangleIcon className="w-4 h-4" />,
    color: "text-red-600 dark:text-red-400",
  },
  {
    value: "BEREAVEMENT_LEAVE",
    label: "Rouwverlof",
    icon: <HeartIcon className="w-4 h-4" />,
    color: "text-gray-600 dark:text-gray-400",
  },
  {
    value: "MOVING_DAY",
    label: "Verhuisdag",
    icon: <HomeIcon className="w-4 h-4" />,
    color: "text-indigo-600 dark:text-indigo-400",
  },
  {
    value: "MATERNITY_LEAVE",
    label: "Zwangerschapsverlof",
    icon: <HeartIcon className="w-4 h-4" />,
    color: "text-pink-600 dark:text-pink-400",
  },
  {
    value: "PATERNITY_LEAVE",
    label: "Vaderschapsverlof",
    icon: <HeartIcon className="w-4 h-4" />,
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    value: "STUDY_LEAVE",
    label: "Studieverlof",
    icon: <BookOpenIcon className="w-4 h-4" />,
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    value: "EMERGENCY_LEAVE",
    label: "Noodverlof",
    icon: <ExclamationTriangleIcon className="w-4 h-4" />,
    color: "text-red-600 dark:text-red-400",
  },
  {
    value: "UNPAID_LEAVE",
    label: "Onbetaald verlof",
    icon: <ClockIcon className="w-4 h-4" />,
    color: "text-gray-600 dark:text-gray-400",
  },
  {
    value: "COMPENSATORY_LEAVE",
    label: "Compensatieverlof",
    icon: <ChartBarIcon className="w-4 h-4" />,
    color: "text-green-600 dark:text-green-400",
  },
];

export default function LeaveRequests() {
  const { data: session } = useSession();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const { confirm, ConfirmModal } = useConfirm();

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
    const confirmed = await confirm({
      type: "warning",
      title: "Verlofaanvraag annuleren",
      message: "Weet je zeker dat je deze verlofaanvraag wilt annuleren?",
      confirmText: "Annuleren",
      cancelText: "Behouden",
    });

    if (!confirmed) {
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
      case "PENDING":
        return "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700";
      case "APPROVED":
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-700";
      case "REJECTED":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-700";
      case "CANCELLED":
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "In behandeling";
      case "APPROVED":
        return "Goedgekeurd";
      case "REJECTED":
        return "Afgewezen";
      case "CANCELLED":
        return "Geannuleerd";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <ClockIcon className="w-4 h-4" />;
      case "APPROVED":
        return <CheckCircleIcon className="w-4 h-4" />;
      case "REJECTED":
        return <XCircleIcon className="w-4 h-4" />;
      case "CANCELLED":
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getLeaveTypeConfig = (type: string) => {
    return (
      LEAVE_TYPES.find((t) => t.value === type) || {
        value: type,
        label: type,
        icon: <CalendarDaysIcon className="w-4 h-4" />,
        color: "text-gray-600 dark:text-gray-400",
      }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate statistics
  const totalRequests = leaveRequests.length;
  const pendingRequests = leaveRequests.filter(
    (req) => req.status === "PENDING"
  ).length;
  const approvedRequests = leaveRequests.filter(
    (req) => req.status === "APPROVED"
  ).length;
  const rejectedRequests = leaveRequests.filter(
    (req) => req.status === "REJECTED"
  ).length;
  const totalDaysRequested = leaveRequests
    .filter((req) => req.status === "APPROVED")
    .reduce((sum, req) => sum + (req.dayCount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
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
      <ConfirmModal />

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Mijn Verlofaanvragen" },
        ]}
        className="mb-4"
      />

      {/* Modern Header Card */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
        <div className="px-6 py-8 border-b border-gray-200 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 dark:from-green-900/20 dark:via-blue-900/20 dark:to-purple-900/20 dark:border-gray-700">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 shadow-lg bg-gradient-to-br from-green-500 to-blue-600 rounded-xl">
                <CalendarDaysIcon className="text-white h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Mijn Verlofaanvragen
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Beheer je verlofaanvragen en bekijk de status van je aanvragen
                </p>
                <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>{totalRequests} Totaal</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    <span>{pendingRequests} In behandeling</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>{approvedRequests} Goedgekeurd</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowCreateModal(true)}
                leftIcon={<PlusIcon className="w-5 h-5" />}
                variant="primary"
                size="md"
                className="text-white bg-green-600 shadow-sm hover:bg-green-700"
              >
                Nieuwe Aanvraag
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Totaal Aanvragen"
          value={totalRequests}
          icon={<DocumentCheckIcon className="w-8 h-8" />}
          color="blue"
          subtitle="Alle verlofaanvragen"
          trend={{
            value: 2,
            isPositive: true,
            label: "deze maand",
          }}
        />

        <MetricCard
          title="In Behandeling"
          value={pendingRequests}
          icon={<ClockIcon className="w-8 h-8" />}
          color="orange"
          subtitle="Wacht op goedkeuring"
          trend={{
            value: pendingRequests > 0 ? pendingRequests : 0,
            isPositive: false,
            label: "open aanvragen",
          }}
        />

        <MetricCard
          title="Goedgekeurd"
          value={approvedRequests}
          icon={<CheckCircleIcon className="w-8 h-8" />}
          color="green"
          subtitle="Toegekende verlofaanvragen"
          trend={{
            value:
              approvedRequests > 0
                ? Math.round((approvedRequests / totalRequests) * 100)
                : 0,
            isPositive: true,
            label: "% van totaal",
          }}
        />

        <MetricCard
          title="Verlof Dagen"
          value={totalDaysRequested}
          icon={<CalendarDaysIcon className="w-8 h-8" />}
          color="purple"
          subtitle="Totaal goedgekeurde dagen"
          trend={{
            value: 8,
            isPositive: true,
            label: "dit jaar",
          }}
        />
      </div>

      {/* Leave Requests List */}
      {leaveRequests.length === 0 ? (
        <div className="p-12 text-center bg-white border border-gray-200 dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <CalendarDaysIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Geen verlofaanvragen gevonden
          </h3>
          <p className="max-w-md mx-auto mb-6 text-gray-500 dark:text-gray-400">
            Je hebt nog geen verlofaanvragen ingediend. Maak je eerste aanvraag
            aan.
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            leftIcon={<PlusIcon className="w-5 h-5" />}
            variant="primary"
            size="md"
            className="text-white bg-green-600 shadow-sm hover:bg-green-700"
          >
            Eerste Aanvraag Maken
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {leaveRequests.map((request) => {
            const typeConfig = getLeaveTypeConfig(request.type);

            return (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="transition-all duration-200 bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700 hover:shadow-md"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1 space-x-4">
                      {/* Request Icon */}
                      <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 shadow-sm bg-gradient-to-br from-green-500 to-blue-600 rounded-xl">
                        {typeConfig.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Request Header */}
                        <div className="flex items-center mb-2 space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {typeConfig.label}
                          </h3>
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {getStatusIcon(request.status)}
                            <span>{getStatusText(request.status)}</span>
                          </span>
                        </div>

                        {/* Date Range */}
                        <div className="mb-3 space-y-1">
                          <div className="flex items-center space-x-2 text-sm">
                            <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatDate(request.startDate)}
                              {request.startDate !== request.endDate && (
                                <span> tot {formatDate(request.endDate)}</span>
                              )}
                            </span>
                            {request.dayCount && (
                              <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-700">
                                {request.dayCount}{" "}
                                {request.dayCount === 1 ? "dag" : "dagen"}
                              </span>
                            )}
                          </div>

                          {!request.isFullDay &&
                            request.startTime &&
                            request.endTime && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <ClockIcon className="w-4 h-4" />
                                <span>
                                  {formatTime(request.startTime)} -{" "}
                                  {formatTime(request.endTime)}
                                </span>
                              </div>
                            )}
                        </div>

                        {/* Description */}
                        {request.description && (
                          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                            {request.description}
                          </p>
                        )}

                        {/* Meta Information */}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Ingediend op {formatDate(request.createdAt)}
                          {request.approvedAt && (
                            <span>
                              {" "}
                              • Goedgekeurd op {formatDate(request.approvedAt)}
                            </span>
                          )}
                          {request.rejectedAt && (
                            <span>
                              {" "}
                              • Afgewezen op {formatDate(request.rejectedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-shrink-0 ml-4">
                      {request.status === "PENDING" && (
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleCancelRequest(request.id)}
                            variant="outline"
                            size="sm"
                            leftIcon={<XCircleIcon className="w-4 h-4" />}
                            className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                          >
                            Annuleren
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

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
                    {type.label}
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
