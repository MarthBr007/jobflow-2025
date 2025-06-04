"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  ClockIcon,
  CalendarDaysIcon,
  PlusIcon,
  MinusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  addDays,
} from "date-fns";
import { nl } from "date-fns/locale";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Modal from "@/components/ui/Modal";

interface TimeCompensationData {
  userId: string;
  currentBalance: number;
  totalAccrued: number;
  totalUsed: number;
  pendingRequests: number;
  breakdown: {
    overtimeHours: { total: number; compensation: number; formatted: string };
    weekendHours: { total: number; compensation: number; formatted: string };
    eveningHours: { total: number; compensation: number; formatted: string };
    nightHours: { total: number; compensation: number; formatted: string };
    holidayHours: { total: number; compensation: number; formatted: string };
  };
  recentTransactions: CompensationTransaction[];
  projectedBalance: number;
}

interface CompensationTransaction {
  id: string;
  date: string;
  type: "ACCRUED" | "USED" | "APPROVED" | "REJECTED";
  hours: number;
  reason: string;
  source:
    | "OVERTIME"
    | "WEEKEND"
    | "EVENING"
    | "NIGHT"
    | "HOLIDAY"
    | "VACATION"
    | "SICK";
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: string;
}

interface TimeOffRequest {
  date: string;
  hours: number;
  reason: string;
  type: "FULL_DAY" | "HALF_DAY" | "CUSTOM";
}

export default function TimeCompensationPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [compensationData, setCompensationData] =
    useState<TimeCompensationData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState<TimeOffRequest>({
    date: format(new Date(), "yyyy-MM-dd"),
    hours: 8,
    reason: "",
    type: "FULL_DAY",
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchCompensationData();
    }
  }, [session, selectedPeriod]);

  const fetchCompensationData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/time-tracking/compensation?period=${selectedPeriod}`
      );
      const data = await response.json();

      if (data.success) {
        setCompensationData(data.data);
      }
    } catch (error) {
      console.error("Error fetching compensation data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeOffRequest = async () => {
    try {
      const response = await fetch("/api/time-tracking/compensation/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestForm),
      });

      const data = await response.json();

      if (data.success) {
        setShowRequestModal(false);
        setRequestForm({
          date: format(new Date(), "yyyy-MM-dd"),
          hours: 8,
          reason: "",
          type: "FULL_DAY",
        });
        fetchCompensationData();
      }
    } catch (error) {
      console.error("Error requesting time off:", error);
    }
  };

  const formatDuration = (hours: number): string => {
    const h = Math.floor(Math.abs(hours));
    const m = Math.round((Math.abs(hours) - h) * 60);
    const sign = hours < 0 ? "-" : "";
    return `${sign}${h}u ${m}m`;
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 40) return "text-green-600 dark:text-green-400";
    if (balance > 0) return "text-blue-600 dark:text-blue-400";
    if (balance > -8) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <ArrowTrendingUpIcon className="h-5 w-5" />;
    return <ArrowTrendingDownIcon className="h-5 w-5" />;
  };

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
          { label: "Tijd voor Tijd Systeem" },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <ClockIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Tijd voor Tijd Systeem
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Beheer je compensatie uren voor overwerk, weekend en
                  feestdagen
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
                onClick={() => setShowRequestModal(true)}
                variant="primary"
                size="md"
                leftIcon={<CalendarDaysIcon className="h-4 w-4" />}
                disabled={
                  !compensationData || compensationData.currentBalance <= 0
                }
              >
                Compensatie Opnemen
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Overview Cards */}
      {compensationData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Current Balance */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getBalanceIcon(compensationData.currentBalance)}
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Huidige Balans
                </h3>
              </div>
            </div>
            <div
              className={`text-3xl font-bold ${getBalanceColor(
                compensationData.currentBalance
              )}`}
            >
              {formatDuration(compensationData.currentBalance)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {compensationData.currentBalance > 0
                ? "Beschikbaar om op te nemen"
                : "Uren tekort"}
            </div>
          </div>

          {/* Total Accrued */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <PlusIcon className="h-5 w-5 text-green-600" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Totaal Opgebouwd
                </h3>
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatDuration(compensationData.totalAccrued)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              In geselecteerde periode
            </div>
          </div>

          {/* Total Used */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <MinusIcon className="h-5 w-5 text-orange-600" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Totaal Opgenomen
                </h3>
              </div>
            </div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {formatDuration(compensationData.totalUsed)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              In geselecteerde periode
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  In Behandeling
                </h3>
              </div>
            </div>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {formatDuration(compensationData.pendingRequests)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Wachtend op goedkeuring
            </div>
          </div>
        </div>
      )}

      {/* Compensation Breakdown */}
      {compensationData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-blue-500" />
              Compensatie Opbouw Detail
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Overzicht van hoe je compensatie uren zijn opgebouwd
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Breakdown Cards */}
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <ClockIcon className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        Overwerk
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-900 dark:text-blue-100">
                        {compensationData.breakdown.overtimeHours.formatted}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        +
                        {formatDuration(
                          compensationData.breakdown.overtimeHours.compensation
                        )}{" "}
                        compensatie
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CalendarDaysIcon className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-purple-900 dark:text-purple-100">
                        Weekend uren
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-purple-900 dark:text-purple-100">
                        {compensationData.breakdown.weekendHours.formatted}
                      </div>
                      <div className="text-sm text-purple-700 dark:text-purple-300">
                        +
                        {formatDuration(
                          compensationData.breakdown.weekendHours.compensation
                        )}{" "}
                        compensatie
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <ClockIcon className="h-5 w-5 text-orange-600" />
                      <span className="font-medium text-orange-900 dark:text-orange-100">
                        Avond uren (18:00+)
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-orange-900 dark:text-orange-100">
                        {compensationData.breakdown.eveningHours.formatted}
                      </div>
                      <div className="text-sm text-orange-700 dark:text-orange-300">
                        +
                        {formatDuration(
                          compensationData.breakdown.eveningHours.compensation
                        )}{" "}
                        compensatie
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Balance Indicator */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                    Balans Trend
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Opgebouwd
                      </span>
                      <span className="font-medium text-green-600">
                        +{formatDuration(compensationData.totalAccrued)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Opgenomen
                      </span>
                      <span className="font-medium text-orange-600">
                        -{formatDuration(compensationData.totalUsed)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">
                          Balans
                        </span>
                        <span
                          className={`font-bold ${getBalanceColor(
                            compensationData.currentBalance
                          )}`}
                        >
                          {formatDuration(compensationData.currentBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <Button
                    onClick={() => setShowRequestModal(true)}
                    variant="primary"
                    size="sm"
                    className="w-full"
                    disabled={compensationData.currentBalance <= 0}
                  >
                    Compensatie Dag Opnemen
                  </Button>
                  <Button
                    onClick={fetchCompensationData}
                    variant="outline"
                    size="sm"
                    className="w-full"
                    leftIcon={<ArrowPathIcon className="h-4 w-4" />}
                  >
                    Vernieuwen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {compensationData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Recente Transacties
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Overzicht van compensatie opbouw en opnames
            </p>
          </div>
          <div className="p-6">
            {compensationData.recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Geen transacties
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Er zijn nog geen compensatie transacties in deze periode.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {compensationData.recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          transaction.type === "ACCRUED"
                            ? "bg-green-500"
                            : transaction.type === "USED"
                            ? "bg-orange-500"
                            : transaction.type === "APPROVED"
                            ? "bg-blue-500"
                            : "bg-red-500"
                        }`}
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {transaction.reason}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(transaction.date), "dd MMM yyyy", {
                            locale: nl,
                          })}{" "}
                          • {transaction.source}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-medium ${
                          transaction.type === "ACCRUED"
                            ? "text-green-600"
                            : "text-orange-600"
                        }`}
                      >
                        {transaction.type === "ACCRUED" ? "+" : "-"}
                        {formatDuration(transaction.hours)}
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${
                          transaction.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : transaction.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {transaction.status === "APPROVED"
                          ? "Goedgekeurd"
                          : transaction.status === "PENDING"
                          ? "In behandeling"
                          : "Afgewezen"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Time Off Request Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Compensatie Uren Opnemen"
        description="Vraag tijd voor tijd verlof aan uit je compensatie saldo"
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Beschikbaar Saldo
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Je hebt{" "}
                  {formatDuration(compensationData?.currentBalance || 0)}{" "}
                  compensatie uren beschikbaar
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Datum
              </label>
              <input
                type="date"
                value={requestForm.date}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, date: e.target.value })
                }
                min={format(new Date(), "yyyy-MM-dd")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type Verlof
              </label>
              <select
                value={requestForm.type}
                onChange={(e) => {
                  const type = e.target.value as
                    | "FULL_DAY"
                    | "HALF_DAY"
                    | "CUSTOM";
                  setRequestForm({
                    ...requestForm,
                    type,
                    hours:
                      type === "FULL_DAY"
                        ? 8
                        : type === "HALF_DAY"
                        ? 4
                        : requestForm.hours,
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="FULL_DAY">Hele dag (8 uur)</option>
                <option value="HALF_DAY">Halve dag (4 uur)</option>
                <option value="CUSTOM">Aangepast</option>
              </select>
            </div>

            {requestForm.type === "CUSTOM" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aantal Uren
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="8"
                  step="0.5"
                  value={requestForm.hours}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      hours: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reden (optioneel)
              </label>
              <textarea
                value={requestForm.reason}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, reason: e.target.value })
                }
                rows={3}
                placeholder="Bijvoorbeeld: Privé afspraak, familiedag, etc."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRequestModal(false)}
            >
              Annuleren
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleTimeOffRequest}
              disabled={
                requestForm.hours > (compensationData?.currentBalance || 0)
              }
            >
              Aanvragen ({formatDuration(requestForm.hours)})
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
